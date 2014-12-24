var express = require('express');
var session = require('express-session');

var appPrivate = require('./app-private');

var middleware = require('./server/middleware');
var auth = require('./server/auth');
var streams = require('./server/streams');

var app = express();

app.use(express.static('public'));

app.use(session({
	name: 's',
	cookie: {
		maxAge: 1000 * 60 * 15
	},
	secret: appPrivate.secret,
	resave: false,
	saveUninitialized: false
}));

app.use(middleware.session);

app.get('/', function(req, res) {
	var options = {
		root: __dirname + '/source/',
		dotfiles: 'deny'
	};
	res.sendFile('templates/base.html', options);
});

app.get('/api/getData', middleware.requireLogin, streams.getData);

// todo: make these posts
app.get('/api/createStream', middleware.requireLogin, streams.createStream);

app.get('/api/createUser', auth.createUser);
app.get('/api/loginUser', auth.loginUser);
app.get('/api/logoutUser', middleware.requireLogin, auth.logoutUser);

app.use(function(req, res, next) {
	res.status(404).send('404');
});

var server = app.listen(1337, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server running at http://%s:%s', host, port);
});
