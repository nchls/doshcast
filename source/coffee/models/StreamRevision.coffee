if exports?
	global = exports
	StreamMutable = require('./StreamMutable').StreamMutable
	_ = require './../../bower/lodash/dist/lodash.min'
else
	window.dosh ?= {}
	window.dosh.models ?= {}
	global = window.dosh.models
	StreamMutable = global.StreamMutable
	_ = window._

class StreamRevision extends StreamMutable
	constructor: (created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount, @revised, @effectiveDate, @isClosed) ->
		super created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount

	localSchema =

		revised:
			type: 'foreignKey'
			model: 'Stream'
			validation:
				required: true

		effectiveDate:
			type: 'dateTime'
			validation:
				required: true

		isClosed:
			type: 'nullBoolean'
			label: 'Account is closed'
			otherLabels:
				transfer: 'Transfer is no longer active'
				income: 'Income source is no longer active'
				loan: 'Loan is forgiven'
			isRevisionOnly: true

	schema: _.assign({}, localSchema, StreamMutable::schema)

global.StreamRevision = StreamRevision

