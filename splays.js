
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

getEpisodesBetween = function(ch, d1, d2, callback){
  core.db.open(function(err, db){
    assert.equal(null, err);
    db.collection('titles', function(err, col){
      var chNames = _.pluck(ch, 'name');
      col.find({'channel.name': {$in: chNames},
                episodes: {$elemMatch: {_added: {$gte: d1, $lt: d2}}}
               }
               ,{'episodes':1}
        ).toArray(function(err, res){
        var ret = [];
        var len = res.length;
        for(var i = 0; i< len; i++){
          var newEps = _.filter(res[i].episodes, function(ep){
            return ep._added >= d1 && ep._added < d2;
          }); 
          ret = ret.concat(newEps);
        }
        callback(ret);
      });
    });
  });
};

getTitlesWithEpisodesBetween = function(ch, d1, d2, callback){
  core.db.open(function(err, db){
    assert.equal(null, err);
    db.collection('titles', function(err, col){
      var chNames = _.pluck(ch, 'name');
      col.find({'channel.name': {$in: chNames},
                episodes: {$elemMatch: {_added: {$gte: d1, $lt: d2}}}
               }
               //,{
               // name: 1,
               // 'episodes.name':1,
               // 'episodes._added':1}
        ).toArray(function(err, res){
        //console.log(res);
        var len = res.length;
        for(var i = 0; i< len; i++){
          res[i].newEps = _.filter(res[i].episodes, function(ep){
            return ep._added >= d1 && ep._added < d2;
          }); 
        }
        callback(res);
      });
    });
  });
};

var d1 = new Date();
d1.setDate(18);
d1.setHours(17);
d1.setMinutes(0);

var d2 = new Date();
d2.setDate(18);
d2.setHours(18);
d2.setMinutes(0);

//getEpisodesBetween([
//                    //channels.tv4play,
//                    channels.svtplay
//                    ], d1, d2,
//                   function(eps, err){
//                   _.each(eps, function(e){
//                    console.log("  "+e.name);
//                   });
//                     //process.exit();
//});


episodeOfDay = function(ch, d){
  var start = new Date(d.toString());
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  var end = new Date(start.toString());
  end.setDate(start.getDate()+1);

  getEpisodeBetween(ch, start, end, function(titles){
      _.each(titles, function(title){
        //_.each(title.newEps()
      });
  });

};

console.time("Update all");
updateChannels([channels.tv4play, channels.svtplay], function(err){
  console.timeEnd("Update all");
  process.exit();
});
