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

    function ManualEntry(props) {
      var prop, val;
      for (prop in props) {
        val = props[prop];
        this[prop] = val;
      }
    }

    localSchema = {
      entryDate: {
        type: 'date',
        validation: {
          required: true
        }
      },
      amount: {
        type: 'numeric',
        validation: {
          required: true,
          maxDigits: 9,
          decimalPlaces: 2
        }
      },
      stream: {
        type: 'varchar',
        foreignModel: 'Stream',
        validation: {
          maxLength: 14,
          required: true
        }
      }
    };

    ManualEntry.prototype.schema = _.assign({}, localSchema, Model.prototype.schema);

    return ManualEntry;

  })(Model);

  global.ManualEntry = ManualEntry;

}).call(this);
