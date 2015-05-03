var GoalsPage = React.createClass({displayName: "GoalsPage",
	getInitialState: function() {
		return {};
	},
	render: function() {
		return React.createElement("div", {className: "goals padded"}, 
			React.createElement("h2", null, "Goals"), 
			React.createElement("div", {className: "actionBar"}

			)
		);
	}
});