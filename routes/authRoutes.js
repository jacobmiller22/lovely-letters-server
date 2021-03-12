const keys = require("../config/keys");
const mongoose = require("mongoose");
const User = mongoose.model("users");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");
const bcrypt = require("../services/bcrypt");
const jwt = require("jsonwebtoken");
const { report } = require("../services/error");
const { emailRe } = require("../services/regex");
const { buildResetLink } = require("../services/linkBuilder");
const Mailer = require("../services/email/Mailer");
const Mailer2 = require("../services/email/Mailer2");
// const resetTemplate = require("../services/email/resetTemplate");
const { resetLinkId } = require("../services/email/templateIds");

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

module.exports = (app) => {
  app.get("/auth", async (req, res) => {
    console.log("GET REQUEST @ /auth");
    const { username, password } = JSON.parse(req.query.user);

    const query = await User.findOne({ username });

    // Encrypt pasword
    const hashCallback = (err, comp) => {
      if (err !== undefined) {
        // Something went wrong
        report(res, 500);
        return;
      }
      if (!comp) {
        report(res, 401);
        return;
      }
      // Valid Password, Sign jwt
      const user = { username };
      const token = jwt.sign({ user }, keys.jwtSecret, {
        expiresIn: "12h",
      });

      res.json({ token });
    };

    // Compare query password with our hash
    if (query) {
      bcrypt.compHash(password, query.h_password, hashCallback);
    } else {
      report(res, 401);
      return;
    }
  });

  app.post("/auth", async (req, res) => {
    const { username, password } = req.body;

    const query = await User.findOne({ username });

    const hashCallback = (err, h_password) => {
      if (err !== undefined) {
        report(res, 500);
        return;
      }
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
          report(res, 500);
        }
      });
      report(res, 200);
      return;
    };

    if (query) {
      report(res, 422);
      return;
    } else {
      bcrypt.hashPass(password, hashCallback);
    }
  });

  // Sends a reset link to the user via email
  app.put("/auth", async (req, res) => {
    const { username_email } = req.query;

    if (emailRe.test(username_email)) {
      var email = { email: username_email };
    } else {
      var username = { username: username_email };
    }

    try {
      var user = await User.findOne(email ? { ...email } : { ...username });
    } catch (err) {
      report(res, 500);
    }

    if (!user) {
      report(res, 202);
      return;
    }

    const token = jwt.sign({ _id: user._id }, keys.passResetSecret, {
      expiresIn: "20m",
    });

    try {
      await User.updateOne({ _id: user._id }, { resetLink: { _id: token } });
    } catch (err) {
      report(res, 500);
      return;
    }

    const templateData = {
      firstName: user.username,
      resetLink: buildResetLink(token),
    };

    const options = {
      recipients: [{ email: user.email }],
      subject: "Reset Password",
      template_id: resetLinkId,
      dynamic_template_data: templateData,
    };

    try {
      const mailer2 = new Mailer2(options);
      var mailerRes = await mailer2.send();
    } catch (err) {
      report(res, 500);
      return;
    }

    report(res, 202);
  });

  // Reset user password with a valid token
  app.patch("/auth", async (req, res) => {
    const { tok, new_password } = req.query;

    const decodedTok = jwt.decode(tok);

    if (Date.now() > decodedTok.exp * 1000) {
      report(res, 401, "Token expired");
      return;
    }

    const hashCallback = (err, h_password) => {
      if (err === undefined) {
        (async () => {
          await User.findByIdAndUpdate(decodedTok._id, { h_password });
        })();
      } else {
        report(res, 500);
        return;
      }
    };

    bcrypt.hashPass(new_password, hashCallback);
    report(res, 200);
  });
};
