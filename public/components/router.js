var Router = ReactRouter,

	DefaultRoute = Router.DefaultRoute,
	Link = Router.Link,
	Route = Router.Route,
	RouteHandler = Router.RouteHandler,

	routes = (
		React.createElement(Route, {name: "app", path: "/", handler: App}, 
			React.createElement(Route, {name: "dashboard", handler: DashboardPage}), 
			React.createElement(Route, {name: "accounts", handler: AccountsPage}), 
			React.createElement(Route, {name: "ledger", handler: LedgerPage}), 
			React.createElement(DefaultRoute, {handler: DashboardPage})
		)
	);

Router.run(routes, Router.HistoryLocation, function(Handler) {
	React.render(React.createElement(Handler, null), document.getElementById('app'));
});
