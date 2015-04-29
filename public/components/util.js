var CloseButton = React.createClass({displayName: "CloseButton",
	handleClick: function(evt) {
		evt.preventDefault();
		this.props.closeAction();
	},

	render: function() {
		return React.createElement("button", {className: "close", onClick: this.handleClick}, 
			React.createElement("i", {className: "fa fa-times"})
		);
	}
});

var LoadingMask = React.createClass({displayName: "LoadingMask",
	render: function() {
		return React.createElement("div", {className: "loading-mask"}, 
			React.createElement("div", {className: "center-icon"}, 
				React.createElement("i", {className: "fa fa-circle-o-notch fa-spin"})
			)
		);
	}
});