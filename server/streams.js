var Stream, db, mongoskin, q;

q = require('q');

mongoskin = require('mongoskin');

Stream = require('./../public/models/Stream').Stream;

db = mongoskin.db('mongodb://127.0.0.1:27017/dosh');

module.exports = {
  getInitialData: function(req, res) {
    var output;
    output = {
      models: {
        stream: {}
      }
    };
    output.models.stream.COMPOUNDING_TYPES = Stream.prototype.getCompoundingTypes();
    output.models.stream.RECURRENCE_TYPES = Stream.prototype.getRecurrenceTypes();
    return res.status(200).send(output);

    /*
    window.initialData = {
      user: {
          "id": null,
          "isActive": false,
          "isAnonymous": true,
          "isLoggedIn": false,
          "username": ""
      },
      models: {
          "stream": {
              "compounding": [
                  ["compound-none", "None"],
                  ["compound-daily", "Daily"],
                  ["compound-monthly", "Monthly"],
                  ["compound-semianually", "Every six months"],
                  ["compound-annually", "Annually"]
              ],
              "config": [{
                  "input": {
                      "type": "select"
                  },
                  "jsName": "type",
                  "key": "stream_subtype",
                  "label": "Account Type",
                  "validation": {
                      "required": true
                  }
              }, {
                  "helpText": "For your own reference.",
                  "input": {
                      "type": "text"
                  },
                  "jsName": "name",
                  "key": "name",
                  "label": "Account Name",
                  "otherLabels": {
                      "transfer": "Transfer name"
                  },
                  "validation": {
                      "required": true
                  }
              }, {
                  "input": {
                      "type": "text"
                  },
                  "isMutable": true,
                  "jsName": "org",
                  "key": "org_name",
                  "label": "Bank name",
                  "otherLabels": {
                      "bill": "Payee name",
                      "income": "Income source",
                      "loan": "Lender name"
                  },
                  "showFor": ["deposit-account", "loan", "bill",
                      "line-of-credit", "income"
                  ],
                  "validation": {
                      "required": true
                  }
              }, {
                  "dataType": "boolean",
                  "helpText": "Check if you do not carry a balance across billing periods.",
                  "input": {
                      "type": "checkbox"
                  },
                  "isMutable": true,
                  "jsName": "isPaidOff",
                  "key": "is_always_paid_off",
                  "label": "Balance is paid off every period",
                  "showFor": "line-of-credit",
                  "validation": {
                      "functions": []
                  }
              }],
              "recurrence": [
                  ["recur-daily", "Daily"],
                  ["recur-weekly", "Weekly"],
                  ["recur-biweekly", "Every two weeks"],
                  ["recur-monthly", "Monthly"],
                  ["recur-semiannually", "Every six months"],
                  ["recur-annually", "Annually"],
                  ["recur-irregularly", "Irregularly"]
              ],
              "types": [
                  ["deposit-account", "Deposit account", [
                      ["account-checking", "Checking account"],
                      ["account-savings",
                          "Savings/money market account"
                      ],
                      ["account-cd", "Certificate of deposit"],
                      ["account-investment",
                          "Investment/retirement account"
                      ]
                  ]],
                  ["line-of-credit", "Line of credit", [
                      ["loc-credit", "Credit card"],
                      ["loc-heloc", "Home equity line of credit"]
                  ]],
    
              ]
          }
      }
    };
     */
  },
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
