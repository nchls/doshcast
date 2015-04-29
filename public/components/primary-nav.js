var PrimaryNav = React.createClass({displayName: "PrimaryNav",
	render: function() {
		return React.createElement("nav", {className: "primary-nav"}, 
			React.createElement("ul", {className: "cf"}, 
				React.createElement("li", {className: document.location.pathname === '/dashboard' ? 'active' : ''}, 
					React.createElement("a", {href: "/dashboard"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-tasks"}), " Dashboard")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/accounts' ? 'active' : ''}, 
					React.createElement("a", {href: "/accounts"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-bank"}), " Accounts")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/ledger' ? 'active' : ''}, 
					React.createElement("a", {href: "/ledger"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-calendar"}), " Ledger")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/goals' ? 'active' : ''}, 
					React.createElement("a", {href: "/goals"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-rocket"}), " Goals")
					)
				), 
				React.createElement("li", {className: document.location.pathname === '/projections' ? 'active' : ''}, 
					React.createElement("a", {href: "/projection"}, 
						React.createElement("span", null, React.createElement("i", {className: "fa fa-line-chart"}), " Projection")
					)
				)
			)
		);
	}
});
