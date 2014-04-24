var io;

// http://www.danielbaulig.de/socket-ioexpress/

module.exports.start = function(lio) {
	io = lio;

	// io.sockets.on('connection', function (socket) {
	//     console.log('A socket connected!');
	// });

	io.sockets.on('connection', function (socket) {
		console.log('A socket connected!');
		socket.emit('news', { hello: 'world' });
		socket.on('my other event', function (data) {
			console.log(data);
		});
	});
}