// Module dependencies
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var wines = require('./routes/wines');
var http = require('http');
var path = require('path');

var app = express();

// For socket.io
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// All environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/wines', wines.findAll);
app.get('/wines/:id', wines.findById);
app.post('/wines', wines.addWine);
app.put('/wines/:id', wines.updateWine);
app.delete('/wines/:id', wines.deleteWine);

// User list
// todo: move to express userlist
var usernames = {};

io.sockets.on('connection', function (socket) {

	// Listens for a client to emit new information
	// Then tells all clients to update view with new information
	socket.on('sendchat', function (data) {
		var date = new Date();
		io.sockets.emit('updatechat', socket.username, data, date);
	});

	// Listen for a client to request adduser
	// Add the user to the user list and emit update to all clients
	socket.on('adduser', function(username){
		socket.username = username;
		usernames[username] = username;
		socket.emit('confirmConnect');
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		io.sockets.emit('updateusers', usernames);
	});

	// Listen for a client to emit the disconnect 
	// Delete that client from the user list and emit update to all clients
	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});

server.listen(app.get('port'), function(){
  console.log('Server listening on port ' + app.get('port') + '.');
});