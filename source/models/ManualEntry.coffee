if exports?
	global = exports
	Model = require('./Model').Model
	_ = require './../bower/lodash/lodash.min'
else
	global = window.util.namespacer('dosh.models')
	Model = global.Model
	_ = window._

class ManualEntry extends Model
	constructor: (props) ->
		@[prop] = val for prop, val of props

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
			type: 'varchar'
			foreignModel: 'Stream'
			validation:
				maxLength: 14
				required: true

	schema: _.assign({}, localSchema, Model::schema)

global.ManualEntry = ManualEntry

