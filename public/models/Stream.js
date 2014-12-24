(function() {
  var Model, Stream, StreamMutable, global, _, _base,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof exports !== "undefined" && exports !== null) {
    global = exports;
    Model = require('./Model').Model;
    _ = require('./../bower/lodash/dist/lodash.min');
  } else {
    if (window.dosh == null) {
      window.dosh = {};
    }
    if ((_base = window.dosh).models == null) {
      _base.models = {};
    }
    global = window.dosh.models;
    Model = global.Model;
    _ = window._;
  }

  StreamMutable = (function(_super) {
    var localSchema;

    __extends(StreamMutable, _super);

    function StreamMutable(created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount) {
      this.orgName = orgName;
      this.amount = amount;
      this.recurrence = recurrence;
      this.balance = balance;
      this.interestRate = interestRate;
      this.compounding = compounding;
      this.creditLimit = creditLimit;
      this.isAlwaysPaidOff = isAlwaysPaidOff;
      this.fromAccount = fromAccount;
      this.toAccount = toAccount;
      StreamMutable.__super__.constructor.call(this, created, modified);
    }

    localSchema = {
      orgName: {
        type: 'string',
        label: 'Bank name',
        otherLabels: {
          loan: 'Lender name',
          bill: 'Payee name',
          income: 'Income source'
        },
        showFor: ['deposit-account', 'loan', 'bill', 'line-of-credit', 'income'],
        validation: {
          maxLength: 50
        }
      },
      amount: {
        type: 'decimal',
        label: 'Minimum payment',
        otherLabels: {
          bill: 'Payment amount',
          income: 'Initial income amount',
          transfer: 'Transfer amount'
        },
        showFor: ['loan', 'bill', 'line-of-credit', 'transfer', 'income'],
        validation: {
          maxDigits: 9,
          decimalPlaces: 2
        }
      },
      recurrence: {
        type: 'string',
        choices: [['recur-daily', 'Daily'], ['recur-weekly', 'Weekly'], ['recur-biweekly', 'Every two weeks'], ['recur-monthly', 'Monthly'], ['recur-semiannually', 'Every six months'], ['recur-annually', 'Annually'], ['recur-irregularly', 'Irregularly']],
        label: 'Payment recurrence',
        otherLabels: {
          income: 'Income recurrence',
          transfer: 'Transfer recurrence'
        },
        showFor: ['loan', 'bill', 'income', 'line-of-credit', 'transfer']
      },
      balance: {
        type: 'decimal',
        label: 'Starting balance',
        reviseLabel: 'Balance',
        showFor: ['deposit-account', 'loan', 'line-of-credit'],
        validation: {
          maxDigits: 14,
          decimalPlaces: 2
        }
      },
      interestRate: {
        type: 'decimal',
        label: 'Interest rate',
        showFor: ['deposit-account', 'loan', 'line-of-credit'],
        input: {
          suffix: '%'
        },
        validation: {
          maxDigits: 6,
          decimalPlaces: 4
        }
      },
      compounding: {
        type: 'string',
        choices: [['compound-none', 'None'], ['compound-daily', 'Daily'], ['compound-monthly', 'Monthly'], ['compound-semianually', 'Every six months'], ['compound-annually', 'Annually']],
        label: 'Compounding',
        showFor: ['deposit-account', 'loan', 'line-of-credit']
      },
      creditLimit: {
        type: 'positiveInt',
        label: 'Credit limit',
        showFor: ['line-of-credit'],
        validation: {
          maxDigits: 10,
          decimalPlaces: 2
        }
      },
      isAlwaysPaidOff: {
        type: 'nullBoolean',
        label: 'Balance is paid off every period',
        helpText: 'Check if you do not carry a balance across billing periods.',
        showFor: ['line-of-credit']
      },
      fromAccount: {
        type: 'foreignKey',
        model: 'Stream',
        label: 'Draw from account',
        showFor: ['loan', 'bill', 'line-of-credit', 'transfer']
      },
      toAccount: {
        type: 'foreignKey',
        model: 'Stream',
        label: 'Deposit to account',
        showFor: ['income', 'transfer']
      }
    };

    StreamMutable.prototype.schema = _.assign({}, localSchema, Model.prototype.schema);

    return StreamMutable;

  })(Model);

  Stream = (function(_super) {
    var STREAM_TYPES, SUBTYPES, TYPES, localSchema, type, _i, _len;

    __extends(Stream, _super);

    function Stream(created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount, name, owner, isActive, order, streamType, streamSubtype, startDate, firstPaymentDate, isRegular, isSeasonal) {
      this.name = name;
      this.owner = owner;
      this.isActive = isActive;
      this.order = order;
      this.streamType = streamType;
      this.streamSubtype = streamSubtype;
      this.startDate = startDate;
      this.firstPaymentDate = firstPaymentDate;
      this.isRegular = isRegular;
      this.isSeasonal = isSeasonal;
      Stream.__super__.constructor.call(this, created, modified, orgName, amount, recurrence, balance, interestRate, compounding, creditLimit, isAlwaysPaidOff, fromAccount, toAccount);
    }

    STREAM_TYPES = [['deposit-account', 'Deposit account', [['account-checking', 'Checking account'], ['account-savings', 'Savings account'], ['account-cd', 'Certificate of deposit'], ['account-investment', 'Investment account']]], ['line-of-credit', 'Line of credit', [['loc-credit', 'Credit card'], ['loc-heloc', 'Home equity line of credit']]], ['income', 'Income', [['income-salary', 'Paycheck'], ['income-other', 'Other income']]], ['bill', 'Bill', [['bill-rent', 'Rent'], ['bill-cell', 'Cell phone'], ['bill-tv', 'TV'], ['bill-water', 'Water'], ['bill-electric', 'Electric'], ['bill-heat', 'Heat'], ['bill-internet', 'Internet'], ['bill-insurance-health', 'Health insurance'], ['bill-insurance-car', 'Car insurance'], ['bill-insurance-life', 'Life insurance'], ['bill-other', 'Other bill']]], ['loan', 'Loan', [['loan-student', 'Student loan'], ['loan-auto', 'Auto loan'], ['loan-health', 'Health loan'], ['loan-mortgage', 'Mortgage'], ['loan-personal', 'Personal loan'], ['loan-other', 'Other loan']]], ['transfer', 'Transfer', [['transfer-transfer', 'Transfer']]]];

    TYPES = [];

    SUBTYPES = [];

    for (_i = 0, _len = STREAM_TYPES.length; _i < _len; _i++) {
      type = STREAM_TYPES[_i];
      TYPES.push(type.slice(0, 2));
      SUBTYPES = SUBTYPES.concat(type[2]);
    }

    localSchema = {
      name: {
        type: 'string',
        label: 'Account Name',
        otherLabels: {
          transfer: 'Transfer name'
        },
        helpText: 'For your own reference.',
        validation: {
          required: true,
          maxLength: 40
        }
      },
      owner: {
        type: 'foreignKey',
        model: 'User',
        validation: {
          required: true
        }
      },
      isActive: {
        type: 'boolean',
        "default": true,
        validation: {
          required: true
        }
      },
      order: {
        type: 'positiveInt',
        "default": 50,
        validation: {
          required: true
        }
      },
      streamType: {
        type: 'string',
        choices: TYPES,
        validation: {
          required: true
        }
      },
      streamSubtype: {
        type: 'string',
        choices: SUBTYPES,
        label: 'Account type',
        validation: {
          required: true
        }
      },
      startDate: {
        type: 'date',
        label: 'Account opening date',
        helpText: 'This doesn\'t have to be exact. It can be simply the date from which you want to start tracking your finances.',
        otherHelpText: {
          loan: 'More accurately, the date the loan began to accrue interest.'
        },
        showFor: ['deposit-account', 'loan', 'line-of-credit']
      },
      firstPaymentDate: {
        type: 'date',
        label: 'Date of first payment',
        otherLabels: {
          transfer: 'Date of first transfer',
          income: 'Date of first deposit'
        },
        showFor: ['loan', 'bill', 'line-of-credit', 'transfer', 'income']
      },
      isRegular: {
        type: 'nullBoolean',
        "default": true,
        label: 'Payment amount is regular',
        helpText: 'Check if the payment is roughly the same amount every period.',
        otherHelpText: {
          income: 'Check if the income is roughly the same amount every period.'
        },
        showFor: ['bill', 'income']
      },
      isSeasonal: {
        type: 'nullBoolean',
        label: 'Payment amount is seasonal',
        helpText: 'Check if the payment amount fluctuates per season. For example, heating bills.',
        showFor: ['bill']
      }
    };

    Stream.prototype.schema = _.assign({}, localSchema, StreamMutable.prototype.schema);

    return Stream;

  })(StreamMutable);

  global.Stream = Stream;

  global.StreamMutable = StreamMutable;

}).call(this);
