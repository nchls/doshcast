if exports?
	global = exports
	Model = require('./Model').Model
	_ = require './../bower/lodash/lodash.min'
else
	global = window.util.namespacer('dosh.models')
	Model = global.Model
	_ = window._

class ManualEntry extends Model
	constructor: (created, modified, @entryDate, @amount, @stream) ->
		super created, modified

	localSchema =

		entryDate:
			type: 'date'
			validation:
				required: true

		amount:
			type: 'numeric'
			validation:
				required: true
				maxDigits: 9
				decimalPlaces: 2

		stream:
			type: 'uuid'
			foreignModel: 'Stream'
			validation:
				required: true

	schema: _.assign({}, localSchema, Model::schema)

global.ManualEntry = ManualEntry

