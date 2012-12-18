
var assert = require('assert');

var _ = require('underscore');
var async = require('async');
var mongodb = require('mongodb');

var core = require('./core');
var utils = require('./utils');
var channels = require('./channels');

/*
 *  t: title object
 *  col: reused db collection
 *  pos: positive callback, if exists
 *  neg: negative callback, not exists
 */
titleExist = function(t, col, pos, neg, callback){
  col.findOne({'channel.name': t.channel.name, name: t.name, urlstr: t.urlstr},
              function(err, found){
      if(found == null){
        neg(t, col, callback);
      } else {
        pos(t, found, col, callback); 
      }
  });
};

addNewTitle = function(t, col, callback){
  t.getEpisodes(function(eps, error){
    assert.equal(false, error);
    t.episodes = eps;
    t._added = new Date();
    _.each(t.episodes, function(e){e._added = t._added});
    col.insert(t, callback);
    console.log('new title:', t);
  });
};

updateEpisodesOfTitle = function(t, found, col, callback){
  t.getEpisodes(function(eps, error){
    assert.equal(false, error);
    var newEps = utils.objListDiff(eps, found.episodes,
    ["name", "url"]);
    var remEps = utils.objListDiff(found.episodes, eps,
    ["name", "url"]);
    //TODO something about remEps, episodes in db but not in source.
    var date = new Date();
    _.each(newEps, function(e){e._added = date});
    col.update({'channel.name': t.channel.name,
      name: t.name,
      urlstr: t.urlstr
    }, {$pushAll: {episodes:newEps}}, callback);
    if(newEps.length > 0){
      console.log(t.name+" new episodes:"); 
      //console.log("episodes from source: ", eps);
      //console.log("episodes from db: ", found.episodes);
      console.log("episodes diff: ", newEps);
    }
  });
};
updateChannels = function(channels, callback){
  core.db.open(function(err, db){
    assert.equal(null, err);
    db.collection('titles', function(err, col){
      _.each(channels, function(ch){
        ch.getTitles(function(res){
          async.forEach(res, function(t, callback){
            titleExist(t, col, updateEpisodesOfTitle, addNewTitle, callback);
          }, callback); 
        });
      });
    });
  }); 
};

console.time("Update all");
updateChannels([channels.tv4play, channels.svtplay], function(err){
  console.timeEnd("Update all");
  process.exit();
});
