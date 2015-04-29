# http://coolors.co/cfc294-373f4b-e3d297-afbc9d-f54a28

util.onReady( ->
	###
	renderPage = (component) ->
		React.render(React.createElement(component, null), document.getElementById('main'))
	###

	window.$document = $(document)

	React.initializeTouchEvents(true)

	React.render(React.createElement(App, null), document.getElementById('app'))
	#React.createElement(Router, null)
)


