(function() {
  var StreamMutable, StreamRevision, _, global,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  if (typeof exports !== "undefined" && exports !== null) {
    global = exports;
    StreamMutable = require('./Stream').StreamMutable;
    _ = require('./../bower/lodash/lodash.min');
  } else {
    global = window.util.namespacer('dosh.models');
    StreamMutable = global.StreamMutable;
    _ = window._;
  }

  StreamRevision = (function(superClass) {
    var localSchema;

    extend(StreamRevision, superClass);

    function StreamRevision(created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount, revised, effectiveDate, isClosed) {
      this.revised = revised;
      this.effectiveDate = effectiveDate;
      this.isClosed = isClosed;
      StreamRevision.__super__.constructor.call(this, created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount);
    }

    localSchema = {
      revised: {
        type: 'foreignKey',
        model: 'Stream',
        validation: {
          required: true
        }
      },
      effectiveDate: {
        type: 'dateTime',
        validation: {
          required: true
        }
      },
      isClosed: {
        type: 'nullBoolean',
        label: 'Account is closed',
        otherLabels: {
          transfer: 'Transfer is no longer active',
          income: 'Income source is no longer active',
          loan: 'Loan is forgiven'
        },
        isRevisionOnly: true
      }
    };

    StreamRevision.prototype.schema = _.assign({}, localSchema, StreamMutable.prototype.schema);

    return StreamRevision;

  })(StreamMutable);

  global.StreamRevision = StreamRevision;

}).call(this);
