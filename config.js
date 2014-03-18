/* List of stuff that shouldn't be hardcoded */
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var host = process.env.OPENSHIFT_NODEJS_IP || "localhost";//"127.0.0.1";

var database = { user:'admin', pass:'4ccTKPc3ALKM', dbname:'notedb' };

//https://www.openshift.com/blogs/getting-started-with-mongodb-on-nodejs-hosting
database.URI = "mongodb://";
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
	database.URI += process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
	process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
	process.env.OPENSHIFT_APP_NAME;
} else {
	database.URI += "localhost/"+database.dbname;
}

// database.URI = (
// 	host == defaultHost
// 	? "mongodb://"+defaultHost+"/"+database.dbname
// 	: "mongodb://"+database.user+":"+database.pass+"@"+database.host+"/"+database.dbname//:"+port+"
// );

//Connection URL: mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/
//module.exports.database.URI = "mongodb://notedb-tjs7664.rhcloud.com/notedb";
//module.exports.database.URI = "mongodb://admin:g8RgpGTXbgYQ@notedb-tjs7664.rhcloud.com/notedb";
//module.exports.database.URI = "mongodb://localhost:8080/notedb";

module.exports = {
	port: port,
	host: host,
	database: database
};