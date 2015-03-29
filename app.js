var fs = require('fs');
var secureFilters = require('secure-filters');

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');

var appPrivate = require('./app-private');

var middleware = require('./server/middleware');
var auth = require('./server/auth');
var streams = require('./server/streams');

var app = express();

var postParser = bodyParser.urlencoded({extended: false});

app.use(express.static('public'));

app.use(session({
	name: 's',
	cookie: {
		maxAge: 1000 * 60 * 120
	},
	secret: appPrivate.secret,
	resave: false,
	saveUninitialized: false
}));

app.get('/:page(|dashboard|accounts|ledger|goals|projection)', function(req, res) {
	fs.readFile('source/templates/base.html', {encoding: 'utf8'}, function(err, template) {
		var user = (req.session.user ?  "'" + secureFilters.js(req.session.user.email) + "'" : null),
			payload = template.replace('{{user}}', user);
		res.send(payload);
	});
});

app.get('/api/getData', middleware.requireLogin, streams.getData);

app.post('/api/createStreamData', middleware.requireLogin, postParser, streams.createStreamData);

app.post('/api/createUser', postParser, auth.createUser);
app.post('/api/loginUser', postParser, auth.loginUser);
app.post('/api/logoutUser', middleware.requireLogin, postParser, auth.logoutUser);

app.use(function(req, res, next) {
	res.status(404).send('404');
});

var server = app.listen(1337, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server running at http://%s:%s', host, port);
});
