q = require('q')
moment = require('moment')
mongoskin = require('mongoskin')
Stream = require('./../public/models/Stream').Stream
ManualEntry = require('./../public/models/ManualEntry').ManualEntry
StreamRevision = require('./../public/models/StreamRevision').StreamRevision

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh')

module.exports =

	getData: (req, res) ->

		collections = [
			'streams'
			'manuals'
			'revisions'
		]

		userId = mongoskin.helper.toObjectID(req.session.user._id)

		db.collection('streams').find({owner: userId}).toArray( (err, streamsResult) ->
			if err
				res.status(500).send(
					isError: true
					msg: 'Error in stream database.'
				)
				return

			db.collection('manuals').find({owner: userId}).toArray( (err, manualsResult) ->
				if err
					res.status(500).send(
						isError: true
						msg: 'Error in manuals database.'
					)
					return

				db.collection('revisions').find({owner: userId}).toArray( (err, revisionsResult) ->
					if err
						res.status(500).send(
							isError: true
							msg: 'Error in revisions database.'
						)
						return

					res.status(200).send(
						isError: false
						result:
							streams: streamsResult
							manuals: manualsResult
							revisions: revisionsResult
					)

				)

			)

		)


	createStreamData: (req, res) ->

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

		obj = model::jsonToObject(data)
		obj.owner = mongoskin.helper.toObjectID(req.session.user._id);
		ymd = moment().format('YYYY-MM-DD')
		obj.created = ymd
		obj.modified = ymd

		# todo: validate

		if collection is 'streams'
			obj.isActive = true

		db.collection(collection).insert(obj, (err, result) ->

			if err
				res.status(500).send(
					isError: true
					errorCode: 50
					msg: 'Error in database insert.'
				)
				console.log('data: ', data)
				console.log('message: ', err.errmsg)
				return

			res.status(200).send(
				isError: false
			)

		)

