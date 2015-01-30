CloseButton = React.createClass
	handleClick: (evt) ->
		evt.preventDefault()
		this.props.closeAction()

	render: ->
		<button className="close" onClick={this.handleClick}>
			<i className="fa fa-times"></i>
		</button>

LoadingMask = React.createClass
	render: ->
		<div className="loading-mask">
			<div class="center-icon">
				<i className="fa fa-circle-o-notch fa-spin"></i>
			</div>
		</div>