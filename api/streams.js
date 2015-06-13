var ManualEntry, Stream, StreamRevision, db, dbq, moment, mongoskin, q;

q = require('q');

moment = require('moment');

mongoskin = require('mongoskin');

Stream = require('./../public/models/Stream').Stream;

ManualEntry = require('./../public/models/ManualEntry').ManualEntry;

StreamRevision = require('./../public/models/StreamRevision').StreamRevision;

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh');

dbq = function(collection, method, criteria) {
  var deferred;
  deferred = q.defer();
  db.collection(collection)[method](criteria).toArray(function(err, result) {
    if (err) {
      deferred.reject(err);
    }
    return deferred.resolve({
      collection: collection,
      result: result
    });
  });
  return deferred.promise;
};

module.exports = {
  getData: function(req, res) {
    var userId;
    userId = mongoskin.helper.toObjectID(req.session.user._id);
    return q.all([
      dbq('streams', 'find', {
        owner: userId
      }), dbq('manuals', 'find', {
        owner: userId
      }), dbq('revisions', 'find', {
        owner: userId
      }), dbq('users', 'find', {
        _id: userId
      })
    ]).then(function(responses) {
      var i, len, output, response;
      output = {};
      for (i = 0, len = responses.length; i < len; i++) {
        response = responses[i];
        if (response.collection !== 'users') {
          output[response.collection] = response.result;
        } else {
          output.user = response.result[0].email;
        }
      }
      return res.status(200).send({
        isError: false,
        result: output
      });
    })["catch"](function(err) {
      return res.status(500).send({
        isError: true,
        msg: 'Error in database select.'
      });
    });
  },
  setStreamData: function(req, res) {
    var collection, data, mode, model, obj, streamId, userId, ymd;
    mode = req.body.mode;
    if (['add', 'edit'].indexOf(mode) === -1) {
      res.status(400).send({
        isError: true,
        msg: 'Parameter required: mode.'
      });
      return;
    }
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
    userId = mongoskin.helper.toObjectID(req.session.user._id);
    obj = model.prototype.jsonToObject(data);
    ymd = moment().format('YYYY-MM-DD');
    obj.modified = ymd;
    if (mode === 'add') {
      obj.created = ymd;
      obj.owner = userId;
      if (collection === 'streams') {
        obj.isActive = true;
      }
    } else {
      streamId = mongoskin.helper.toObjectID(obj._id);
      delete obj._id;
      delete obj.owner;
      delete obj.created;
    }
    if (mode === 'add') {
      return db.collection('streams').insert(obj, function(err, result) {
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
        return res.status(200).send(result[0]);
      });
    } else {
      return db.collection('streams').update({
        _id: streamId,
        owner: userId
      }, {
        $set: obj
      }, function(err, result) {
        if (err) {
          res.status(500).send({
            isError: true,
            errorCode: 50,
            msg: 'Error in database update.'
          });
          console.log('data: ', data);
          console.log('message: ', err.errmsg);
          return;
        }
        if (result !== 1) {
          res.status(500).send({
            isError: true,
            errorCode: 51,
            msg: 'Error in database update.'
          });
          return;
        }
        return res.status(200).send({
          isError: false
        });
      });
    }
  }
};
