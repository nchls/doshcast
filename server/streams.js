var Stream, db, mongoskin, q;

q = require('q');

mongoskin = require('mongoskin');

Stream = require('./../public/models/Stream').Stream;

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh');

module.exports = {
  getData: function(req, res) {
    return db.collection('streams').find({
      owner: req.user.id
    }).toArray(function(err, result) {
      if (err) {
        res.status(500).send({
          isError: true,
          msg: 'Error in stream database.'
        });
        return;
      }
      return res.status(200).send({
        isError: false,
        result: result
      });
    });
  },
  createStream: function(req, res) {
    var stream;
    if (!req.query.stream) {
      res.status(400).send({
        isError: true,
        msg: 'Parameter required: stream.'
      });
      return;
    }
    stream = req.query.stream;
    stream = Stream.prototype.jsonToObject(stream);
    stream.owner = req.user.id;
    stream.isActive = true;
    stream.created = new Date();
    stream.modified = new Date();
    return db.collection('streams').insert(stream, function(err, result) {
      if (err) {
        res.status(500).send({
          isError: true,
          msg: 'Error in stream database insert.'
        });
        return;
      }
      return res.status(200).send({
        isError: false
      });
    });
  }
};
