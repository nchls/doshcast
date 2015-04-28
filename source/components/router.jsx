(function(global) {

	global.Router = global.ReactRouter;
	global.DefaultRoute = global.Router.DefaultRoute;
	global.Link = global.Router.Link;
	global.Route = global.Router.Route;
	global.RouteHandler = global.Router.RouteHandler;
	global.NotFoundRoute = global.Router.NotFoundRoute;
	
	var routes = (
		<Route handler={App} path="/">
			<DefaultRoute handler={DashboardPage}/>
			<Route name="dashboard" handler={DashboardPage}/>
			<Route name="accounts" handler={AccountsPage}/>
			<Route name="ledger" handler={LedgerPage}/>
		</Route>
	);

	/*
	Router.run(routes, Router.HistoryLocation, function(Handler) {
		React.render(<Handler/>, document.getElementById('app'));
	});
*/

}(window));
