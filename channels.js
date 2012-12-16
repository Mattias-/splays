var channels = {};
module.exports = channels;

var _ = require('underscore');
var ent = require('ent');
var request = require('request');

var utils = require('./utils');
var core = require('./core');

channels.svtplay = {
  'name': 'SVT Play',
  'baseUrl': 'http://www.svtplay.se',
  'titleUrl': '{baseUrl}/{titleUrlStr}',
  'utils': {
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
        var urlstr = n.attribs.href.slice(1);
        var name = ent.decode(n.children[0].data);
        var title = new core.Title(channels.svtplay, name, urlstr, {});
        return title;
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
        var url = '{baseUrl}' + n.children[0].children[0].attribs.href;
        var name = ent.decode(n.attribs['data-title']);
        return new core.Episode(channels.svtplay, '',
                                 name, url, '', {});
      } 
    }
  }
}; 
channels.svtplay.getTitles = function(callback){
  var ch = channels.svtplay;
  var at = ch.utils.allTitles;
  utils.htmlScraper(at.url,
                    at.nodeFinder,
                    at.nodeParser,
                    callback);
};
channels.svtplay.getEpisodes = function(title, callback){
  var ch = channels.svtplay;
  var ate = ch.utils.allTitleEpisodes;
  utils.htmlScraper(title.getURL(),
                    ate.nodeFinder,
                    ate.nodeParser,
                    callback);
};

channels.tv4play = {
  'name': 'TV4 Play',
  'baseUrl': 'http://www.tv4play.se',
  'titleUrl': '{baseUrl}/program/{titleUrlStr}',
  'utils': {
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
        var urlstr = decodeURI(n.attribs.href.split('/program/')[1]);
        var name = n.children[0].data;
        var title = new core.Title(channels.tv4play, name, urlstr, {});
        return title;
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
        var url = '{baseUrl}'+ n.attribs.href;
        var name =  n.children[0].data;
        var episode = new core.Episode(channels.tv4play, 'title', name,
                                        url, 'datetime', {});
        return episode;
      }
    }
  }
}; 

channels.tv4play.getTitles = function(callback){
  var ch = channels.tv4play;
  var at = ch.utils.allTitles;
  utils.htmlScraper(at.url,
                    at.nodeFinder,
                    at.nodeParser,
                    callback);
};
channels.tv4play.getEpisodes = function(title, callback){
  var ch = channels.tv4play;
  var ate = ch.utils.allTitleEpisodes;
  utils.htmlScraper(title.getURL(),
                    ate.nodeFinder,
                    ate.nodeParser,
                    callback);
};
