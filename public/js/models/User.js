(function() {
  var Model, User, global, _, _base,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof exports !== "undefined" && exports !== null) {
    global = exports;
    Model = require('./Model').Model;
    _ = require('./../../bower/lodash/dist/lodash.min');
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

  User = (function(_super) {
    var localSchema;

    __extends(User, _super);

    function User(created, modified, email, password, registrationIp, isActive, lastLogin) {
      this.email = email;
      this.password = password;
      this.registrationIp = registrationIp;
      this.isActive = isActive;
      this.lastLogin = lastLogin;
      User.__super__.constructor.call(this, created, modified);
    }

    localSchema = {
      email: {
        type: 'string',
        label: 'E-mail address',
        validation: {
          required: true,
          regex: /.+@.+\..+/i
        }
      },
      password: {
        type: 'password',
        label: 'Password',
        validation: {
          required: true,
          minLength: 7,
          maxLength: 160
        }
      },
      passwordSchema: {
        type: 'positiveInt',
        validation: {
          required: true
        }
      },
      registrationIp: {
        type: 'string',
        validation: {
          required: true
        }
      },
      isVerified: {
        type: 'boolean',
        validation: {
          required: true
        }
      },
      lastLogin: {
        type: 'dateTime',
        validation: {
          required: true
        }
      }
    };

    User.prototype.schema = _.assign({}, localSchema, Model.prototype.schema);

    return User;

  })(Model);

  global.User = User;

}).call(this);
