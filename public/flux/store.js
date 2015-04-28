(function(global, AppDispatcher, EventEmitter) {

	var streams = [],
		revisions = [],
		manuals = []

		getData = function() {
			var self = this;

			return $.getJSON('/api/getData').done(function(response) {
				self.setState({
					streams: response.result.streams,
					manuals: response.result.manuals,
					revisions: response.result.revisions
				});
				dosh.state.streams = response.result.streams;
				dosh.state.manuals = response.result.manuals;
				dosh.state.revisions = response.result.revisions;
			});
		},

	global.AppStore = _.merge(EventEmitter.prototype, {
		emitChange: function() {
			this.emit('change');
		},
		addChangeListener: function(callback) {
			this.on('change', callback);
		},
		removeChangeListener: function(callback) {
			this.removeListener('change', callback);
		},
		getStreams: function() {
			return streams;
		},
		getRevisions: function() {
			return revisions;
		},
		getManuals: function() {
			return manuals;
		},
		dispatcherIndex: AppDispatcher.register(function(payload) {
			var action = payload.action;
			if (action.actionType === 'login')
		})
	});

}(window, AppDispatcher, EventEmitter));