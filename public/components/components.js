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
		evt.preventDefault();

		var self = this,
			data = {stream: JSON.stringify(dosh.state.newStream)};

		self.props.addStream(dosh.state.newStream);

		return $.ajax({
			type: 'POST',
			url: '/api/createStreamData',
			data: data,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			if (self.isMounted() && self.state.openPanel === 'addStream') {
				self.setState({
					openPanel: null
				});
			}
		});
	},

	handleStreamClick: function(evt, stream) {
		evt.preventDefault();
		return this.setState({
			openPanel: 'editStream',
			editingStream: stream
		});
	},

	handleEditStreamSubmit: function(evt) {
		evt.preventDefault();

		var self = this,
			data = {stream: JSON.stringify(dosh.state.editedStream)};

		self.props.editStream(dosh.state.editedStream);

		return $.ajax({
			type: 'POST',
			url: '/api/editStreamData',
			data: data,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			if (self.isMounted() && self.state.openPanel === 'editStream') {
				self.setState({
					openPanel: null
				});
			}
		});
	},

	render: function() {
		return React.createElement("div", {className: "accounts"}, 
			React.createElement("h2", null, "Accounts"), 
			React.createElement("div", {className: "actionBar"}, 
				this.state.openPanel === null ?
					React.createElement("a", {className: "btn", onClick: this.handleAddStreamClick, href: "/accounts/add"}, 
						React.createElement("i", {className: "fa fa-plus"}), " Add Account"
					)
				: null, 
				_.includes(['addStream', 'editStream'], this.state.openPanel) ?
					React.createElement("a", {className: "btn secondary", onClick: this.handleCloseStreamForm, href: "/accounts"}, 
						React.createElement("i", {className: "fa fa-arrow-left"}), " Accounts"
					)
				: null
			), 
			this.state.openPanel === null ? React.createElement(StreamsList, {streams: this.props.streams, handleStreamClick: this.handleStreamClick}) : null, 
			this.state.openPanel === 'addStream' ? React.createElement(StreamForm, {handleSubmit: this.handleAddStreamSubmit, handleCancel: this.handleCloseStreamForm, stream: {}}) : null, 
			this.state.openPanel === 'editStream' ? React.createElement(StreamForm, {handleSubmit: this.handleEditStreamSubmit, handleCancel: this.handleCloseStreamForm, stream: this.state.editingStream}) : null
		);
	}
});

var StreamsList = React.createClass({displayName: "StreamsList",
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
		var self = this,
			streamsByType = _.pairs(_.groupBy(this.props.streams, 'streamType'));
		return React.createElement("ul", {className: "streams-list"}, 
			streamsByType.map( function(type) {
				return React.createElement(StreamsGroup, {key: type[0], type: type[0], streams: type[1], handleStreamClick: self.props.handleStreamClick})
			})
		);
	}
});

