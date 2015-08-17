if exports?
	global = exports
	StreamMutable = require('./Stream').StreamMutable
	_ = require './../bower/lodash/lodash.min'
else
	global = window.util.namespacer('dosh.models')
	StreamMutable = global.StreamMutable
	_ = window._

class StreamRevision extends StreamMutable
	constructor: (created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount, @revised, @effectiveDate, @isClosed) ->
		super created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount

	localSchema =

		revised:
			type: 'uuid'
			foreignModel: 'Stream'
			validation:
				required: true

		effectiveDate:
			type: 'date'
			validation:
				required: true

		isClosed:
			type: 'boolean'
			label: 'Account is closed'
			otherLabels:
				transfer: 'Transfer is no longer active'
				income: 'Income source is no longer active'
				loan: 'Loan is forgiven'
			isRevisionOnly: true
			validation:
				canBeNull: true

	schema: _.assign({}, localSchema, StreamMutable::schema)

global.StreamRevision = StreamRevision

