var User, db, mongoskin, pbkdf2, q;

q = require('q');

mongoskin = require('mongoskin');

pbkdf2 = require('easy-pbkdf2')({
  DEFAULT_HASH_ITERATIONS: 128000,
  SALT_SIZE: 64
});

User = require('./../public/models/User').User;

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh');

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
      return db.collection('users').insert(user, function(err, result) {
        if (err) {
          res.status(500).send({
            isError: true,
            errorCode: 50,
            msg: 'Error in user database insert.'
          });
          return;
        }
        return res.status(200).send({
          isError: false
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
    return db.collection('users').findOne({
      email: user.email
    }, function(err, dbUser) {
      if (err) {
        res.status(500).send({
          isError: true,
          errorCode: 50,
          msg: 'Error in user lookup.'
        });
        return;
      }
      if (!dbUser) {
        res.status(401).send({
          isError: true,
          errorCode: 42,
          msg: 'User not found.'
        });
        return;
      }
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
    });
  },
  logoutUser: function(req, res) {
    delete req.session.user;
    return res.status(200).send({
      isError: false
    });
  }
};
