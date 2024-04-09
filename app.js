const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB Error: ${e}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Get players api-1
app.get("/players/", async (request, response) => {
  const playersQuery = `SELECT player_id AS playerId, player_name AS playerName FROM player_details;`;
  const playersQueryResponse = await db.all(playersQuery);
  response.send(playersQueryResponse);
});

//get player api-2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT player_id AS playerId, player_name AS playerName FROM player_details WHERE player_id = ${playerId};`;
  const playerQueryResponse = await db.get(playerQuery);
  response.send(playerQueryResponse);
});

//put player api-3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `
      UPDATE 
        player_details 
      SET 
        player_name = '${playerName}' 
      WHERE 
        player_id = ${playerId};
    `;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

// get matches api-4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchesQuery = `SELECT match_id AS matchId, match, year FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(matchesQuery);
  response.send(matchDetails);
});

//get players api-5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `SELECT match_id AS matchId, match, year FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;
  const playerMatchResponse = await db.all(playerMatchesQuery);
  response.send(playerMatchResponse);
});

//get matches api-6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchesQuery = `
    SELECT player_match_score.player_id AS playerId, player_name AS playerName
    FROM player_details INNER JOIN player_match_score ON player_match_score.player_id = player_details.player_id
    WHERE match_id = ${matchId};
  `;
  const matchesQueryResponse = await db.all(matchesQuery);
  response.send(matchesQueryResponse);
});

//get playerScores api-7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const scoresQuery = `
      SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
      FROM
        player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
      WHERE
        player_details.player_id = ${playerId};`;
  const scoresQueryResponse = await db.get(scoresQuery);
  response.send(scoresQueryResponse);
});

module.exports = app;
