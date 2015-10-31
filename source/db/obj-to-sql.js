var _ = require('../../public/bower/lodash/lodash.js');

var Stream = require('../../public/models/Stream').Stream;
var StreamRevision = require('../../public/models/StreamRevision').StreamRevision;
var User = require('../../public/models/User').User;
var ManualEntry = require('../../public/models/ManualEntry').ManualEntry;


var allEnums = [],

init = function() {
	var output = '';
	
	_.forEach([User, Stream, StreamRevision, ManualEntry], function(model) {
		output += getSQL(model) + '\n';
	})

	console.log(output);
},

getSQL = function(model) {
	var output = '',
		enums = [],
		columns = [];

	var enumFields = _.pick(model.prototype.schema, function(field, fieldName) {
		return (field.choices !== undefined && allEnums.indexOf(fieldName) === -1);
	});
	_.forEach(enumFields, function(field, fieldName) {
		enums.push('create type ' + fieldName + 'choices as enum ' + getChoices(field.choices) + ';');
		allEnums.push(fieldName);
	});
	output += enums.join('\n') + '\n';

	columns.push('"id" varchar (14) primary key');
	_.forEach(model.prototype.schema, function(field, fieldName) {
		var validation = field.dbValidation || field.validation || {};

		if (field.type === 'enum') {
			var columnDef = ['"' + fieldName + '"', fieldName + 'choices'];
			if (!validation.canBeNull) {
				columnDef.push('not null');
			}
			columns.push(columnDef.join(' '));
			return;
		}

		var columnDef = ['"' + fieldName + '"', field.type];

		if (validation.maxLength) {
			columnDef.push('(' + validation.maxLength +')');
		}

		if (field.type === 'numeric' && validation.maxDigits && validation.decimalPlaces) {
			columnDef.push('(' + (validation.maxDigits + validation.decimalPlaces) + ', ' + validation.decimalPlaces + ')');
		}

		if (field.foreignModel !== undefined) {
			columnDef.push('references "' + field.foreignModel + '"');
		}

		if (!validation.canBeNull) {
			columnDef.push('not null');
		}

		if (field.default !== undefined) {
			columnDef.push('default ' + getDefault(field));
		}

		columns.push(columnDef.join(' '));
	});

	output += 'create table "' + model.name + '" (\n\t';
	output += columns.join(',\n\t') + '\n';
	output += ');'

	return output;
},

getChoices = function(choices) {
	return '(' + choices.map(function(choice) {
		return "'" + choice[0] + "'";
	}) + ')';
},

getDefault = function(field) {
	if (field.type === 'boolean') {
		if (field.default) {
			return 'TRUE';
		} else {
			return 'FALSE';
		}
	} else if (field.type === 'timestamp') {
		if (field.default === 'now') {
			return "(now() at time zone 'utc')";
		}
	}
	return field.default;
};

init();



