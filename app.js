var express = require('express');
var session = require('express-session');

var appPrivate = require('./app-private');

var api = require('./source/api/api');

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

app.use(api.sessionMiddleware);

app.get('/', function(req, res) {
	var options = {
		root: __dirname + '/source/',
		dotfiles: 'deny'
	};
	res.sendFile('templates/base.html', options);
});

app.get('/api/getData', api.requireLogin, api.getData);

// todo: make these posts
app.get('/api/createStream', api.requireLogin, api.createStream);

app.get('/api/createUser', api.createUser);
app.get('/api/loginUser', api.loginUser);
app.get('/api/logoutUser', api.requireLogin, api.logoutUser);

app.use(function(req, res, next) {
	res.status(404).send('404');
});

var server = app.listen(1337, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server running at http://%s:%s', host, port);
});
