mongoskin = require('mongoskin')
pbkdf2 = require('easy-pbkdf2')({
	DEFAULT_HASH_ITERATIONS: 128000
	SALT_SIZE: 64
})
Stream = require('./../../public/js/models/Stream').Stream
User = require('./../../public/js/models/User').User

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh')

module.exports =

	sessionMiddleware: (req, res, next) ->

		if req.session?.user

			db.collection('users').findOne({id: req.session.user.id}, (err, dbUser) ->

				if err
					res.status(500).send(
						isError: true
						msg: 'Error in session user database.'
					)
					return

				if dbUser

					req.user =
						id: dbUser._id
						email: dbUser.email

					next()

				else
					res.status(401).send(
						isError: true
						msg: 'Session user not found.'
					)
					return
			)

		else

			next()


	requireLogin: (req, res, next) ->

		if not req.user

			res.status(401).send(
				isError: true
				msg: 'You must be logged in.'
			)
			return

		next()


	getData: (req, res) ->

		db.collection('streams').find({owner: req.user.id}).toArray( (err, result) ->

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

		if not req.query.stream
			res.status(400).send(
				isError: true
				msg: 'Parameter required: stream.'
			)
			return

		stream = req.query.stream
		stream = Stream::jsonToObject(stream)
		stream.owner = req.user.id
		stream.isActive = true
		stream.created = new Date()
		stream.modified = new Date()

		# todo: validate

		db.collection('streams').insert(stream, (err, result) ->

			if err
				res.status(500).send(
					isError: true
					msg: 'Error in stream database insert.'
				)
				return

			res.status(200).send(
				isError: false
			)

		)


	createUser: (req, res) ->

		if not req.query.user
			res.status(400).send(
				isError: true
				msg: 'Parameter required: user.'
			)
			return

		user = req.query.user
		user = User::jsonToObject(user)
		user.passwordSchema = 1
		user.registrationIp = req.connection.remoteAddress
		user.isVerified = true
		user.lastLogin = new Date()

		# todo: validate

		pbkdf2.secureHash(user.password, (err, passwordHash, salt) ->

			if err
				res.status(500).send(
					isError: true
					msg: 'Error in user hash creation.'
				)
				return

			user.password = passwordHash
			user.salt = salt

			db.collection('users').insert(user, (err, result) ->

				if err
					res.status(500).send(
						isError: true
						msg: 'Error in user database insert.'
					)
					return

				res.status(200).send(
					isError: false
				)

			)

		)


	loginUser: (req, res) ->

		if not req.query.user
			res.status(400).send(
				isError: true
				msg: 'Parameter required: user.'
			)
			return

		if req.user
			res.status(400).send(
				isError: true
				msg: 'You are already logged in.'
			)
			return

		user = User::jsonToObject(req.query.user)

		db.collection('users').findOne({email: user.email}, (err, dbUser) ->

			if err
				res.status(500).send(
					isError: true
					msg: 'Error in user lookup.'
				)
				return

			if not dbUser
				res.status(401).send(
					isError: true
					msg: 'User not found.'
				)
				return

			pbkdf2.verify(dbUser.salt, dbUser.password, user.password, (err, valid) ->

				if err
					res.status(500).send(
						isError: true
						msg: 'Error in user authentication.'
					)
					return

				if not valid
					res.status(401).send(
						isError: true
						msg: 'Incorrect password.'
					)
					return

				req.session.user = dbUser

				res.status(200).send(
					isError: false
				)

			)

		)


	logoutUser: (req, res) ->
		delete req.session.user
		res.status(200).send(
			isError: false
		)

