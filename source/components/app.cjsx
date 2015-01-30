App = React.createClass
	getInitialData: ->
		isBlockingAjaxInProgress: false

	render: ->
		<div>
			<div className="topBar cf">
				<header>
					<a href="/">
						<h1>DoshCast</h1>
					</a>
				</header>

				<PrimaryNav/>

				<AuthControls/>
			</div>

			{ if document.location.pathname is '/accounts'
				<AccountsPage/>
			}
			{ if document.location.pathname is '/ledger'
				<LedgerPage/>
			}
		</div>
