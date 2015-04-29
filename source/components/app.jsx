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
		return <div>
			<div className="topBar cf">
				<header>
					<a href="/">
						<h1>DoshCast</h1>
						<small>alpha!</small>
					</a>
				</header>

				<PrimaryNav/>

				<AuthControls/>
			</div>

			{document.location.pathname === '/accounts' ? <AccountsPage/> : null}
			{document.location.pathname === '/ledger' ? <LedgerPage/> : null}
		</div>;
	}
}));
