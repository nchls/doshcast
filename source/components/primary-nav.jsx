var PrimaryNav = React.createClass({
	render: function() {
		return <nav className="primary-nav">
			<ul className="cf">
				<li className={document.location.pathname === '/dashboard' ? 'active' : ''}>
					<Link to="dashboard">
						<span><i className="fa fa-tasks"></i> Dashboard</span>
					</Link>
				</li>
				<li className={document.location.pathname === '/accounts' ? 'active' : ''}>
					<Link to="accounts">
						<span><i className="fa fa-bank"></i> Accounts</span>
					</Link>
				</li>
				<li className={document.location.pathname === '/ledger' ? 'active' : ''}>
					<Link to="ledger">
						<span><i className="fa fa-calendar"></i> Ledger</span>
					</Link>
				</li>
				<li className={document.location.pathname === '/goals' ? 'active' : ''}>
					<Link to="goals">
						<span><i className="fa fa-rocket"></i> Goals</span>
					</Link>
				</li>
				<li className={document.location.pathname === '/projections' ? 'active' : ''}>
					<Link to="projection">
						<span><i className="fa fa-line-chart"></i> Projection</span>
					</Link>
				</li>
			</ul>
		</nav>;
	}
});
