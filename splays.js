
var _ = require('underscore');
var utils = require('./utils');

//console.log(utils);

getAllTitlesAndEpisodes = function(ch){
  utils.getAllTitles(ch, function(titles, error){
     if(!error){
      //console.log(values);
      //var titles = titles.slice(4,20); //XXX
      return getEpisodes(ch, titles);
     } 
  });
};

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


//getAllTitlesAndEpisodes(utils.svtplay);
//utils.getAllTitles(utils.tv4play, function(titles, error){
//    console.log(titles);
    
//});
utils.getAllEpisodesOfTitle(utils.tv4play, '{baseUrl}/program/solsidan',
                            function(episodes, error){
    console.log(episodes);    
});

