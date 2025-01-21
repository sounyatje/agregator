let https = require('https');
const filestream = require('fs'); 

const express = require('express'); 
const app = express(); 
const parseString = require("xml2js").parseString;

let megaJSON = new Object ()

app.set('view engine', 'ejs'); 

app.use('/', express.static(__dirname+ "/htdocs" )); 


app.listen(8000, function() { 
    console.log('server is running and Listening on port 8000'); 

   });

app.get('/',function(request,response) { 
    console.log(megaJSON)
   response.render('index.ejs', megaJSON)
   });

   refreshlFoatrates()
   refreshAirQuality();
   refreshWeather();
   refreshRSSLemonde();
   refreshCrunchyrollRSS()
   setInterval( refreshWeather, 60 * 60 * 1000); 
   setInterval(refreshRSSLemonde, 30 * 60 * 1000);
   setInterval( refreshAirQuality, 60 * 60 * 1000);
   setInterval(refreshlFoatrates, 60 * 60 * 1000); 
   setInterval(refreshCrunchyrollRSS, 60 * 60 * 1000);

   function refreshWeather() {

    // Client de l'API : 
    // https://api.open-meteo.com/v1/forecast?latitude=50.85&longitude=4.35&hourly=temperature_2m
    
    let request = {
        "host": "api.open-meteo.com",
        "port": 443,
        "path": "/v1/forecast?latitude=50.85&longitude=4.35&hourly=temperature_2m"
        };
    
    https.get(request,receiveResponseCallback);
    
    function receiveResponseCallback(response) {
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', function() { 
            let weatherJSON = JSON.parse(rawData);
            let newWeatherJSON = {
                forecast: []
            };
    
            for (let i = 0; i < weatherJSON.hourly.time.length; i++) {
                newWeatherJSON.forecast.push({
                    time: weatherJSON.hourly.time[i],
                    temperature: weatherJSON.hourly.temperature_2m[i]
                });
            }
    
            // Correction de la syntaxe de writeFile et son callback
            filestream.writeFile('./cache/newWeather.json', JSON.stringify(newWeatherJSON, null, "\t"), function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("News du monde à jour " + new Date());
                }
            });
    
            // Correction de l'affectation de megaJSON
            megaJSON.weather = newWeatherJSON;
        });
    }
}

function refreshRSSLemonde() {
    let request = {
      host: "www.lemonde.fr",
      port: 443,
      path: "/cinema/rss_full.xml",
    };
  
    https.get(request, receiveResponseCallback);
  
    function receiveResponseCallback(response) {
      let rawData = " ";
  
      response.on("data", (chunk) => {
        rawData += chunk;
      });
      response.on("end", function (chunk) {
        let rssLeMondeJSON = { item: [] };
        parseString(rawData, function (err, result) {
          //for(i in result.rss.channel[0].item) {
          //for (let i = 0; i < result.rss.channel[0].item.length; i++) {
          for(const item of result.rss.channel[0].item){
            rssLeMondeJSON.item.push({
              title: item.title[0],
              pubDate: item.pubDate[0],
              description: item.description[0],
              link: item.link[0],
              imageUrl: item["media:content"][0].$.url,
            });
            //   console.log(result.rss.channel[0].item[i].title[0]);
            // }
          }
          filestream.writeFile("./cache/rsslemonde.json",JSON.stringify(rssLeMondeJSON, null, "\t"),
            function (err) {
              if (err) console.log(err);
              else console.log("news du monde à jour" + new Date ());
            }
          );
          megaJSON.lemonde = rssLeMondeJSON
        });
      });
    }
  }

  function refreshAirQuality() {

    // Client de l'API : 
    // https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.5235&longitude=13.4115&hourly=pm10,pm2_5
    
    let request = {
        "host": "air-quality-api.open-meteo.com",
        "port": 443,
        "path": "/v1/air-quality?latitude=52.5235&longitude=13.4115&hourly=pm10,pm2_5"
        };
    
    https.get(request,receiveResponseCallback);
    
    function receiveResponseCallback(response) {
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', function(chunk) { 
            let airQualityJSON = JSON.parse(rawData);
            let newAirQualityJSON = {
                forecast: []
             };

             for(i=0; i< airQualityJSON.hourly.time.length; i++){
                newAirQualityJSON.forecast.push({
                    time:airQualityJSON.hourly.time[i],
                    airquality:airQualityJSON.hourly.pm10[i]

                })
             }
        
    
            filestream.writeFile('./cache/airquality.json', JSON.stringify(newAirQualityJSON, null, "\t"),
                function (err) {
                    if (err) console.log(err);
                    else console.log("File saved");
                    }
                ); 
                megaJSON.airquality = newAirQualityJSON
            });
        }
}

