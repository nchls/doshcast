(function() {
  var AccountsController, AuthController, LedgerController, PrimaryNavController, accountsService, ledgerService;

  util.onReady(function() {
    var renderPage;
    renderPage = function(component) {
      return React.render(React.createElement(component, null), document.getElementById('main'));
    };
    window.$document = $(document);
    React.initializeTouchEvents(true);
    return React.render(React.createElement(App, null), document.getElementById('app'));
  });

  ledgerService = function() {
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
      var columns, i, len, ref, ref1, ref2, stream;
      perf.start('setStreamColumns');
      for (i = 0, len = streams.length; i < len; i++) {
        stream = streams[i];
        columns = [];
        if ((ref = stream.type) === 'line-of-credit' || ref === 'loan' || ref === 'bill' || ref === 'income' || ref === 'transfer') {
          columns.push(['payment', 'Payment']);
        }
        if ((ref1 = stream.type) === 'deposit-account' || ref1 === 'line-of-credit') {
          columns.push(['spending', 'Spending']);
        }
        if ((ref2 = stream["class"]) === 'balance' || ref2 === 'hybrid') {
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
      var i, len, start, stream, streamsStart;
      perf.start('getStreamsStart');
      streamsStart = moment();
      for (i = 0, len = streams.length; i < len; i++) {
        stream = streams[i];
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
      var field, i, initialValues, len, stream, streamIdx;
      perf.start('getInitialValues');
      initialValues = {};
      for (streamIdx in streams) {
        stream = streams[streamIdx];
        initialValues[stream.id] = {};
        for (i = 0, len = mutableFields.length; i < len; i++) {
          field = mutableFields[i];
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
      var amount, balance, current, day, i, interest, j, len, len1, lookupLedger, manual, manualId, ref, ref1, ref2, ref3, ref4, ref5, startDate, stream, streamEntry, streamIdx, transDate, ymd;
      perf.start('getLookupLedger');
      lookupLedger = {};
      for (i = 0, len = dataDates.length; i < len; i++) {
        day = dataDates[i];
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
          if ((ref = stream["class"]) === 'transaction' || ref === 'hybrid') {
            amount = null;
            ref1 = transactionDates[stream.id];
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              transDate = ref1[j];
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
          if ((ref2 = stream.type) === 'line-of-credit' || ref2 === 'loan' || ref2 === 'bill' || ref2 === 'income' || ref2 === 'transfer') {
            streamEntry.payment = amount != null ? doshFormat(amount) : null;
          }
          if ((ref3 = stream.type) === 'deposit-account' || ref3 === 'line-of-credit') {
            streamEntry.spending = null;
          }
          if ((ref4 = stream["class"]) === 'balance' || ref4 === 'hybrid') {
            startDate = stream.startDate;
            balance = current.balance;
            interest = 0;
            streamEntry.balance = doshFormat(current.balance);
            if (stream.subType === 'loc-credit') {
              streamEntry.carriedBalance = null;
            }
            if (startDate === ymd || startDate < ymd) {
              ref5 = manuals[stream.id];
              for (manualId in ref5) {
                manual = ref5[manualId];
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
  };

  accountsService = function() {
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
  };

  AuthController = function() {
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
  };

  PrimaryNavController = function() {
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
  };

  LedgerController = function() {
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
      var columnLabels, i, len, stream, subStreams;
      perf.start('prepLedgerHeader');
      subStreams = [];
      for (i = 0, len = streams.length; i < len; i++) {
        stream = streams[i];
        if (stream.columns.length > 1) {
          columnLabels = _.pluck(stream.columns, 1);
          subStreams = subStreams.concat(columnLabels);
        }
      }
      perf.end('prepLedgerHeader');
      return subStreams;
    };
    formatLedgerTable = function(lookupLedger) {
      var data, day, i, j, ledger, len, len1, ref, row, streamEntry, subCol;
      perf.start('formatLedgerTable');
      ledger = {};
      for (day in lookupLedger) {
        data = lookupLedger[day];
        ledger[day] = {
          printDate: data.moment.format('MMM D'),
          fullDate: data.moment.format('dddd, MMMM Do, YYYY')
        };
        row = [];
        ref = data.streams;
        for (i = 0, len = ref.length; i < len; i++) {
          streamEntry = ref[i];
          for (j = 0, len1 = subColumns.length; j < len1; j++) {
            subCol = subColumns[j];
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
  };

  AccountsController = function() {
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
      var field, fields, i, len, results;
      $scope.newStream = {
        type: type,
        name: name
      };
      fields = getFieldsByType(type.typeKey);
      results = [];
      for (i = 0, len = fields.length; i < len; i++) {
        field = fields[i];
        if (field["default"]) {
          results.push($scope.newStream[field.jsName] = field["default"]);
        } else {
          results.push(void 0);
        }
      }
      return results;
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
      var i, j, len, len1, ref, ref1, streamType, streamTypes, subType;
      perf.start('getStreamTypes');
      streamTypes = [];
      ref = $rootScope.initialData.models.stream.types;
      for (i = 0, len = ref.length; i < len; i++) {
        streamType = ref[i];
        ref1 = streamType[2];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          subType = ref1[j];
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
  };

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

}).call(this);
