var App = React.createClass({
	getInitialState: function() {
		return {};
	},

	componentDidMount: function() {
		AppActions.updateData();
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
});
