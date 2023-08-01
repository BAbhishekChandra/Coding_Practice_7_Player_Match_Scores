const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// GET API1 Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getAllPlayersList = `SELECT * FROM player_details ORDER BY player_id;`;
  const playersArray = await db.all(getAllPlayersList);
  //response.send(playersArray);
  const ans = (playersArray) => {
    return {
      playerId: playersArray.player_id,
      playerName: playersArray.player_name,
    };
  };
  response.send(playersArray.map((eachPlayer) => ans(eachPlayer)));
});

// GET API2 Returns a specific player based on the player ID.

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player_details = await db.get(getPlayerQuery);
  response.send({
    playerId: player_details.player_id,
    playerName: player_details.player_name,
  });
});

// PUT API3 Updates the details of a specific player based on the player ID.

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerDetails = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

// GET API4 Returns the match details of a specific match.

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchIdQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchResponse = await db.get(getMatchIdQuery);
  response.send({
    matchId: matchResponse.match_id,
    match: matchResponse.match,
    year: matchResponse.year,
  });
});

// GET API5 Returns a list of all the matches of a player.

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;
  const playerMatchesArray = await db.all(getPlayerMatchDetails);
  //response.send(playerMatchesArray);
  const ans = (playerMatchesArray) => {
    return {
      matchId: playerMatchesArray.match_id,
      match: playerMatchesArray.match,
      year: playerMatchesArray.year,
    };
  };
  response.send(playerMatchesArray.map((eachMatch) => ans(eachMatch)));
});

// GET API6 Returns a list of players of a specific match.

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const matchPlayerQueryResponse = await db.all(getMatchPlayersQuery);
  response.send(matchPlayerQueryResponse);
});

// GET API7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID.

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const getPlayerScoredResponse = await db.get(getPlayerScored);
  response.send(getPlayerScoredResponse);
});

module.exports = app;
