var PrimaryNav = React.createClass({
	render: function() {
		return <nav className="primary-nav">
			<ul className="cf">
				<li className={document.location.pathname === '/dashboard' ? 'active' : ''}>
					<a href="/dashboard">
						<span><i className="fa fa-tasks"></i> Dashboard</span>
					</a>
				</li>
				<li className={document.location.pathname === '/accounts' ? 'active' : ''}>
					<a href="/accounts">
						<span><i className="fa fa-bank"></i> Accounts</span>
					</a>
				</li>
				<li className={document.location.pathname === '/ledger' ? 'active' : ''}>
					<a href="/ledger">
						<span><i className="fa fa-calendar"></i> Ledger</span>
					</a>
				</li>
				<li className={document.location.pathname === '/goals' ? 'active' : ''}>
					<a href="/goals">
						<span><i className="fa fa-rocket"></i> Goals</span>
					</a>
				</li>
				<li className={document.location.pathname === '/projections' ? 'active' : ''}>
					<a href="/projection">
						<span><i className="fa fa-line-chart"></i> Projection</span>
					</a>
				</li>
			</ul>
		</nav>;
	}
});
