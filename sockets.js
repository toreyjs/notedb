var config = require('./config');

var _io;
var TYPE = Object.freeze({ SYSTEM:"system", USER:"user" });

// http://www.danielbaulig.de/socket-ioexpress/
// http://www.ranu.com.ar/post/50418940422/redisstore-and-rooms-with-socket-io
// http://stackoverflow.com/questions/6846174/dynamic-rooms-with-socket-io-and-node

module.exports.start = function(lio) {
	_io = lio;

	_io.sockets.on('connection', function (socket) {
		console.log('A socket connected!');
		
		var session = socket.handshake.session;
		
		//console.log(socket);

		// socket.emit('news', { hello: 'world' });
		// socket.on('my other event', function (data) {
		// 	console.log(data);
		// });

		//var room = "";
		socket.on("chatSignIn", function(data){
			var room = data.room, name = data.nick;
			socket.set('room', room);
			socket.set('name', name);
			socket.join(room);
			
			//room = data.room;
			
			socket.emit('message', { msg: "Hello " + name, type: TYPE.SYSTEM });
			socket.broadcast.to(room).json.send({ msg	: "<i>"+name+"</i> has connected.", type: TYPE.SYSTEM });
		});
		
		socket.on('message', function(message){
			// lookup room and broadcast to that room
	        socket.get('room', function(err, room) {
	        	message.type = TYPE.USER;
				
				socket.broadcast.to(room).json.send(message);
				socket.emit('message', message);
	        });
		});
		 
		socket.on('disconnect', function(){
			socket.get('room', function(err, room) { if(room) {
				socket.get('name', function(err, name) { if(name) {
					socket.broadcast.to(room).json.send({ msg: "<i>"+name+"</i> has disconnected.", type: TYPE.SYSTEM });
				}});
			}});
		});
	});
}

module.exports.userAddedToBoard = function(user, board) {
	for (var i = 0; i < board.users.length; i++) {
		var user = board.users[i];
	}
}