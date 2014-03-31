var mongoose = require("mongoose");
var User = require('./user.js').model;
var Schema, Model;

Schema = new mongoose.Schema({
	name		: { type: String, required: true },
	type		: { type:Number, required: true, 'default': 0 }, /* 0:public, 1:private */
	users		: [{
		playerID: { type: mongoose.Schema.ObjectId, required: true },
		access	: { type: Number, required: true, 'default': 0 }, /* 0:none (viewing), 1:normal (editing), 2:admin (can add users, etc), 3:bureaucrat (add users, admins, and other bereaucrats [creater of board is automatically this])  */
		joinDate: { type: Date, 'default': Date.now }
	}],
	creationDate: { type: Date, 'default': Date.now }
});

///////####### findById is a default function ########
// http://mongoosejs.com/docs/guide.html#statics
/*Schema.statics.findByID = function(id, callback) {
	return Model.findOne(
	{
		_id: id
	}, callback);
};*/

Schema.methods.addUser = function(username, access, callback) {
	var self = this;
	User.findByUsername(username, function(err, user) {
		if(err) { if(callback) callback(err); return; }
		self.users.push({ playerID:user._id, access:access });
		if(callback) callback(undefined, self);
	});
};

Schema.statics.findByUser = function(playerID, callback) {
	//return Model.find({}, callback).elemMatch("users", { playerID: playerID });
	var query = Model.find({}).elemMatch("users", { playerID: playerID });
	query.exec(callback);
};

Model = mongoose.model('Organization', Schema);
module.exports.schema = Schema;
module.exports.model = Model;