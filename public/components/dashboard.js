var DashboardPage = React.createClass({displayName: "DashboardPage",
	getInitialState: function() {
		return {};
	},
	render: function() {
		return React.createElement("div", {className: "dashboard padded"}, 
			React.createElement("h2", null, "Dashboard"), 
			React.createElement("div", {className: "actionBar"}

			)
		);
	}
});