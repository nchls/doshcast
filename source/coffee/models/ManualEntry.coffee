if exports?
	global = exports
	Model = require('./Model').Model
	_ = require './../../bower/lodash/dist/lodash.min'
else
	window.dosh ?= {}
	window.dosh.models ?= {}
	global = window.dosh.models
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
			type: 'decimal'
			maxDigits: 9
			decimalPlaces: 2
			validation:
				required: true
		stream:
			type: 'foreignKey'
			model: 'Stream'
			validation:
				required: true

	schema: _.assign({}, localSchema, Model::schema)

global.ManualEntry = ManualEntry

