var AuthControls = React.createClass(_.merge({}, EventListenerMixin, {
	getInitialState: function() {
		return {
			user: dosh.state.user,
			openPanel: null
		};
	},

	componentWillMount: function() {
		this.addPropListener('user', this.handleDataUpdate);
	},

	handleDataUpdate: function() {
		this.setState({
			user: dosh.state.user
		});
	},

	handleLoginClick: function() {
		this.setState({
			openPanel: 'login'
		});
	},

	handleLoginSubmit: function(evt) {
		evt.preventDefault();
		var self = this,
			data = {};

		_.forEach($('.log-in-panel').serializeArray(), function(pair) {
			data[pair.name] = pair.value;
		});

		payload = {
			user: JSON.stringify(data)
		};

		$.ajax({
			type: 'POST',
			url: '/api/loginUser',
			data: payload,
			dataType: 'json'
		}).done(function(response, status, xhr) {
			if (self.isMounted()) {
				if (!response.isError) {
					self.handlePanelDismiss();
					dosh.store.set({
						user: data.email
					});
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
					dosh.store.set({
						user: data.email
					});
				}
			}
		});
	},

	handleRegisterClick: function() {
		this.setState({
			openPanel: 'register'
		});
	},

	handleRegisterSubmit: function(evt) {
		evt.preventDefault();
		var self = this,
			data = {};
		_.forEach($('.register-panel').serializeArray(), function(pair) {
			data[pair.name] = pair.value;
		});
		payload = {
			user: JSON.stringify(data)
		};
		$.ajax({
			type: 'POST',
			url: '/api/createUser',
			data: payload,
			dataType: 'json'
		}).done(function(response) {
			if (self.isMounted()) {
				if (!response.isError) {
					self.handlePanelDismiss();
					dosh.store.set({
						user: data.email
					});
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
				dosh.store.set({
					user: null
				});
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
					dosh.store.set({
						user: null
					});
				}
			}
		});
	},

	handlePanelDismiss: function() {
		this.setState({
			openPanel: null
		});
	},

	render: function() {
		if (this.state.user !== null) {
			return React.createElement("div", {className: "auth"}, 
				React.createElement("span", {className: "authed-email"}, this.state.user), 
				React.createElement(LogoutButton, {clickHandler: this.handleLogoutClick})
			);
		}
		return React.createElement("div", {className: "auth"}, 
			React.createElement(LoginButton, {clickHandler: this.handleLoginClick, isPanelOpen: this.state.openPanel === 'login'}), 
			this.state.openPanel === 'login' ? React.createElement(LoginPanel, {submitHandler: this.handleLoginSubmit, handleDismiss: this.handlePanelDismiss}) : null, 
			React.createElement(RegisterButton, {clickHandler: this.handleRegisterClick, isPanelOpen: this.state.openPanel === 'register'}), 
			this.state.openPanel === 'register' ? React.createElement(RegisterPanel, {submitHandler: this.handleRegisterSubmit, handleDismiss: this.handlePanelDismiss}) : null
		);
	}
}));

var LoginButton = React.createClass({displayName: "LoginButton",
	render: function() {
		return React.createElement("button", {className: 'log-in btn transparent ' + (this.props.isPanelOpen ? 'active' : ''), onClick: this.props.clickHandler}, 
			React.createElement("i", {className: "fa fa-sign-in"}), " Log In"
		);
	}
});

var LoginPanel = React.createClass({displayName: "LoginPanel",
	getInitialState: function() {
		return {};
	},

	componentWillMount: function() {
		var self = this;
		self.clickHandler = function(evt) {
			if ($(evt.target).closest('.log-in-panel').length === 0) {
				self.props.handleDismiss();
			}
		};
		window.$document.on('click', self.clickHandler);
	},

	componentDidMount: function() {
		$('.log-in-panel input').first().focus();
	},

	componentWillUnmount: function() {
		window.$document.off('click', this.clickHandler);
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
			React.createElement(CloseButton, {closeAction: this.props.handleDismiss})
		);
	}
});

var RegisterButton = React.createClass({displayName: "RegisterButton",
	render: function() {
		return React.createElement("button", {className: 'register btn transparent ' + (this.props.isPanelOpen ? 'active' : ''), onClick: this.props.clickHandler}, 
			React.createElement("i", {className: "fa fa-user"}), " Register"
		);
	}
});

var RegisterPanel = React.createClass({displayName: "RegisterPanel",
	getInitialState: function() {
		return {};
	},

	componentWillMount: function() {
		var self = this;
		self.clickHandler = function(evt) {
			if ($(evt.target).closest('.register-panel').length === 0) {
				self.props.handleDismiss();
			}
		};
		window.$document.on('click', self.clickHandler);
	},

	componentDidMount: function() {
		$('.register-panel input').first().focus();
	},

	componentWillUnmount: function() {
		window.$document.off('click', this.clickHandler);
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
			React.createElement(CloseButton, {closeAction: this.props.handleDismiss})
		);
	}
});

var LogoutButton = React.createClass({displayName: "LogoutButton",
	render: function() {
		return React.createElement("button", {className: 'log-out btn transparent', onClick: this.props.clickHandler}, 
			React.createElement("i", {className: "fa fa-sign-out"}), " Log Out"
		);
	}
});
