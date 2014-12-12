(function() {
  angular.module('dosh', ['angular.filter', 'ngResource']);

  angular.module('dosh').run(function($rootScope) {
    $rootScope._ = window._;
    return $rootScope.initialData = window.initialData;
  }).service('ledgerService', function($resource, $rootScope) {
    var buildLedger, getData, getDaysInRange, getInitialValues, getLookupLedger, getMutableFields, getStreamsStart, getTransactionDates, setStreamColumns, timeDeltas;
    timeDeltas = {
      'daily': ['days', 1],
      'weekly': ['weeks', 1],
      'biweekly': ['weeks', 2],
      'monthly': ['months', 1],
      'semiannually': ['months', 6],
      'annually': ['years', 1]
    };
    getData = function(callback, endDelta) {
      var request;
      if (endDelta == null) {
        endDelta = 90;
      }
      perf.start('REQUEST');
      request = $resource('/api/v1/getData', {
        types: 'streams|revisions|manuals'
      });
      return request.get({}, function(data) {
        var output;
        perf.end('REQUEST');
        output = buildLedger(data, endDelta);
        return callback(output);
      });
    };
    buildLedger = function(data, endDelta) {
      var currentValues, dataDates, dataEnd, dataStart, lookupLedger, manuals, mutableFields, output, revisions, streams, transactionDates;
      perf.start('PROCESSING');
      manuals = data.manuals;
      revisions = data.revisions;
      streams = data.streams;
      streams = _.sortBy(streams, ['order', 'class', 'type', 'subType', 'id']);
      streams = setStreamColumns(streams);
      dataStart = getStreamsStart(streams);
      dataEnd = moment().add('days', endDelta);
      dataDates = getDaysInRange(dataStart, dataEnd);
      transactionDates = getTransactionDates(streams, dataEnd);
      mutableFields = getMutableFields();
      currentValues = getInitialValues(streams, mutableFields);
      lookupLedger = getLookupLedger(streams, manuals, revisions, dataDates, transactionDates, currentValues);
      window.ledger = lookupLedger;
      output = {
        ledger: lookupLedger,
        manuals: manuals,
        revisions: revisions,
        streams: streams
      };
      perf.end('PROCESSING');
      return output;
    };
    setStreamColumns = function(streams) {
      var columns, stream, _i, _len, _ref, _ref1, _ref2;
      perf.start('setStreamColumns');
      for (_i = 0, _len = streams.length; _i < _len; _i++) {
        stream = streams[_i];
        columns = [];
        if ((_ref = stream.type) === 'line-of-credit' || _ref === 'loan' || _ref === 'bill' || _ref === 'income' || _ref === 'transfer') {
          columns.push(['payment', 'Payment']);
        }
        if ((_ref1 = stream.type) === 'deposit-account' || _ref1 === 'line-of-credit') {
          columns.push(['spending', 'Spending']);
        }
        if ((_ref2 = stream["class"]) === 'balance' || _ref2 === 'hybrid') {
          columns.push(['balance', 'Balance']);
        }
        if (stream.subType === 'loc-credit') {
          columns.push(['carriedBalance', 'Carried Balance']);
        }
        if (stream.intRate != null) {
          columns.push(['interest', 'Interest']);
          columns.push(['accruedInterest', 'Accrued Interest']);
        }
        stream.columns = columns;
      }
      perf.end('setStreamColumns');
      return streams;
    };
    getStreamsStart = function(streams) {
      var start, stream, streamsStart, _i, _len;
      perf.start('getStreamsStart');
      streamsStart = moment();
      for (_i = 0, _len = streams.length; _i < _len; _i++) {
        stream = streams[_i];
        start = moment(stream.startDate);
        if (start.isBefore(streamsStart)) {
          streamsStart = start;
        }
      }
      perf.end('getStreamsStart');
      return streamsStart;
    };
    getDaysInRange = function(startDate, endDate) {
      var days, endDateYmd, iterDate, iterDateYmd;
      perf.start('getDaysInRange');
      days = [];
      endDateYmd = endDate.format('YYYY-MM-DD');
      iterDate = startDate.clone();
      iterDateYmd = iterDate.format('YYYY-MM-DD');
      while (iterDateYmd < endDateYmd) {
        days.push(iterDate);
        iterDate = iterDate.clone().add('days', 1);
        iterDateYmd = iterDate.format('YYYY-MM-DD');
      }
      perf.end('getDaysInRange');
      return days;
    };

    /*
    	Returns an object of recurring transaction stream IDs with arrays of their transaction dates.
    
    	{
    		11: [Moment, ...]
    	}
     */
    getTransactionDates = function(streams, endDate) {
      var checkDate, checkDateYmd, delta, endDateYmd, recurrence, stream, streamIdx, transactionDates;
      perf.start('getTransactionDates');
      transactionDates = {};
      endDateYmd = endDate.format('YYYY-MM-DD');
      for (streamIdx in streams) {
        stream = streams[streamIdx];
        if (stream.recurrence) {
          transactionDates[stream.id] = [];
          recurrence = stream.recurrence.split('-')[1];
          delta = timeDeltas[recurrence];
          if (recurrence !== 'irregularly') {
            checkDateYmd = stream.firstPaymentDate;
            checkDate = moment(checkDateYmd);
            while (checkDate.isBefore(endDate) || checkDateYmd === endDateYmd) {
              transactionDates[stream.id].push([checkDateYmd, checkDate]);
              checkDate = checkDate.clone().add(delta[0], delta[1]);
              checkDateYmd = checkDate.format('YYYY-MM-DD');
            }
          } else {
            void 0;
          }
        }
      }
      perf.end('getTransactionDates');
      return transactionDates;
    };
    getInitialValues = function(streams, mutableFields) {
      var field, initialValues, stream, streamIdx, _i, _len;
      perf.start('getInitialValues');
      initialValues = {};
      for (streamIdx in streams) {
        stream = streams[streamIdx];
        initialValues[stream.id] = {};
        for (_i = 0, _len = mutableFields.length; _i < _len; _i++) {
          field = mutableFields[_i];
          if (field in stream) {
            initialValues[stream.id][field] = stream[field];
          }
        }
      }
      perf.end('getInitialValues');
      return initialValues;
    };
    getMutableFields = function() {
      var output;
      perf.start('getMutableFields');
      output = _.pluck(_.filter($rootScope.initialData.models.stream.config, 'isMutable'), 'jsName');
      perf.end('getMutableFields');
      return output;
    };
    getLookupLedger = function(streams, manuals, revisions, dataDates, transactionDates, currentValues) {
      var amount, balance, current, day, interest, lookupLedger, manual, manualId, startDate, stream, streamEntry, streamIdx, transDate, ymd, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      perf.start('getLookupLedger');
      lookupLedger = {};
      for (_i = 0, _len = dataDates.length; _i < _len; _i++) {
        day = dataDates[_i];
        ymd = day.format('YYYY-MM-DD');
        lookupLedger[ymd] = {
          moment: day,
          streams: []
        };
        for (streamIdx in streams) {
          stream = streams[streamIdx];
          streamEntry = {
            id: stream.id
          };
          current = currentValues[stream.id];
          if ((_ref = stream["class"]) === 'transaction' || _ref === 'hybrid') {
            amount = null;
            _ref1 = transactionDates[stream.id];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              transDate = _ref1[_j];
              if (transDate[0] === ymd) {
                amount = current.amount;
                if ('fromAccount' in stream) {
                  currentValues[stream.fromAccount].balance -= amount;
                  if (stream["class"] === 'hybrid') {
                    current.balance -= amount;
                  }
                }
                if ('toAccount' in stream) {
                  currentValues[stream.toAccount].balance += amount;
                }
              }
            }
          }
          if ((_ref2 = stream.type) === 'line-of-credit' || _ref2 === 'loan' || _ref2 === 'bill' || _ref2 === 'income' || _ref2 === 'transfer') {
            streamEntry.payment = amount != null ? doshFormat(amount) : null;
          }
          if ((_ref3 = stream.type) === 'deposit-account' || _ref3 === 'line-of-credit') {
            streamEntry.spending = null;
          }
          if ((_ref4 = stream["class"]) === 'balance' || _ref4 === 'hybrid') {
            startDate = stream.startDate;
            balance = current.balance;
            interest = 0;
            streamEntry.balance = doshFormat(current.balance);
            if (stream.subType === 'loc-credit') {
              streamEntry.carriedBalance = null;
            }
            if (startDate === ymd || startDate < ymd) {
              _ref5 = manuals[stream.id];
              for (manualId in _ref5) {
                manual = _ref5[manualId];
                if (manual.date.isSame(day)) {
                  current.balance = manual.amount;
                }
              }
              if (startDate === ymd) {
                streamEntry.isManual = true;
              }
              if ((stream.intRate != null) && current.intRate > 0) {
                interest = ((current.intRate / 100) / 365.25) * balance;
              }
            }
            if (stream.intRate != null) {
              streamEntry.interest = interest > 0 ? doshFormat(interest) : null;
              streamEntry.accruedInterest = null;
            }
          }
          lookupLedger[ymd].streams.push(streamEntry);
        }
      }
      perf.end('getLookupLedger');
      return lookupLedger;
    };
    return {
      getData: getData
    };
  }).service('accountsService', function($resource) {
    var getData;
    getData = function(callback) {
      var output, request;
      output = {};
      request = $resource('/api/v1/getData', {
        types: 'streams'
      });
      return request.get({}, function(data) {
        output = {
          streams: data.streams
        };
        return callback(output);
      });
    };
    return {
      getData: getData
    };
  }).controller('AuthController', function($rootScope, $scope) {
    window.authscope = $scope;
    $scope.user = $rootScope.initialData.user;
    $('body').on('click', function(evt) {
      if ($scope.signupPanelOpen && $(evt.target).closest('.sign-up-panel, .sign-up').length === 0) {
        $scope.signupPanelOpen = false;
        $scope.$apply();
      }
      if ($scope.loginPanelOpen && $(evt.target).closest('.log-in-panel, .log-in').length === 0) {
        $scope.loginPanelOpen = false;
        return $scope.$apply();
      }
    });
    $scope.handleLoginClick = function() {
      return $scope.loginPanelOpen = !$scope.loginPanelOpen;
    };
    $scope.handleSignupClick = function() {
      return $scope.signupPanelOpen = !$scope.signupPanelOpen;
    };
    $scope.handleLogoutClick = function() {
      var $form, formData, logoutPromise;
      $form = $('.log-out');
      formData = $form.serialize();
      logoutPromise = $.post($form.attr('data-url'), formData);
      return logoutPromise.done(function(data) {
        if (!data.error) {
          $scope.user = {
            isLoggedIn: false
          };
          return $scope.$apply();
        }
      });
    };
    $scope.handleLoginSubmit = function() {
      var $form, formData, formPromise;
      $form = $('.log-in-panel');
      formData = $form.serialize();
      formPromise = $.post($form.attr('data-url'), formData);
      return formPromise.done(function(data) {
        if (!data.error) {
          $scope.user.isLoggedIn = true;
          $scope.user.username = data.username;
          return $scope.$apply();
        }
      });
    };
    return $scope.handleSignupSubmit = function() {
      var $form, formData, formPromise;
      $form = $('.sign-up-panel');
      formData = $form.serialize();
      formPromise = $.post($form.attr('data-url'), formData);
      return formPromise.done(function(data) {
        if (!data.error) {
          $scope.user.isLoggedIn = true;
          $scope.user.username = data.username;
          return $scope.$apply();
        }
      });
    };
  }).controller('PrimaryNavController', function($rootScope, $scope) {
    return $scope.links = [
      {
        name: 'Dashboard',
        href: '/dashboard'
      }, {
        name: 'Accounts',
        href: '/accounts'
      }, {
        name: 'Ledger',
        href: '/ledger'
      }, {
        name: 'Goals',
        href: '/goals'
      }, {
        name: 'Projection',
        href: '/projection'
      }
    ];
  }).controller('DashboardController', function($rootScope, $scope) {
    return $scope.message = 'Hello world';
  }).controller('LedgerController', function($rootScope, $scope, ledgerService) {
    var formatLedgerTable, handleLedgerData, init, prepLedgerHeader, subColumns;
    window.ledgerScope = $scope;
    subColumns = [['payment', 'Payment'], ['spending', 'Spending'], ['balance', 'Balance'], ['carriedBalance', 'Carried Balance'], ['interest', 'Interest'], ['accruedInterest', 'Accrued Interest']];
    init = function() {
      return ledgerService.getData(handleLedgerData);
    };
    handleLedgerData = function(data) {
      var ledger;
      ledger = formatLedgerTable(data.ledger);
      perf.start('RENDER');
      $scope.streams = data.streams;
      $scope.manuals = data.manuals;
      $scope.revisions = data.revisions;
      $scope.ledger = ledger;
      $scope.subStreams = prepLedgerHeader(data.streams);
      return setTimeout(function() {
        return perf.end('RENDER');
      }, 1);
    };
    prepLedgerHeader = function(streams) {
      var columnLabels, stream, subStreams, _i, _len;
      perf.start('prepLedgerHeader');
      subStreams = [];
      for (_i = 0, _len = streams.length; _i < _len; _i++) {
        stream = streams[_i];
        if (stream.columns.length > 1) {
          columnLabels = _.pluck(stream.columns, 1);
          subStreams = subStreams.concat(columnLabels);
        }
      }
      perf.end('prepLedgerHeader');
      return subStreams;
    };
    formatLedgerTable = function(lookupLedger) {
      var data, day, ledger, row, streamEntry, subCol, _i, _j, _len, _len1, _ref;
      perf.start('formatLedgerTable');
      ledger = {};
      for (day in lookupLedger) {
        data = lookupLedger[day];
        ledger[day] = {
          printDate: data.moment.format('MMM D'),
          fullDate: data.moment.format('dddd, MMMM Do, YYYY')
        };
        row = [];
        _ref = data.streams;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          streamEntry = _ref[_i];
          for (_j = 0, _len1 = subColumns.length; _j < _len1; _j++) {
            subCol = subColumns[_j];
            if (subCol[0] in streamEntry) {
              row.push({
                val: streamEntry[subCol[0]]
              });
            }
          }
        }
        ledger[day].row = row;
      }
      perf.end('formatLedgerTable');
      return ledger;
    };
    return init();
  }).controller('AccountsController', function($rootScope, $scope, accountsService) {
    var getFieldsByType, getStreamTypes, init, setTransferStreams;
    window.accountsScope = $scope;
    init = function() {
      $scope.streamTypes = getStreamTypes();
      $scope.streamFields = $rootScope.initialData.models.stream.config;
      $scope.recurrenceTypes = $rootScope.initialData.models.stream.recurrence;
      $scope.compoundingTypes = $rootScope.initialData.models.stream.compounding;
      $scope.newStream = {};
      if (!$scope.streams) {
        return accountsService.getData(function(data) {
          return $scope.streams = data.streams;
        });
      }
    };
    $scope.handleStreamClick = function(streamId) {
      $scope.editStreamOpen = true;
      return $scope.editStream = streamId;
    };
    $scope.handleAddStreamClick = function() {
      $scope.addStreamOpen = true;
      return setTransferStreams();
    };
    $scope.setNewStream = function(type, name) {
      var field, fields, _i, _len, _results;
      $scope.newStream = {
        type: type,
        name: name
      };
      fields = getFieldsByType(type.typeKey);
      _results = [];
      for (_i = 0, _len = fields.length; _i < _len; _i++) {
        field = fields[_i];
        if (field["default"]) {
          _results.push($scope.newStream[field.jsName] = field["default"]);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    $scope.getSelectOptions = function(type) {
      if (type === 'compounding') {
        return 'type.1 for type in compoundingTypes';
      }
      if (type === 'recurrence') {
        return 'type.1 for type in recurrenceTypes';
      }
      if (type === 'from_account' || type === 'to_account') {
        return 'stream.name for stream in transferStreams';
      }
    };
    $scope.getStreamsByType = function() {
      return _.groupBy($scope.streams, 'type');
    };
    $scope.getStreamLabel = function(field, type) {
      var label, thisField;
      thisField = _.find($scope.streamFields, {
        'key': field
      });
      label = thisField.label;
      if (thisField.otherLabels && type in thisField.otherLabels) {
        label = thisField.otherLabels[type];
      }
      return label;
    };
    $scope.getStreamHelp = function(field, type) {
      var help, thisField;
      thisField = _.find($scope.streamFields, {
        'key': field
      });
      help = thisField.helpText;
      if (thisField.otherHelpText && type in thisField.otherHelpText) {
        help = thisField.otherHelpText[type];
      }
      return help;
    };
    $scope.handleAddStreamSubmit = function() {
      var $form, formData, formPromise;
      $form = $('.addStreamForm');
      formData = _.cloneDeep($scope.newStream);
      formData.type = formData.type.subKey;
      _.forEach(formData, function(v, k) {
        var thisField;
        if (typeof v === 'object') {
          if (Array.isArray(v)) {
            formData[k] = v[0];
          } else {
            formData[k] = v.id;
          }
        }
        thisField = _.find($scope.streamFields, {
          'jsName': k
        });
        if (thisField.dataType === 'decimal') {
          return formData[k] = parseFloat(v);
        }
      });
      formData = 'newStream=' + JSON.stringify(formData);
      formPromise = $.post($form.attr('data-url'), formData);
      return formPromise.done(function(data) {
        if (!data.error) {
          return $scope.$apply();
        }
      });
    };
    $scope.closeAddStream = function() {
      return $scope.addStreamOpen = false;
    };
    getStreamTypes = function() {
      var streamType, streamTypes, subType, _i, _j, _len, _len1, _ref, _ref1;
      perf.start('getStreamTypes');
      streamTypes = [];
      _ref = $rootScope.initialData.models.stream.types;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        streamType = _ref[_i];
        _ref1 = streamType[2];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          subType = _ref1[_j];
          streamTypes.push({
            typeName: streamType[1],
            typeKey: streamType[0],
            subName: subType[1],
            subKey: subType[0]
          });
        }
      }
      perf.end('getStreamTypes');
      return streamTypes;
    };
    getFieldsByType = function(type) {
      var fieldsByType;
      perf.start('getFieldsByType');
      fieldsByType = _.filter($scope.streamFields, function(thisField) {
        return !thisField.showFor || _.contains(thisField.showFor, type);
      });
      perf.end('getFieldsByType');
      return fieldsByType;
    };
    setTransferStreams = function() {
      return $scope.transferStreams = _.filter($scope.streams, function(stream) {
        return _.contains(['deposit-account', 'line-of-credit'], stream.type);
      });
    };
    return init();
  });

  window.log = function() {
    log.history = log.history || [];
    log.history.push(arguments);
    if (this.console) {
      return console.log(Array.prototype.slice.call(arguments));
    }
  };

  (function() {
    var metrics;
    metrics = {};
    return window.perf = {
      start: function(evtName) {
        return metrics[evtName] = window.performance.now();
      },
      end: function(evtName) {
        var duration;
        duration = window.performance.now() - metrics[evtName];
        return log(evtName + ': ' + duration.toFixed(2) + ' ms');
      }
    };
  })();


  /*
  
  columns = []
  
   * Format dates in manuals
  for stream, manualList of manuals
  	for manual in manualList
  		manual.date = moment(manual.date)
  
  deltas =
  	'daily': ['days', 1]
  	'weekly': ['weeks', 1]
  	'biweekly': ['weeks', 2]
  	'monthly': ['months', 1]
  	'semiannually': ['months', 6]
  	'annually': ['years', 1]
  
  
   * Start computation at the earliest start date
  
  today = moment()
  accountsStart = today.clone()
  
  
   * First pass through streams -- gather info
  
  streamMeta = {}
  for streamIdx, stream of streams
  
  	 * Record start date
  	streamMeta[streamIdx] =
  		start: moment(stream.startDate)
  
  	if streamMeta[streamIdx].start.isBefore(accountsStart)
  		accountsStart = streamMeta[streamIdx].start
  
  	 * Is this a "transaction", "balance", or "hybrid" account? Save for later
  	if 'recurrence' of stream
  		streamMeta[streamIdx].class = if 'startBalance' of stream then 'hybrid' else 'transaction'
  	if 'startBalance' of stream
  		streamMeta[streamIdx].class = if 'recurrence' of stream then 'hybrid' else 'balance'
  
  	 * How many columns should this stream take up in the ledger header?
  	streams[stream.id].columns = []
  	if streamMeta[streamIdx].class in ['hybrid', 'transaction']
  		streams[stream.id].columns.push('Amount')
  	if 'intRate' of stream
  		streams[stream.id].columns.push('Interest')
  	if streamMeta[streamIdx].class in ['hybrid', 'balance']
  		streams[stream.id].columns.push('Balance')
  
  ledgerStart = today.clone().subtract('days', -startDelta)
  ledgerEnd = today.clone().add('days', endDelta)
  
  calcDates = []
  iterdate = accountsStart
  while iterdate.isBefore(ledgerEnd)
  	iterdate = iterdate.clone()
  	calcDates.push(iterdate)
  	iterdate.add('days', 1)
  
  
   * Populate an object with transaction ids and their recurring dates
  
  transactionDates = {}
  for streamIdx, stream of streams
  	if stream.recurrence
  		 * Initialize this stream's list of dates
  		transactionDates[stream.id] = []
  
  		recurrence = stream.recurrence.split('-')[1]
  
  		if recurrence isnt 'irregularly'
  			checkDate = moment(stream.startDate)
  			while checkDate.isBefore(ledgerEnd) or checkDate.isSame(ledgerEnd)
  				checkDate = checkDate.clone()
  				transactionDates[stream.id].push(checkDate)
  				 * move to the next transaction date
  				checkDate.add(deltas[recurrence][0], deltas[recurrence][1])
  
  		else
  			undefined # todo: irregular recurrence
  
  
   * Values will change as we move through the ledger, unlike the static stream values
  
  currentValues = {}
  for streamIdx, stream of streams
  	currentValues[stream.id] = {}
  	if 'startBalance' of stream
  		currentValues[stream.id]['balance'] = stream.startBalance
  	if 'recurrence' of stream
  		currentValues[stream.id]['amount'] = stream.amount
  
  
   * Run the simulation, populating a ledger list with dates and transaction/balance notes
  
  rows = []
  for day in calcDates
  
  	if day.isSame(ledgerStart) or day.isAfter(ledgerStart)
  		fullDay = day.format('YYYY-MM-DD')
  		printDay = day.format('MMM D')
  		ledgerEntry = [fullDay, printDay, []]
  	else
  		ledgerEntry = null
  
  	for streamIdx, stream of streams
  
  		streamClass = streamMeta[stream.id].class
  
  		 * Transaction columns printed recurringly
  		if streamClass in ['transaction', 'hybrid']
  			note =
  				'name': stream.name
  				'class': streamClass
  				'type': stream.subtype
  				'amount': null
  
  			streamDates = transactionDates[stream.id]
  
  			for streamDate in streamDates
  				if streamDate.isSame(day, 'day')
  					note['amount'] = doshFormat(stream.amount)
  
  					 * todo: manual transactions
  					 * todo: revisions
  					 * todo: balance to 0
  					 * todo: interest
  
  					 * Modify other streams
  
  					if 'fromAccount' of stream
  						 * Subtract from another account
  						currentValues[stream.fromAccount]['balance'] -= stream.amount
  						if streamClass is 'hybrid'
  							 * And reduce this stream's balance
  							currentValues[stream.id]['balance'] -= stream.amount
  					if 'toAccount' of stream
  						 * Deposit to account
  						currentValues[stream.toAccount]['balance'] += stream.amount
  
  			if ledgerEntry isnt null
  				ledgerEntry[2].push(note)
  
  		 * Balance streams, printed every day
  		if streamClass in ['balance', 'hybrid']
  
  			note =
  				'name': stream.name
  				'class': streamClass
  				'type': stream.subtype
  				'balance': 0
  
  			if streamMeta[stream.id].start.isSame(day) or streamMeta[stream.id].start.isBefore(day)
  
  				for manualId, manual of manuals[stream.id]
  					if manual.date.isSame(day, 'day')
  						currentValues[stream.id].balance = manual.amount
  
  				streamValue = currentValues[stream.id].balance
  
  				note.balance = streamValue
  
  				if streamMeta[stream.id].start.isSame(day)
  					note.manual = true
  
  				 * Add column for interest rate
  				if 'intRate' of stream and stream.intRate > 0
  					intAmt = ((stream.intRate / 100) / 365.25) * streamValue
  					intNote =
  						name: stream.name
  						class: streamClass
  						type: stream.subtype
  						balance: intAmt
  					intNote.balance = doshFormat(intNote.balance)
  					 * todo: Compounding
  					 * currentValues[stream.id]['balance'] += intAmt
  					if ledgerEntry isnt null
  						ledgerEntry[2].push(intNote)
  
  			note.balance = doshFormat(note.balance)
  
  			 *currentValues[col] = doshRound(currentValues[col] for col of currentValues)
  
  			if ledgerEntry isnt null
  				ledgerEntry[2].push(note)
  
  	if ledgerEntry isnt null
  		rows.push(ledgerEntry)
   */

}).call(this);
