(function(global, namespacer, EventEmitter) {

	global.events = new EventEmitter();

	namespacer('dosh.state');

	dosh.store = {
		set: function(updates) {
			var updatedKeys = [];
			_.forEach(updates, function(val, key) {
				if (dosh.state[key] !== val) {
					dosh.state[key] = val;
					updatedKeys.push(key);
				}
			});
			if (updatedKeys.length) {
				events.emitEvent('update', [updatedKeys]);
			}
		},
		push: function(key, pushVal) {
			dosh.state[key].push(pushVal);
			events.emitEvent('update', [[key]]);
		},

		listeners: {},
		addPropListener: function(prop, callback) {
			var handler = function(keys) {
				if (keys.indexOf(prop) !== -1) {
					callback();
				}
			};
			this.listeners[callback] = handler;
			events.addListener('update', handler);
		},
		removePropListeners: function(listeners) {
			var self = this;
			_.forEach(listeners, function(listener) {
				var handler = self.listeners[listener.callback];
				events.removeListener('update', handler);
			});
		}
	};

}(window, util.namespacer, EventEmitter));