q = require('q')
moment = require('moment')
mongoskin = require('mongoskin')
Stream = require('./../public/models/Stream').Stream
ManualEntry = require('./../public/models/ManualEntry').ManualEntry
StreamRevision = require('./../public/models/StreamRevision').StreamRevision

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh')

dbq = (collection, method, criteria) ->
	deferred = q.defer()

	db.collection(collection)[method](criteria).toArray( (err, result) ->
		if err
			deferred.reject(err)

		deferred.resolve(
			collection: collection
			result: result
		)
	)

	return deferred.promise


module.exports =

	getData: (req, res) ->

		userId = mongoskin.helper.toObjectID(req.session.user._id)

		q.all([
			dbq('streams', 'find', {owner: userId})
			dbq('manuals', 'find', {owner: userId})
			dbq('revisions', 'find', {owner: userId})
			dbq('users', 'find', {_id: userId})
		]).then( (responses) ->
			output = {}
			for response in responses
				if response.collection isnt 'users'
					output[response.collection] = response.result
				else
					output.user = response.result[0].email
			res.status(200).send(
				isError: false
				result: output
			)
		).catch( (err) ->
			res.status(500).send(
				isError: true
				msg: 'Error in database select.'
			)
		)


	setStreamData: (req, res) ->

		mode = req.body.mode

		if ['add', 'edit'].indexOf(mode) is -1
			res.status(400).send(
				isError: true
				msg: 'Parameter required: mode.'
			)
			return

		if req.body.stream
			data = req.body.stream
			collection = 'streams'
			model = Stream

		else if req.body.manual
			data = req.body.manual
			collection = 'manuals'
			model = ManualEntry

		else if req.body.revision
			data = req.body.revision
			collection = 'revisions'
			model = StreamRevision

		else
			res.status(400).send(
				isError: true
				msg: 'Parameter required: stream, manual, or revision.'
			)
			return

		userId = mongoskin.helper.toObjectID(req.session.user._id)

		obj = model::jsonToObject(data)

		ymd = moment().format('YYYY-MM-DD')
		obj.modified = ymd

		if mode is 'add'
			obj.created = ymd
			obj.owner = userId

			if collection is 'streams'
				obj.isActive = true

		else
			streamId = mongoskin.helper.toObjectID(obj._id)

			# Don't trust these from the client
			delete obj._id
			delete obj.owner
			delete obj.created

		# todo: validate

		if mode is 'add'

			db.collection('streams').insert(obj, (err, result) ->

				if err
					res.status(500).send(
						isError: true
						errorCode: 50
						msg: 'Error in database insert.'
					)
					console.log('data: ', data)
					console.log('message: ', err.errmsg)
					return

				res.status(200).send(result[0])

			)

		else

			db.collection('streams').update({_id: streamId, owner: userId}, {$set: obj}, (err, result) ->

				if err
					res.status(500).send(
						isError: true
						errorCode: 50
						msg: 'Error in database update.'
					)
					console.log('data: ', data)
					console.log('message: ', err.errmsg)
					return

				if result isnt 1
					res.status(500).send(
						isError: true
						errorCode: 51
						msg: 'Error in database update.'
					)
					return

				res.status(200).send(
					isError: false
				)

			)



