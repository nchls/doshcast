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
				var instances = {};

				// Transform objects to class instances
				_.forEach([
					['streams', dosh.models.Stream],
					['revisions', dosh.models.StreamRevision],
					['manuals', dosh.models.ManualEntry]
				], function(collection) {
					instances[collection[0]] = [];
					_.forEach(response.result[collection[0]], function(obj) {
						instances[collection[0]].push(new collection[1](obj));
					});
				});

				dosh.store.set(instances);
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
		return <div>
			<div className="topBar cf">
				<header>
					<a href="/">
						<h1>DoshCast</h1>
						<small>alpha!</small>
					</a>
				</header>

				<PrimaryNav/>

				<AuthControls/>
			</div>

			<RouteHandler/>
		</div>;
	}
}));

util.onReady(function() {
	var routes = (
		<Route handler={App}>
			<DefaultRoute handler={DashboardPage}/>
			<Route name="dashboard" path="dashboard" handler={DashboardPage}/>
			<Route name="accounts" path="accounts" handler={AccountsPage}/>
			<Route name="accounts-add" path="accounts/add" handler={AddStream}/>
			<Route name="accounts-edit" path="accounts/edit/:streamId" handler={EditStream}/>
			<Route name="accounts-revise" path="accounts/revise/:streamId" handler={AddStreamRevision}/>
			<Route name="accounts-history" path="accounts/history/:streamId" handler={ViewStreamHistory}/>
			<Route name="ledger" path="ledger" handler={LedgerPage}/>
			<Route name="goals" path="goals" handler={GoalsPage}/>
			<Route name="projection" path="projection" handler={ProjectionPage}/>
		</Route>
	);

	Router.run(routes, Router.HistoryLocation, function(Handler) {
		ReactDOM.render(<Handler/>, document.getElementById('app'));
	});
});