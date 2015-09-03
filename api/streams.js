var ManualEntry, Stream, StreamRevision, User, db, moment, q, shortid;

q = require('q');

moment = require('moment');

shortid = require('shortid');

db = require('../source/db/db');

User = require('./../public/models/User').User;

Stream = require('./../public/models/Stream').Stream;

ManualEntry = require('./../public/models/ManualEntry').ManualEntry;

StreamRevision = require('./../public/models/StreamRevision').StreamRevision;

module.exports = {
  getData: function(req, res) {
    var userId;
    userId = req.session.user.id;
    return q.all([db.query(Stream, 'select * from "Stream" where owner=$1', [userId]), db.query(ManualEntry, 'select * from "ManualEntry" inner join "Stream" on "ManualEntry".stream="Stream".id and "Stream".owner=$1', [userId]), db.query(StreamRevision, 'select * from "StreamRevision" inner join "Stream" on "StreamRevision".revised="Stream".id and "Stream".owner=$1', [userId]), db.query(User, 'select email from "User" where id=$1 limit 1', [userId])]).then(function(responses) {
      var collection, i, j, len, len1, output, ref, row;
      output = {
        streams: responses[0].rows,
        manuals: responses[1].rows,
        revisions: responses[2].rows,
        user: responses[3].rows[0].email
      };
      ref = [output.streams, output.manuals, output.revisions];
      for (i = 0, len = ref.length; i < len; i++) {
        collection = ref[i];
        for (j = 0, len1 = collection.length; j < len1; j++) {
          row = collection[j];
          delete row.owner;
          delete row.created;
          delete row.modified;
        }
      }
      return res.status(200).send({
        isError: false,
        result: output
      });
    })["catch"](function(err) {
      res.status(500).send({
        isError: true,
        msg: 'Error in database select.'
      });
      return console.log(err);
    });
  },
  setStreamData: function(req, res) {
    var collection, data, insertion, mode, model, obj, streamId, update, userId, ymd;
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
    userId = req.session.user.id;
    obj = model.prototype.jsonToObject(data);
    ymd = moment().format('YYYY-MM-DD');
    obj.modified = ymd;
    if (mode === 'add') {
      obj.id = shortid.generate();
      obj.owner = userId;
      obj.created = ymd;
      if (collection === 'streams') {
        obj.isActive = true;
      }
    } else {
      streamId = obj.id;
      delete obj.id;
      delete obj.owner;
      delete obj.created;
    }
    if (mode === 'add') {
      insertion = db.insert(model, model.name, obj);
      insertion.done(function(result) {
        return res.status(200).send(result.rows[0]);
      });
      return insertion["catch"](function(err) {
        res.status(500).send({
          isError: true,
          errorCode: 50,
          msg: 'Error in database insert.'
        });
        console.log('message: ', err);
      });
    } else {
      update = db.update(model, model.name, {
        id: streamId,
        owner: userId
      }, obj);
      update.done(function(result) {
        if (result.rowCount !== 1) {
          res.status(500).send({
            isError: true,
            errorCode: 51,
            msg: 'Error in database update.'
          });
          console.log(result);
          return;
        }
        return res.status(200).send({
          isError: false
        });
      });
      return update["catch"](function(err) {
        res.status(500).send({
          isError: true,
          errorCode: 50,
          msg: 'Error in database update.'
        });
        console.log('message: ', err);
      });
    }
  }
};
