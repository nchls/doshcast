(function(global, EventEmitter) {

	var user = global.user,
		streams = [],
		revisions = [],
		manuals = [];

	global.events = new EventEmitter();

	global.AppActions = {
		login: function(username) {
			console.log('login!');
			user = username;
			this.updateData();
			events.emitEvent('login');
		},

		logout: function() {
			user = null;
			this.updateData();
			events.emitEvent('logout');
		},

		addStream: function(stream) {
			streams.push(stream);
			events.emitEvent('addStream');
		},

		/* Todo: implement */
		editStream: function(stream) {
			events.emitEvent('editStream');
		},

		updateData: function() {
			console.log('updateData!');
			var self = this;
			if (user !== null) {
				return $.getJSON('/api/getData').done(function(response) {
					console.log('new data!', response.result);
					streams = response.result.streams;
					revisions = response.result.revisions;
					manuals = response.result.manuals;
					events.emitEvent('updateData');
				});
			} else {
				streams = [];
				revisions = [];
				manuals = [];
				events.emitEvent('null user updateData');
			}
		},

		getUser: function() {
			return user;
		},

		getStreams: function() {
			return streams;
		},

		getRevisions: function() {
			return revisions;
		},

		getManuals: function() {
			return manuals;
		}
	};

}(window, EventEmitter));