function refreshFloatRates() {
  let request = {
      host: "www.floatrates.com",
      port: 443,
      path: "/daily/eur.json",
  };

  https.get(request, receiveResponseCallback);

  function receiveResponseCallback(response) {
      let rawData = " ";
      response.on("data", (chunk) => {
          rawData += chunk;
      });
      response.on("end", function (chunk) {
          let floatratesJSON = JSON.parse(rawData);
          let newFloatratesJSON = { floatrates: [] };

          for (let key in floatratesJSON) {
              newFloatratesJSON.floatrates.push({
                  currency: floatratesJSON[key].code,
                  rate: floatratesJSON[key].rate,
                  name: floatratesJSON[key].name,
                  flagUrl: `https://flagcdn.com/w40/${floatratesJSON[key].code.toLowerCase()}.png`
              });
          }

          filestream.writeFile("./cache/floatrates.json", JSON.stringify(newFloatratesJSON, null, "\t"), function (err) {
              if (err) {
                  console.log(err);
              } else {
                  console.log("Floatrates à jour " + new Date());
              }
          });

          megaJSON.floatrates = newFloatratesJSON;
      });
  }
}

app.get('/', function(request, response) {
  console.log(megaJSON); // Vérifiez si megaJSON contient bien toutes les données
  response.render('index.ejs', megaJSON);
});

  
  function refreshCrunchyrollRSS() {
    let request = {
        host: "feeds.feedburner.com",
        port: 443,
        path: "/crunchyroll/rss?lang=frFR",
    };

    https.get(request, receiveResponseCallback);

    function receiveResponseCallback(response) {
        let rawData = " ";
        //console.log('Got response:' + response.statusCode);
        response.on("data", (chunk) => {
            rawData += chunk;
        });

        response.on("end", function () {
            let rssCrunchyrollJSON = { item: [] };
            parseString(rawData, function (err, result) {
                if (err) {
                    console.error("Erreur lors du parsing XML :", err);
                    return;
                }

                for (const item of result.rss.channel[0].item) {
                    rssCrunchyrollJSON.item.push({
                        title: item.title[0],
                        pubDate: item.pubDate[0],
                        description: item.description[0],
                        link: item.link[0],
                        imageUrl: item["media:content"][0].$.url,
                    });
                }

                // Sauvegarde dans un fichier JSON
                filestream.writeFile(
                    "./cache/rsscrunchyroll.json",
                    JSON.stringify(rssCrunchyrollJSON, null, "\t"),
                    function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("File saved");
                        }
                    }
                    //megaJSON.rsscrunchyroll = rssCrunchyrollJSON
                );
            });
        });
    }
}



let request = {
    host: "api.irail.be",
    port: 443,
    path: "/v1/liveboard/?id=BE.NMBS.008812005&lang=fr&format=json",
  };
  
  https.get(request, receiveResponseCallback);
  
  // function receiveResponseCallback(response) {
  //     console.log('Got response:' + response.statusCode);
  //     } status code pour savoir si ca marche
  
  function receiveResponseCallback(response) {
    let rawData = " ";
    //console.log('Got response:' + response.statusCode);
    response.on("data", (chunk) => {
      rawData += chunk;
    });
    response.on("end", function (chunk) {
      let liveboardJSON = JSON.parse(rawData);
      for (i = 0; i < liveboardJSON.departures.departure.length; i++) {
        let heure = new Date(
          parseInt(liveboardJSON.departures.departure[i].time) * 1000
        );
        heure = heure.toLocaleTimeString("fr-BE");
        let station = liveboardJSON.departures.departure[i].station;
        let quai = liveboardJSON.departures.departure[i].platform;
        let retardEnMinutes = liveboardJSON.departures.departure[i].delay / 60;
        console.log(
          heure + " " + station + " " + quai + " " + retardEnMinutes + "'"
        );
      }
      filestream.writeFile('./cache/liveboard.json', JSON.stringify(liveboardJSON),
        function (err) {
          if (err) console.log(err);
          else console.log("File saved");
        }
      );
      megaJSON.liveboard = liveboardJSON
    });
  }
  