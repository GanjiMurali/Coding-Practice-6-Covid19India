const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//1) GET State Details
app.get("/states/", async (request, response) => {
  const getStateDetailsQuery = `SELECT * FROM state;`;
  const dbResponse = await db.all(getStateDetailsQuery);
  const convertColumnNameSnakeCaseToPascalCase = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  let newStateArray = [];
  for (let stateDetails of dbResponse) {
    let state = convertColumnNameSnakeCaseToPascalCase(stateDetails);
    newStateArray.push(state);
  }
  response.send(newStateArray);
});
//2) GET State Details With ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const dbResponse = await db.get(getStateDetailsQuery);
  const convertColumnNameSnakeCaseToPascalCase = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  let state = convertColumnNameSnakeCaseToPascalCase(dbResponse);
  response.send(state);
});
//3) POST Create District
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictDetails = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const dbResponse = await db.run(addDistrictDetails);
  response.send("District Successfully Added");
});
//4) GET District Details With ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const dbResponse = await db.get(getDistrictQuery);
  const convertColumnNameSnakeCaseToPascalCase = (dbObject) => {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  };
  let districtDetails = convertColumnNameSnakeCaseToPascalCase(dbResponse);
  response.send(districtDetails);
});

//5) DELETE District With District ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//6) PUT Update District Details With District ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const getUpdateQuery = `UPDATE district SET district_name = '${districtName}',state_id = ${stateId},cases = ${cases},cured = ${cured},active = ${active},deaths = ${deaths}
  WHERE district_id = ${districtId};`;
  await db.run(getUpdateQuery);
  response.send("District Details Updated");
});

//7) GET State Statics With Id
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `SELECT cases, cured, active, deaths FROM district WHERE state_id = ${stateId};`;
  const dbResponse = await db.get(getStateDetailsQuery);

  const convertColumnNameSnakeCaseToPascalCase = (dbObject) => {
    return {
      totalCases: dbObject.cases,
      totalCured: dbObject.cured,
      totalActive: dbObject.active,
      totalDeaths: dbObject.deaths,
    };
  };
  let stateDetails = convertColumnNameSnakeCaseToPascalCase(dbResponse);

  response.send(stateDetails);
});

//8) GET State Name With District Id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT state_name FROM state JOIN district ON state.state_id = district.state_id WHERE district.district_id = ${districtId} `;
  const dbResponse = await db.get(getStateNameQuery);

  const convertColumnNameSnakeCaseToPascalCase = (dbObject) => {
    return {
      stateName: dbObject.state_name,
    };
  };

  let stateName = convertColumnNameSnakeCaseToPascalCase(dbResponse);
  response.send(stateName);
});
module.exports = app;
