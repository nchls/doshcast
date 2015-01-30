AuthControls = React.createClass
	getInitialState: ->
		return {
			openPanel: null
		}

	handleLoginClick: ->
		this.setState({openPanel: 'login'})

	handleLoginSubmit: (evt) ->
		evt.preventDefault()
		self = this
		data = {}
		_.forEach($('.log-in-panel').serializeArray(), (pair) ->
			data[pair.name] = pair.value
		)
		data = {user: JSON.stringify(data)}
		$.ajax(
			url: '/api/loginUser'
			data: data
			dataType: 'json'
		).done( (response) ->
			if self.isMounted()
				if not response.isError
					self.handlePanelDismiss()
		)

	handleRegisterClick: ->
		this.setState({openPanel: 'register'})

	handleRegisterSubmit: (evt) ->
		evt.preventDefault()

	handlePanelDismiss: ->
		this.setState({openPanel: null})

	render: ->
		<div className="auth">
			<LoginButton clickHandler={this.handleLoginClick} isPanelOpen={this.state.openPanel is 'login'}/>
			{if this.state.openPanel is 'login'
				<LoginPanel submitHandler={this.handleLoginSubmit} dismissHandler={this.handlePanelDismiss}/>
			}
			<RegisterButton clickHandler={this.handleRegisterClick} isPanelOpen={this.state.openPanel is 'register'}/>
			{if this.state.openPanel is 'register'
				<RegisterPanel submitHandler={this.handleRegisterSubmit} dismissHandler={this.handlePanelDismiss}/>
			}
		</div>

LoginButton = React.createClass
	render: ->
		<button className={'log-in btn transparent ' + (if this.props.isPanelOpen then 'active' else '')} onClick={this.props.clickHandler}>
			<i className="fa fa-sign-in"></i> Log In
		</button>

LoginPanel = React.createClass
	getInitialState: ->
		clickHandler: null

	componentWillMount: ->
		self = this
		this.state.clickHandler = (evt) ->
			if $(evt.target).closest('.log-in-panel').length is 0
				self.props.dismissHandler()
		window.$document.on('click', this.state.clickHandler)

	componentDidMount: ->
		$('.log-in-panel input').first().focus()

	componentWillUnmount: ->
		window.$document.off('click', this.state.clickHandler)

	render: ->
		<form method="post" className="panel log-in-panel" onSubmit={this.props.submitHandler}>
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

RegisterButton = React.createClass
	render: ->
		<button className={'register btn transparent ' + (if this.props.isPanelOpen then 'active' else '')} onClick={this.props.clickHandler}>
			<i className="fa fa-user"></i> Register
		</button>

RegisterPanel = React.createClass
	getInitialState: ->
		clickHandler: null

	componentWillMount: ->
		self = this
		this.state.clickHandler = (evt) ->
			if $(evt.target).closest('.register-panel').length is 0
				self.props.dismissHandler()
		window.$document.on('click', this.state.clickHandler)

	componentDidMount: ->
		$('.register-panel input').first().focus()

	componentWillUnmount: ->
		window.$document.off('click', this.state.clickHandler)

	render: ->
		<form method="post" className="panel register-panel" onSubmit={this.props.submitHandler}>
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



"""
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
"""