var StreamsGroup = React.createClass({displayName: "StreamsGroup",
	render: function() {
		var self = this;
		return React.createElement("li", {className: "stream-group"}, 
			React.createElement("h3", null, StreamsList.getTypeLabel(self.props.type)), 
			React.createElement("ul", null, 
				self.props.streams.map( function(stream) {
					return React.createElement(StreamsListItem, {key: stream._id, stream: stream, handleStreamClick: self.props.handleStreamClick})
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
				React.createElement("div", {className: "streamType"}, StreamsList.getSubtypeLabel(self.props.stream.streamSubtype))
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
		var updatedState = _.clone(this.state.stream);
		updatedState[fieldId] = value;

		if (fieldId === 'streamSubtype') {
			updatedState['streamType'] = StreamForm.getTypeFromSubtype(value);
		}

		this.setState({stream: updatedState});

		dosh.state.newStream = updatedState;
	},

	render: function() {
		var self = this,
			fields = StreamForm.getStreamFields();
		return React.createElement("form", {className: "streamForm", onSubmit: this.props.handleSubmit}, 
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
						return React.createElement(StreamField, {key: fieldId, fieldId: fieldId, fieldData: fieldData, inputType: inputType, helpText: helpText, label: label, isRequired: isRequired, handleStreamUpdate: self.handleStreamUpdate})
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
			value = self.state.value;

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
							StreamForm.getChoices(self.props.fieldData, dosh.state.streams).map(function(choice) {
								if (self.props.fieldId !== 'streamSubtype') {
									return React.createElement("option", {key: choice[0], value: choice[0]}, choice[1])
								} else {
									return React.createElement("optgroup", {key: choice[0], label: choice[1]}, 
										choice[2].map(function(subtypeChoice) {
											return React.createElement("option", {key: subtypeChoice[0], value: subtypeChoice[0]}, subtypeChoice[1])
										})
									)
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

		)
	}
});

var App = React.createClass({displayName: "App",
	getInitialState: function() {
		return {
			user: window.user,
			streams: [],
			revisions: [],
			manuals: [],
			isBlockingAjaxInProgress: false
		};
	},

	componentDidMount: function() {
		if (this.state.user !== null) {
			this.getData();
		}
	},

	getData: function() {
		var self = this;

		util.namespacer('dosh.state').streams = [];

		return $.getJSON('/api/getData').done(function(response) {
			self.setState({
				streams: response.result.streams,
				manuals: response.result.manuals,
				revisions: response.result.revisions
			});
			dosh.state.streams = response.result.streams;
			dosh.state.manuals = response.result.manuals;
			dosh.state.revisions = response.result.revisions;
		});
	},

	addStream: function(stream) {
		var streamsState = _.clone(this.state.streams);
		streamsState.push(stream);
		dosh.state.streams = streamsState;
		this.setState({
			streams: streamsState,
		});
	},

	handleLogin: function(email) {
		this.setState({user: email});
		this.getData();
	},

	handleLogout: function() {
		this.setState({
			user: null,
			streams: [],
			revisions: [],
			manuals: []
		});
	},

	render: function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "topBar cf"}, 
				React.createElement("header", null, 
					React.createElement("a", {href: "/"}, 
						React.createElement("h1", null, "DoshCast"), 
						React.createElement("small", null, "alpha!")
					)
				), 

				React.createElement(PrimaryNav, null), 

				React.createElement(AuthControls, {handleLogin: this.handleLogin, handleLogout: this.handleLogout, user: this.state.user})
			), 

			document.location.pathname === '/accounts' ? React.createElement(AccountsPage, {streams: this.state.streams, addStream: this.addStream}) : null, 
			document.location.pathname === '/ledger' ? React.createElement(LedgerPage, {streams: this.state.streams}) : null
		);
	}
});

var AuthControls = React.createClass({displayName: "AuthControls",
	getInitialState: function() {
		return {
			openPanel: null
		};
	},

	handleLoginClick: function() {
		this.setState({openPanel: 'login'});
	},

	handleLoginSubmit: function(evt) {
		evt.preventDefault();
		var self = this,
			data = {};
		_.forEach($('.log-in-panel').serializeArray(), function(pair) {
			data[pair.name] = pair.value;
		});
		payload = {user: JSON.stringify(data)};
		$.ajax({
			type: 'POST',
			url: '/api/loginUser',
			data: payload,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			if (self.isMounted()) {
				if (!response.isError) {
					self.handlePanelDismiss();
					self.props.handleLogin(data.email);
				}
			}
		}).fail(function(xhr, errorType, error) {
			if (self.isMounted()) {
				var response = {};
				try {
					response = JSON.parse(xhr.responseText);
				} catch(e) {
					return false;
				}
				// User is already logged in
				if (response.errorCode === 41) {
					self.props.handleLogin(data.email);
				}
			}
		});
	},

	handleRegisterClick: function() {
		this.setState({openPanel: 'register'});
	},

	handleRegisterSubmit: function(evt) {
		evt.preventDefault();
		var self = this,
			data = {}
		_.forEach($('.register-panel').serializeArray(), function(pair) {
			data[pair.name] = pair.value;
		});
		payload = {user: JSON.stringify(data)};
		$.ajax({
			type: 'POST',
			url: '/api/createUser',
			data: payload,
			dataType: 'json'
		}).done(function(response) {
			if (self.isMounted()) {
				if (!response.isError) {
					self.handlePanelDismiss();
					self.props.handleLogin(data.email);
				}
			}
		});
	},

	handleLogoutClick: function() {
		var self = this;
		$.ajax({
			type: 'POST',
			url: '/api/logoutUser',
			dataType: 'json'
		}).done(function(response) {
			if (self.isMounted()) {
				self.props.handleLogout();
			}
		}).fail(function(xhr, errorType, error) {
			if (self.isMounted()) {
				var response = {};
				try {
					response = JSON.parse(xhr.responseText);
				} catch(e) {
					return false;
				}
				// User is already logged out
				if (response.errorCode === 40) {
					self.props.handleLogout();
				}
			}
		});
	},

	handlePanelDismiss: function() {
		this.setState({openPanel: null});
	},

	render: function() {
		if (this.props.user !== null) {
			return React.createElement("div", {className: "auth"}, 
				React.createElement("span", {className: "authed-email"}, this.props.user), 
				React.createElement(LogoutButton, {clickHandler: this.handleLogoutClick})
			)
		}
		return React.createElement("div", {className: "auth"}, 
			React.createElement(LoginButton, {clickHandler: this.handleLoginClick, isPanelOpen: this.state.openPanel === 'login'}), 
			this.state.openPanel === 'login' ? React.createElement(LoginPanel, {submitHandler: this.handleLoginSubmit, dismissHandler: this.handlePanelDismiss}) : null, 
			React.createElement(RegisterButton, {clickHandler: this.handleRegisterClick, isPanelOpen: this.state.openPanel === 'register'}), 
			this.state.openPanel === 'register' ? React.createElement(RegisterPanel, {submitHandler: this.handleRegisterSubmit, dismissHandler: this.handlePanelDismiss}) : null
		)
	}
});

var LoginButton = React.createClass({displayName: "LoginButton",
	render: function() {
		return React.createElement("button", {className: 'log-in btn transparent ' + (this.props.isPanelOpen ? 'active' : ''), onClick: this.props.clickHandler}, 
			React.createElement("i", {className: "fa fa-sign-in"}), " Log In"
		)
	}
});

var LoginPanel = React.createClass({displayName: "LoginPanel",
	getInitialState: function() {
		return {
			clickHandler: null
		};
	},

	componentWillMount: function() {
		var self = this;
		this.state.clickHandler = function(evt) {
			if ($(evt.target).closest('.log-in-panel').length === 0) {
				self.props.dismissHandler();
			}
		};
		window.$document.on('click', this.state.clickHandler);
	},

	componentDidMount: function() {
		$('.log-in-panel input').first().focus();
	},

	componentWillUnmount: function() {
		window.$document.off('click', this.state.clickHandler);
	},

	render: function() {
		return React.createElement("form", {method: "post", className: "panel log-in-panel", onSubmit: this.props.submitHandler}, 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("label", {htmlFor: "loginEmail"}, "E-mail address"), 
				React.createElement("input", {type: "email", id: "loginEmail", name: "email", autoCorrect: "off", autoCapitalize: "off"})
			), 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("label", {htmlFor: "loginPassword"}, 
					"Password"
				), 
				React.createElement("input", {type: "password", id: "loginPassword", name: "password"})
			), 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("label", null, 
					React.createElement("input", {type: "checkbox", name: "loginRemember"}), 
					"Remember me"
				)
			), 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("button", {className: "btn", type: "submit"}, 
					React.createElement("i", {className: "fa fa-sign-in"}), " Log In"
				)
			), 
			React.createElement(CloseButton, {closeAction: this.props.dismissHandler})
		)
	}
});

