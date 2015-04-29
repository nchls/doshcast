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
      })
    ]).then(function(responses) {
      var i, len, output, response;
      output = {};
      for (i = 0, len = responses.length; i < len; i++) {
        response = responses[i];
        output[response.collection] = response.result;
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
      return res.status(200).send(result[0]);
    });
  }
};
