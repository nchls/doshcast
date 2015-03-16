var AccountsPage = React.createClass({displayName: "AccountsPage",
	getInitialState: function() {
		return {
			streams: []
		};
	},

	componentDidMount: function() {
		var self = this;

		util.namespacer('dosh.state').streams = [];

		return $.getJSON('/api/getData').done(function(response) {
			if (self.isMounted()) {
				self.setState({
					streams: response.result
				});
				dosh.state.streams = response.result;
			}
		});
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

		return $.getJSON('/api/createStream', data).done(function(response) {
			var streamsState = _.clone(self.state.streams);
			streamsState.push(dosh.state.newStream);
			dosh.state.streams = streamsState;
			if (self.isMounted()) {
				self.setState({
					streams: streamsState,
					addStreamOpen: false
				});
			}
		});

	},

	render: function() {
		return React.createElement("div", {className: "accounts"}, 
			React.createElement("h2", null, "Accounts"), 
			React.createElement("div", {className: "actionBar"}, 
				(this.state.addStreamOpen ?
					React.createElement("button", {className: "btn secondary", onClick: this.handleCloseAddStreamClick}, 
						React.createElement("i", {className: "fa fa-arrow-left"}), " Accounts"
					)
				:
					React.createElement("button", {className: "btn", onClick: this.handleAddStreamClick}, 
						React.createElement("i", {className: "fa fa-plus"}), " Add Account"
					)
				)
			), 
			this.state.addStreamOpen ? null : React.createElement(StreamsList, {streams: this.state.streams}), 
			this.state.addStreamOpen ? React.createElement(AddStream, {handleSubmit: this.handleAddStreamSubmit, handleCancel: this.handleCloseAddStreamClick, fields: []}) : null
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
		var streamsByType = _.pairs(_.groupBy(this.props.streams, 'streamType'));
		return React.createElement("ul", {className: "streams-list"}, 
			streamsByType.map( function(type) {
				return React.createElement(StreamsGroup, {key: type[0], type: type[0], streams: type[1]})
			})
		);
	}
});

var StreamsGroup = React.createClass({displayName: "StreamsGroup",
	render: function() {
		return React.createElement("li", {className: "stream-group"}, 
			React.createElement("h3", null, StreamsList.getTypeLabel(this.props.type)), 
			React.createElement("ul", null, 
				this.props.streams.map( function(stream) {
					return React.createElement(StreamsListItem, {key: stream._id, id: stream._id, name: stream.name, subtype: stream.streamSubtype})
				})
			)
		);
	}
});

var StreamsListItem = React.createClass({displayName: "StreamsListItem",
	render: function() {
		return React.createElement("li", {className: "item"}, 
			React.createElement("div", {className: "streamName"}, this.props.name), 
			React.createElement("div", {className: "streamType"}, StreamsList.getSubtypeLabel(this.props.subtype))
		);
	}
});

var AddStream = React.createClass({displayName: "AddStream",
	getInitialState: function() {
		return {
			newStream: {}
		};
	},

	statics: {
		getStreamFields: function() {
			return _.pairs(dosh.models.Stream.prototype.schema);
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
		return React.createElement("form", {className: "addStreamForm", onSubmit: this.props.handleSubmit}, 
			fields.map( function(field) {
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
						return React.createElement(AddStreamField, {key: fieldId, fieldId: fieldId, fieldData: fieldData, inputType: inputType, helpText: helpText, label: label, isRequired: isRequired, handleStreamUpdate: self.handleStreamUpdate})
					}
				}
			}), 
			React.createElement("div", {className: "actionBar"}, 
				React.createElement("button", {className: "btn secondary", onClick: this.props.handleCancel}, 
					"Cancel"
				), 
				React.createElement("button", {className: "btn"}, 
					React.createElement("i", {className: "fa fa-plus"}), " Add Account"
				)
			)
		);
	}

});

