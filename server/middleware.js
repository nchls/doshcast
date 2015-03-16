var db, mongoskin, q;

q = require('q');

mongoskin = require('mongoskin');

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh');

module.exports = {
  session: function(req, res, next) {
    var ref;
    if ((ref = req.session) != null ? ref.user : void 0) {
      return db.collection('users').findOne({
        id: req.session.user.id
      }, function(err, dbUser) {
        if (err) {
          res.status(500).send({
            isError: true,
            msg: 'Error in session user database.'
          });
          return;
        }
        if (dbUser) {
          req.user = {
            id: dbUser._id,
            email: dbUser.email
          };
          return next();
        } else {
          res.status(401).send({
            isError: true,
            msg: 'Session user not found.'
          });
        }
      });
    } else {
      return next();
    }
  },
  requireLogin: function(req, res, next) {
    if (!req.user) {
      res.status(401).send({
        isError: true,
        msg: 'You must be logged in.'
      });
      return;
    }
    return next();
  }
};
