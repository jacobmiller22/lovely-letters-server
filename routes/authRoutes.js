const keys = require("../config/keys");
const mongoose = require("mongoose");
const User = mongoose.model("users");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");
const bcrypt = require("../services/bcrypt");
const jwt = require("jsonwebtoken");
const { report } = require("../services/error");

module.exports = (app) => {
  app.get("/auth", async (req, res) => {
    console.log("GET REQUEST @ /auth");
    const { username, password } = JSON.parse(req.query.user);

    const query = await User.findOne({ username });

    // Encrypt pasword
    const hashCallback = (err, comp) => {
      if (err === undefined) {
        (async () => {
          if (comp) {
            // Valid Password, Sign jwt
            console.log("Valid");
            // Send currUser details
            const user = { username };
            const token = jwt.sign({ user }, keys.jwtSecret);

            res.json({ token });
          } else {
            report(res, 401, "Invalid credentials", err);
          }
        })();
      } else {
        // Something went wrong
        report(res, 500, "There has been an error with bcrypt", err);
      }
    };

    // Compare query password with our hash
    if (query) {
      bcrypt.compHash(password, query.h_password, hashCallback);
    } else {
      report(res, 401, "Invalid credentials");
    }
  });

  app.post("/auth", async (req, res) => {
    const { username, password } = req.body;

    const query = await User.findOne({ username });

    const hashCallback = (err, h_password) => {
      if (err === undefined) {
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
            if (err) {
              report(
                res,
                500,
                "An error occured while saving to the database",
                err
              );
            }
          });
          res.status(200);
          res.send();
        })();
      } else {
        report(res, 500, "There has been an error with bcrypt", err);
      }
    };

    if (query.length < 1) {
      bcrypt.hashPass(password, hashCallback);
    } else {
      report(res, 422, "Username unavailable");
    }
  });
};
