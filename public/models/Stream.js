(function() {
  var Model, Stream, StreamMutable, _, global,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  if (typeof exports !== "undefined" && exports !== null) {
    global = exports;
    Model = require('./Model').Model;
    _ = require('./../bower/lodash/lodash.min');
  } else {
    global = window.util.namespacer('dosh.models');
    Model = global.Model;
    _ = window._;
  }

  StreamMutable = (function(superClass) {
    var COMPOUNDING_TYPES, FIELD_ORDER, RECURRENCE_TYPES, localSchema;

    extend(StreamMutable, superClass);

    function StreamMutable(props) {
      var prop, val;
      for (prop in props) {
        val = props[prop];
        this[prop] = val;
      }
    }

    StreamMutable.prototype.RECURRENCE_TYPES = RECURRENCE_TYPES = [['recur-daily', 'Daily'], ['recur-weekly', 'Weekly'], ['recur-biweekly', 'Every two weeks'], ['recur-monthly', 'Monthly'], ['recur-semiannually', 'Every six months'], ['recur-annually', 'Annually'], ['recur-irregularly', 'Irregularly']];

    StreamMutable.prototype.getRecurrenceTypes = function() {
      return RECURRENCE_TYPES;
    };

    StreamMutable.prototype.COMPOUNDING_TYPES = COMPOUNDING_TYPES = [['compound-none', 'None'], ['compound-daily', 'Daily'], ['compound-monthly', 'Monthly'], ['compound-semianually', 'Every six months'], ['compound-annually', 'Annually']];

    StreamMutable.prototype.getCompoundingTypes = function() {
      return COMPOUNDING_TYPES;
    };

    StreamMutable.prototype.FIELD_ORDER = FIELD_ORDER = ["streamSubtype", "name", "orgName", "isActive", "startDate", "firstPaymentDate", "isRegular", "isSeasonal", "amount", "recurrence", "balance", "interestRate", "compounding", "creditLimit", "isAlwaysPaidOff", "fromAccount", "toAccount"];

    StreamMutable.prototype.getFieldOrder = function() {
      return FIELD_ORDER;
    };

    localSchema = {
      orgName: {
        type: 'varchar',
        isMutable: true,
        label: 'Bank name',
        otherLabels: {
          loan: 'Lender name',
          bill: 'Payee name',
          income: 'Income source'
        },
        showFor: ['deposit-account', 'loan', 'bill', 'line-of-credit', 'income'],
        validation: {
          canBeNull: true,
          maxLength: 50
        }
      },
      amount: {
        type: 'numeric',
        isMutable: true,
        label: 'Minimum payment',
        otherLabels: {
          bill: 'Payment amount',
          income: 'Initial income amount',
          transfer: 'Transfer amount'
        },
        showFor: ['loan', 'bill', 'line-of-credit', 'transfer', 'income'],
        validation: {
          canBeNull: true,
          maxDigits: 9,
          decimalPlaces: 2
        }
      },
      recurrence: {
        type: 'enum',
        choices: RECURRENCE_TYPES,
        isMutable: true,
        label: 'Payment recurrence',
        otherLabels: {
          income: 'Income recurrence',
          transfer: 'Transfer recurrence'
        },
        showFor: ['loan', 'bill', 'income', 'line-of-credit', 'transfer'],
        validation: {
          canBeNull: true
        }
      },
      balance: {
        type: 'numeric',
        isMutable: true,
        label: 'Starting balance',
        reviseLabel: 'Balance',
        showFor: ['deposit-account', 'loan', 'line-of-credit'],
        validation: {
          canBeNull: true,
          maxDigits: 14,
          decimalPlaces: 2
        }
      },
      interestRate: {
        type: 'numeric',
        isMutable: true,
        label: 'Interest rate',
        showFor: ['deposit-account', 'loan', 'line-of-credit'],
        input: {
          suffix: '%'
        },
        validation: {
          canBeNull: true,
          maxDigits: 6,
          decimalPlaces: 4
        }
      },
      compounding: {
        type: 'enum',
        choices: COMPOUNDING_TYPES,
        isMutable: true,
        label: 'Compounding',
        showFor: ['deposit-account', 'loan', 'line-of-credit'],
        validation: {
          canBeNull: true
        }
      },
      creditLimit: {
        type: 'int',
        isMutable: true,
        label: 'Credit limit',
        showFor: ['line-of-credit'],
        validation: {
          canBeNull: true,
          maxDigits: 10,
          decimalPlaces: 2
        }
      },
      isAlwaysPaidOff: {
        type: 'boolean',
        isMutable: true,
        label: 'Balance is paid off every period',
        helpText: 'Check if you do not carry a balance across billing periods.',
        showFor: ['line-of-credit'],
        validation: {
          canBeNull: true
        }
      },
      fromAccount: {
        type: 'varchar',
        foreignModel: 'Stream',
        isMutable: true,
        label: 'Draw from account',
        showFor: ['loan', 'bill', 'line-of-credit', 'transfer'],
        validation: {
          maxLength: 14,
          canBeNull: true
        }
      },
      toAccount: {
        type: 'varchar',
        foreignModel: 'Stream',
        isMutable: true,
        label: 'Deposit to account',
        showFor: ['income', 'transfer'],
        validation: {
          maxLength: 14,
          canBeNull: true
        }
      }
    };

    StreamMutable.prototype.schema = _.assign({}, localSchema, Model.prototype.schema);

    return StreamMutable;

  })(Model);

  Stream = (function(superClass) {
    var STREAM_TYPES, SUBTYPES, TYPES, i, len, localSchema, ref, type;

    extend(Stream, superClass);

    function Stream(props) {
      var prop, val;
      for (prop in props) {
        val = props[prop];
        this[prop] = val;
      }
    }

    STREAM_TYPES = {
      STREAM_TYPES: [['deposit-account', 'Deposit account', [['account-checking', 'Checking account'], ['account-savings', 'Savings account'], ['account-cd', 'Certificate of deposit'], ['account-investment', 'Investment account']]], ['line-of-credit', 'Line of credit', [['loc-credit', 'Credit card'], ['loc-heloc', 'Home equity line of credit']]], ['income', 'Income', [['income-salary', 'Paycheck'], ['income-other', 'Other income']]], ['bill', 'Bill', [['bill-rent', 'Rent'], ['bill-cell', 'Cell phone'], ['bill-tv', 'TV'], ['bill-water', 'Water'], ['bill-electric', 'Electric'], ['bill-heat', 'Heat'], ['bill-internet', 'Internet'], ['bill-insurance-health', 'Health insurance'], ['bill-insurance-car', 'Car insurance'], ['bill-insurance-life', 'Life insurance'], ['bill-other', 'Other bill']]], ['loan', 'Loan', [['loan-student', 'Student loan'], ['loan-auto', 'Auto loan'], ['loan-health', 'Health loan'], ['loan-mortgage', 'Mortgage'], ['loan-personal', 'Personal loan'], ['loan-other', 'Other loan']]], ['transfer', 'Transfer', [['transfer-transfer', 'Transfer']]]]
    };

    Stream.prototype.getStreamTypes = function() {
      return STREAM_TYPES;
    };

    TYPES = [];

    SUBTYPES = [];

    ref = STREAM_TYPES.STREAM_TYPES;
    for (i = 0, len = ref.length; i < len; i++) {
      type = ref[i];
      TYPES.push(type.slice(0, 2));
      SUBTYPES = SUBTYPES.concat(type[2]);
    }

    localSchema = {
      name: {
        type: 'varchar',
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
        type: 'varchar',
        foreignModel: 'User',
        validation: {
          maxLength: 14,
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
        type: 'smallint',
        "default": 50,
        validation: {
          required: true
        }
      },
      streamType: {
        type: 'enum',
        choices: TYPES,
        validation: {
          required: true
        }
      },
      streamSubtype: {
        type: 'enum',
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
        showFor: ['deposit-account', 'loan', 'line-of-credit'],
        validation: {
          canBeNull: true
        }
      },
      firstPaymentDate: {
        type: 'date',
        label: 'Date of first payment',
        otherLabels: {
          transfer: 'Date of first transfer',
          income: 'Date of first deposit'
        },
        showFor: ['loan', 'bill', 'line-of-credit', 'transfer', 'income'],
        validation: {
          canBeNull: true
        }
      },
      isRegular: {
        type: 'boolean',
        "default": true,
        label: 'Payment amount is regular',
        helpText: 'Check if the payment is roughly the same amount every period.',
        otherHelpText: {
          income: 'Check if the income is roughly the same amount every period.'
        },
        showFor: ['bill', 'income'],
        validation: {
          canBeNull: true
        }
      },
      isSeasonal: {
        type: 'boolean',
        label: 'Payment amount is seasonal',
        helpText: 'Check if the payment amount fluctuates per season. For example, heating bills.',
        showFor: ['bill'],
        "default": false,
        validation: {
          canBeNull: true
        }
      }
    };

    Stream.prototype.schema = _.assign({}, localSchema, StreamMutable.prototype.schema);

    return Stream;

  })(StreamMutable);

  global.Stream = Stream;

  global.StreamMutable = StreamMutable;

}).call(this);
