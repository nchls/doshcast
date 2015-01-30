(function() {
  var ManualEntry, Model, global, _,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  if (typeof exports !== "undefined" && exports !== null) {
    global = exports;
    Model = require('./Model').Model;
    _ = require('./../bower/lodash/dist/lodash.min');
  } else {
    global = window.util.namespacer('dosh.models');
    Model = global.Model;
    _ = window._;
  }

  ManualEntry = (function(_super) {
    var localSchema;

    __extends(ManualEntry, _super);

    function ManualEntry(created, modified, _at_entryDate, _at_amount, _at_stream) {
      this.entryDate = _at_entryDate;
      this.amount = _at_amount;
      this.stream = _at_stream;
      ManualEntry.__super__.constructor.call(this, created, modified);
    }

    localSchema = {
      entryDate: {
        type: 'date',
        validation: {
          required: true
        }
      },
      amount: {
        type: 'decimal',
        maxDigits: 9,
        decimalPlaces: 2,
        validation: {
          required: true
        }
      },
      stream: {
        type: 'foreignKey',
        model: 'Stream',
        validation: {
          required: true
        }
      }
    };

    ManualEntry.prototype.schema = _.assign({}, localSchema, Model.prototype.schema);

    return ManualEntry;

  })(Model);

  global.ManualEntry = ManualEntry;

}).call(this);
