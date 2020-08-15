require("dotenv").config()
const path = require("path")
const dateformat = require("dateformat")
const { CommandoClient } = require("discord.js-commando")
var srv = require('./core/lolstatus');
var game = require('./core/matchWatcher');

const client = new CommandoClient({
  owner: process.env.OWNER_ID,
  commandPrefix: process.env.COMMAND_PREFIX,
  unknownCommandResponse: false,
})

const { UserActivity } = require("./mySchema")

active_members = {}

client.registry
  .registerDefaultTypes()
  .registerGroups([
    ["util", "Utility commands"],
    ["fun", "Fun commands."]
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    help: false,
  })
  .registerCommandsIn(path.join(__dirname, "commands"))

client.on("ready", () => {
  console.log(`Logged in as ${client.user.username}`)
  client.user.setActivity(process.env.BOT_STATUS, { type: process.env.BOT_STATUS_TYPE });

  (function _scheduler() {
    srv.checkServerStatus(client, process.env.SERVER_STATUS_CHANNEL);
    game.watchGames(client, process.env.FEEDS_CHANNEL);
    setTimeout(() => { _scheduler();}, 60000);
  }());
})

client.on("voiceStateUpdate", async (before, after) => {
  try {
    const { id, username } = after.user
    const curTime = new Date().getTime()
    const curMonth = dateformat(new Date(), "yyyy mm")
    if (!before.voiceChannel && after.voiceChannel) {
      active_members[id] = curTime
    } else if (
      before.voiceChannel &&
      !after.voiceChannel &&
      active_members[id]
    ) {
      const timeDelta = curTime - active_members[id]
      const member_activity = await UserActivity.findOne({
        member: id,
        month: curMonth
      })
      if (!member_activity) {
        await UserActivity.create({
          member: id,
          name: username,
          month: curMonth,
          active_time: timeDelta
        })
      } else {
        await UserActivity.updateOne(
          { member: id, month: curMonth },
          { active_time: member_activity.active_time.toNumber() + timeDelta }
        )
      }
      delete active_members[id]
    }
  } catch (e) {
    console.log(e)
  }
})

client.on("guildMemberAdd", member => {
  const { guild } = member
  if (guild && guild.available) {
    const channel = guild.channels.find(ch => ch.name == process.env.GENERAL_NAME)
    if (channel) {
      channel.send(`Welcome ${member.user.username}!`)
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
