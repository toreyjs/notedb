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
		cards	: [{
			title		: { type: String, required: true },
			description	: { type: String, required: true },
			comments	: [{
				userID		: { type: mongoose.Schema.ObjectId, required: true },
				comment		: { type: String, required: true },
				creationDate: { type: Date, 'default': Date.now }
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
	//var query = Model.findOne( {"_id":mongoose.Schema.ObjectId(boardID), "sections.cards._id":mongoose.Schema.ObjectId(cardID)} );
	// var query = Model.findById(boardID);//.findOne({ "_id":cardID });
	// query.exec(function(err, board) {
	// 	if(err) { callback(err); return; }
	// 	for(var i = 0; i < board.sections; i++) {
	// 		for (var i = 0; i < board.sections.cards.length; i++) {
	// 			var card = board.sections.cards[i];
	// 			if(card._id == cardID) {
	// 				callback(err, card);
	// 				return;
	// 			}
	// 		};
	// 	}
	// });
	
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