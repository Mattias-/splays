var core = {};
module.exports = core;

var _ = require('underscore');
var mongodb = require('mongodb');

var config = require('./config');

core.db_serv = new mongodb.Server(config.mongodb.host, config.mongodb.port,
                                  config.mongodb.server_options);
core.db = new mongodb.Db(config.mongodb.db_name, core.db_serv,
                         config.mongodb.db_options);

core.Title = function(ch, name, urlstr, data){
  this.channel = ch;
  this.name = name;
  this.urlstr = urlstr;
  this.data = data;
};

core.Title.prototype.getEpisodes = function(callback){
  this.channel.getEpisodes(this, callback);
};

core.Title.prototype.getURL = function(){
  var titleUrl = this.channel.titleUrl.replace('{baseUrl}',
                                               this.channel.baseUrl);
  var url = titleUrl.replace('{titleUrlStr}', this.urlstr);
  return url;
};

core.Episode = function(ch, title, name, url, datetime, data){
  this.channel = ch;
  this.title = title;
  this.name = name;
  this.url = url;
  this.datetime = datetime;
  this.data = data;
};
