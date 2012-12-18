var config = {}

var argv = require('optimist').argv; 

config.mongodb = {}

config.mongodb.host = 'localhost';
config.mongodb.port = 27017;
config.mongodb.server_options = '';
config.mongodb.db_name = 'splays';
if(argv.db_name){
  config.mongodb.db_name = argv.db_name;
  console.log("Using database: %s", argv.db_name);
}
config.mongodb.db_options = {safe: true};

module.exports = config;
