(function() {
  window.log = function() {
    log.history = log.history || [];
    log.history.push(arguments);
    if (this.console) {
      return console.log(Array.prototype.slice.call(arguments));
    }
  };

  window.doshRound = function(fig) {
    return Math.round(fig * 100) / 100;
  };

  window.doshFormat = function(fig) {
    fig = (fig.toFixed(2)) + '';
    return fig;
  };

}).call(this);
