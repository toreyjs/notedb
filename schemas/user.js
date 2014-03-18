var mongoose = require("mongoose"); 
var Schema, Model;

Schema = new mongoose.Schema({
	username	: { type: String, required: true, trim: true, unique: true },
	password	: { type: String, required: true },
	/* http://mongoosejs.com/docs/api.html#schema_string_SchemaString-match */
	email		: { type: String, required: true, match: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i },
	access		: { type: Number, required: true, 'default': 0 }, /* 0:normal, 1:???, 2:staff */
	displayName	: { type: String, required: true },
	creationDate: { type: Date, 'default': Date.now }
});

// http://mongoosejs.com/docs/guide.html#statics
Schema.statics.findByUsername = function(username, callback) {
	return Model.findOne(
	{
		username: new RegExp('^' + username.trim() + '$', 'i')
	}, callback);
};

// http://mongoosejs.com/docs/guide.html#statics
Schema.statics.listStaff = function(callback) {
	return Model.find({ access: 2 }, callback);
};

Model = mongoose.model('User', Schema);
module.exports.schema = Schema;
module.exports.model = Model;