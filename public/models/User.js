(function() {
  var Model, User, _, global,
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

  User = (function(superClass) {
    var localSchema;

    extend(User, superClass);

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
        type: 'varchar',
        label: 'E-mail address',
        validation: {
          required: true,
          maxLength: 60,
          regex: /.+@.+\..+/i
        }
      },
      password: {
        type: 'varchar',
        label: 'Password',
        validation: {
          required: true,
          minLength: 7,
          maxLength: 160
        },
        dbValidation: {
          maxLength: 500
        }
      },
      salt: {
        type: 'varchar',
        validation: {
          maxLength: 200
        }
      },
      passwordSchema: {
        type: 'smallint',
        validation: {
          required: true
        }
      },
      registrationIp: {
        type: 'inet',
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
        type: 'timestamp',
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