var RegisterButton = React.createClass({displayName: "RegisterButton",
	render: function() {
		return React.createElement("button", {className: 'register btn transparent ' + (this.props.isPanelOpen ? 'active' : ''), onClick: this.props.clickHandler}, 
			React.createElement("i", {className: "fa fa-user"}), " Register"
		)
	}
});

var RegisterPanel = React.createClass({displayName: "RegisterPanel",
	getInitialState: function() {
		return {
			clickHandler: null
		};
	},

	componentWillMount: function() {
		var self = this;
		this.state.clickHandler = function(evt) {
			if ($(evt.target).closest('.register-panel').length === 0) {
				self.props.dismissHandler();
			}
		};
		window.$document.on('click', this.state.clickHandler);
	},

	componentDidMount: function() {
		$('.register-panel input').first().focus();
	},

	componentWillUnmount: function() {
		window.$document.off('click', this.state.clickHandler);
	},

	render: function() {
		return React.createElement("form", {method: "post", className: "panel register-panel", onSubmit: this.props.submitHandler}, 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("label", {htmlFor: "registerEmail"}, "E-mail address"), 
				React.createElement("input", {type: "email", id: "registerEmail", name: "email", autoCorrect: "off", autoCapitalize: "off"})
			), 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("label", {htmlFor: "registerPassword"}, 
					"Password"
				), 
				React.createElement("input", {type: "password", id: "registerPassword", name: "password"})
			), 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("label", {htmlFor: "registerPassword2"}, 
					"Password (again)"
				), 
				React.createElement("input", {type: "password", id: "registerPassword2"})
			), 
			React.createElement("div", {className: "formRow"}, 
				React.createElement("button", {className: "btn", type: "submit"}, 
					React.createElement("i", {className: "fa fa-user"}), " Register"
				)
			), 
			React.createElement(CloseButton, {closeAction: this.props.dismissHandler})
		)
	}
});

