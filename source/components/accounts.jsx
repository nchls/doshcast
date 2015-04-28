var AccountsPage = React.createClass({
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
		return <div className="accounts">
			<h2>Accounts</h2>
			<div className="actionBar">
				{this.state.openPanel === null ?
					<a className="btn" onClick={this.handleAddStreamClick} href="/accounts/add">
						<i className="fa fa-plus"></i> Add Account
					</a>
				: null}
				{_.includes(['addStream', 'editStream'], this.state.openPanel) ?
					<a className="btn secondary" onClick={this.handleCloseStreamForm} href="/accounts">
						<i className="fa fa-arrow-left"></i> Accounts
					</a>
				: null}
			</div>
			{this.state.openPanel === null ? <StreamsList handleStreamClick={this.handleStreamClick}/> : null}
			{this.state.openPanel === 'addStream' ? <StreamForm action="add" handleSubmit={this.handleAddStreamSubmit} handleCancel={this.handleCloseStreamForm} stream={{}}/> : null}
			{this.state.openPanel === 'editStream' ? <StreamForm action="edit" handleSubmit={this.handleEditStreamSubmit} handleCancel={this.handleCloseStreamForm} stream={this.state.editingStream}/> : null}
		</div>;
	}
});

var StreamsList = React.createClass({
	getInitialState: function() {
		return {
			streams: AppActions.getStreams()
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
		var self = this;
		self.eventListeners = [];
		self.addListener('addStream', self.handleDataUpdate);
		self.addListener('editStream', self.handleDataUpdate);
		self.addListener('updateData', self.handleDataUpdate);
	},

	componentWillUnmount: function() {
		_.forEach(this.eventListeners, function(listener) {
			events.removeListener(listener.event, listener.callback);
		});
	},

	addListener: function(event, callback) {
		events.addListener(event, callback);
		this.eventListeners.push({
			event: event,
			callback: callback
		});
	},

	handleDataUpdate: function() {
		this.setState({
			streams: AppActions.getStreams()
		});
	},

	render: function() {
		var self = this,
			streamsByType = _.pairs(_.groupBy(self.state.streams, 'streamType'));
		return <ul className="streams-list">
			{streamsByType.map( function(type) {
				return <StreamsGroup key={type[0]} type={type[0]} streams={type[1]} handleStreamClick={self.props.handleStreamClick}/>;
			})}
		</ul>;
	}
});

var StreamsGroup = React.createClass({
	render: function() {
		var self = this;
		return <li className="stream-group">
			<h3>{StreamsList.getTypeLabel(self.props.type)}</h3>
			<ul>
				{self.props.streams.map( function(stream) {
					return <StreamsListItem key={stream._id} stream={stream} handleStreamClick={self.props.handleStreamClick}/>;
				})}
			</ul>
		</li>;
	}
});

var StreamsListItem = React.createClass({
	handleStreamClick: function(evt) {
		evt.preventDefault();
		this.props.handleStreamClick(evt, this.props.stream);
	},

	render: function() {
		var self = this;
		return <li className="item">
			<a href={"/accounts/edit/" + self.props.stream._id} onClick={self.handleStreamClick}>
				<div className="streamName">{self.props.stream.name}</div>
				<div className="streamType">{StreamsList.getSubtypeLabel(self.props.stream.streamSubtype)}</div>
			</a>
		</li>;
	}
});

var StreamForm = React.createClass({
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

		this.setState({stream: updatedState});
	},

	handleSubmit: function() {
		evt.preventDefault();
		var self = this,
			data = {
				stream: self.state.stream
			},
			endpoint = '/api/createStreamData';

		if (self.props.action === 'edit') {
			endpoint = '/api/editStreamData';
		}

		return $.ajax({
			type: 'POST',
			url: endpoint,
			data: data,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			if (self.props.action === 'add') {
				AppActions.addStream(self.state.stream);
			} else {
				AppActions.editStream(self.state.stream);
			}
			self.props.handleSubmit();
		});
	},

	render: function() {
		var self = this,
			fields = StreamForm.getStreamFields();
		return <form className="streamForm" onSubmit={this.props.handleSubmit}>
			{fields.map( function(field) {
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
						return <StreamField key={fieldId} fieldId={fieldId} fieldData={fieldData} inputType={inputType} helpText={helpText} label={label} isRequired={isRequired} handleStreamUpdate={self.handleStreamUpdate} />;
					}
				}
			})}
			<div className="actionBar">
				<a className="btn secondary" onClick={this.props.handleCancel} href="/accounts">
					Cancel
				</a>
				<button className="btn">
					<i className="fa fa-plus"></i> Add Account
				</button>
			</div>
		</form>;
	}

});

var StreamField = React.createClass({
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
			streams = AppActions.getStreams();

		return <div className={'formRow cf ' + (self.props.inputType === 'checkbox' ? 'inline' : '')}>
			<div className="field">

				{self.props.inputType !== 'checkbox' ?
					<label htmlFor={'newStream-' + self.props.fieldId}>
						{self.props.label}
					</label>
				: null}

				{self.props.inputType !== 'select' ?
						<input type={self.props.inputType} id={'newStream-' + self.props.fieldId} value={value} checked={value} onChange={self.handleChange} required={self.props.isRequired}/>
					:
						<select id={'newStream-' + self.props.fieldId} onChange={self.handleChange} required={self.props.isRequired}>
							<option value="">--- Choose {self.props.fieldData.label.toLowerCase()} ---</option>
							{StreamForm.getChoices(self.props.fieldData, streams).map(function(choice) {
								if (self.props.fieldId !== 'streamSubtype') {
									return <option key={choice[0]} value={choice[0]}>{choice[1]}</option>;
								} else {
									return <optgroup key={choice[0]} label={choice[1]}>
										{choice[2].map(function(subtypeChoice) {
											return <option key={subtypeChoice[0]} value={subtypeChoice[0]}>{subtypeChoice[1]}</option>;
										})}
									</optgroup>;
								}
							})}
						</select>
				}

				{self.props.inputType === 'checkbox' ?
					<label htmlFor={'newStream-' + self.props.fieldId}>
						{self.props.fieldData.label}
					</label>
				: null}

			</div>

			{self.props.helpText ?
				<label className="helpText aside" htmlFor={'newStream-' + self.props.fieldId}>
					{this.props.helpText}
				</label>
			: null}

		</div>;
	}
});
