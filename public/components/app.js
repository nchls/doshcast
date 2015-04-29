var App = React.createClass(_.merge(EventListenerMixin, {
	getInitialState: function() {
		return {};
	},

	componentWillMount: function() {
		this.addPropListener('user', this.handleUserUpdate);

		dosh.store.set({
			'streams': [],
			'revisions': [],
			'manuals': [],
			'user': window.user
		});
	},

	handleUserUpdate: function() {
		if (dosh.state.user !== null) {
			return $.getJSON('/api/getData').done(function(response) {
				dosh.store.set({
					'streams': response.result.streams,
					'revisions': response.result.revisions,
					'manuals': response.result.manuals
				});
			});
		} else {
			dosh.store.set({
				'streams': [],
				'revisions': [],
				'manuals': []
			});
		}
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

				React.createElement(AuthControls, null)
			), 

			document.location.pathname === '/accounts' ? React.createElement(AccountsPage, null) : null, 
			document.location.pathname === '/ledger' ? React.createElement(LedgerPage, null) : null
		);
	}
}));
