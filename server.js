//{REGION Requires
var http = require("http");
var express = require("express");
var mongoose = require("mongoose");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var config = require('./config.js');
//}END Requires

// (Async) Mongoose runs while the server is running rather than connecting to it multiple times (also prevents race conditions)
// Check this first since the whole site depends on database access
mongoose.connect(config.databaseURI);
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
db.once('open', function() {
	console.log("yay");
});

var app = express();
//module.exports.app = app; // Let other files access the app
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser('JuniperBarriesD4wg'));
app.use(express.bodyParser());
app.use(express.session({cookie: { path: '/', httpOnly: true, maxAge: null}, secret:'JuniperBarriesD4wg!'}));

router(app, requestHandlers);

//http.createServer(app).listen(config.port);
app.listen(config.port);

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