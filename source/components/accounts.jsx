var global = window;

var AccountsPage = React.createClass({
	getInitialState: function() {
		return {
			dialogMode: null,
			dialogStream: null
		};
	},

	componentWillMount: function() {
		global.events.addListener('dialogRequested', this.handleDialogRequest);
	},

	handleClickAdd: function(evt) {
		if (evt.button === 0) { // left mouse click
			evt.preventDefault();
			global.events.emitEvent('dialogRequested', ['add', {}]);
		}
	},

	handleDialogRequest: function(mode, stream) {
		this.setState({
			dialogMode: mode,
			dialogStream: stream
		});
	},

	handleDialogDismiss: function() {
		this.setState({
			dialogMode: null,
			dialogStream: {}
		});
	},

	render: function() {
		var self = this;
		return <div className="accounts padded">
			<h2>Accounts</h2>
			<div className="actionBar">
				<a className="btn" onClick={self.handleClickAdd} href="/accounts/add">
					<i className="fa fa-plus"></i> Add Account
				</a>
			</div>
			<StreamsList/>
			{self.state.dialogMode !== null ? <StreamDialog mode={self.state.dialogMode} stream={self.state.dialogStream} handleDismiss={self.handleDialogDismiss}/> : null}
		</div>;
	}
});

var StreamsList = React.createClass(_.merge({}, EventListenerMixin, {
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
		var self = this,
			streamsByType = _.pairs(_.groupBy(self.state.streams, 'streamType'));
		return <ul className="streams-list">
			{streamsByType.map( function(type) {
				return <StreamsGroup key={type[0]} type={type[0]} streams={type[1]} handleStreamClick={self.props.handleStreamClick}/>;
			})}
		</ul>;
	}
}));

var StreamsGroup = React.createClass({
	render: function() {
		var self = this;
		return <li className="stream-group">
			<h3>{StreamsList.getTypeLabel(self.props.type)}</h3>
			<ul>
				{self.props.streams.map( function(stream) {
					return <StreamsListItem key={stream.id} stream={stream}/>;
				})}
			</ul>
		</li>;
	}
});

var StreamsListItem = React.createClass({
	handleClick: function(evt, mode) {
		if (evt.button === 0) { // left mouse click
			evt.preventDefault();
			global.events.emitEvent('dialogRequested', [mode, this.props.stream]);
		}
	},

	handleEdit: function(evt) {
		this.handleClick(evt, 'edit');
	},

	handleRevise: function(evt) {
		this.handleClick(evt, 'revise');
	},

	handleHistory: function(evt) {
		this.handleClick(evt, 'history');
	},

	render: function() {
		var self = this;
		return <li className="item">
			<a href={'/accounts/edit/' + self.props.stream.id} onClick={self.handleEdit}>
				<div className="streamName">{self.props.stream.name}</div>
				<div className="streamType">{StreamsList.getSubtypeLabel(self.props.stream.streamSubtype)}</div>
			</a>
			<ul className="stream-options">
				<Link to="accounts-edit" onClick={self.handleEdit} params={{streamId: self.props.stream.id}}>
					Edit base data
				</Link>
				<Link to="accounts-revise" onClick={self.handleRevise} params={{streamId: self.props.stream.id}}>
					Add revision
				</Link>
				<Link to="accounts-history" onClick={self.handleHistory} params={{streamId: self.props.stream.id}}>
					View history
				</Link>
			</ul>
		</li>;
	}
});

var AddStream = React.createClass(_.merge({}, EventListenerMixin, {
	getInitialState: function() {
		return {
			mode: 'add',
			params: {},
			stream: {}
		};
	},

	handleSubmit: function() {
		// redirect to accounts
	},

	render: function() {
		/*
		<div className="actionBar">
			<Link className="btn secondary" to="accounts">
				<i className="fa fa-arrow-left"></i> Accounts
			</Link>
		</div>
		*/
		return <div className="accounts-form padded">
			<StreamForm action="add" handleSubmit={this.handleSubmit} stream={this.state.stream}/>
		</div>;
	}
}));

var EditStream = React.createClass(_.merge({}, EventListenerMixin, {
	contextTypes: {
		router: React.PropTypes.func
	},

	getInitialState: function() {
		var params = this.context.router.getCurrentParams();
		return {
			mode: 'edit',
			params: params,
			stream: _.find(dosh.state.streams, {id: params.streamId})
		};
	},

	componentDidMount: function() {
		this.addPropListener('streams', this.handleStreamsUpdate);
	},

	handleStreamsUpdate: function() {
		this.setState({
			stream: _.find(dosh.state.streams, {id: this.state.params.streamId})
		});
	},

	handleSubmit: function() {
		// redirect to accounts
	},

	render: function() {
		return <div className="accounts-form padded">
			{(this.state.stream ? 
				<StreamForm action="edit" handleSubmit={this.handleSubmit} stream={this.state.stream}/>
			: null)}
		</div>;
	}
}));

