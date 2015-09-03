var User, db, pbkdf2, q, shortid;

q = require('q');

shortid = require('shortid');

pbkdf2 = require('easy-pbkdf2')({
  DEFAULT_HASH_ITERATIONS: 128000,
  SALT_SIZE: 64
});

db = require('../source/db/db');

User = require('./../public/models/User').User;

module.exports = {
  createUser: function(req, res) {
    var user;
    if (!req.body.user) {
      res.status(400).send({
        isError: true,
        errorCode: 40,
        msg: 'Parameter required: user.'
      });
      return;
    }
    user = req.body.user;
    user = User.prototype.jsonToObject(user);
    user.passwordSchema = 1;
    user.registrationIp = req.connection.remoteAddress;
    user.isVerified = true;
    user.lastLogin = new Date();
    return pbkdf2.secureHash(user.password, function(err, passwordHash, salt) {
      if (err) {
        res.status(500).send({
          isError: true,
          errorCode: 50,
          msg: 'Error in user hash creation.'
        });
        return;
      }
      user.password = passwordHash;
      user.salt = salt;
      return db.query(User, "insert into \"User\" (\n	id,\n	email,\n	password,\n	\"passwordSchema\",\n	\"registrationIp\",\n	\"isVerified\",\n	\"lastLogin\",\n	salt\n) values ($1,$2,$3,$4,$5,$6,$7);", [shortid.generate(), user.email, user.password, user.passwordSchema, user.registrationIp, user.isVerified, user.lastLogin, user.salt]).then(function(result) {
        return res.status(200).send({
          isError: false
        });
      })["catch"](function(err) {
        res.status(500).send({
          isError: true,
          errorCode: 50,
          msg: 'Error in user database insert.'
        });
      });
    });
  },
  loginUser: function(req, res) {
    var user;
    if (!req.body.user) {
      res.status(400).send({
        isError: true,
        errorCode: 40,
        msg: 'Parameter required: user.'
      });
      return;
    }
    if (req.session.user) {
      res.status(400).send({
        isError: true,
        errorCode: 41,
        msg: 'You are already logged in.',
        email: req.session.user.email
      });
      return;
    }
    user = User.prototype.jsonToObject(req.body.user);
    return db.query(User, 'select * from "User" where email=$1', [user.email]).then(function(result) {
      var dbUser;
      if (result.rows.length === 0) {
        res.status(401).send({
          isError: true,
          errorCode: 42,
          msg: 'User not found.'
        });
        return;
      }
      dbUser = result.rows[0];
      return pbkdf2.verify(dbUser.salt, dbUser.password, user.password, function(err, valid) {
        if (err) {
          res.status(500).send({
            isError: true,
            errorCode: 50,
            msg: 'Error in user authentication.'
          });
          return;
        }
        if (!valid) {
          res.status(401).send({
            isError: true,
            errorCode: 43,
            msg: 'Incorrect password.'
          });
          return;
        }
        req.session.user = dbUser;
        return res.status(200).send({
          isError: false
        });
      });
    })["catch"](function(err) {
      res.status(500).send({
        isError: true,
        errorCode: 50,
        msg: 'Error in user lookup.'
      });
    });
  },
  logoutUser: function(req, res) {
    delete req.session.user;
    return res.status(200).send({
      isError: false
    });
  }
};
