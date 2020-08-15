const fs = require("fs");
const axios = require('axios');
const { RichEmbed } = require("discord.js")

module.exports.checkServerStatus = function (client, channelId) { 
    console.log("checking server status...");
    let url = `https://eun1.api.riotgames.com/lol/status/v3/shard-data?api_key=${process.env.RIOT_API_KEY}`;
    axios.get(url)
    .then(function (data) {
        // handle success
        const { ServerStatus } = require("../mySchema");
        let array = [];
        let newIds = [];

        ServerStatus.find(function (err, records) {
            if (err) return console.error(err);
            records.forEach(record => {
                array.push(record.incidentId);                
            });
          });

          // Find is await, hack to become async.
          setTimeout(() => {
            newIds = checkResponse(client, data, array, channelId);
            if (newIds.length > 0) {
                newIds.forEach(id => {
                    console.log("adding "+id);
                    
                    ServerStatus.create({
                        incidentId: id
                    });
                });
            }
          }, 600);

        return 
    })
    .catch(function (error) {
        // handle error
        client.channels.get(channelId).send("error");
        console.log(error);
        
        return
    })
};

function checkResponse(client, data, arr, channelId) {
    let response = data;
    let array = arr;
    let newIdArray = [];
    response.data.services.forEach(itr => {
        if (itr.incidents.length > 0) {      
            let incidentName = itr.name;
            let incidentStatus = itr.status;          
            itr.incidents.forEach(itr => {
                // incidents.push(itr)
                itr.updates.forEach(incident => {                    
                    if (!array.includes(incident.id)) {
                        const embed = new RichEmbed()
                            .setTitle(incident.heading)
                            .setAuthor(response.data.name, 'https://lutris.net/media/games/icons/leagueoflegends-icon.png')
                            .setThumbnail('https://lutris.net/media/games/icons/leagueoflegends-icon.png')
                            .setDescription(incident.content)
                            .setColor('BLUE');

                        embed.addField(
                            "STATUS",
                            incidentStatus,
                            true
                        )

                        embed.addField(
                            "SEVERITY",
                            incident.severity,
                            true
                        )

                        client.channels.get(channelId).send(embed);

                        // store id in array so it can't be announced again.
                        newIdArray.push(incident.id)
                    }
                });
            });
        }
    });

    return newIdArray;
}
