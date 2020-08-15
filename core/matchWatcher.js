const fs = require("fs");
const axios = require('axios');
const { RichEmbed } = require("discord.js")
const champions = require('lol-champions')
const { TeamMembers } = require("../mySchema");
const { TeamMemberLoggedGames } = require("../mySchema");

module.exports.watchGames = function (client, channelId)  {
    let gameIds = [];
    TeamMemberLoggedGames.find(function (err, records) {
        if (err) return console.error(err);
        records.forEach(record => {
            gameIds.push(record.gameId);                
        });
    }).then( d => {
        TeamMembers.find(function (err, records) {
            if (err) return console.error(err);
            records.forEach(record => {
                getSummonerAccountID(client, record.summonerName, channelId).then(summoner => {
                    getLatestMatchFrom(client, summoner, channelId)
                        .then(match => {
                        
                        if (!match.id || gameIds.includes(match.id.toString())) {                            
                            return;
                        } 

                        let url = `https://eun1.api.riotgames.com/lol/match/v4/matches/${match.id}?api_key=${process.env.RIOT_API_KEY}`;
                        axios.get(url)
                        .then(function (response) {
                            // Loop through every player in match.
                            let participantId;
                            let summonerName;
                            response.data.participantIdentities.forEach(p => {
                                // Find our player.
                                if (p.player.accountId == summoner) {
                                    participantId = p.participantId;
                                    summonerName = p.player.summonerName;
                                    return;
                                }
                            });

                            // loop through every player details.
                            let victory;
                            let stats = [];
                            let champion;
                            let gameDuration = formatSecondsToMinutesAndSeconds(response.data.gameDuration);
                            response.data.participants.forEach(p => {
                                if (p.participantId == participantId) {
                                    victory = p.stats.win;
                                    stats['kills'] = p.stats.kills;
                                    stats['wardsPlaced'] = p.stats.wardsPlaced;
                                    stats['visionScore'] = p.stats.visionScore;
                                    stats['deaths'] = p.stats.deaths;
                                    stats['assists'] = p.stats.assists;
                                    champion = p.championId;
                                    stats['totalDamageDealtToChampions'] = p.stats.totalDamageDealtToChampions;
                                    stats['totalDamageDealt'] = p.stats.totalDamageDealt;
                                    stats['neutralMinionsKilled'] = p.stats.neutralMinionsKilled;

                                    if (p.stats.pentaKills > 0) {
                                        stats['killStatus'] = ':trophy: **PENTAKILL!!**'
                                    }
                                    else if (p.stats.quadraKills > 0) {
                                        stats['killStatus'] = ':skull_crossbones:  **Quadrakill!**'
                                    }
                                    else if (p.stats.tripleKills > 0) {
                                        stats['killStatus'] = ':fire: **Triple Kill!**'
                                    }
                                    else if (p.stats.doubleKills > 0) {
                                        stats['killStatus'] = '**Doublekill!**'
                                    }
                                    stats['pentaKills'] = p.stats.pentaKills;
                                    stats['quadraKills'] = p.stats.quadraKills;
                                    stats['tripleKills'] = p.stats.quadraKills;
                                    stats['doubleKills'] = p.stats.doubleKills;
                                    // role = p.timeline.role;
                                }
                            });

                            let vcolor;
                            if (victory) {
                                victory = 'Victory! :white_check_mark:';
                                vcolor = 'GREEN';
                            }

                            else {
                                victory = 'Defeat :boom:';
                                vcolor = 'RED';
                            }

                            let champion_avatar;
                            champions.forEach(c => {
                                if (c.key == champion) {
                                    champion = c.name;
                                    champion_avatar = c.icon
                                }
                            })
                            
                            // Check for killstatus.
                            let killStatus = '';
                            if (stats.killStatus) {
                                killStatus = ' with a ' + stats.killStatus;
                            }

                            // Style up message output.
                            const embed = new RichEmbed()
                                .setTitle(`${summonerName} with a ${victory}`)
                                .setAuthor(match.queue, 'https://lutris.net/media/games/icons/leagueoflegends-icon.png')
                                // .setImage(champion_avatar) 
                                .setTimestamp()
                                .setThumbnail(champion_avatar)
                                .setColor(vcolor)
                                .setDescription('Length: '+ gameDuration + killStatus);

                            // Lane.
                            embed.addField(
                                "LANE",
                                match.lane + ' with ' + champion,
                                false
                            )

                            // check if pentakill etc.
                            if (killStatus) {
                                embed.addField(
                                    "_Oh Snap!! :scream:_",
                                    stats.killStatus,
                                    false
                                )
                            }

                            // Stats.
                            embed.addField(
                                "K/D/A",
                                `_Kills_: **${stats.kills}** _Deaths_: **${stats.deaths}** _Assists_: **${stats.assists}**
                                `,
                                true
                            )
                            embed.addBlankField()
                            embed.addField(
                                "Ward Amount",
                                stats.wardsPlaced,
                                true
                            )

                            embed.addField(
                                "_Vision Score_",
                                stats.visionScore,
                                true
                            )

                            embed.addField(
                                "_Total Damage dealt_",
                                stats.totalDamageDealt,
                                false
                            )

                            embed.addField(
                                "_Total Damage dealt to Champions_",
                                stats.totalDamageDealtToChampions,
                                true
                            )

                            client.channels.get(channelId).send(embed);

                            stats = [];
                            TeamMemberLoggedGames.create({
                                gameId: match.id
                            });
                        })
                        .catch(function (error) {
                            client.channels.get(channelId).send("error");
                            console.log(error);
                            return array;
                        })                        
                    });
                });
            });
        });      
    });
}


function getSummonerAccountID(client, summonerName, channelId) {        
    let url = `https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURI(summonerName)}?api_key=${process.env.RIOT_API_KEY}`;
    return axios.get(url)
    .then(function (response) {
        // handle success
        return response.data.accountId;    
    })
    .catch(function (error) {
        // handle error
        client.channels.get(channelId).send("error");
        console.log(error);
        return array;
    })              
}

function formatSecondsToMinutesAndSeconds(s){return(s-(s%=60))/60+(9<s?':':':0')+s}

function getLatestMatchFrom(client, summonerId, channelId) {
    let array = [];
    let url = `https://eun1.api.riotgames.com/lol/match/v4/matchlists/by-account/${summonerId}?endIndex=1&beginIndex=0&api_key=${process.env.RIOT_API_KEY}`;
    return axios.get(url)
    .then(function (response) {
        // handle success
        let type = response.data.matches[0].queue;        
        switch (parseInt(type)) {
            case 420:
                type = 'Summoners Rift 5v5 (Ranked)';
                break;
            case 440:
                type = 'Summoners Rift 5v5 (Flex)';
                break;
            case 400:
                type = 'Summoners Rift 5v5 (Normal)';
                break;
            default:
                type = false;
                break;
        }
                
        if (!type) {
            return false;
        }

        array['id'] = response.data.matches[0].gameId;
        array['lane'] = response.data.matches[0].lane;
        array['champion'] = response.data.matches[0].champion;
        array['queue'] = type;
        return array;
    })
    .catch(function (error) {
        // handle error
        client.channels.get(channelId).send("error");
        console.log(error);
        
        return false;
    })
}
