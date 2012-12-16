
var _ = require('underscore');
var utils = require('./utils');
var channels = require('./channels');

getEpisodes = function(ch, titles){
  console.time(ch.name + " ("+ titles.length+" titles) getEpisodes");
  var completedTitles = 0; 
  var episodeTotal = 0;
  _.each(titles, function(title){
    utils.getAllEpisodesOfTitle(ch, title.url,
      function(episodes, error){
        if(!error){
          title.episodes = episodes;
          episodeTotal += episodes.length;
        }
        if(++completedTitles == titles.length){
          //console.log(some);
          console.timeEnd(ch.name + " ("+ titles.length+" titles) getEpisodes");
          console.log('Total episodes: ' + episodeTotal);
          return titles;
        }
      });
  });
};

//channels.svtplay.getTitles(function(res, error){
//    console.log(res);
//    console.log(res[18].getURL());
//utils.svtplay.getEpisodes(res[18], function(res, error){
//    console.log(res);  
//});
//    res[13].getEpisodes(function(eps){
//        console.log(eps);
//    });
//});

channels.tv4play.getTitles(function(res){
  console.log(res);
  res[res.length-1].getEpisodes(function(res){console.log(res)})
});

