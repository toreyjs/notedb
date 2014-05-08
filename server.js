//{REGION Requires
  var http = require("http");
  var express = require("express");
  var mongoose = require("mongoose");
  var lessMiddleware = require('less-middleware');

  var router = require("./router");
  var sockets = require("./sockets");
  var requestHandlers = require("./requestHandlers");
  var config = require('./config');
//}END Requires

//{REGION Links
  /*
    These are just a list of (some of the) links I found helpful for this project.
    http://www.anupshinde.com/posts/how-to-create-nodejs-npm-package/
  */
//}END Links

// (Async) Mongoose runs while the server is running rather than connecting to it multiple times (also prevents race conditions)
// Check this first since the whole site depends on database access
mongoose.connect(config.database.URI);
/*, function (err, res) {//, { user:"admin", pass:"g8RgpGTXbgYQ" }
	if (err) {
		console.log('ERROR connecting to: ' + config.databaseURI + '. ' + err);
	} else {
	    console.log('Successfully connected to: ' + config.databaseURI);
	}
}*/
//app.mongoose = mongoose;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() { console.log("yay"); });

// var app = express();
// app.use(lessMiddleware(__dirname+"/public", { compress : true }));
// app.use(express.static(__dirname + '/public'));
// app.use(express.cookieParser(config.cookieSecret));
// app.use(express.bodyParser());
// app.use(express.session({cookie: { path: '/', httpOnly: true, maxAge: null}, secret:config.cookieSecret}));

var cookieParser = express.cookieParser(config.cookieSecret);
var sessionStore = require('sessionstore').createSessionStore();

var app = express();

app.configure(function(){
  app.use(lessMiddleware(__dirname+"/public", { compress : true }));
  app.use(express.static(__dirname + '/public'));
  app.use(cookieParser);
  app.use(express.bodyParser()); // Lets me do req.body.var
  app.use(express.session({secret: config.cookieSecret, store: sessionStore}));
  app.use(app.router);
});

router(app, requestHandlers);

var server = app.listen(config.port, config.host);
var io = require('socket.io').listen(server, { log: false });
io.configure(function(){
  // https://github.com/AustP/session.io/blob/master/examples/test.js
  //use session.io to get our session data
  io.set('authorization', require('session.io')(cookieParser, sessionStore));
});
io.configure('production', function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
});
sockets.start(io);

// Original
// var io = require('socket.io').listen(80);
// io.sockets.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });

//http.createServer(app).listen(config.port, config.host);
//app.listen(config.port, config.host);
//server.listen(config.port, config.host);

/**
 *  Setup termination handlers (for exit and a list of signals).
 */
process.on('exit', function() { terminate(); });

// Removed 'SIGPIPE' from the list - bugz 852598.
['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { terminate(element); });
});

function terminate(sig){
    if (typeof sig === "string") {
       console.log('%s: Received %s - terminating server ...',
                   Date(Date.now()), sig);
       mongoose.connection.close();
       process.exit(1);
    }
    console.log('%s: Node server stopped.', Date(Date.now()) );
};

console.log("Server Started");