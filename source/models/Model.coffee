if exports?
	global = exports
else
	global = window.util.namespacer('dosh.models')

class Model
	constructor: (@created, @modified) ->

	schema:
		created:
			type: 'timestamp'
			default: 'now'
			validation:
				required: true

		modified:
			type: 'timestamp'
			default: 'now'
			validation:
				required: true


	instanceToObject: ->
		obj = {}
		obj[key] = value for own key, value of @
		return obj


	jsonToObject: (json) ->
		output = {}
		obj = JSON.parse(json)
		for own key, value of obj
			if key of @schema
				if @schema[key].type in ['date', 'timestamp']
					output[key] = new Date(value)
					continue
				output[key] = value
		return obj


	validate: ->


global.Model = Model

