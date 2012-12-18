
var _ = require('underscore');
var assert = require('assert');

var core = require('./core');
var utils = require('./utils');
var channels = require('./channels');

/*
 *  t: title object
 *  col: reused db collection
 *  pos: positive callback, if exists
 *  neg: negative callback, not exists
 */
titleExist = function(t, col, pos, neg){
  col.findOne({'channel.name': t.channel.name, name: t.name, urlstr: t.urlstr},
              function(err, found){
      if(found == null){
        neg(t, col);
      } else {
        pos(t, found, col); 
      }
  });
};

addNewTitle = function(t, col){
  t.getEpisodes(function(eps, error){
    assert.equal(false, error);
    t.episodes = eps;
    t._added = new Date().toISOString();
    _.each(t.episodes, function(e){e._added = t._added});
    col.insert(t, {safe:false});
    console.log('new title:', t);
  });
};

updateEpisodesOfTitle = function(t, found, col){
  t.getEpisodes(function(eps, error){
    assert.equal(false, error);
    var newEps = utils.objListDiff(eps, found.episodes,
    ["name", "url"]);
    var remEps = utils.objListDiff(found.episodes, eps,
    ["name", "url"]);
    //TODO something about remEps, episodes in db but not in source.
    var date = new Date().toISOString();
    _.each(newEps, function(e){e._added = date});
    col.update({'channel.name': t.channel.name,
      name: t.name,
      urlstr: t.urlstr
    }, {$pushAll: {episodes:newEps}},{safe:false});
    if(newEps.length > 0){
      console.log(t.name+" new episodes:", newEps); 
    }
  });
};

updateChannels = function(channels){
  core.db.open(function(err, db){
    assert.equal(null, err);
    db.collection('titles', function(err, col){
      _.each(channels, function(ch){
        ch.getTitles(function(res){
          _.each(res, function(t){
            titleExist(t, col, updateEpisodesOfTitle, addNewTitle);
          }); 
        });
      });
    });
  }); 
};

updateChannels([channels.tv4play, channels.svtplay]);
