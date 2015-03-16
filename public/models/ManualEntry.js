(function() {
  var ManualEntry, Model, _, global,
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

  ManualEntry = (function(superClass) {
    var localSchema;

    extend(ManualEntry, superClass);

    function ManualEntry(created, modified, entryDate, amount, stream) {
      this.entryDate = entryDate;
      this.amount = amount;
      this.stream = stream;
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
