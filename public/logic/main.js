(function() {
  util.onReady(function() {

    /*
    	renderPage = (component) ->
    		React.render(React.createElement(component, null), document.getElementById('main'))
     */
    window.$document = $(document);
    React.initializeTouchEvents(true);
    return React.render(React.createElement(App, null), document.getElementById('app'));
  });

}).call(this);
