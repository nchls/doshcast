var AuthControls = React.createClass({
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
			return <div className="auth">
				<span className="authed-email">{this.props.user}</span>
				<LogoutButton clickHandler={this.handleLogoutClick}/>
			</div>
		}
		return <div className="auth">
			<LoginButton clickHandler={this.handleLoginClick} isPanelOpen={this.state.openPanel === 'login'}/>
			{this.state.openPanel === 'login' ? <LoginPanel submitHandler={this.handleLoginSubmit} dismissHandler={this.handlePanelDismiss}/> : null}
			<RegisterButton clickHandler={this.handleRegisterClick} isPanelOpen={this.state.openPanel === 'register'}/>
			{this.state.openPanel === 'register' ? <RegisterPanel submitHandler={this.handleRegisterSubmit} dismissHandler={this.handlePanelDismiss}/> : null}
		</div>
	}
});

var LoginButton = React.createClass({
	render: function() {
		return <button className={'log-in btn transparent ' + (this.props.isPanelOpen ? 'active' : '')} onClick={this.props.clickHandler}>
			<i className="fa fa-sign-in"></i> Log In
		</button>
	}
});

var LoginPanel = React.createClass({
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
		return <form method="post" className="panel log-in-panel" onSubmit={this.props.submitHandler}>
			<div className="formRow">
				<label htmlFor="loginEmail">E-mail address</label>
				<input type="email" id="loginEmail" name="email" autoCorrect="off" autoCapitalize="off"/>
			</div>
			<div className="formRow">
				<label htmlFor="loginPassword">
					Password
				</label>
				<input type="password" id="loginPassword" name="password"/>
			</div>
			<div className="formRow">
				<label>
					<input type="checkbox" name="loginRemember"/>
					Remember me
				</label>
			</div>
			<div className="formRow">
				<button className="btn" type="submit">
					<i className="fa fa-sign-in"></i> Log In
				</button>
			</div>
			<CloseButton closeAction={this.props.dismissHandler}/>
		</form>
	}
});

var RegisterButton = React.createClass({
	render: function() {
		return <button className={'register btn transparent ' + (this.props.isPanelOpen ? 'active' : '')} onClick={this.props.clickHandler}>
			<i className="fa fa-user"></i> Register
		</button>
	}
});

var RegisterPanel = React.createClass({
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
		return <form method="post" className="panel register-panel" onSubmit={this.props.submitHandler}>
			<div className="formRow">
				<label htmlFor="registerEmail">E-mail address</label>
				<input type="email" id="registerEmail" name="email" autoCorrect="off" autoCapitalize="off"/>
			</div>
			<div className="formRow">
				<label htmlFor="registerPassword">
					Password
				</label>
				<input type="password" id="registerPassword" name="password"/>
			</div>
			<div className="formRow">
				<label htmlFor="registerPassword2">
					Password (again)
				</label>
				<input type="password" id="registerPassword2"/>
			</div>
			<div className="formRow">
				<button className="btn" type="submit">
					<i className="fa fa-user"></i> Register
				</button>
			</div>
			<CloseButton closeAction={this.props.dismissHandler}/>
		</form>
	}
});

var LogoutButton = React.createClass({
	render: function() {
		return <button className={'log-out btn transparent'} onClick={this.props.clickHandler}>
			<i className="fa fa-sign-out"></i> Log Out
		</button>
	}
});
