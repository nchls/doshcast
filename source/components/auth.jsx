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
				<input type="password" id="registerPassword2" name="password"/>
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
