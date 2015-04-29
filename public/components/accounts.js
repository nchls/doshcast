var AccountsPage = React.createClass({displayName: "AccountsPage",
	getInitialState: function() {
		return {
			openPanel: null,
			editingStream: null
		};
	},

	handleAddStreamClick: function(evt) {
		evt.preventDefault();
		return this.setState({
			openPanel: 'addStream'
		});
	},

	handleCloseStreamForm: function(evt) {
		evt.preventDefault();
		return this.setState({
			openPanel: null,
			editingStream: null
		});
	},

	handleAddStreamSubmit: function(evt) {
		var self = this;
		if (self.isMounted() && self.state.openPanel === 'addStream') {
			self.setState({
				openPanel: null
			});
		}
	},

	handleStreamClick: function(evt, stream) {
		evt.preventDefault();
		return this.setState({
			openPanel: 'editStream',
			editingStream: stream
		});
	},

	render: function() {
		return React.createElement("div", {className: "accounts padded"}, 
			React.createElement("h2", null, "Accounts"), 
			React.createElement("div", {className: "actionBar"}, 
				this.state.openPanel === null ?
					React.createElement("a", {className: "btn", onClick: this.handleAddStreamClick, href: "/accounts/add"}, 
						React.createElement("i", {className: "fa fa-plus"}), " Add Account"
					)
				: null, 
				_.includes(['addStream', 'editStream'], this.state.openPanel) ?
					React.createElement("div", null, 
						React.createElement("a", {className: "btn secondary", onClick: this.handleCloseStreamForm, href: "/accounts"}, 
							React.createElement("i", {className: "fa fa-arrow-left"}), " Accounts"
						), 
						React.createElement("button", {className: "btn tertiary small"}, 
							React.createElement("i", {className: "fa fa-trash-o"}), " Delete Account"
						)
					)
				: null
			), 
			this.state.openPanel === null ? React.createElement(StreamsList, {handleStreamClick: this.handleStreamClick}) : null, 
			this.state.openPanel === 'addStream' ? React.createElement(StreamForm, {action: "add", handleSubmit: this.handleAddStreamSubmit, handleCancel: this.handleCloseStreamForm, stream: {}}) : null, 
			this.state.openPanel === 'editStream' ? React.createElement(StreamForm, {action: "edit", handleSubmit: this.handleEditStreamSubmit, handleCancel: this.handleCloseStreamForm, stream: this.state.editingStream}) : null
		);
	}
});

var StreamsList = React.createClass(_.merge(EventListenerMixin, {
	getInitialState: function() {
		return {
			streams: dosh.state.streams
		};
	},

	statics: {
		getTypeLabel: function(type) {
			return _.find(dosh.models.Stream.prototype.schema.streamType.choices, function(choice) {
				return choice[0] === type;
			})[1];
		},

		getSubtypeLabel: function(subtype) {
			return _.find(dosh.models.Stream.prototype.schema.streamSubtype.choices, function(choice) {
				return choice[0] === subtype;
			})[1];
		}
	},

	componentWillMount: function() {
		this.addPropListener('streams', this.handleDataUpdate);
	},

	handleDataUpdate: function() {
		this.setState({
			streams: dosh.state.streams
		});
	},

	render: function() {
		console.log('StreamsList render');
		var self = this,
			streamsByType = _.pairs(_.groupBy(self.state.streams, 'streamType'));
		return React.createElement("ul", {className: "streams-list"}, 
			streamsByType.map( function(type) {
				return React.createElement(StreamsGroup, {key: type[0], type: type[0], streams: type[1], handleStreamClick: self.props.handleStreamClick});
			})
		);
	}
}));

var StreamsGroup = React.createClass({displayName: "StreamsGroup",
	render: function() {
		var self = this;
		return React.createElement("li", {className: "stream-group"}, 
			React.createElement("h3", null, StreamsList.getTypeLabel(self.props.type)), 
			React.createElement("ul", null, 
				self.props.streams.map( function(stream) {
					return React.createElement(StreamsListItem, {key: stream._id, stream: stream, handleStreamClick: self.props.handleStreamClick});
				})
			)
		);
	}
});