var LogoutButton = React.createClass({displayName: "LogoutButton",
	render: function() {
		return React.createElement("button", {className: 'log-out btn transparent', onClick: this.props.clickHandler}, 
			React.createElement("i", {className: "fa fa-sign-out"}), " Log Out"
		)
	}
});

var LedgerPage = React.createClass({displayName: "LedgerPage",
	getInitialState: function() {
		return {};
	},
	render: function() {
		return React.createElement("div", {className: "ledger"}, 
			React.createElement("h2", null, "Ledger"), 
			React.createElement("div", {className: "actionBar"}

			), 
			React.createElement(Ledger, {streams: this.props.streams})
		)
	}
});

var Ledger = React.createClass({displayName: "Ledger",
	getInitialState: function() {
		return {
			ledger: [],
			manuals: [],
			revisions: [],
			streams: [],
			subStreams: []
		};
	},

	componentWillReceiveProps: function(nextProps) {
		this.setLedgerData(nextProps);
	},

	setLedgerData: function(props) {
		var ledgerData = dosh.services.ledger.getLedgerData({ streams: props.streams }),
			subStreams;

		perf.start('FORMATTING');
		ledgerData.ledger = this.formatLedgerTable(ledgerData.ledger);
		subStreams = this.prepLedgerHeader(ledgerData.streams);
		perf.end('FORMATTING');

		this.setState({
			ledger: ledgerData.ledger,
			manuals: ledgerData.manuals,
			revisions: ledgerData.revisions,
			streams: ledgerData.streams,
			subStreams: subStreams
		});
	},

	formatLedgerTable: function(ledger) {
		perf.start('formatLedgerTable');

		var row,
			subColumns = [
				['payment', 'Payment'],
				['spending', 'Spending'],
				['balance', 'Balance'],
				['carriedBalance', 'Carried Balance'],
				['interest', 'Interest'],
				['accruedInterest', 'Accrued Interest'],
			];

		_.forEach(ledger, function(dayEntry, index) {
			ledger[index].printDate = dayEntry.moment.format('MMM D');
			ledger[index].fullDate = dayEntry.moment.format('dddd, MMMM Do, YYYY');
			row = [];
			_.forEach(dayEntry.streams, function(streamEntry) {
				_.forEach(subColumns, function(subCol) {
					if (streamEntry.hasOwnProperty(subCol[0])) {
						row.push({
							val: streamEntry[subCol[0]]
						});
					}
				});
			});
			ledger[index].row = row;
		});

		perf.end('formatLedgerTable');
		return ledger;
	},

	prepLedgerHeader: function(streams) {
		perf.start('prepLedgerHeader');

		var subStreams = [],
			columnLabels;
		_.forEach(streams, function(stream) {
			if (stream.columns.length > 1) {
				columnLabels = _.pluck(stream.columns, 1);
				subStreams = subStreams.concat(columnLabels);
			}
		});

		perf.end('prepLedgerHeader');
		return subStreams;
	},

	render: function() {
		if (this.state.streams.length === 0) {
			return null;
		}
		return React.createElement("table", null, 
			React.createElement("thead", null, 
				React.createElement("tr", null, 
					React.createElement("th", {className: "date", rowSpan: "2"}, "Date"), 
					this.state.streams.map(function(stream) {
						return React.createElement("th", {className: "stream", key: stream._id, colSpan: stream.columns.length, rowSpan: (stream.columns.length === 1 ? 2 : 1)}, 
							stream.name
						)
					})
				), 
				React.createElement("tr", null, 
					this.state.subStreams.map(function(subStream, index) {
						return React.createElement("th", {className: "subStream", key: index}, subStream)
					})
				)
			), 
			React.createElement("tbody", null, 
				this.state.ledger.map(function(entry) {
					return React.createElement("tr", {key: entry.ymd}, 
						React.createElement("td", {className: "date", title: entry.fullDate}, 
							entry.printDate
						), 
						entry.row.map(function(column, index) {
							return React.createElement("td", {className: "stream", key: index}, 
								column.val
							)
						})
					)
				})
			)
		)
	}
});

