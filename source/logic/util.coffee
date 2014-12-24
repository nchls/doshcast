window.log = ->
	log.history = log.history or []
	log.history.push(arguments)
	if this.console
		console.log( Array.prototype.slice.call(arguments) )

window.doshRound = (fig) ->
	return Math.round(fig * 100) / 100

window.doshFormat = (fig) ->
	fig = (fig.toFixed 2) + ''
	return fig