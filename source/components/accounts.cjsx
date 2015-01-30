AccountsPage = React.createClass
	getInitialState: ->
		return {
			streams: []
		}

	componentDidMount: ->
		self = this
		$.getJSON('/api/getData').done( (response) ->
			if self.isMounted()
				self.setState(
					streams: response.result
				)
				util.namespacer('dosh.state').streams = response.result
		)

	handleAddStreamClick: ->
		this.setState(addStreamOpen: true)

	handleCloseAddStreamClick: ->
		this.setState(addStreamOpen: false)

	handleAddStreamSubmit: (evt) ->
		evt.preventDefault()
		this.setState(addStreamOpen: false)

	render: ->
		<div className="accounts">
			<h2>Accounts</h2>
			<div className="actionBar">
				{if this.state.addStreamOpen
					<button className="btn secondary" onClick={this.handleCloseAddStreamClick}>
						<i className="fa fa-arrow-left"></i> Accounts
					</button>
				else
					<button className="btn" onClick={this.handleAddStreamClick}>
						<i className="fa fa-plus"></i> Add Account
					</button>
				}
			</div>
			{if this.state.addStreamOpen then null else <StreamsList streams={this.state.streams}/>}
			{if this.state.addStreamOpen then <AddStream handleSubmit={this.handleAddStreamSubmit} fields={[]}/> else null}
		</div>

StreamsList = React.createClass
	getInitialState: ->
		null

	statics:
		getTypeLabel: (type) ->
			_.find(dosh.models.Stream.prototype.schema.streamType.choices, (choice) ->
				choice[0] is type
			)[1]

		getSubtypeLabel: (subtype) ->
			_.find(dosh.models.Stream.prototype.schema.streamSubtype.choices, (choice) ->
				choice[0] is subtype
			)[1]

	render: ->
		streamsByType = _.pairs(_.groupBy(this.props.streams, 'streamType'))
		<ul className="streams-list">
			{streamsByType.map( (type) ->
				<StreamsGroup key={type[0]} type={type[0]} streams={type[1]}/>
			)}
		</ul>

StreamsGroup = React.createClass
	render: ->
		<li className="stream-group">
			<h3>{StreamsList.getTypeLabel(this.props.type)}</h3>
			<ul>
				{this.props.streams.map( (stream) ->
					<StreamsListItem key={stream._id} id={stream._id} name={stream.name} subtype={stream.streamSubtype}/>
				)}
			</ul>
		</li>

StreamsListItem = React.createClass
	render: ->
		<li className="item">
			<div className="streamName">{this.props.name}</div>
			<div className="streamType">{StreamsList.getSubtypeLabel(this.props.subtype)}</div>
		</li>

AddStream = React.createClass
	statics:
		getStreamFields: ->
			_.pairs(dosh.models.Stream.prototype.schema)

	render: ->
		<form className="addStreamForm" onSubmit={this.props.handleSubmit}>
			{AddStream.getStreamFields().map( (field) ->
				<div className={'formRow cf ' + (if field[1].input && field[1].input.type is 'checkbox' then 'inline' else '')}>

				</div>
			)}
		</form>


"""
				ng-class="{formRow: true, cf: true, inline: (field.input.type === 'checkbox')}"
				ng-repeat="field in streamFields"
				ng-if="!field.showFor || (field.showFor && _.contains(field.showFor, newStream.type.typeKey))"
			>

				<div class="field">

					<label
						ng-if="field.input.type !== 'checkbox'"
						for="newStream-{{ field.jsName }}"
					>
						{{ getStreamLabel(field.key, newStream.type.typeKey) }}
					</label>

					<input
						ng-if="field.input.type !== 'select'"
						type="{{ field.input.type }}"
						id="newStream-{{ field.jsName }}"
						ng-model="newStream[field.jsName]"
						ng-required="field.validation.required"
					>

					<label
						ng-if="field.input.type === 'checkbox'"
						for="newStream-{{ field.jsName }}"
					>
						{{ getStreamLabel(field.key, newStream.type.typeKey) }}
					</label>

					<select
						ng-if="field.input.type === 'select' && field.key !== 'stream_subtype'"
						id="newStream-{{ field.jsName }}"
						ng-model="newStream[field.jsName]"
						ng-options="{{ getSelectOptions(field.key) }}"
						ng-required="field.validation.required"
					>
						<option value="">--- Choose {{ field.label | lowercase }} ---</option>
					</select>

					<select
						ng-if="field.key === 'stream_subtype'"
						id="newStream-{{ field.jsName }}"
						ng-model="newStream[field.jsName]"
						ng-options="type.subName group by type.typeName for type in streamTypes"
						ng-required="field.validation.required"
						ng-change="setNewStream(newStream.type, newStream.name)"
					>
						<option value="">--- Choose {{ field.label | lowercase }} ---</option>
					</select>

				</div>

				<p
					ng-if="field.helpText"
					class="helpText aside"
				>
					{{ getStreamHelp(field.key, newStream.type.typeKey) }}
				</p>

			</div>

			<div class="actionBar">
				<button
					class="btn secondary"
					ng-click="closeAddStream()"
				>
					Cancel
				</button>

				<button
					class="btn"
				>
					<i class="fa fa-plus"></i> Add Account
				</button>
			</div>

		</form>
"""