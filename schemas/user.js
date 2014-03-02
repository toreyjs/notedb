var mongoose = require ("mongoose"); 
var Model;

var Schema = new mongoose.Schema({
	username: String,
	password: String,
	email	: String
});

// http://mongoosejs.com/docs/guide.html#statics
Schema.statics.findByUsername = function(username, callback) {
	return Model.findOne(
	{
		username: new RegExp('^' + username.trim() + '$', 'i')
	}, callback);
};

Model = mongoose.model('User', Schema);
module.exports.schema = Schema;
module.exports.model = Model;