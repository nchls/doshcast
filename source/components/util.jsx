var CloseButton = React.createClass({
	handleClick: function(evt) {
		evt.preventDefault();
		this.props.closeAction();
	},

	render: function() {
		return <button className="close" onClick={this.handleClick}>
			<i className="fa fa-times"></i>
		</button>;
	}
});

var LoadingMask = React.createClass({
	render: function() {
		return <div className="loading-mask">
			<div className="center-icon">
				<i className="fa fa-circle-o-notch fa-spin"></i>
			</div>
		</div>;
	}
});