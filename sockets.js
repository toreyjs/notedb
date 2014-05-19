var config = require('./config');
var User = require('./schemas/user.js').model;

var _io, _sockets;
var TYPE = Object.freeze({ SYSTEM:"system", USER:"user" });

// http://www.danielbaulig.de/socket-ioexpress/
// http://www.ranu.com.ar/post/50418940422/redisstore-and-rooms-with-socket-io
// http://stackoverflow.com/questions/6846174/dynamic-rooms-with-socket-io-and-node

module.exports.start = function(lio) {
	_io = lio;
	_sockets = {};

	_io.sockets.on('connection', function (socket) {
		console.log('A socket connected!');
		// Don't do anything if no session exists
		var session = socket.handshake.session;
		if(!session) { return socket.disconnect('Session has expired'); }
		// If user, keep track of socket
		if(session.user) {
			_sockets[session.user._id] = socket;
		}
		
		//console.log(socket);
		
		//{REGION Notifications
			socket.on('remove-notification', function(data) {
				var session = socket.handshake.session;
				var noteID = data.id, userID = session.user._id;
				
				User.findById(userID, function(err, user) {
					for (var i = 0; i < user.notifications.length; i++) {
						var note = user.notifications[i];
						if(note._id == noteID) {
							note.remove();
							user.save(function(err) {
								if(!err)
									socket.emit('remove-notification-elem', { id:noteID });
							});
							break;
						}
					}
				});
			});
		//}END Notifications
		
		//{REGION Chat
			socket.on("chatSignIn", function(data){
				var session = socket.handshake.session;
				if(session.user) {
					var room = data.room, name = session.user.displayName;
					socket.set('room', room);
					socket.set('name', name);
					socket.join(room);
					
					socket.emit('message', { msg: "Hello " + name, type: TYPE.SYSTEM });
					socket.broadcast.to(room).json.send({ msg	: "<i>"+name+"</i> has connected.", type: TYPE.SYSTEM });
				}
			});
			
			socket.on('message', function(data){
				var session = socket.handshake.session;
				if(session.user) {
					// lookup room and broadcast to that room
			        socket.get('room', function(err, room) {
			        	data.type = TYPE.USER;
			        	data.nick = session.user.displayName;
						
						socket.broadcast.to(room).json.send(data);
						socket.emit('message', data);
			        });
			    }
			});
			
			function chatDisconnect(socket) {
				// Disconnect from chat
				socket.get('room', function(err, room) { if(room) {
					socket.get('name', function(err, name) { if(name) {
						socket.broadcast.to(room).json.send({ msg: "<i>"+name+"</i> has disconnected.", type: TYPE.SYSTEM });
					}});
				}});
			}
		//}END Chat
		 
		socket.on('disconnect', function(){
			chatDisconnect(socket);
			
			// Remove socket from list
			var session = socket.handshake.session;
			if(session.user) {
				_sockets[session.user._id] = undefined;
			}
		});
	});
}

module.exports.userAddedToBoard = function(newuser, board) {
	for (var i = 0; i < board.users.length; i++) {
		User.findById(board.users[i].userID, function(err, user) {
			user.notifications.push({ message:newuser.displayName+" has been added to board \"<a href='/board/"+board._id+"'>"+board.boardName+"</a>\"" });
			user.save(function() {
				var socket = _sockets[user._id];
				if(socket) {
					socket.emit('new-notification', user.notifications[user.notifications.length-1]);
				}
			});
		});
	}
}

module.exports.userAddedToCard = function(card, board) {
	for (var i = 0; i < card.users.length; i++) {
		User.findById(card.users[i].userID, function(err, user) {
			user.notifications.push({ message:"A new user has been added to card \""+card.title+"\" on board \"<a href='/board/"+board._id+"'>"+board.boardName+"</a>\"" });
			user.save(function() {
				var socket = _sockets[user._id];
				if(socket) {
					socket.emit('new-notification', user.notifications[user.notifications.length-1]);
				}
			});
		});
	}
}

module.exports.commentAddedToCard = function(card, board) {
	for (var i = 0; i < card.users.length; i++) {
		User.findById(card.users[i].userID, function(err, user) {
			user.notifications.push({ message:"New comment added to card \""+card.title+"\" on board \"<a href='/board/"+board._id+"'>"+board.boardName+"</a>\"" });
			user.save(function() {
				var socket = _sockets[user._id];
				if(socket) {
					socket.emit('new-notification', user.notifications[user.notifications.length-1]);
				}
			});
		});
	}
}

module.exports.cardEdited = function(card, board) {
	for (var i = 0; i < card.users.length; i++) {
		User.findById(card.users[i].userID, function(err, user) {
			user.notifications.push({ message:"Card \""+card.title+"\" has been modified on board \"<a href='/board/"+board._id+"'>"+board.boardName+"</a>\"" });
			user.save(function() {
				var socket = _sockets[user._id];
				if(socket) {
					socket.emit('new-notification', user.notifications[user.notifications.length-1]);
				}
			});
		});
	}
}