var AddStreamField = React.createClass({displayName: "AddStreamField",
	getInitialState: function() {
		return {
			value: ''
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
						React.createElement("input", {type: self.props.inputType, id: 'newStream-' + self.props.fieldId, value: value, onChange: self.handleChange, required: self.props.isRequired})
					:
						React.createElement("select", {id: 'newStream-' + self.props.fieldId, onChange: self.handleChange, required: self.props.isRequired}, 
							React.createElement("option", {value: ""}, "--- Choose ", self.props.fieldData.label.toLowerCase(), " ---"), 
							AddStream.getChoices(self.props.fieldData, dosh.state.streams).map(function(choice) {
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
				React.createElement("p", {className: "helpText aside"}, 
					this.props.helpText
				)
			: null

		)
	}
});

/*
					<select
						ng-if="field.input.type === 'select' && field.key !== 'stream_subtype'"
						id="newStream-{{ field.jsName }}"
						ng-model="newStream[field.jsName]"
						ng-options="{{ getSelectOptions(field.key) }}"
						ng-required="field.validation.required"
					>
						<option value="">--- Choose {{ field.label | lowercase }} ---</option>
					</select>

					<select
						ng-if="field.key === 'stream_subtype'"
						id="newStream-{{ field.jsName }}"
						ng-model="newStream[field.jsName]"
						ng-options="type.subName group by type.typeName for type in streamTypes"
						ng-required="field.validation.required"
						ng-change="setNewStream(newStream.type, newStream.name)"
					>
						<option value="">--- Choose {{ field.label | lowercase }} ---</option>
					</select>

				</div>

				<p
					ng-if="field.helpText"
					class="helpText aside"
				>
					{{ getStreamHelp(field.key, newStream.type.typeKey) }}
				</p>

			</div>

			<div class="actionBar">
				<button
					class="btn secondary"
					ng-click="closeAddStream()"
				>
					Cancel
				</button>

				<button
					class="btn"
				>
					<i class="fa fa-plus"></i> Add Account
				</button>
			</div>

		</form>
 */
var App = React.createClass({displayName: "App",
	getInitialData: function() {
		return {
			isBlockingAjaxInProgress: false
		};
	},

	render: function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "topBar cf"}, 
				React.createElement("header", null, 
					React.createElement("a", {href: "/"}, 
						React.createElement("h1", null, "DoshCast")
					)
				), 

				React.createElement(PrimaryNav, null), 

				React.createElement(AuthControls, null)
			), 

			document.location.pathname === '/accounts' ? React.createElement(AccountsPage, null) : null, 
			document.location.pathname === '/ledger' ? React.createElement(LedgerPage, null) : null
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
			data = {}
		_.forEach($('.log-in-panel').serializeArray(), function(pair) {
			data[pair.name] = pair.value;
		});
		data = {user: JSON.stringify(data)};
		$.ajax({
			url: '/api/loginUser',
			data: data,
			dataType: 'json'
		}).done(function(response) {
			if (self.isMounted()) {
				if (!response.isError) {
					self.handlePanelDismiss();
				}
			}
		});
	},

	handleRegisterClick: function() {
		this.setState({openPanel: 'register'});
	},

	handleRegisterSubmit: function(evt) {
		evt.preventDefault();
	},

	handlePanelDismiss: function() {
		this.setState({openPanel: null});
	},

	render: function() {
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
				React.createElement("input", {type: "password", id: "registerPassword2", name: "password"})
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



/*
<div
	class="auth"
	ng-cloak
	ng-controller="AuthController"
>

	<button
		class="log-in btn"
		ng-click="handleLoginClick()"
		ng-if="!user.isLoggedIn"
	>
		<i class="fa fa-sign-in"></i> Log In
	</button>
	<form
		method="post"
		data-url="{% url 'api' version="1" method="loginUser" %}"
		class="panel log-in-panel"
		ng-if="loginPanelOpen && !user.isLoggedIn"
		ng-submit="handleLoginSubmit()"
	>
		<div class="formRow">
			<label for="loginUsername">
				Username
			</label>
			<input type="text" id="loginUsername" name="username" autoCorrect="off" autoCapitalize="off">
		</div>
		<div class="formRow">
			<label for="loginPassword">
				Password
			</label>
			<input type="password" id="loginPassword" name="password">
		</div>
		<div class="formRow">
			<label>
				<input type="checkbox" name="loginRemember">
				Remember me
			</label>
		</div>
		<div class="formRow">
			<button
				class="btn"
				type="submit"
			>
				<i class="fa fa-sign-in"></i> Log In
			</button>
		</div>
	</form>

	<button
		class="sign-up btn"
		ng-click="handleSignupClick()"
		ng-if="!user.isLoggedIn"
	>
		<i class="fa fa-user"></i> Sign Up
	</button>
	<form
		method="post"
		data-url="{% url 'api' version="1" method="createUser" %}"
		class="panel sign-up-panel"
		ng-if="signupPanelOpen && !user.isLoggedIn"
		ng-submit="handleSignupSubmit()"
	>
		<div class="formRow">
			<label for="signupUsername">
				Username
			</label>
			<input type="text" id="signupUsername" name="username" autoComplete="off" autoCorrect="off" autoCapitalize="off">
		</div>
		<div class="formRow">
			<label for="signupEmail">
				E-mail Address
			</label>
			<input type="email" id="signupEmail" name="email" autoComplete="off">
		</div>
		<div class="formRow">
			<label for="signupPassword">
				Password
			</label>
			<input type="password" id="signupPassword" name="password" autoComplete="off">
		</div>
		<div class="formRow">
			<label for="signupRePassword">
				Password (again)
			</label>
			<input type="password" id="signupRePassword" name="" autoComplete="off">
		</div>
		<div class="formRow">
			<button
				class="btn"
				type="submit"
			>
				<i class="fa fa-user"></i> Sign Up
			</button>
		</div>
	</form>

	<form
		data-url="{% url 'api' version="1" method="logoutUser" %}"
		class="log-out"
		ng-if="user.isLoggedIn"
	>
		<p class="loggedInAs">
			You are logged in as {% verbatim %}{{ user.username }}{% endverbatim %}.
		</p>
		<button
			class="btn"
			ng-click="handleLogoutClick()"
		>
			<i class="fa fa-sign-out fa-flip-horizontal"></i> Log Out
		</button>
	</form>

</div>
*/

var LedgerPage = React.createClass({displayName: "LedgerPage",
	render: function() {
		React.createElement("p", null, "Hello world. I am the ledger.")
	}
});


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
			React.createElement("div", {class: "center-icon"}, 
				React.createElement("i", {className: "fa fa-circle-o-notch fa-spin"})
			)
		)
	}
});