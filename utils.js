var utils = {};
module.exports = utils;

var _ = require('underscore');
var request = require('request');
var htmlparser = require('htmlparser');
var ent = require('ent');

var handler = new htmlparser.DefaultHandler(function (error, dom) {
  },
  {verbose: false, ignoreWhitespace: true}
);
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

hash = function(o, props){
  var res = "";
  _.each(props, function(pr){
    res += o[pr]; 
  });
  return res;
};

utils.objListDiff = function(a1, a2, eq){
  if(!_.isArray(a1) || a1.length <= 0){
    return a2; 
  } else if(!_.isArray(a2) || a2.length <= 0){
    return a1;
  }
  hmap = {};
  r = [];
  _.each(a2, function(e2){
    hmap[hash(e2, eq)] = e2;
  });
  _.each(a1, function(e1){
    if(!hmap[hash(e1, eq)]){
      r.push(e1);
    }
  });
  return r;
};
