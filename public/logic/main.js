(function() {
  util.onReady(function() {
    window.$document = $(document);
    return React.initializeTouchEvents(true);
  });

}).call(this);
