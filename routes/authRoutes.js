const keys = require("../config/keys");
const mongoose = require("mongoose");
const User = mongoose.model("users");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");
const bcrypt = require("../services/bcrypt");
const jwt = require("jsonwebtoken");

module.exports = (app) => {
  app.get("/auth", async (req, res) => {
    console.log("GET REQUEST @ /letters");
    const { username, password } = JSON.parse(req.query.user);
    // Encrypt pasword
    const hashCallback = (err, comp) => {
      if (err === undefined) {
        // all is good
        (async () => {
          if (comp) {
            // Valid Password, Sign jwt
            console.log("Valid");
            // Send currUser details
            const user = { username };
            const token = jwt.sign({ user }, keys.jwtSecret);

            res.json({ token });
          } else {
            res.sendStatus(401);
          }
        })();
      } else {
        // Something went wrong
        console.log("There has been an error with bcrypt:\n\n", err);
        res.status(500);
        res.send("Something went wrong");
      }
    };

    const query = await User.find({ username });
    // Compare query password with our hash
    if (query.length != 1) {
      // Throw error
    } else {
      bcrypt.compHash(password, query[0].h_password, hashCallback);
    }
  });

  app.post("/auth", async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    const hashCallback = (err, h_password) => {
      if (err === undefined) {
        // all is good
        (async () => {
          const payload = {
            _id: uuidv4(),
            username,
            h_password,
            dateCreated: new Date(),
            contacts: [],
          };
          const newUser = new User(payload);

          newUser.save((err) => {
            if (err)
              console.log("An error occured with mongo/mongoose\n\n", err);
          });
          res.status(200);
          res.send();
        })();
      } else {
        // Something went wrong
        console.log("There has been an error with bcrypt:\n\n", err);
        res.status(500);
        res.send("Something went wrong");
      }
    };
    bcrypt.hashPass(password, hashCallback);
  });
};
