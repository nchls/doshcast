# http://coolors.co/cfc294-373f4b-e3d297-afbc9d-f54a28

renderPage = (component) ->
	React.render(React.createElement(component, null), document.getElementById('main'))


( ->

	if document.location.pathname is '/accounts'
		renderPage(AccountsPage)

	if document.location.pathname is '/ledger'
		renderPage(LedgerPage)

)()


ledgerService = ->

	timeDeltas =
		'daily': ['days', 1]
		'weekly': ['weeks', 1]
		'biweekly': ['weeks', 2]
		'monthly': ['months', 1]
		'semiannually': ['months', 6]
		'annually': ['years', 1]


	getData = (callback, endDelta = 90) ->

		perf.start('REQUEST')

		request = $resource('/api/v1/getData', {types: 'streams|revisions|manuals'})

		request.get({}, (data) ->
			perf.end('REQUEST')
			output = buildLedger(data, endDelta)
			callback(output)
		)


	buildLedger = (data, endDelta) ->

		perf.start 'PROCESSING'

		manuals = data.manuals
		revisions = data.revisions
		streams = data.streams

		streams = _.sortBy(streams, ['order', 'class', 'type', 'subType', 'id'])

		streams = setStreamColumns(streams)

		dataStart = getStreamsStart(streams)
		dataEnd = moment().add('days', endDelta)
		dataDates = getDaysInRange(dataStart, dataEnd)

		transactionDates = getTransactionDates(streams, dataEnd)
		mutableFields = getMutableFields()
		currentValues = getInitialValues(streams, mutableFields)

		lookupLedger = getLookupLedger(streams, manuals, revisions, dataDates, transactionDates, currentValues)

		window.ledger = lookupLedger

		output =
			ledger: lookupLedger
			manuals: manuals
			revisions: revisions
			streams: streams

		perf.end 'PROCESSING'

		return output


	setStreamColumns = (streams) ->
		perf.start 'setStreamColumns'

		for stream in streams
			columns = []

			if stream.type in ['line-of-credit', 'loan', 'bill', 'income', 'transfer']
				columns.push(['payment', 'Payment'])

			if stream.type in ['deposit-account', 'line-of-credit']
				columns.push(['spending', 'Spending'])

			if stream.class in ['balance', 'hybrid']
				columns.push(['balance', 'Balance'])

			if stream.subType is 'loc-credit'
				columns.push(['carriedBalance', 'Carried Balance'])

			if stream.intRate?
				columns.push(['interest', 'Interest'])
				columns.push(['accruedInterest', 'Accrued Interest'])

			stream.columns = columns

		perf.end 'setStreamColumns'
		return streams


	getStreamsStart = (streams) ->
		perf.start 'getStreamsStart'

		streamsStart = moment()

		for stream in streams
			start = moment(stream.startDate)
			if start.isBefore(streamsStart)
				streamsStart = start

		perf.end 'getStreamsStart'
		return streamsStart


	getDaysInRange = (startDate, endDate) ->
		perf.start 'getDaysInRange'
		days = []
		endDateYmd = endDate.format('YYYY-MM-DD')
		iterDate = startDate.clone()
		iterDateYmd = iterDate.format('YYYY-MM-DD')
		while iterDateYmd < endDateYmd
			days.push(iterDate)
			iterDate = iterDate.clone().add('days', 1)
			iterDateYmd = iterDate.format('YYYY-MM-DD')
		perf.end 'getDaysInRange'
		return days


	###
	Returns an object of recurring transaction stream IDs with arrays of their transaction dates.

	{
		11: [Moment, ...]
	}
	###
	getTransactionDates = (streams, endDate) ->
		perf.start 'getTransactionDates'
		transactionDates = {}

		endDateYmd = endDate.format('YYYY-MM-DD')

		for streamIdx, stream of streams
			if stream.recurrence
				# Initialize this stream's list of dates
				transactionDates[stream.id] = []

				recurrence = stream.recurrence.split('-')[1]
				delta = timeDeltas[recurrence]

				if recurrence isnt 'irregularly'
					checkDateYmd = stream.firstPaymentDate
					checkDate = moment(checkDateYmd)
					while checkDate.isBefore(endDate) or checkDateYmd is endDateYmd
						transactionDates[stream.id].push([checkDateYmd, checkDate])
						# move to the next transaction date
						checkDate = checkDate.clone().add(delta[0], delta[1])
						checkDateYmd = checkDate.format('YYYY-MM-DD')
				else
					undefined # todo: irregular recurrence

		perf.end 'getTransactionDates'
		return transactionDates


	getInitialValues = (streams, mutableFields) ->
		perf.start 'getInitialValues'
		initialValues = {}
		for streamIdx, stream of streams
			initialValues[stream.id] = {}
			for field in mutableFields
				if field of stream
					initialValues[stream.id][field] = stream[field]

		perf.end 'getInitialValues'
		return initialValues


	getMutableFields = ->
		perf.start 'getMutableFields'
		output = _.pluck(_.filter($rootScope.initialData.models.stream.config, 'isMutable'), 'jsName')
		perf.end 'getMutableFields'
		return output


	getLookupLedger = (streams, manuals, revisions, dataDates, transactionDates, currentValues) ->
		perf.start 'getLookupLedger'

		lookupLedger = {}
		for day in dataDates

			ymd = day.format('YYYY-MM-DD')

			lookupLedger[ymd] =
				moment: day
				streams: []

			for streamIdx, stream of streams

				streamEntry =
					id: stream.id

				current = currentValues[stream.id]

				if stream.class in ['transaction', 'hybrid']

					amount = null
					for transDate in transactionDates[stream.id]
						if transDate[0] is ymd
							amount = current.amount

							if 'fromAccount' of stream
								# Subtract from another account
								currentValues[stream.fromAccount].balance -= amount
								if stream.class is 'hybrid'
									# And reduce this stream's balance
									current.balance -= amount
							if 'toAccount' of stream
								# Deposit to account
								currentValues[stream.toAccount].balance += amount


				if stream.type in ['line-of-credit', 'loan', 'bill', 'income', 'transfer']
					streamEntry.payment = if amount? then doshFormat(amount) else null


				if stream.type in ['deposit-account', 'line-of-credit']
					streamEntry.spending = null


				if stream.class in ['balance', 'hybrid']

					startDate = stream.startDate

					balance = current.balance
					interest = 0

					streamEntry.balance = doshFormat(current.balance)

					if stream.subType is 'loc-credit'
						streamEntry.carriedBalance = null

					if startDate is ymd or startDate < ymd

						for manualId, manual of manuals[stream.id]
							if manual.date.isSame(day)
								current.balance = manual.amount

						if startDate is ymd
							streamEntry.isManual = true

						# Add column for interest rate
						if stream.intRate? and current.intRate > 0
							interest = ((current.intRate / 100) / 365.25) * balance

					if stream.intRate?
						streamEntry.interest = if interest > 0 then doshFormat(interest) else null

						streamEntry.accruedInterest = null

				lookupLedger[ymd].streams.push(streamEntry)

		perf.end 'getLookupLedger'
		return lookupLedger


	return { getData: getData }


