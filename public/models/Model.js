(function() {
  var Model, global,
    hasProp = {}.hasOwnProperty;

  if (typeof exports !== "undefined" && exports !== null) {
    global = exports;
  } else {
    global = window.util.namespacer('dosh.models');
  }

  Model = (function() {
    function Model(props) {
      var prop, val;
      for (prop in props) {
        val = props[prop];
        this[prop] = val;
      }
    }

    Model.prototype.schema = {
      created: {
        type: 'timestamp',
        "default": 'now',
        validation: {
          required: true
        }
      },
      modified: {
        type: 'timestamp',
        "default": 'now',
        validation: {
          required: true
        }
      }
    };

    Model.prototype.instanceToObject = function() {
      var key, obj, value;
      obj = {};
      for (key in this) {
        if (!hasProp.call(this, key)) continue;
        value = this[key];
        obj[key] = value;
      }
      return obj;
    };

    Model.prototype.jsonToObject = function(json) {
      var key, obj, output, ref, value;
      output = {};
      obj = JSON.parse(json);
      for (key in obj) {
        if (!hasProp.call(obj, key)) continue;
        value = obj[key];
        if (key in this.schema) {
          if ((ref = this.schema[key].type) === 'date' || ref === 'timestamp') {
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
