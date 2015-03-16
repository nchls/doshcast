var App = React.createClass({
	getInitialData: function() {
		return {
			isBlockingAjaxInProgress: false
		};
	},

	render: function() {
		return <div>
			<div className="topBar cf">
				<header>
					<a href="/">
						<h1>DoshCast</h1>
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
