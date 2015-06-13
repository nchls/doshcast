(function() {
  (function() {
    var classifyStreams, getDaysInRange, getInitialValues, getLedger, getLedgerData, getMutableFields, getStreamsStart, getTransactionDates, setStreamColumns, timeDeltas;
    timeDeltas = {
      'daily': [1, 'days'],
      'weekly': [1, 'weeks'],
      'biweekly': [2, 'weeks'],
      'monthly': [1, 'months'],
      'semiannually': [6, 'months'],
      'annually': [1, 'years']
    };
    getLedgerData = function(data, indexDate, endDelta) {
      var currentValues, dataDates, dataEnd, dataStart, foundIndex, ledger, ledgerOutput, manuals, mutableFields, output, revisions, streams, transactionDates;
      if (indexDate == null) {
        indexDate = void 0;
      }
      if (endDelta == null) {
        endDelta = 90;
      }
      perf.start('PROCESSING');
      manuals = _.clone(data.manuals);
      revisions = _.clone(data.revisions);
      streams = _.clone(data.streams);
      streams = _.sortBy(streams, ['order', 'class', 'streamType', 'streamSubtype', '_id']);
      streams = classifyStreams(streams);
      streams = setStreamColumns(streams);
      dataStart = getStreamsStart(streams);
      dataEnd = moment().add(endDelta, 'days');
      dataDates = getDaysInRange(dataStart, dataEnd);
      transactionDates = getTransactionDates(streams, dataEnd);
      mutableFields = getMutableFields();
      currentValues = getInitialValues(streams, mutableFields);
      ledgerOutput = getLedger(streams, manuals, revisions, dataDates, transactionDates, currentValues, indexDate);
      ledger = ledgerOutput.ledger;
      foundIndex = ledgerOutput.foundIndex;
      output = {
        ledger: ledger,
        manuals: manuals,
        revisions: revisions,
        streams: streams,
        foundIndex: foundIndex
      };
      perf.end('PROCESSING');
      return output;
    };
    classifyStreams = function(streams) {
      var i, len, stream;
      perf.start('classifyStreams');
      for (i = 0, len = streams.length; i < len; i++) {
        stream = streams[i];
        if ((stream.balance != null) && (stream.recurrence != null)) {
          stream["class"] = 'hybrid';
        } else {
          if (stream.recurrence != null) {
            stream["class"] = 'transaction';
          } else {
            stream["class"] = 'balance';
          }
        }
      }
      perf.end('classifyStreams');
      return streams;
    };
    setStreamColumns = function(streams) {
      var columns, i, len, ref, ref1, stream;
      perf.start('setStreamColumns');
      for (i = 0, len = streams.length; i < len; i++) {
        stream = streams[i];
        columns = [];
        if ((ref = stream.streamType) === 'line-of-credit' || ref === 'loan' || ref === 'bill' || ref === 'income' || ref === 'transfer') {
          columns.push(['payment', 'Payment']);
        }
        if (stream.streamType === 'line-of-credit' || stream.streamSubtype === 'account-checking') {
          columns.push(['spending', 'Spending']);
        }
        if ((ref1 = stream["class"]) === 'balance' || ref1 === 'hybrid') {
          columns.push(['balance', 'Balance']);
        }
        if (stream.streamSubtype === 'loc-credit') {
          columns.push(['carriedBalance', 'Carried Balance']);
        }
        if (stream.interestRate != null) {
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
        iterDate = iterDate.clone().add(1, 'days');
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
          transactionDates[stream._id] = [];
          recurrence = stream.recurrence.split('-')[1];
          delta = timeDeltas[recurrence];
          if (recurrence !== 'irregularly') {
            checkDateYmd = stream.firstPaymentDate;
            checkDate = moment(checkDateYmd);
            while (checkDate.isBefore(endDate) || checkDateYmd === endDateYmd) {
              transactionDates[stream._id].push([checkDateYmd, checkDate]);
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
        initialValues[stream._id] = {};
        for (i = 0, len = mutableFields.length; i < len; i++) {
          field = mutableFields[i];
          if (field in stream) {
            initialValues[stream._id][field] = stream[field];
          }
        }
      }
      perf.end('getInitialValues');
      return initialValues;
    };
    getMutableFields = function() {
      var output;
      perf.start('getMutableFields');
      output = _.pull(_.map(dosh.models.Stream.prototype.schema, function(value, key) {
        if (value.isMutable) {
          return key;
        }
      }), void 0);
      perf.end('getMutableFields');
      return output;
    };
    getLedger = function(streams, manuals, revisions, dataDates, transactionDates, currentValues, indexDate) {
      var amount, balance, current, day, foundIndex, i, interest, j, ledger, len, len1, manual, manualId, output, ref, ref1, ref2, ref3, ref4, startDate, stream, streamEntry, streamIdx, streamsData, transDate, ymd;
      perf.start('getLedger');
      ledger = [];
      indexDate = indexDate.format('YYYY-MM-DD');
      foundIndex = false;
      for (i = 0, len = dataDates.length; i < len; i++) {
        day = dataDates[i];
        ymd = day.format('YYYY-MM-DD');
        streamsData = [];
        for (streamIdx in streams) {
          stream = streams[streamIdx];
          streamEntry = {
            id: stream._id
          };
          current = currentValues[stream._id];
          if ((ref = stream["class"]) === 'transaction' || ref === 'hybrid') {
            amount = null;
            ref1 = transactionDates[stream._id];
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
          if ((ref2 = stream.streamType) === 'line-of-credit' || ref2 === 'loan' || ref2 === 'bill' || ref2 === 'income' || ref2 === 'transfer') {
            streamEntry.payment = amount != null ? util.doshFormat(amount) : null;
          }
          if (stream.streamType === 'line-of-credit' || stream.streamSubtype === 'account-checking') {
            streamEntry.spending = null;
          }
          if ((ref3 = stream["class"]) === 'balance' || ref3 === 'hybrid') {
            startDate = stream.startDate;
            balance = current.balance;
            interest = 0;
            streamEntry.balance = util.doshFormat(current.balance);
            if (stream.streamSubtype === 'loc-credit') {
              streamEntry.carriedBalance = null;
            }
            if (startDate === ymd || startDate < ymd) {
              if (manuals != null ? manuals[stream._id] : void 0) {
                ref4 = manuals[stream._id];
                for (manualId in ref4) {
                  manual = ref4[manualId];
                  if (manual.date.isSame(day)) {
                    current.balance = manual.amount;
                  }
                }
              }
              if (startDate === ymd) {
                streamEntry.isManual = true;
              }
              if ((stream.interestRate != null) && current.interestRate > 0) {
                interest = ((current.interestRate / 100) / 365.25) * balance;
              }
            }
            if (stream.interestRate != null) {
              streamEntry.interest = interest > 0 ? util.doshFormat(interest) : null;
              streamEntry.accruedInterest = null;
            }
          }
          streamsData.push(streamEntry);
        }
        if ((indexDate && !foundIndex) && ymd === indexDate) {
          foundIndex = ledger.length;
        }
        ledger.push({
          ymd: ymd,
          moment: day,
          streams: streamsData
        });
      }
      output = {
        ledger: ledger
      };
      if (indexDate) {
        output.foundIndex = foundIndex;
      }
      perf.end('getLedger');
      return output;
    };
    return util.namespacer('dosh.services').ledger = {
      getLedgerData: getLedgerData
    };
  })();

}).call(this);
