var mongoose = require("mongoose");
var User = require('./user.js').model;
var Schema, Model;

Schema = new mongoose.Schema({
	boardName	: { type: String, required: true },
	boardType	: { type:Number, required: true, 'default': 0 }, /* 0:public, 1:private */
	users		: [{
		userID	: { type: mongoose.Schema.ObjectId, required: true, unique: true },
		access	: { type: Number, required: true, 'default': 0 }, /* 0:none (viewing), 1:normal (editing), 2:admin (can add users, etc), 3:bureaucrat (add users, admins, and other bereaucrats [creater of board is automatically this])  */
		joinDate: { type: Date, 'default': Date.now }
	}],
	sections	: [{
		title	: { type: String, required: true },
		cards	: [{
			title		: { type: String, required: true },
			description	: { type: String, required: true },
			priority	: { type: Number, required: true, 'default': 0 }, /* 0:none, 1:low, 2:medium, 3:high */
			comments	: [{
				userID		: { type: mongoose.Schema.ObjectId, required: true },
				comment		: { type: String, required: true },
				creationDate: { type: Date, 'default': Date.now }
			}],
			users		: [{
				userID		: { type: mongoose.Schema.ObjectId, required: true },
				dateAdded	: { type: Date, 'default': Date.now }
			}]
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

Schema.methods.findCard = function(cardID, callback) {
	for(var s = 0; s < this.sections.length; s++) {
		for (var c = 0; c < this.sections[s].cards.length; c++) {
			var card = this.sections[s].cards[c];
			if(card._id == cardID) {
				callback(undefined, card);
				return;
			}
		};
	}
	callback();
};

Schema.methods.containsUser = function(userID) {
	var contains = false;
	for(var i = 0; i < this.users.length; i++) {
		var user = this.users[i];
		if(user.userID.toString() == userID.toString()) {
			contains = true;
			break;
		}
	}
	return contains;
}

Schema.statics.findByOrganization = function(organizationID, callback) {
	return Model.find({ organizationID: organizationID }, callback);
};

Schema.statics.findByUser = function(userID, callback) {
	//return Model.find({}, callback).elemMatch("users", { userID: userID });
	var query = Model.find({}).elemMatch("users", { userID: userID });
	query.exec(callback);
	//return Model.find({ users: { $all: [{ "$elemMatch" : { userID: userID } }] } }, callback);
};

Model = mongoose.model('Board', Schema);
module.exports.schema = Schema;
module.exports.model = Model;