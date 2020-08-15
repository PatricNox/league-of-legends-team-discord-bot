const mongoose = require("mongoose")
require("mongoose-long")(mongoose)

const schemaTypes = mongoose.Schema.Types

mongoose.connect(`${process.env.MONGO_HOST_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const UserActivitySchema = new mongoose.Schema({
  member: schemaTypes.Long,
  name: String,
  month: String,
  active_time: schemaTypes.Long
})

const ServerStatusSchema = new mongoose.Schema({
  incidentId: String,
})

const TeamMembersSchema = new mongoose.Schema({
  summonerName: String,
})

const TeamMemberLoggedGamesSchema = new mongoose.Schema({
  gameId: String,
})

module.exports.UserActivity = mongoose.model(
  "user_activity",
  UserActivitySchema
)


module.exports.ServerStatus = mongoose.model(
  "server_status",
  ServerStatusSchema
)

module.exports.TeamMembers = mongoose.model(
  "team_members",
  TeamMembersSchema
)

module.exports.TeamMemberLoggedGames = mongoose.model(
  "team_members_logged_games",
  TeamMemberLoggedGamesSchema
)
