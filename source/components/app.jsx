var App = React.createClass({
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
				streams: response.result
			});
			dosh.state.streams = response.result;
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
		return <div>
			<div className="topBar cf">
				<header>
					<a href="/">
						<h1>DoshCast</h1>
						<small>alpha!</small>
					</a>
				</header>

				<PrimaryNav/>

				<AuthControls handleLogin={this.handleLogin} handleLogout={this.handleLogout} user={this.state.user}/>
			</div>

			{document.location.pathname === '/accounts' ? <AccountsPage streams={this.state.streams} addStream={this.addStream}/> : null}
			{document.location.pathname === '/ledger' ? <LedgerPage streams={this.state.streams}/> : null}
		</div>;
	}
});