accountsService = ->

	getData = (callback) ->

		output = {}

		request = $resource('/api/v1/getData', {types: 'streams'})

		request.get({}, (data) ->

			output =
				streams: data.streams

			callback(output)

		)

	return { getData: getData }


AuthController = ->

	window.authscope = $scope;

	$scope.user = $rootScope.initialData.user

	$('body').on('click', (evt) ->
		if $scope.signupPanelOpen and $(evt.target).closest('.sign-up-panel, .sign-up').length is 0
			$scope.signupPanelOpen = false
			$scope.$apply()
		if $scope.loginPanelOpen and $(evt.target).closest('.log-in-panel, .log-in').length is 0
			$scope.loginPanelOpen = false
			$scope.$apply()
	)

	$scope.handleLoginClick = ->
		$scope.loginPanelOpen = not $scope.loginPanelOpen

	$scope.handleSignupClick = ->
		$scope.signupPanelOpen = not $scope.signupPanelOpen

	$scope.handleLogoutClick = ->
		$form = $('.log-out')
		formData = $form.serialize()

		logoutPromise = $.post($form.attr('data-url'), formData)

		logoutPromise.done( (data) ->
			if not data.error
				$scope.user = {
					isLoggedIn: false
				}
				$scope.$apply()
		)

	$scope.handleLoginSubmit = ->
		$form = $('.log-in-panel')
		formData = $form.serialize()

		formPromise = $.post($form.attr('data-url'), formData)

		formPromise.done( (data) ->
			if not data.error
				$scope.user.isLoggedIn = true
				$scope.user.username = data.username
				$scope.$apply()
		)

	$scope.handleSignupSubmit = ->
		$form = $('.sign-up-panel')
		formData = $form.serialize()

		formPromise = $.post($form.attr('data-url'), formData)

		formPromise.done( (data) ->
			if not data.error
				$scope.user.isLoggedIn = true
				$scope.user.username = data.username
				$scope.$apply()
		)


PrimaryNavController = ->
	$scope.links = [
		{
			name: 'Dashboard'
			href: '/dashboard'
		}
		{
			name: 'Accounts'
			href: '/accounts'
		}
		{
			name: 'Ledger'
			href: '/ledger'
		}
		{
			name: 'Goals'
			href: '/goals'
		}
		{
			name: 'Projection'
			href: '/projection'
		}
	]


