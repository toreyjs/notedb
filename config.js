/* List of stuff that shouldn't be hardcoded */
var host = process.env.OPENSHIFT_NODEJS_IP || "localhost";//"127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

// https://www.openshift.com/blogs/getting-started-with-mongodb-on-nodejs-hosting
(database = {}).URI = "mongodb://";
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
	database.URI += process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
	process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
	process.env.OPENSHIFT_APP_NAME;
} else {
	database.URI += "localhost/notedb";
}

module.exports = {
	port: port,
	host: host,
	database: database
};