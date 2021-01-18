const keys = require("../config/keys");
const mongoose = require("mongoose");
const User = mongoose.model("users");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");
const bcrypt = require("../services/bcrypt");
const jwt = require("jsonwebtoken");
const { report } = require("../services/error");
const { emailRe } = require("../services/regex");
const Mailer = require("../services/email/Mailer");
const Mailer2 = require("../services/email/Mailer2");
// const resetTemplate = require("../services/email/resetTemplate");
const { resetLinkId } = require("../services/email/templateIds");

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
            const user = { username };
            const token = jwt.sign({ user }, keys.jwtSecret, {
              expiresIn: "12h",
            });

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

    if (query) {
      report(res, 422, "Username unavailable");
    } else {
      bcrypt.hashPass(password, hashCallback);
    }
  });

  app.post("/auth/reset", async (req, res) => {
    const { username_email } = req.body;

    if (emailRe.test(username_email)) {
      var email = { email: username_email };
    } else {
      var username = username_email;
    }

    const user = await User.findOne({ ...email }).catch((err) => {
      if (err) {
        report(res, 400, "User does not exist", err);
      }
    });

    if (!user) {
      report(res, 400, "User does not exist", err);
    }

    const token = jwt.sign({ _id: user._id }, keys.passResetSecret, {
      expiresIn: "20m",
    });

    User.updateOne({ _id: user._id }, { resetLink: token });

    // Grab reset link

    // const emailData = await User.findOne({ email });
    // Send mail

    const templateData = {
      firstName: "Jacob",
      resetLink: "",
    };

    const options = {
      recipients: [{ email: "jacobmiller22@vt.edu" }],
      subject: "Reset Password",
      template_id: resetLinkId,
      dynamic_template_data: templateData,
    };

    const mailer2 = new Mailer2(options);
    mailer2.send().catch((err) => {
      console.log(err);
    });
    res.status(202);
    res.send();
  });
};
