/* List of stuff that shouldn't be hardcoded */
module.exports.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
module.exports.ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

module.exports.database = { user:'admin', pass:'4ccTKPc3ALKM' };
module.exports.database.URI = "mongodb://"+module.exports.ipaddress+":"+module.exports.port+"/notedb"; //Connection URL: mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/
//module.exports.databaseURI = "mongodb://notedb-tjs7664.rhcloud.com/notedb";
//module.exports.databaseURI = "mongodb://admin:g8RgpGTXbgYQ@notedb-tjs7664.rhcloud.com/notedb";
module.exports.databaseURI = "mongodb://localhost:8080/notedb";