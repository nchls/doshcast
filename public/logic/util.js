(function() {
  (function(global) {
    return global.util = {
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
  })(window);

}).call(this);
