q = require('q')
shortid = require('shortid')
pbkdf2 = require('easy-pbkdf2')({
	DEFAULT_HASH_ITERATIONS: 128000
	SALT_SIZE: 64
})

db = require('../source/db/db')
User = require('./../public/models/User').User

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

			db.query(User, """
				insert into "User" (
					id,
					email,
					password,
					"passwordSchema",
					"registrationIp",
					"isVerified",
					"lastLogin",
					salt
				) values ($1,$2,$3,$4,$5,$6,$7);""", [
					shortid.generate()
					user.email
					user.password
					user.passwordSchema
					user.registrationIp
					user.isVerified
					user.lastLogin
					user.salt
				])

				.then( (result) ->

					res.status(200).send(
						isError: false
					)

				).catch( (err) ->

					res.status(500).send(
						isError: true
						errorCode: 50
						msg: 'Error in user database insert.'
					)
					return

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

		db.query(User, 'select * from "User" where email=$1', [user.email])

			.then( (result) ->

				if result.rows.length is 0
					res.status(401).send(
						isError: true
						errorCode: 42
						msg: 'User not found.'
					)
					return

				dbUser = result.rows[0]

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

			).catch( (err) ->

				res.status(500).send(
					isError: true
					errorCode: 50
					msg: 'Error in user lookup.'
				)
				return

			);


	logoutUser: (req, res) ->
		delete req.session.user
		res.status(200).send(
			isError: false
		)

