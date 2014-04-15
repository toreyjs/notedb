var mongoose = require("mongoose");
var User = require('./user.js').model;
var Schema, Model;

Schema = new mongoose.Schema({
	name		: { type: String, required: true },
	type		: { type:Number, required: true, 'default': 0 }, /* 0:public, 1:private */
	users		: [{
		userID: { type: mongoose.Schema.ObjectId, required: true },
		access	: { type: Number, required: true, 'default': 0 }, /* 0:normal (viewing), 1:admin (can add users, etc), 2:bureaucrat (add users, admins, and other bereaucrats [creater of board is automatically this])  */
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

Schema.methods.containsUser = function(userID) {
	var contains = false;
	for(var key in this.users) {
		var user = this.users[key];
		if(user.userID == userID) {
			contains = true;
			break;
		}
	}
	return contains;
}

Schema.statics.findByUser = function(userID, callback) {
	var query = Model.find({}).elemMatch("users", { userID: userID });
	query.exec(callback);
};

Model = mongoose.model('Organization', Schema);
module.exports.schema = Schema;
module.exports.model = Model;