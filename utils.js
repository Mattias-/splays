var utils = {};
module.exports = utils;

var _ = require('underscore');
var request = require('request');
var htmlparser = require('htmlparser');
var ent = require('ent');

var handler = new htmlparser.DefaultHandler(function (error, dom) {
  }, {verbose: false, ignoreWhitespace: true});
var parser = new htmlparser.Parser(handler);

var nodeSearch = function(node, func){
  var ret = [];
  if(func(node)){
    ret.push(node); 
  }
  _.each(node.children, function(e){
      e.parent = node;
      var ch = nodeSearch(e,func);
      if(ch.length > 0){
        ret = ret.concat(ch);
      }
  }); 
  return ret;
}


utils.Title = function(ch, name, urlstr, data){
    this.channel = ch;
    this.name = name;
    this.urlstr = urlstr;
    this.data = data;
};

utils.Title.prototype.getEpisodes = function(callback){
    this.channel.getEpisodes(this, callback);
};

utils.Title.prototype.getURL = function(){
    var titleUrl = this.channel.titleUrl.replace('{baseUrl}',
                                                 this.channel.baseUrl);
    var url = titleUrl.replace('{titleUrlStr}', this.urlstr);
    return url;
};

utils.Episode = function(ch, title, name, url, datetime, data){
    this.channel = ch;
    this.title = title;
    this.name = name;
    this.url = url;
    this.datetime = datetime;
    this.data = data;
};

utils.htmlScraper = function(url, nodeFinder, nodeParser, callback){
    console.time("htmlScraper " + url);
    request(url, function (error, response, page) {
        if (!error && response.statusCode == 200) {
          parser.parseComplete(page);
          //console.log(page);
          var html = _.find(handler.dom, function(n){return n.name == 'html'});
          //console.log(html);
          //console.time("dfs nodeSearch");
          var nodes = nodeSearch(html, nodeFinder);
          //console.timeEnd("dfs nodeSearch");
          var parsed = _.map(nodes, nodeParser);
          console.timeEnd("htmlScraper " + url);
          callback(parsed, false);
        } else {
          console.timeEnd("htmlScraper " + url);
          console.warn('Could not get page. Error: %s', response.statusCode);
          callback('Could not get page', true);
        }
    });
};