/*
			<table id="ledger-table">
				<thead>
				</thead>
				<tbody>
					<tr
						ng-repeat="(date, entry) in ledger track by $index"
						data-date="{{ date }}"
					>
						<td
							class="date"
							title="{{ entry.fullDate }}"
						>
							{{ entry.printDate }}
						</td>
						<td
							class="stream"
							ng-repeat="column in entry.row track by $index"
						>
							{{ column.val }}
						</td>
					</tr>
				</tbody>
			</table>
 */
var PrimaryNav = React.createClass({displayName: "PrimaryNav",
	render: function() {
		return React.createElement("nav", {className: "primary-nav"}, 
			React.createElement("ul", {className: "cf"}, 
				React.createElement("li", {className: document.location.pathname === '/dashboard' ? 'active' : ''}, 
					React.createElement("a", {href: "/dashboard"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-tasks"}), " Dashboard")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/accounts' ? 'active' : ''}, 
					React.createElement("a", {href: "/accounts"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-bank"}), " Accounts")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/ledger' ? 'active' : ''}, 
					React.createElement("a", {href: "/ledger"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-calendar"}), " Ledger")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/goals' ? 'active' : ''}, 
					React.createElement("a", {href: "/goals"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-rocket"}), " Goals")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/projections' ? 'active' : ''}, 
					React.createElement("a", {href: "/projection"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-line-chart"}), " Projection")
					)
				)
			)
		)
	}
});

var CloseButton = React.createClass({displayName: "CloseButton",
	handleClick: function(evt) {
		evt.preventDefault();
		this.props.closeAction();
	},

	render: function() {
		return React.createElement("button", {className: "close", onClick: this.handleClick}, 
			React.createElement("i", {className: "fa fa-times"})
		)
	}
});

var LoadingMask = React.createClass({displayName: "LoadingMask",
	render: function() {
		return React.createElement("div", {className: "loading-mask"}, 
			React.createElement("div", {className: "center-icon"}, 
				React.createElement("i", {className: "fa fa-circle-o-notch fa-spin"})
			)
		)
	}
});