var StreamsListItem = React.createClass({displayName: "StreamsListItem",
	handleStreamClick: function(evt) {
		evt.preventDefault();
		this.props.handleStreamClick(evt, this.props.stream);
	},

	render: function() {
		var self = this;
		return React.createElement("li", {className: "item"}, 
			React.createElement("a", {href: "/accounts/edit/" + self.props.stream._id, onClick: self.handleStreamClick}, 
				React.createElement("div", {className: "streamName"}, self.props.stream.name), 
				React.createElement("div", {className: "streamType"}, StreamsList.getSubtypeLabel(self.props.stream.streamSubtype)), 
				React.createElement("a", {href: "/accounts/edit/" + self.props.stream._id, onClick: self.handleStreamClick}, "Edit ", React.createElement("small", null, "base data")), 
				React.createElement("a", {href: "/accounts/revise/" + self.props.stream._id}, "Add ", React.createElement("small", null, "revision")), 
				React.createElement("a", {href: "/accounts/revise/" + self.props.stream._id}, "Another ", React.createElement("small", null, "action"))
			)
		);
	}
});

var StreamForm = React.createClass({displayName: "StreamForm",
	getInitialState: function() {
		return {
			stream: this.props.stream
		};
	},

	statics: {
		getStreamFields: function() {
			var fields = _.pairs(dosh.models.Stream.prototype.schema),
				fieldOrder = dosh.models.Stream.prototype.getFieldOrder();
			return _.sortBy(fields, function(field) {
				return fieldOrder.indexOf(field[0]);
			});
		},

		getInputType: function(fieldData) {
			if (fieldData.type === 'nullBoolean' || fieldData.type === 'boolean') {
				return 'checkbox';
			}
			if (fieldData.choices || fieldData.type === 'foreignKey') {
				return 'select';
			}
			if (fieldData.type === 'string') {
				return 'text';
			}
			if (fieldData.type === 'date') {
				return 'date';
			}
			if (fieldData.type === 'positiveInt' || fieldData.type === 'decimal') {
				return 'zip';
			}
		},

		getChoices: function(fieldData, currentStreams) {
			if (fieldData.choices) {
				if (fieldData.fieldId !== 'streamSubtype') {
					return fieldData.choices;
				} else {
					// Return subtypes nested by types
					return dosh.models.Stream.prototype.getStreamTypes().STREAM_TYPES;
				}
			}
			if (fieldData.type === 'foreignKey') {
				var transferStreams = _.filter(currentStreams, function(stream) {
					return _.includes(['deposit-account', 'line-of-credit'], stream.streamType);
				});
				return _.map(transferStreams, function(stream) {
					return [stream._id, stream.name];
				});
			}
		},

		getFieldHelp: function(fieldId, currentType) {
			var fieldSchema = dosh.models.Stream.prototype.schema[fieldId];
			if (fieldSchema.otherHelpText && fieldSchema.otherHelpText[currentType] !== undefined) {
				return fieldSchema.otherHelpText[currentType];
			}
			return fieldSchema.helpText;
		},

		getFieldLabel: function(fieldData, currentType) {
			if (fieldData.otherLabels && fieldData.otherLabels[currentType] !== undefined) {
				return fieldData.otherLabels[currentType];
			}
			return fieldData.label;
		},

		getTypeFromSubtype: function(needle) {
			var type = _.find(dosh.models.Stream.prototype.getStreamTypes().STREAM_TYPES, function(type) {
				return _.find(type[2], function(subtype) {
					return subtype[0] === needle;
				});
			});
			if (type !== undefined) {
				return type[0];
			}
			return type;
		},

		getTransferStreams: function() {
			return _.filter($scope.streams, function(stream) {
				return _.includes(['deposit-account', 'line-of-credit'], stream.type);
			});
		}
	},

	handleStreamUpdate: function(fieldId, value) {
		var updatedState = _.clone(this.state.stream);
		updatedState[fieldId] = value;

		if (fieldId === 'streamSubtype') {
			updatedState.streamType = StreamForm.getTypeFromSubtype(value);
		}

		this.setState({
			stream: updatedState
		});
	},

	handleSubmit: function(evt) {
		evt.preventDefault();
		var self = this,
			data = {
				stream: JSON.stringify(self.state.stream)
			},
			endpoint = (self.props.action === 'add' ? '/api/createStreamData' : '/api/editStreamData');

		return $.ajax({
			type: 'POST',
			url: endpoint,
			data: data,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			if (status === 'success') {
				if (self.props.action === 'add') {
					Store.push('streams', response);
				} else {
					// TODO: edit action
				}
				self.props.handleSubmit();
			} else {
				// TODO: submission error
			}
		});
	},

	render: function() {
		var self = this,
			fields = StreamForm.getStreamFields();
		return React.createElement("form", {className: "streamForm", onSubmit: this.handleSubmit}, 
			fields.map( function(field) {
				var fieldId = field[0],
					fieldData = field[1],
					inputType = StreamForm.getInputType(fieldData),
					helpText = StreamForm.getFieldHelp(fieldId, self.state.stream.streamType),
					label = StreamForm.getFieldLabel(fieldData, self.state.stream.streamType),
					isRequired = !!(fieldData.validation && fieldData.validation.required);

				fieldData.fieldId = fieldId;

				if (!fieldData.label) {
					return null;
				} else {
					if (fieldData.showFor === undefined || _.includes(fieldData.showFor, self.state.stream.streamType)) {
						return React.createElement(StreamField, {key: fieldId, fieldId: fieldId, fieldData: fieldData, inputType: inputType, helpText: helpText, label: label, isRequired: isRequired, handleStreamUpdate: self.handleStreamUpdate});
					}
				}
			}), 
			React.createElement("div", {className: "actionBar"}, 
				React.createElement("a", {className: "btn secondary", onClick: this.props.handleCancel, href: "/accounts"}, 
					"Cancel"
				), 
				React.createElement("button", {className: "btn"}, 
					React.createElement("i", {className: "fa fa-plus"}), " Add Account"
				)
			)
		);
	}

});

