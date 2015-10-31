if exports?
	global = exports
	Model = require('./Model').Model
	_ = require './../bower/lodash/lodash.min'
else
	global = window.util.namespacer('dosh.models')
	Model = global.Model
	_ = window._

class StreamMutable extends Model
	constructor: (props) ->
		@[prop] = val for prop, val of props

	RECURRENCE_TYPES:
		RECURRENCE_TYPES = [
			['recur-daily', 'Daily']
			['recur-weekly', 'Weekly']
			['recur-biweekly', 'Every two weeks']
			['recur-monthly', 'Monthly']
			['recur-semiannually', 'Every six months']
			['recur-annually', 'Annually']
			['recur-irregularly', 'Irregularly']
		]

	getRecurrenceTypes: ->
		RECURRENCE_TYPES

	COMPOUNDING_TYPES:
		COMPOUNDING_TYPES = [
			['compound-none', 'None']
			['compound-daily', 'Daily']
			['compound-monthly', 'Monthly']
			['compound-semianually', 'Every six months']
			['compound-annually', 'Annually']
		]

	getCompoundingTypes: ->
		COMPOUNDING_TYPES

	FIELD_ORDER:
		FIELD_ORDER = [
			"streamSubtype"
			"name"
			"orgName"
			"isActive"
			"startDate"
			"firstPaymentDate"
			"isRegular"
			"isSeasonal"
			"amount"
			"recurrence"
			"balance"
			"interestRate"
			"compounding"
			"creditLimit"
			"isAlwaysPaidOff"
			"fromAccount"
			"toAccount"
		]

	getFieldOrder: ->
		FIELD_ORDER

	localSchema =

		# bill, loan, income, deposit, loc
		orgName:
			type: 'varchar'
			isMutable: true
			label: 'Bank name',
			otherLabels:
				loan: 'Lender name'
				bill: 'Payee name'
				income: 'Income source'
			showFor: [
				'deposit-account'
				'loan'
				'bill'
				'line-of-credit'
				'income'
			]
			validation:
				canBeNull: true
				maxLength: 50

		# bill, loan, income, transfer, loc
		amount:
			type: 'numeric'
			isMutable: true
			label: 'Minimum payment'
			otherLabels:
				bill: 'Payment amount'
				income: 'Initial income amount'
				transfer: 'Transfer amount'
			showFor: [
				'loan'
				'bill'
				'line-of-credit'
				'transfer'
				'income'
			]
			validation:
				canBeNull: true
				maxDigits: 9
				decimalPlaces: 2

		recurrence:
			type: 'enum'
			choices: RECURRENCE_TYPES
			isMutable: true
			label: 'Payment recurrence'
			otherLabels:
				income: 'Income recurrence'
				transfer: 'Transfer recurrence'
			showFor: [
				'loan'
				'bill'
				'income'
				'line-of-credit'
				'transfer'
			]
			validation:
				canBeNull: true

		# deposit, loan, loc
		balance:
			type: 'numeric'
			isMutable: true
			label: 'Starting balance'
			reviseLabel: 'Balance'
			showFor: [
				'deposit-account'
				'loan'
				'line-of-credit'
			]
			validation:
				canBeNull: true
				maxDigits: 14
				decimalPlaces: 2

		# deposit, loan, loc
		# to do: interest rate tiers
		# to do: unpredictable return, e.g. stocks
		interestRate:
			type: 'numeric'
			isMutable: true
			label: 'Interest rate'
			showFor: [
				'deposit-account'
				'loan'
				'line-of-credit'
			]
			input:
				suffix: '%'
			validation:
				canBeNull: true
				maxDigits: 6
				decimalPlaces: 4

		compounding:
			type: 'enum'
			choices: COMPOUNDING_TYPES
			isMutable: true
			label: 'Compounding'
			showFor: [
				'deposit-account'
				'loan'
				'line-of-credit'
			]
			validation:
				canBeNull: true

		# loan, loc
		creditLimit:
			type: 'int'
			isMutable: true
			label: 'Credit limit'
			showFor: [
				'line-of-credit'
			]
			validation:
				canBeNull: true
				maxDigits: 10
				decimalPlaces: 2

		# loan-credit
		isAlwaysPaidOff:
			type: 'boolean'
			isMutable: true
			label: 'Balance is paid off every period'
			helpText: 'Check if you do not carry a balance across billing periods.'
			showFor: [
				'line-of-credit'
			]
			validation:
				canBeNull: true

		# bill, loc, transfer
		fromAccount:
			type: 'varchar'
			foreignModel: 'Stream'
			isMutable: true
			label: 'Draw from account'
			showFor: [
				'loan'
				'bill'
				'line-of-credit'
				'transfer'
			]
			validation:
				maxLength: 14
				canBeNull: true

		# income, transfer
		toAccount:
			type: 'varchar'
			foreignModel: 'Stream'
			isMutable: true
			label: 'Deposit to account'
			showFor: [
				'income'
				'transfer'
			]
			validation:
				maxLength: 14
				canBeNull: true

	schema: _.assign({}, localSchema, Model::schema)

