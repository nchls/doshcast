(function() {
  var Model, global,
    __hasProp = {}.hasOwnProperty;

  if (typeof exports !== "undefined" && exports !== null) {
    global = exports;
  } else {
    global = window.util.namespacer('dosh.models');
  }

  Model = (function() {
    function Model(_at_created, _at_modified) {
      this.created = _at_created;
      this.modified = _at_modified;
    }

    Model.prototype.schema = {
      created: {
        type: 'dateTime',
        validation: {
          required: true
        }
      },
      modified: {
        type: 'dateTime',
        validation: {
          required: true
        }
      }
    };

    Model.prototype.instanceToObject = function() {
      var key, obj, value;
      obj = {};
      for (key in this) {
        if (!__hasProp.call(this, key)) continue;
        value = this[key];
        obj[key] = value;
      }
      return obj;
    };

    Model.prototype.jsonToObject = function(json) {
      var key, obj, output, value, _ref;
      output = {};
      obj = JSON.parse(json);
      for (key in obj) {
        if (!__hasProp.call(obj, key)) continue;
        value = obj[key];
        if (key in this.schema) {
          if ((_ref = this.schema[key].type) === 'date' || _ref === 'dateTime') {
            output[key] = new Date(value);
            continue;
          }
          output[key] = value;
        }
      }
      return obj;
    };

    Model.prototype.validate = function() {};

    return Model;

  })();

  global.Model = Model;

}).call(this);
