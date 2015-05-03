var Router = ReactRouter,

	DefaultRoute = Router.DefaultRoute,
	Link = Router.Link,
	Route = Router.Route,
	RouteHandler = Router.RouteHandler,

	routes = (
		<Route name="app" path="/" handler={App}>
			<Route name="dashboard" handler={DashboardPage}/>
			<Route name="accounts" handler={AccountsPage}/>
			<Route name="ledger" handler={LedgerPage}/>
			<DefaultRoute handler={DashboardPage}/>
		</Route>
	);

Router.run(routes, Router.HistoryLocation, function(Handler) {
	React.render(<Handler/>, document.getElementById('app'));
});
