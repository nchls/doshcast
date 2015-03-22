(->

	timeDeltas =
		'daily': [1, 'days']
		'weekly': [1, 'weeks']
		'biweekly': [2, 'weeks']
		'monthly': [1, 'months']
		'semiannually': [6, 'months']
		'annually': [1, 'years']


	getLedgerData = (data, endDelta = 90) ->

		perf.start 'PROCESSING'

		manuals = data.manuals
		revisions = data.revisions
		streams = data.streams

		streams = _.sortBy(streams, ['order', 'class', 'streamType', 'streamSubtype', '_id'])
		streams = classifyStreams(streams)

		streams = setStreamColumns(streams)

		dataStart = getStreamsStart(streams)
		dataEnd = moment().add(endDelta, 'days')
		dataDates = getDaysInRange(dataStart, dataEnd)

		transactionDates = getTransactionDates(streams, dataEnd)
		mutableFields = getMutableFields()
		currentValues = getInitialValues(streams, mutableFields)

		ledger = getLedger(streams, manuals, revisions, dataDates, transactionDates, currentValues)

		output =
			ledger: ledger
			manuals: manuals
			revisions: revisions
			streams: streams

		perf.end 'PROCESSING'

		return output


	classifyStreams = (streams) ->
		perf.start 'classifyStreams'
		for stream in streams
			if stream.balance? and stream.recurrence?
				stream.class = 'hybrid'
			else
				if stream.recurrence? then stream.class = 'transaction' else stream.class = 'balance'
		perf.end 'classifyStreams'
		return streams


	setStreamColumns = (streams) ->
		perf.start 'setStreamColumns'

		for stream in streams
			columns = []

			if stream.streamType in ['line-of-credit', 'loan', 'bill', 'income', 'transfer']
				columns.push(['payment', 'Payment'])

			if stream.streamType is 'line-of-credit' or stream.streamSubtype is 'account-checking'
				columns.push(['spending', 'Spending'])

			if stream.class in ['balance', 'hybrid']
				columns.push(['balance', 'Balance'])

			if stream.streamSubtype is 'loc-credit'
				columns.push(['carriedBalance', 'Carried Balance'])

			if stream.interestRate?
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
			iterDate = iterDate.clone().add(1, 'days')
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
				transactionDates[stream._id] = []

				recurrence = stream.recurrence.split('-')[1]
				delta = timeDeltas[recurrence]

				if recurrence isnt 'irregularly'
					checkDateYmd = stream.firstPaymentDate
					checkDate = moment(checkDateYmd)
					while checkDate.isBefore(endDate) or checkDateYmd is endDateYmd
						transactionDates[stream._id].push([checkDateYmd, checkDate])
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
			initialValues[stream._id] = {}
			for field in mutableFields
				if field of stream
					initialValues[stream._id][field] = stream[field]

		perf.end 'getInitialValues'
		return initialValues


	getMutableFields = ->
		perf.start 'getMutableFields'
		output = _.pull(_.map(dosh.models.Stream.prototype.schema, (value, key) ->
			if value.isMutable
				return key;
		), undefined)
		perf.end 'getMutableFields'
		return output


	getLedger = (streams, manuals, revisions, dataDates, transactionDates, currentValues) ->
		perf.start 'getLedger'

		ledger = []

		for day in dataDates

			ymd = day.format('YYYY-MM-DD')

			streamsData = []

			for streamIdx, stream of streams

				streamEntry =
					id: stream._id

				current = currentValues[stream._id]

				if stream.class in ['transaction', 'hybrid']

					amount = null
					for transDate in transactionDates[stream._id]
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


				if stream.streamType in ['line-of-credit', 'loan', 'bill', 'income', 'transfer']
					streamEntry.payment = if amount? then util.doshFormat(amount) else null


				if stream.streamType is 'line-of-credit' or stream.streamSubtype is 'account-checking'
					streamEntry.spending = null


				if stream.class in ['balance', 'hybrid']

					startDate = stream.startDate

					balance = current.balance
					interest = 0

					streamEntry.balance = util.doshFormat(current.balance)

					if stream.streamSubtype is 'loc-credit'
						streamEntry.carriedBalance = null

					if startDate is ymd or startDate < ymd

						if manuals?[stream._id]
							for manualId, manual of manuals[stream._id]
								if manual.date.isSame(day)
									current.balance = manual.amount

						if startDate is ymd
							streamEntry.isManual = true

						# Add column for interest rate
						if stream.interestRate? and current.interestRate > 0
							interest = ((current.interestRate / 100) / 365.25) * balance

					if stream.interestRate?
						streamEntry.interest = if interest > 0 then util.doshFormat(interest) else null

						streamEntry.accruedInterest = null

				streamsData.push(streamEntry)

			ledger.push(
				ymd: ymd
				moment: day
				streams: streamsData
			)

		perf.end 'getLedger'
		return ledger


	util.namespacer('dosh.services').ledger =
		getLedgerData: getLedgerData

)()