var AddStreamRevision = React.createClass(_.merge({}, EventListenerMixin, {
	contextTypes: {
		router: React.PropTypes.func
	},

	getInitialState: function() {
		var params = this.context.router.getCurrentParams();
		return {
			mode: 'revise',
			params: params,
			stream: _.find(dosh.state.streams, {id: params.streamId})
		};
	},

	componentDidMount: function() {
		this.addPropListener('streams', this.handleStreamsUpdate);
	},

	handleStreamsUpdate: function() {
		this.setState({
			stream: _.find(dosh.state.streams, {id: this.state.params.streamId})
		});
	},

	handleSubmit: function() {
		// redirect to accounts
	},

	render: function() {
		return <div className="accounts-form padded">
			{(this.state.stream ? 
				<StreamForm action="revise" handleSubmit={this.handleSubmit} stream={this.state.stream}/>
			: null)}
		</div>;
	}
}));

var ViewStreamHistory = React.createClass(_.merge({}, EventListenerMixin, {
	render: function() {
		return <p>History!</p>;
	}
}));

var StreamDialog = React.createClass({
	handleSubmit: function() {
		this.props.handleDismiss();
	},

	render: function() {
		return <div className="dialog">
			<div className="inner">
				<div className="scrollable">
					<StreamForm action={this.props.mode} handleSubmit={this.handleSubmit} stream={this.props.stream}/>
				</div>
				<CloseButton closeAction={this.props.handleDismiss}/>
			</div>
		</div>;
	}
});

var StreamForm = React.createClass({
	mixins: [ReactRouter.Navigation],

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
			if (fieldData.type === 'boolean') {
				return 'checkbox';
			}
			if (fieldData.choices || fieldData.foreignModel !== undefined) {
				return 'select';
			}
			if (fieldData.type === 'varchar') {
				return 'text';
			}
			if (fieldData.type === 'date') {
				return 'date';
			}
			if (fieldData.type === 'int' || fieldData.type === 'numeric') {
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
			if (fieldData.foreignModel !== undefined) {
				var transferStreams = _.filter(currentStreams, function(stream) {
					return _.includes(['deposit-account', 'line-of-credit'], stream.streamType);
				});
				return _.map(transferStreams, function(stream) {
					return [stream.id, stream.name];
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

		getTransferStreams: function(streams) {
			return _.filter(streams, function(stream) {
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
				mode: self.props.action
			},
			streamObj = _.clone(self.state.stream);

		delete streamObj.created;
		delete streamObj.modified;
		delete streamObj.owner;

		data.stream = JSON.stringify(streamObj);

		return $.ajax({
			type: 'POST',
			url: '/api/setStreamData',
			data: data,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			var newStreams;
			if (status === 'success') {
				if (self.props.action === 'add') {
					dosh.store.push('streams', response);
				} else {
					// Replace stream in state
					newStreams = _.cloneDeep(dosh.state.streams);
					newStreams[_.findIndex(newStreams, {id: self.state.stream.id})] = self.state.stream;
					dosh.store.set({streams: newStreams});
					self.transitionTo('accounts');
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
		return <form className="streamForm" onSubmit={self.handleSubmit}>
			<h2>
				{self.props.action === 'add' ? 'Add Account' : null}
				{self.props.action === 'edit' ? 'Edit Account' : null}
				{self.props.action === 'revise' ? 'Add Account Revision' : null}
			</h2>
			{fields.map( function(field) {
				var fieldId = field[0],
					fieldData = field[1],
					fieldValue = self.state.stream[fieldId];
					inputType = StreamForm.getInputType(fieldData),
					helpText = StreamForm.getFieldHelp(fieldId, self.state.stream.streamType),
					label = StreamForm.getFieldLabel(fieldData, self.state.stream.streamType),
					isRequired = !!(fieldData.validation && fieldData.validation.required);

				fieldData.fieldId = fieldId;

				if (fieldData.label === undefined) {
					return null;
				}
				if (fieldData.showFor !== undefined && !_.includes(fieldData.showFor, self.state.stream.streamType)) {
					return null;
				}
				if (self.props.action === 'edit' && fieldId === 'streamSubtype') {
					return null;
				}

				return <StreamField key={fieldId} fieldId={fieldId} value={fieldValue} fieldData={fieldData} inputType={inputType} helpText={helpText} label={label} isRequired={isRequired} handleStreamUpdate={self.handleStreamUpdate} />;
			})}
			<div className="actionBar">
				<Link className="btn secondary" to="accounts">
					Cancel
				</Link>
				{(self.props.action === 'add' ? 
					<button className="btn">
						<i className="fa fa-plus"></i> Add Account
					</button>
				: 
					<button className="btn">
						<i className="fa fa-floppy-o"></i> Save Changes
					</button>
				)}
			</div>
		</form>;
	}

});

var StreamField = React.createClass({
	getInitialState: function() {
		var output = {};
		if (this.props.value === undefined) {
			output.value = (this.props.fieldData.default !== undefined ? this.props.fieldData.default : '');
		} else {
			output.value = this.props.value;
		}
		return output;
	},

	handleChange: function(evt) {
		var self = this,
			value = evt.target.value;

		if (self.props.fieldData.type === 'boolean') {
			value = !!(evt.target.checked);
		}

		this.setState({value: value});

		if (_.includes(['int', 'smallint'], self.props.fieldData.type)) {
			value = parseInt(value, 10);
		} else if (self.props.fieldData.type === 'numeric') {
			value = parseFloat(value);
		}

		this.props.handleStreamUpdate(this.props.fieldId, value);
	},

	render: function() {
		var self = this,
			value = self.state.value,
			streams = dosh.state.streams;

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
						<select id={'newStream-' + self.props.fieldId} value={value} onChange={self.handleChange} required={self.props.isRequired}>
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
