(function() {
  util.onReady(function() {
    var renderPage;
    renderPage = function(component) {
      return React.render(React.createElement(component, null), document.getElementById('main'));
    };
    window.$document = $(document);
    React.initializeTouchEvents(true);
    return React.render(React.createElement(App, null), document.getElementById('app'));
  });

  window.log = function() {
    log.history = log.history || [];
    log.history.push(arguments);
    if (this.console) {
      return console.log(Array.prototype.slice.call(arguments));
    }
  };

  (function() {
    var metrics;
    metrics = {};
    return window.perf = {
      start: function(evtName) {
        return metrics[evtName] = window.performance.now();
      },
      end: function(evtName) {
        var duration;
        duration = window.performance.now() - metrics[evtName];
        return log(evtName + ': ' + duration.toFixed(2) + ' ms');
      }
    };
  })();

}).call(this);
