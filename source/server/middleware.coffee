module.exports =

	requireLogin: (req, res, next) ->

		if not req.session?.user

			res.status(401).send(
				isError: true
				errorCode: 40
				msg: 'You must be logged in.'
			)
			return

		next()

