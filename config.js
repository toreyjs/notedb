/* List of stuff that shouldn't be hardcoded */
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var database = { user:'admin', pass:'4ccTKPc3ALKM' };
database.URI = "mongodb://"+database.user+":"+database.pass+"@"+ipaddress+":"+port+"/notedb"; //Connection URL: mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/
//module.exports.database.URI = "mongodb://notedb-tjs7664.rhcloud.com/notedb";
//module.exports.database.URI = "mongodb://admin:g8RgpGTXbgYQ@notedb-tjs7664.rhcloud.com/notedb";
//module.exports.database.URI = "mongodb://localhost:8080/notedb";

module.exports = {
	port: port,
	ipaddress: ipaddress,
	database: database
};