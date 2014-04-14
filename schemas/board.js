var mongoose = require("mongoose");
var User = require('./user.js').model;
var Schema, Model;

Schema = new mongoose.Schema({
	boardName	: { type: String, required: true },
	boardType	: { type:Number, required: true, 'default': 0 }, /* 0:public, 1:private, 2:viewable by organization members */
	users		: [{
		playerID: { type: mongoose.Schema.ObjectId, required: true },
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

Schema.methods.addUser = function(username, access, callback) {
	var self = this;
	User.findByUsername(username, function(err, user) {
		if(err) { if(callback) callback(err); return; }
		self.users.push({ playerID:user._id, access:access });
		if(callback) callback(undefined, self);
	});
};

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

Schema.statics.findByOrganization = function(organizationID, callback) {
	return Model.find({ organizationID: organizationID }, callback);
};

Schema.statics.findByUser = function(playerID, callback) {
	//return Model.find({}, callback).elemMatch("users", { playerID: playerID });
	var query = Model.find({}).elemMatch("users", { playerID: playerID });
	query.exec(callback);
	//return Model.find({ users: { $all: [{ "$elemMatch" : { playerID: playerID } }] } }, callback);
};

Model = mongoose.model('Board', Schema);
module.exports.schema = Schema;
module.exports.model = Model;