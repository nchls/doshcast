q = require('q')
mongoskin = require('mongoskin')

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh')

module.exports =

	session: (req, res, next) ->

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

