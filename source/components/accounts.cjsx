AccountsPage = React.createClass
	getInitialState: ->
		return {
			accounts: []
		}

	componentDidMount: ->
		self = this
		qwest.get('/api/getData').then( (response) ->
			if self.isMounted()
				response = JSON.parse(response)
				self.setState(
					accounts: response.result
				)
		)

	render: ->
		<div>
			<h2>Accounts</h2>
			<AccountsList accounts={this.state.accounts}/>
		</div>

AccountsList = React.createClass
	getInitialState: ->
		null

	render: ->
		<ul>
			{this.props.accounts.map( (account) ->
				<li key={account._id}>{account.name}</li>
			)}
		</ul>

