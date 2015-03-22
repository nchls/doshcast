var AccountsPage = React.createClass({
	getInitialState: function() {
		return {};
	},

	handleAddStreamClick: function() {
		return this.setState({
			addStreamOpen: true
		});
	},

	handleCloseAddStreamClick: function(evt) {
		evt.preventDefault();
		return this.setState({
			addStreamOpen: false
		});
	},

	handleAddStreamSubmit: function(evt) {
		evt.preventDefault();

		var self = this,
			data = {stream: JSON.stringify(dosh.state.newStream)};

		self.props.addStream(dosh.state.newStream);

		return $.ajax({
			type: 'POST',
			url: '/api/createStream',
			data: data,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			if (self.isMounted()) {
				self.setState({
					addStreamOpen: false
				});
			}
		});
	},

	render: function() {
		return <div className="accounts">
			<h2>Accounts</h2>
			<div className="actionBar">
				{(this.state.addStreamOpen ?
					<button className="btn secondary" onClick={this.handleCloseAddStreamClick}>
						<i className="fa fa-arrow-left"></i> Accounts
					</button>
				:
					<button className="btn" onClick={this.handleAddStreamClick}>
						<i className="fa fa-plus"></i> Add Account
					</button>
				)}
			</div>
			{this.state.addStreamOpen ? null : <StreamsList streams={this.props.streams}/>}
			{this.state.addStreamOpen ? <AddStream handleSubmit={this.handleAddStreamSubmit} handleCancel={this.handleCloseAddStreamClick} fields={[]}/> : null}
		</div>;
	}
});

var StreamsList = React.createClass({
	getInitialState: function() {
		return null;
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

	render: function() {
		var streamsByType = _.pairs(_.groupBy(this.props.streams, 'streamType'));
		return <ul className="streams-list">
			{streamsByType.map( function(type) {
				return <StreamsGroup key={type[0]} type={type[0]} streams={type[1]}/>
			})}
		</ul>;
	}
});

var StreamsGroup = React.createClass({
	render: function() {
		return <li className="stream-group">
			<h3>{StreamsList.getTypeLabel(this.props.type)}</h3>
			<ul>
				{this.props.streams.map( function(stream) {
					return <StreamsListItem key={stream._id} id={stream._id} name={stream.name} subtype={stream.streamSubtype}/>
				})}
			</ul>
		</li>;
	}
});

var StreamsListItem = React.createClass({
	render: function() {
		return <li className="item">
			<div className="streamName">{this.props.name}</div>
			<div className="streamType">{StreamsList.getSubtypeLabel(this.props.subtype)}</div>
		</li>;
	}
});

var AddStream = React.createClass({
	getInitialState: function() {
		return {
			newStream: {}
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
				})
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
		var updatedState = _.clone(this.state.newStream);
		updatedState[fieldId] = value;

		if (fieldId === 'streamSubtype') {
			updatedState['streamType'] = AddStream.getTypeFromSubtype(value);
		}

		this.setState({newStream: updatedState});

		dosh.state.newStream = updatedState;
	},

	render: function() {
		var self = this,
			fields = AddStream.getStreamFields();
		return <form className="addStreamForm" onSubmit={this.props.handleSubmit}>
			{fields.map( function(field) {
				var fieldId = field[0],
					fieldData = field[1],
					inputType = AddStream.getInputType(fieldData),
					helpText = AddStream.getFieldHelp(fieldId, self.state.newStream.streamType),
					label = AddStream.getFieldLabel(fieldData, self.state.newStream.streamType),
					isRequired = !!(fieldData.validation && fieldData.validation.required);

				fieldData.fieldId = fieldId;

				if (!fieldData.label) {
					return null;
				} else {
					if (fieldData.showFor === undefined || _.includes(fieldData.showFor, self.state.newStream.streamType)) {
						return <AddStreamField key={fieldId} fieldId={fieldId} fieldData={fieldData} inputType={inputType} helpText={helpText} label={label} isRequired={isRequired} handleStreamUpdate={self.handleStreamUpdate} />
					}
				}
			})}
			<div className="actionBar">
				<button className="btn secondary" onClick={this.props.handleCancel}>
					Cancel
				</button>
				<button className="btn">
					<i className="fa fa-plus"></i> Add Account
				</button>
			</div>
		</form>;
	}

});

var AddStreamField = React.createClass({
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
			value = self.state.value;

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
							{AddStream.getChoices(self.props.fieldData, dosh.state.streams).map(function(choice) {
								if (self.props.fieldId !== 'streamSubtype') {
									return <option key={choice[0]} value={choice[0]}>{choice[1]}</option>
								} else {
									return <optgroup key={choice[0]} label={choice[1]}>
										{choice[2].map(function(subtypeChoice) {
											return <option key={subtypeChoice[0]} value={subtypeChoice[0]}>{subtypeChoice[1]}</option>
										})}
									</optgroup>
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
				<p className="helpText aside">
					{this.props.helpText}
				</p>
			: null}

		</div>
	}
});
