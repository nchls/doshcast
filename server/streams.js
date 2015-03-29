var ManualEntry, Stream, StreamRevision, db, moment, mongoskin, q;

q = require('q');

moment = require('moment');

mongoskin = require('mongoskin');

Stream = require('./../public/models/Stream').Stream;

ManualEntry = require('./../public/models/ManualEntry').ManualEntry;

StreamRevision = require('./../public/models/StreamRevision').StreamRevision;

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh');

module.exports = {
  getData: function(req, res) {
    var collections, userId;
    collections = ['streams', 'manuals', 'revisions'];
    userId = mongoskin.helper.toObjectID(req.session.user._id);
    return db.collection('streams').find({
      owner: userId
    }).toArray(function(err, streamsResult) {
      if (err) {
        res.status(500).send({
          isError: true,
          msg: 'Error in stream database.'
        });
        return;
      }
      return db.collection('manuals').find({
        owner: userId
      }).toArray(function(err, manualsResult) {
        if (err) {
          res.status(500).send({
            isError: true,
            msg: 'Error in manuals database.'
          });
          return;
        }
        return db.collection('revisions').find({
          owner: userId
        }).toArray(function(err, revisionsResult) {
          if (err) {
            res.status(500).send({
              isError: true,
              msg: 'Error in revisions database.'
            });
            return;
          }
          return res.status(200).send({
            isError: false,
            result: {
              streams: streamsResult,
              manuals: manualsResult,
              revisions: revisionsResult
            }
          });
        });
      });
    });
  },
  createStreamData: function(req, res) {
    var collection, data, model, obj, ymd;
    if (req.body.stream) {
      data = req.body.stream;
      collection = 'streams';
      model = Stream;
    } else if (req.body.manual) {
      data = req.body.manual;
      collection = 'manuals';
      model = ManualEntry;
    } else if (req.body.revision) {
      data = req.body.revision;
      collection = 'revisions';
      model = StreamRevision;
    } else {
      res.status(400).send({
        isError: true,
        msg: 'Parameter required: stream, manual, or revision.'
      });
      return;
    }
    obj = model.prototype.jsonToObject(data);
    obj.owner = mongoskin.helper.toObjectID(req.session.user._id);
    ymd = moment().format('YYYY-MM-DD');
    obj.created = ymd;
    obj.modified = ymd;
    if (collection === 'streams') {
      obj.isActive = true;
    }
    return db.collection(collection).insert(obj, function(err, result) {
      if (err) {
        res.status(500).send({
          isError: true,
          errorCode: 50,
          msg: 'Error in database insert.'
        });
        console.log('data: ', data);
        console.log('message: ', err.errmsg);
        return;
      }
      return res.status(200).send({
        isError: false
      });
    });
  }
};
