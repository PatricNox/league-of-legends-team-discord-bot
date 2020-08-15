const { Command } = require("discord.js-commando");
const { RichEmbed } = require("discord.js")
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");

module.exports = class RiotAPICommand extends Command {
    constructor(client) {
        super(client, {
        name: "schedule",
        aliases: ["team-schedule"],
        group: "fun",
        memberName: "lol_team",
        guildOnly: true,
        description: "Announce a new scheduled team game."
        })
    }

    run(msg) {
        const args = msg.content.slice('.'.length).split(' ');

        let teamMode = args[1];
        switch (teamMode.toLowerCase()) {
            case 'coreteam':
                teamMode = 'Rift Core Team - '
                break;
            case 'subteam':
                teamMode = 'Rift Substitute - '
                break;
            default:
                teamMode = false;
                break;
        }

        let gameMode = args[2];
        
        switch (gameMode.toLowerCase()) {
            case 'training':
            case 'ranked':
            case 'competive':
                gameMode = gameMode;
                break;
            default:
                gameMode = false;
                break;
        }

        let weekDay = args[3];
        let time = args[4];

        if (!teamMode || !gameMode || !weekDay || !time) {
            msg.channel.send(
                'Invalid argument, see list below. \n'
                + '.schedule [teamMode] [gameMode] {WeekDay} {Time}'
                + '```'
                + 'Team Modes: \n'
                    + '- Core Team (coreteam) \n'
                    + '- Sub Team (subteam) \n'
                +'\n\n'
                +'Game Modes: \n'
                    +'- Training Mode (training) \n'
                    +'- Ranked Mode (ranked) \n'
                    +'- Competive Mode (competive) \n'
               +'```'
            )
        }

        // Style up message output.
        const embed = new RichEmbed()
            .setTitle(teamMode + gameMode.toUpperCase())
            .setAuthor('Schemalagd Team spel!', 'https://lutris.net/media/games/icons/leagueoflegends-icon.png')
            .setDescription(weekDay + ' ' + time)
            .setThumbnail('https://lutris.net/media/games/icons/leagueoflegends-icon.png')
            .setColor(0x0000ff);

        // Information field.
        embed.addField(
            "INFORMATION",
            'Reagera nedan om du kan komma eller ej!',
            true
        )    
        
        msg.member.guild.channels.find(c => c.id == process.env.SCHEDULE_CHANNEL).send(embed)
        .then(function (message) {
            message.react('✅');
            setTimeout(() => {
                message.react('❌');    
            }, 400);
          }).catch(function() {
            console.log("error when reacting");
            });
    }
}