LedgerController = ->

	window.ledgerScope = $scope

	subColumns = [
		['payment', 'Payment'],
		['spending', 'Spending'],
		['balance', 'Balance'],
		['carriedBalance', 'Carried Balance'],
		['interest', 'Interest'],
		['accruedInterest', 'Accrued Interest'],
	]

	init = ->
		ledgerService.getData(handleLedgerData)


	handleLedgerData = (data) ->

		ledger = formatLedgerTable(data.ledger)

		perf.start 'RENDER'

		$scope.streams = data.streams
		$scope.manuals = data.manuals
		$scope.revisions = data.revisions
		$scope.ledger = ledger

		$scope.subStreams = prepLedgerHeader(data.streams)

		setTimeout( ->
			perf.end 'RENDER'
		, 1);


	prepLedgerHeader = (streams) ->

		perf.start 'prepLedgerHeader'

		subStreams = []
		for stream in streams
			if stream.columns.length > 1
				columnLabels = _.pluck(stream.columns, 1)
				subStreams = subStreams.concat(columnLabels)

		perf.end 'prepLedgerHeader'
		return subStreams


	formatLedgerTable = (lookupLedger) ->

		perf.start 'formatLedgerTable'

		ledger = {}

		for day, data of lookupLedger

			ledger[day] =
				printDate: data.moment.format('MMM D')
				fullDate: data.moment.format('dddd, MMMM Do, YYYY')

			row = []

			for streamEntry in data.streams
				for subCol in subColumns
					if subCol[0] of streamEntry
						row.push(
							val: streamEntry[subCol[0]]
						)

			ledger[day].row = row

		perf.end 'formatLedgerTable'
		return ledger


	init()


AccountsController = ->

	window.accountsScope = $scope

	init = ->

		$scope.streamTypes = getStreamTypes()

		$scope.streamFields = $rootScope.initialData.models.stream.config

		$scope.recurrenceTypes = $rootScope.initialData.models.stream.recurrence
		$scope.compoundingTypes = $rootScope.initialData.models.stream.compounding

		$scope.newStream = {}

		if not $scope.streams
			accountsService.getData( (data) ->
				$scope.streams = data.streams
			)


	$scope.handleStreamClick = (streamId) ->
		$scope.editStreamOpen = true
		$scope.editStream = streamId


	$scope.handleAddStreamClick = ->
		$scope.addStreamOpen = true
		setTransferStreams()


	$scope.setNewStream = (type, name) ->
		$scope.newStream =
			type: type
			name: name
		fields = getFieldsByType(type.typeKey)
		for field in fields
			if field.default
				$scope.newStream[field.jsName] = field.default


	$scope.getSelectOptions = (type) ->
		if type is 'compounding'
			return 'type.1 for type in compoundingTypes'
		if type is 'recurrence'
			return 'type.1 for type in recurrenceTypes'
		if type in ['from_account', 'to_account']
			return 'stream.name for stream in transferStreams'


	$scope.getStreamsByType = ->
		return _.groupBy($scope.streams, 'type')


	$scope.getStreamLabel = (field, type) ->
		thisField = _.find($scope.streamFields, {'key': field})
		label = thisField.label
		if thisField.otherLabels and type of thisField.otherLabels
			label = thisField.otherLabels[type]
		return label


	$scope.getStreamHelp = (field, type) ->
		thisField = _.find($scope.streamFields, {'key': field})
		help = thisField.helpText
		if thisField.otherHelpText and type of thisField.otherHelpText
			help = thisField.otherHelpText[type]
		return help


	$scope.handleAddStreamSubmit = ->
		$form = $('.addStreamForm')

		formData = _.cloneDeep($scope.newStream)
		formData.type = formData.type.subKey
		_.forEach(formData, (v, k) ->

			if typeof v is 'object'
				if Array.isArray(v)
					# Get key from select fields
					formData[k] = v[0]
				else
					# Foreign keys for accounts
					formData[k] = v.id

			thisField = _.find($scope.streamFields, {'jsName': k})
			if thisField.dataType is 'decimal'
				formData[k] = parseFloat(v)

		)
		formData = 'newStream=' + JSON.stringify(formData);

		formPromise = $.post($form.attr('data-url'), formData)

		formPromise.done( (data) ->
			if not data.error
				# Update streams
				$scope.$apply()
		)


	$scope.closeAddStream = ->
		$scope.addStreamOpen = false


	getStreamTypes = ->

		perf.start 'getStreamTypes'

		streamTypes = []
		for streamType in $rootScope.initialData.models.stream.types
			for subType in streamType[2]
				streamTypes.push(
					typeName: streamType[1]
					typeKey: streamType[0]
					subName: subType[1]
					subKey: subType[0]
				)

		perf.end 'getStreamTypes'
		return streamTypes


	# todo: memoize
	getFieldsByType = (type) ->
		perf.start 'getFieldsByType'
		fieldsByType = _.filter($scope.streamFields, (thisField) ->
			return not thisField.showFor or _.contains(thisField.showFor, type)
		)
		perf.end 'getFieldsByType'
		return fieldsByType


	setTransferStreams = ->
		$scope.transferStreams = _.filter($scope.streams, (stream) ->
			return _.contains(['deposit-account', 'line-of-credit'], stream.type)
		)


	init()


window.log = ->
  log.history = log.history or []
  log.history.push(arguments)
  if this.console
    console.log( Array.prototype.slice.call(arguments) )


( ->

	metrics = {}

	window.perf = {
		start: (evtName) ->
			metrics[evtName] = window.performance.now()
		end: (evtName) ->
			duration = window.performance.now() - metrics[evtName]
			log(evtName + ': ' + duration.toFixed(2) + ' ms')
	}

)()
