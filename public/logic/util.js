(function() {
  (function(global) {
    var metrics;
    global.util = {
      onReady: function(fn) {
        if (document.readyState !== 'loading') {
          return fn();
        } else {
          return document.addEventListener('DOMContentLoaded', fn);
        }
      },
      namespacer: function(ns) {
        var container, part, parts;
        parts = ns.split('.');
        container = window;
        while (parts.length) {
          part = parts.shift();
          container[part] = container[part] || {};
          if (parts.length === 0) {
            return container[part];
          }
          container = container[part];
        }
      },
      log: function() {
        return console.log(Array.prototype.slice.call(arguments));
      },
      doshRound: function(fig) {
        return Math.round(fig * 100) / 100;
      },
      doshFormat: function(fig) {
        return fig = (fig.toFixed(2)) + '';
      }
    };
    metrics = {};
    return global.perf = {
      start: function(evtName) {
        return metrics[evtName] = global.performance.now();
      },
      end: function(evtName) {
        var duration;
        duration = global.performance.now() - metrics[evtName];
        return global.util.log(evtName + ': ' + duration.toFixed(2) + ' ms');
      }
    };
  })(window);

}).call(this);
