const express = require("express");
const app = express();
app.use(express.json());
let bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const sqlite = require("sqlite");
const { open } = sqlite;
const sqlite3 = require("sqlite3");

let db;

let initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost/3000/");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
initializeDBServer();

// register api
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let selectUser = `select * from user where username = '${username}'`;
  selectUser = await db.get(selectUser);

  if (selectUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedPassword = await bcrypt.hash(password, 10);
      let insertQuery = `INSERT INTO user values(
            '${username}','${name}','${hashedPassword}','${gender}','${location}'
        )`;
      db.run(insertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// login api

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  let user = `select * from user where username = '${username}'`;
  user = await db.get(user);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let validPassword = await bcrypt.compare(password, user.password);
    console.log(validPassword);
    if (validPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// change password api

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  let user = `select * from user where username = '${username}'`;
  user = await db.get(user);
  console.log(user);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user!");
  } else {
    let validPassword = await bcrypt.compare(oldPassword, user.password);
    if (validPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        let hashPassword = await bcrypt.hash(newPassword, 10);
        let updateQuery = `UPDATE user SET
                                          password = '${hashPassword}'
                                        WHERE username = '${username}'`;
        db.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
