mongoskin = require('mongoskin')
Stream = require('./../public/models/Stream').Stream

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh')

module.exports =

	getData: (req, res) ->

		db.collection('streams').find({owner: mongoskin.helper.toObjectID(req.session.user._id)}).toArray( (err, result) ->

			if err
				res.status(500).send(
					isError: true
					msg: 'Error in stream database.'
				)
				return

			res.status(200).send(
				isError: false
				result: result
			)

		)


	createStream: (req, res) ->

		if not req.body.stream
			res.status(400).send(
				isError: true
				msg: 'Parameter required: stream.'
			)
			return

		stream = req.body.stream
		stream = Stream::jsonToObject(stream)
		stream.owner = mongoskin.helper.toObjectID(req.session.user._id);
		stream.isActive = true
		stream.created = new Date()
		stream.modified = new Date()

		# todo: validate

		db.collection('streams').insert(stream, (err, result) ->

			if err
				res.status(500).send(
					isError: true
					errorCode: 50
					msg: 'Error in stream database insert.'
				)
				return

			res.status(200).send(
				isError: false
			)

		)
