PrimaryNav = React.createClass
	render: ->
		<nav className="primary-nav">
			<ul className="cf">
				<li className={if document.location.pathname is '/dashboard' then 'active' else ''}>
					<a href="/dashboard">
						<span><i className="fa fa-tasks"></i> Dashboard</span>
					</a>
				</li>
				<li className={if document.location.pathname is '/accounts' then 'active' else ''}>
					<a href="/accounts">
						<span><i className="fa fa-bank"></i> Accounts</span>
					</a>
				</li>
				<li className={if document.location.pathname is '/ledger' then 'active' else ''}>
					<a href="/ledger">
						<span><i className="fa fa-calendar"></i> Ledger</span>
					</a>
				</li>
				<li className={if document.location.pathname is '/goals' then 'active' else ''}>
					<a href="/goals">
						<span><i className="fa fa-rocket"></i> Goals</span>
					</a>
				</li>
				<li className={if document.location.pathname is '/projections' then 'active' else ''}>
					<a href="/projection">
						<span><i className="fa fa-line-chart"></i> Projection</span>
					</a>
				</li>
			</ul>
		</nav>
