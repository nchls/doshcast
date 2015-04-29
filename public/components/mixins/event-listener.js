var EventListenerMixin = {
	mixins: [{
		componentWillMount: function() {
			this.propListeners = [];
		},
		componentWillUnmount: function() {
			dosh.store.removePropListeners(this.propListeners);
		}
	}],

	addPropListener: function(prop, callback) {
		dosh.store.addPropListener(prop, callback);
		this.propListeners.push({
			event: event,
			callback: callback
		});
	}
};
