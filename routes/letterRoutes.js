const mongoose = require("mongoose");
const Letter = mongoose.model("letters");
const User = mongoose.model("users");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");
const { report } = require("../services/error");

module.exports = (app) => {
  app.get("/letters", requireLogin, async (req, res, next) => {
    const q = JSON.parse(req.query.q);

    const { where, order } = q;

    console.log(q);
    // h_password
    const receiver = await User.findOne({ username: where._receiver });

    const letters = await Letter.find({ _receiver: receiver._id })
      .populate("_receiver _sender", "-h_password -_id -__v -contacts")
      .select("title content _sender _receiver dateSent dateRead isDraft")
      .catch((err) => {
        report(res, 400, "Error with query", err);
      });

    console.log(letters);

    if (letters === undefined) {
      report(res, 204, "There are no letters");
    }

    const params = order.split(" ");
    const field = params[0];

    const type = params[1];

    const comp = (a, b) => {
      const x = a[field];
      const y = b[field];

      const xt = typeof x;

      if (xt != typeof y) {
        report(res, 400, "The values being compared are not of the same type");
      }
      const cmp = (x, y) => {
        switch (xt) {
          case "string":
            return x.toLowerCase().localeCompare(y.toLowerCase());
          case "number":
            return x - y;
          case "boolean":
            return x && y ? 0 : x || y ? (x ? 1 : 0) : 0;

          case "object":
            // use instance of
            if (x instanceof Date && y instanceof Date) {
              return x.getTime() - y.getTime();
            }
          default:
            // Undefined, null, function, object, or otherwise
            report(res, 500, "Invalid field record", x);
            next();
        }
      };

      switch (type) {
        case "ASC":
          return cmp(x, y);
        case "DESC":
          return cmp(y, x);
        default:
          report(res, 400, "Invalid order query");
      }
    };

    res.status(200);
    res.send(letters.slice().sort(comp));
  });

  app.post("/letters", requireLogin, async (req, res) => {
    const { title, receiver, content, sender, isDraft } = req.body;

    const senderUser = await User.findOne({ username: sender });
    const receiverUser = await User.findOne({ username: receiver });
    console.log(senderUser);
    const payload = {
      _id: uuidv4(),
      title,
      dateSent: Date.now(),
      _sender: senderUser._id,
      _receiver: receiverUser._id,
      content,
      isDraft,
    };

    const newLetter = new Letter(payload);

    newLetter.save((err) => {
      if (err) console.log("An error occured\n\n", err);
    });
    res.status(200);
    res.send();
  });
};
