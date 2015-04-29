q = require('q')
mongoskin = require('mongoskin')
pbkdf2 = require('easy-pbkdf2')({
	DEFAULT_HASH_ITERATIONS: 128000
	SALT_SIZE: 64
})
User = require('./../public/models/User').User

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh')

module.exports =

	createUser: (req, res) ->

		if not req.body.user
			res.status(400).send(
				isError: true
				errorCode: 40
				msg: 'Parameter required: user.'
			)
			return

		user = req.body.user
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
					errorCode: 50
					msg: 'Error in user hash creation.'
				)
				return

			user.password = passwordHash
			user.salt = salt

			db.collection('users').insert(user, (err, result) ->

				if err
					res.status(500).send(
						isError: true
						errorCode: 50
						msg: 'Error in user database insert.'
					)
					return

				res.status(200).send(
					isError: false
				)

			)

		)


	loginUser: (req, res) ->

		if not req.body.user
			res.status(400).send(
				isError: true
				errorCode: 40
				msg: 'Parameter required: user.'
			)
			return

		if req.session.user
			res.status(400).send(
				isError: true
				errorCode: 41
				msg: 'You are already logged in.'
				email: req.session.user.email
			)
			return

		user = User::jsonToObject(req.body.user)

		db.collection('users').findOne({email: user.email}, (err, dbUser) ->

			if err
				res.status(500).send(
					isError: true
					errorCode: 50
					msg: 'Error in user lookup.'
				)
				return

			if not dbUser
				res.status(401).send(
					isError: true
					errorCode: 42
					msg: 'User not found.'
				)
				return

			pbkdf2.verify(dbUser.salt, dbUser.password, user.password, (err, valid) ->

				if err
					res.status(500).send(
						isError: true
						errorCode: 50
						msg: 'Error in user authentication.'
					)
					return

				if not valid
					res.status(401).send(
						isError: true
						errorCode: 43
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

