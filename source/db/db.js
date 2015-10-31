var pg = require('pg'),
	q = require('q'),
	_ = require('lodash');

var appPrivate = require('../../app-private');

var conString = 'postgres://' + appPrivate.db.user + ':' + appPrivate.db.pass + '@' + appPrivate.db.host + '/' + appPrivate.db.name;

var query = function(model, sql, parameters) {
	var deferred = q.defer();

	pg.connect(conString, function(err, client, done) {
		if (err) {
			deferred.reject('Error fetching client from pool', err);
		}

		console.log(sql, parameters);
		client.query(sql, parameters, function(err, result) {
			done();
			if (err) {
				deferred.reject(JSON.stringify({msg: 'Error running query', err: err}));
			}
			result = formatPgData(model, result);
			deferred.resolve(result);
		});
	});

	return deferred.promise;
},

insert = function(model, table, obj) {
	var sql = '',
		valuesClause = objToValuesClause(obj),
		parameterizedClauses = parameterizeClauses([valuesClause]),
		parameters = [];

	valuesClause = parameterizedClauses[0];
	parameters = parameterizedClauses[1];

	sql = 'insert into "' + table + '" ' + valuesClause + ' returning id;';

	var output = query(model, sql, parameters);

	return output;
},

update = function(model, table, criteria, obj) {
	var sql = '',
		whereClause = objToSetOrWhereClause(criteria, 'where'),
		setClause = objToSetOrWhereClause(obj, 'set'),
		parameterizedClauses = parameterizeClauses([setClause, whereClause]),
		parameters = [];

	setClause = parameterizedClauses[0];
	whereClause = parameterizedClauses[1];
	parameters = parameterizedClauses[2];

	sql = 'update "' + table + '" set ' + setClause + ' where ' + whereClause + ';';

	return query(model, sql, parameters);
},

objToValuesClause = function(obj) {
	var output = [],
		keys = _.keys(obj),
		vals = _.values(obj);

	var formattedKeys = formatKeys(keys);

	var formattedVals = _.map(vals, function(val) {
		return '$param';
	});

	output.push('(' + formattedKeys.join(',') + ') values (' + formattedVals.join(',') + ')');
	output.push(vals);

	return output;
},

objToSetOrWhereClause = function(obj, setOrWhere) {
	var output = [],
		keys = _.keys(obj),
		vals = _.values(obj),
		formattedKeys = formatKeys(keys),
		formattedVals = _.map(vals, function(val, idx) {
			return '$param';
		}),
		zipped = _.zipObject(formattedKeys, formattedVals),
		joiner = (setOrWhere === 'set' ? ', ' : ' and ');

	zipped = _.map(zipped, function(val, key) {
		return key + ' = ' + val;
	});
	zipped = zipped.join(joiner);

	output.push(zipped);
	output.push(vals);

	return output;
},

formatKeys = function(keys) {
	return _.map(keys, function(key) {
		if (hasCap(key) || key === 'order') {
			return '"' + key + '"';
		}
		return key;
	});
},

hasCap = function(str) {
	for (var i=0, l=str.length; i < l; i++) {
		if (str[i] === str[i].toUpperCase()) {
			return true;
		}
	}
	return false;
},

parameterizeClauses = function(clauses) {
	var parameters = [],
		parameterIdx = 1,
		output = [];

	console.log('clauses', clauses);

	_.forEach(clauses, function(clause) {
		while (clause[0].indexOf('$param') !== -1) {
			clause[0] = clause[0].replace('$param', '$' + parameterIdx);
			parameterIdx++;
		}
		parameters = parameters.concat(clause[1]);
		output.push(clause[0]);
	});

	output.push(parameters);

	console.log('parameters', parameters);

	return output;
},

formatPgData = function(model, data) {
	var schema = model.prototype.schema;

	if (data !== undefined) {
		_.forEach(data.rows, function(row, rowIdx) {
			_.forEach(row, function(val, key) {

				if (val === null) {
					delete data.rows[rowIdx][key];
					return;
				}

				var propSchema = schema[key],
					newVal;
				if (propSchema) {
					if (propSchema.type === 'numeric') {
						newVal = parseFloat(val);
					} else if (_.contains(['int', 'smallint'], propSchema.type)) {
						newVal = parseInt(val, 10);
					} else if (propSchema.type === 'date' && val !== null) {
						newVal = val.toISOString().split('T')[0];
					}
				}
				if (newVal !== undefined) {
					data.rows[rowIdx][key] = newVal;
				}

			});
		});
	}

	return data;
};

module.exports = {
	query: query,
	insert: insert,
	update: update
};