var StreamField = React.createClass({displayName: "StreamField",
	getInitialState: function() {
		var self = this;
		return {
			value: (self.props.fieldData.default !== undefined ? self.props.fieldData.default : '')
		};
	},

	handleChange: function(evt) {
		var self = this,
			value = evt.target.value;

		if (_.includes(['boolean', 'nullBoolean'], self.props.fieldData.type)) {
			value = !!(evt.target.checked);
		}

		this.setState({value: value});

		if (_.includes(['int', 'positiveInt'], self.props.fieldData.type)) {
			value = parseInt(value, 10);
		} else if (self.props.fieldData.type === 'decimal') {
			value = parseFloat(value);
		}

		this.props.handleStreamUpdate(this.props.fieldId, value);
	},

	render: function() {
		var self = this,
			value = self.state.value,
			streams = dosh.state.streams;

		return React.createElement("div", {className: 'formRow cf ' + (self.props.inputType === 'checkbox' ? 'inline' : '')}, 
			React.createElement("div", {className: "field"}, 

				self.props.inputType !== 'checkbox' ?
					React.createElement("label", {htmlFor: 'newStream-' + self.props.fieldId}, 
						self.props.label
					)
				: null, 

				self.props.inputType !== 'select' ?
						React.createElement("input", {type: self.props.inputType, id: 'newStream-' + self.props.fieldId, value: value, checked: value, onChange: self.handleChange, required: self.props.isRequired})
					:
						React.createElement("select", {id: 'newStream-' + self.props.fieldId, onChange: self.handleChange, required: self.props.isRequired}, 
							React.createElement("option", {value: ""}, "--- Choose ", self.props.fieldData.label.toLowerCase(), " ---"), 
							StreamForm.getChoices(self.props.fieldData, streams).map(function(choice) {
								if (self.props.fieldId !== 'streamSubtype') {
									return React.createElement("option", {key: choice[0], value: choice[0]}, choice[1]);
								} else {
									return React.createElement("optgroup", {key: choice[0], label: choice[1]}, 
										choice[2].map(function(subtypeChoice) {
											return React.createElement("option", {key: subtypeChoice[0], value: subtypeChoice[0]}, subtypeChoice[1]);
										})
									);
								}
							})
						), 
				

				self.props.inputType === 'checkbox' ?
					React.createElement("label", {htmlFor: 'newStream-' + self.props.fieldId}, 
						self.props.fieldData.label
					)
				: null

			), 

			self.props.helpText ?
				React.createElement("label", {className: "helpText aside", htmlFor: 'newStream-' + self.props.fieldId}, 
					this.props.helpText
				)
			: null

		);
	}
});
