( (global) ->

	global.util =

		onReady: (fn) ->
			if document.readyState isnt 'loading'
				fn()
			else
				document.addEventListener('DOMContentLoaded', fn)

		namespacer: (ns) ->
			parts = ns.split('.')
			container = window
			while parts.length
				part = parts.shift()
				container[part] = container[part] || {}
				if parts.length is 0
					return container[part]
				container = container[part]

		log: ->
			console.log( Array.prototype.slice.call(arguments) )

		doshRound: (fig) ->
			Math.round(fig * 100) / 100

		doshFormat: (fig) ->
			fig = (fig.toFixed 2) + ''

)(window)