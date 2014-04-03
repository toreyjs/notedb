var mongoose = require("mongoose");
var User = require('./user.js').model;
var Schema, Model;

Schema = new mongoose.Schema({
	boardName	: { type: String, required: true },
	boardType	: { type:Number, required: true, 'default': 0 }, /* 0:public, 1:private */
	users		: [{
		playerID: { type: mongoose.Schema.ObjectId, required: true },
		access	: { type: Number, required: true, 'default': 0 }, /* 0:none (viewing), 1:normal (editing), 2:admin (can add users, etc), 3:bureaucrat (add users, admins, and other bereaucrats [creater of board is automatically this])  */
		joinDate: { type: Date, 'default': Date.now }
	}],
	sections	: [{
		title	: { type: String, required: true },
		notes	: [{
			title		: { type: String, required: true },
			description	: { type: String, required: true }
		}],
	}],
	organizationID	: { type: mongoose.Schema.ObjectId },
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

Schema.statics.findByOrganization = function(organizationID, callback) {
	return Model.find({ organizationID: organizationID }, callback);
};

Schema.statics.findByUser = function(playerID, callback) {
	//return Model.find({}, callback).elemMatch("users", { playerID: playerID });
	var query = Model.find({}).elemMatch("users", { playerID: playerID });
	query.exec(callback);
	//return Model.find({ users: { $all: [{ "$elemMatch" : { playerID: playerID } }] } }, callback);

	//return Model.find({
	//	users: { "$elemMatch" : { playerID: playerID } }
	//});

	//return Model.elemMatch("users", { playerID: playerID });

	//var users = Model.find({ users: [] }, function(err, data) {
	//	var userss = users.elemMatch("users", { playerID: playerID });
	//	callback(err, userss);
	//});
};

Model = mongoose.model('Board', Schema);
module.exports.schema = Schema;
module.exports.model = Model;