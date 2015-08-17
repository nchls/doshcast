if exports?
	global = exports
	Model = require('./Model').Model
	_ = require './../bower/lodash/lodash.min'
else
	global = window.util.namespacer('dosh.models')
	Model = global.Model
	_ = window._

class User extends Model
	constructor: (created, modified, @email, @password, @registrationIp, @isActive, @lastLogin) ->
		super created, modified

	localSchema =

		email:
			type: 'varchar'
			label: 'E-mail address',
			validation:
				required: true
				maxLength: 60
				regex: /.+@.+\..+/i

		password:
			type: 'varchar'
			label: 'Password'
			validation:
				required: true
				minLength: 7
				# limit to prevent DOS attacks
				maxLength: 160
			dbValidation:
				maxLength: 500

		salt:
			type: 'varchar'
			validation:
				maxLength: 200

		passwordSchema:
			type: 'smallint'
			validation:
				required: true

		registrationIp:
			type: 'inet'
			validation:
				required: true

		isVerified:
			type: 'boolean'
			validation:
				required: true

		lastLogin:
			type: 'timestamp'
			validation:
				required: true


	schema: _.assign({}, localSchema, Model::schema)


global.User = User