class Stream extends StreamMutable
	constructor: (props) ->
		@[prop] = val for prop, val of props

	STREAM_TYPES =
		STREAM_TYPES: [
			['deposit-account', 'Deposit account', [
				['account-checking', 'Checking account']
				['account-savings', 'Savings account']
				['account-cd', 'Certificate of deposit']
				['account-investment', 'Investment account']
			]]
			['line-of-credit', 'Line of credit', [
				['loc-credit', 'Credit card']
				['loc-heloc', 'Home equity line of credit']
			]]
			['income', 'Income', [
				['income-salary', 'Paycheck']
				['income-other', 'Other income']
			]]
			['bill', 'Bill', [
				['bill-rent', 'Rent']
				['bill-cell', 'Cell phone']
				['bill-tv', 'TV']
				['bill-water', 'Water']
				['bill-electric', 'Electric']
				['bill-heat', 'Heat']
				['bill-internet', 'Internet']
				['bill-insurance-health', 'Health insurance']
				['bill-insurance-car', 'Car insurance']
				['bill-insurance-life', 'Life insurance']
				['bill-other', 'Other bill']
			]]
			['loan', 'Loan', [
				['loan-student', 'Student loan']
				['loan-auto', 'Auto loan']
				['loan-health', 'Health loan']
				['loan-mortgage', 'Mortgage']
				['loan-personal', 'Personal loan']
				['loan-other', 'Other loan']
			]]
			['transfer', 'Transfer', [
				['transfer-transfer', 'Transfer']
			]]
		]

	getStreamTypes: ->
		STREAM_TYPES

	TYPES = []
	SUBTYPES = []
	for type in STREAM_TYPES.STREAM_TYPES
		TYPES.push(type[0..1])
		SUBTYPES = SUBTYPES.concat(type[2])

	localSchema =

		name:
			type: 'varchar'
			label: 'Account Name'
			otherLabels:
				transfer: 'Transfer name'
			helpText: 'For your own reference.'
			validation:
				required: true
				maxLength: 40

		owner:
			type: 'varchar'
			foreignModel: 'User'
			validation:
				maxLength: 14
				required: true

		isActive:
			type: 'boolean'
			default: true
			validation:
				required: true

		order:
			type: 'smallint'
			default: 50
			validation:
				required: true

		streamType:
			type: 'enum'
			choices: TYPES
			validation:
				required: true

		streamSubtype:
			type: 'enum'
			choices: SUBTYPES
			label: 'Account type'
			validation:
				required: true

		# deposit, loan, loc
		startDate:
			type: 'date'
			label: 'Account opening date'
			helpText: 'This doesn\'t have to be exact. It can be simply the date from which you want to start tracking your finances.'
			otherHelpText:
				loan: 'More accurately, the date the loan began to accrue interest.'
			showFor: [
				'deposit-account'
				'loan'
				'line-of-credit'
			]
			validation:
				canBeNull: true

		# loan, bill, loc, transfer, income
		firstPaymentDate:
			type: 'date'
			label: 'Date of first payment'
			otherLabels:
				transfer: 'Date of first transfer'
				income: 'Date of first deposit'
			showFor: [
				'loan'
				'bill'
				'line-of-credit'
				'transfer'
				'income'
			]
			validation:
				canBeNull: true

		# loan, bill
		# always the same payment amount
		isRegular:
			type: 'boolean'
			default: true
			label: 'Payment amount is regular'
			helpText: 'Check if the payment is roughly the same amount every period.'
			otherHelpText:
				income: 'Check if the income is roughly the same amount every period.'
			showFor: [
				'bill'
				'income'
			]
			validation:
				canBeNull: true

		# bill
		# fluctuates based on season, e.g. heat
		isSeasonal:
			type: 'boolean'
			label: 'Payment amount is seasonal'
			helpText: 'Check if the payment amount fluctuates per season. For example, heating bills.'
			showFor: [
				'bill'
			]
			default: false
			validation:
				canBeNull: true

	schema: _.assign({}, localSchema, StreamMutable::schema)


global.Stream = Stream
global.StreamMutable = StreamMutable

