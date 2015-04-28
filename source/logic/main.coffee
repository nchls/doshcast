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


window.log = ->
  log.history = log.history or []
  log.history.push(arguments)
  if this.console
    console.log( Array.prototype.slice.call(arguments) )


( ->

	metrics = {}

	window.perf = {
		start: (evtName) ->
			metrics[evtName] = window.performance.now()
		end: (evtName) ->
			duration = window.performance.now() - metrics[evtName]
			log(evtName + ': ' + duration.toFixed(2) + ' ms')
	}

)()

