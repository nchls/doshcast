var Router = ReactRouter,

	DefaultRoute = Router.DefaultRoute,
	Link = Router.Link,
	Route = Router.Route,
	RouteHandler = Router.RouteHandler;

var App = React.createClass(_.merge({}, EventListenerMixin, {
	getInitialState: function() {
		return {};
	},

	componentWillMount: function() {
		this.addPropListener('user', this.handleUserUpdate);

		dosh.store.set({
			'streams': [],
			'revisions': [],
			'manuals': [],
			'user': window.user
		});
	},

	handleUserUpdate: function() {
		if (dosh.state.user !== null) {
			return $.getJSON('/api/getData').done(function(response) {
				dosh.store.set({
					'streams': response.result.streams,
					'revisions': response.result.revisions,
					'manuals': response.result.manuals
				});
			});
		} else {
			dosh.store.set({
				'streams': [],
				'revisions': [],
				'manuals': []
			});
		}
	},

	render: function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "topBar cf"}, 
				React.createElement("header", null, 
					React.createElement("a", {href: "/"}, 
						React.createElement("h1", null, "DoshCast"), 
						React.createElement("small", null, "alpha!")
					)
				), 

				React.createElement(PrimaryNav, null), 

				React.createElement(AuthControls, null)
			), 

			React.createElement(RouteHandler, null)
		);
	}
}));

util.onReady(function() {
	var routes = (
		React.createElement(Route, {handler: App}, 
			React.createElement(DefaultRoute, {handler: DashboardPage}), 
			React.createElement(Route, {name: "dashboard", path: "dashboard", handler: DashboardPage}), 
			React.createElement(Route, {name: "accounts", path: "accounts", handler: AccountsPage}), 
			React.createElement(Route, {name: "accounts-add", path: "accounts/add", handler: AddStream}), 
			React.createElement(Route, {name: "accounts-edit", path: "accounts/edit/:streamId", handler: EditStream}), 
			React.createElement(Route, {name: "accounts-revise", path: "accounts/revise/:streamId", handler: AddStreamRevision}), 
			React.createElement(Route, {name: "accounts-history", path: "accounts/history/:streamId", handler: ViewStreamHistory}), 
			React.createElement(Route, {name: "ledger", path: "ledger", handler: LedgerPage}), 
			React.createElement(Route, {name: "goals", path: "goals", handler: GoalsPage}), 
			React.createElement(Route, {name: "projection", path: "projection", handler: ProjectionPage})
		)
	);

	Router.run(routes, Router.HistoryLocation, function(Handler) {
		ReactDOM.render(React.createElement(Handler, null), document.getElementById('app'));
	});
});