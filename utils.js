var utils = {};
module.exports = utils;

var _ = require('underscore');
var request = require('request');
var htmlparser = require('htmlparser');
var ent = require('ent');

var handler = new htmlparser.DefaultHandler(function (error, dom) {
    if (error) {
    
    }
  }, { verbose: false, ignoreWhitespace: true }
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

utils.svtplay = {
    'name': 'SVT Play',
    'baseUrl': 'http://www.svtplay.se',
    'allTitles': {
        'url': 'http://www.svtplay.se/program',
        'nodeFinder': function(n){
            return n.type == 'tag'
              && n.name == "a"
              && _.has(n, "attribs")
              && _.has(n.attribs, "class")
              && n.attribs.class.indexOf("playAlphabeticLetterLink") !== -1;
        },
        'nodeParser': function(n){
            return {'url': '{baseUrl}' + n.attribs.href,
                    'name': ent.decode(n.children[0].data)}
        } 
    },
    'allTitleEpisodes': {
        'url': '{titleUrl}/?tab=episodes&sida=6',
        'nodeFinder': function(n){
            return n.type == 'tag'
              && n.name == "article"
              && _.has(n, "attribs")
              && _.has(n.attribs, "class")
              && n.attribs.class.indexOf("svtMediaBlock") !== -1;
        },
        'nodeParser': function(n){
            return {'url':  '{baseUrl}' + n.children[0].children[0].attribs.href,
                    'name': ent.decode(n.attribs['data-title'])};
        } 
    }
}; 

utils.tv4play = {
    'name': 'TV4 Play',
    'baseUrl': 'http://www.tv4play.se',
    'allTitles': {
        'url': 'http://www.tv4play.se/program?per_page=999&per_row=4&page=1&content-type=a-o',
        'nodeFinder': function(n){
            if(!(n.type == 'tag'
               && n.name == "a")){
              return false;
            }
            if(_.has(n, "parent")
               && _.has(n.parent, "parent")
               && _.has(n.parent.parent, "parent")
               && _.has(n.parent.parent.parent, "parent")){
              lca = n.parent.parent.parent.parent;
              return lca.name == "ul"
                && _.has(lca, "attribs")
                && _.has(lca.attribs, "class")
                && lca.attribs.class.indexOf("a-o-list") !== -1;
            } else {
              return false;
            }
        },
        'nodeParser': function(n){
            return {'url': '{baseUrl}' + n.attribs.href,
                    'name': n.children[0].data};
        } 
    },
    'allTitleEpisodes': {
        'url': '{titleUrl}',
        'nodeFinder': function(n){
            if(!(n.type == 'tag'
               && n.name == "a")){
              return false;
            }
            return _.has(n, "parent")
              && n.parent.name == "h3"
              && _.has(n.parent, "attribs")
              && _.has(n.parent.attribs, "class")
              && n.parent.attribs.class.indexOf("video-title") !== -1;
        },
        'nodeParser': function(n){
            return {'url': '{baseUrl}'+ n.attribs.href,
                    'name': n.children[0].data};
        }
    }
}; 

utils.getAllTitles = function(ch, callback){
    console.time(ch.name + " getAllTitles");
    request(ch.allTitles.url, function (error, response, page) {
        if (!error && response.statusCode == 200) {
          parser.parseComplete(page);
          //console.log(page);
          html = _.find(handler.dom, function(node){ return node.name == 'html'});
          //console.log(html);
          //console.time("dfs nodeSearch");
          nodes = nodeSearch(html, ch.allTitles.nodeFinder);
          //console.timeEnd("dfs nodeSearch");
          parsed = _.map(nodes, ch.allTitles.nodeParser);
          console.timeEnd(ch.name + " getAllTitles");
          callback(parsed, false);
        } else {
          console.timeEnd(ch.name + " getAllTitles");
          console.warn('Could not get page. Error: %s', response.statusCode);
          callback('Could not get page', true);
        }
    });
};

utils.getAllEpisodesOfTitle = function(ch, titleUrl, callback){
    var titleUrl = titleUrl.replace('{baseUrl}', ch.baseUrl);
    var url = ch.allTitleEpisodes.url.replace('{titleUrl}', titleUrl);
    console.time(url + " getAllEpisodesOfTitle");
    request(url, function (error, response, page) {
        if (!error && response.statusCode == 200) {
          parser.parseComplete(page);
          //console.log(page);
          var html = _.find(handler.dom, function(node){ return node.name == 'html'});
          //console.log(html);
          //console.time("dfs nodeSearch");
          var nodes = nodeSearch(html, ch.allTitleEpisodes.nodeFinder);
          //console.timeEnd("dfs nodeSearch");
          var parsed = _.map(nodes, ch.allTitleEpisodes.nodeParser);
          console.timeEnd(url + " getAllEpisodesOfTitle");
          callback(parsed, false);
        } else {
          console.warn('ERROR: Could not get page. url: %s', url);
          console.timeEnd(url + " getAllEpisodesOfTitle");
          callback('Could not get page', true);
        }
    });
};
