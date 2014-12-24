if exports?
	global = exports
	Model = require('./Model').Model
	_ = require './../bower/lodash/dist/lodash.min'
else
	window.dosh ?= {}
	window.dosh.models ?= {}
	global = window.dosh.models
	Model = global.Model
	_ = window._

class User extends Model
	constructor: (created, modified, @email, @password, @registrationIp, @isActive, @lastLogin) ->
		super created, modified

	localSchema =

		email:
			type: 'string'
			label: 'E-mail address',
			validation:
				required: true
				regex: /.+@.+\..+/i

		password:
			type: 'password'
			label: 'Password'
			validation:
				required: true
				minLength: 7
				# limit to prevent DOS attacks
				maxLength: 160

		passwordSchema:
			type: 'positiveInt'
			validation:
				required: true

		registrationIp:
			type: 'string'
			validation:
				required: true

		isVerified:
			type: 'boolean'
			validation:
				required: true

		lastLogin:
			type: 'dateTime'
			validation:
				required: true


	schema: _.assign({}, localSchema, Model::schema)


global.User = User

