const mongoose = require("mongoose");
const Letter = mongoose.model("letters");
const User = mongoose.model("users");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");
const { report } = require("../services/error");

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

module.exports = (app) => {
  app.get("/letters", requireLogin, async (req, res, next) => {
    const q = JSON.parse(req.query.q);

    const { where, order, select } = q;

    const createSelect = (select) => {
      let sel = "";
      select.forEach((ele) => {
        sel += " " + ele;
      });
      return sel.trim();
    };

    if (where._receiver) {
      var name = "_receiver";
      var poi_user = where._receiver;
    } else if (where._sender) {
      var name = "_sender";
      var poi_user = where._sender;
    } else {
      var name = "";
      var poi_user = "";
    }

    const poi = await User.findOne({ username: poi_user }).select("_id");

    const showDrafts = () => {
      if (req.user.username === poi_user && name === "_sender") {
        // Requesting about self, allow unpublished letters
        if (where.isDraft) {
          return { isDraft: true };
        }
        return {};
      }
      return { isDraft: false };
    };

    const letters = await Letter.find({
      ...where,
      [name]: poi._id,
      ...showDrafts(),
    })
      .populate("_receiver _sender", "-h_password -_id -__v -contacts")
      .select(createSelect(select))
      .catch((err) => {
        report(res, 400, "Error with query", err);
      });

    if (letters === undefined) {
      report(res, 204, "There are no letters");
    }

    if (!order) {
      console.log("--------------------");
      console.log(letters);
      res.status(200);
      res.send(letters.slice());
      return;
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

  app.get("/letter", requireLogin, async (req, res) => {
    const q = req.query;
    const { _id } = q;

    try {
      var letter = await Letter.findById(_id).populate(
        "_receiver _sender",
        "-h_password -_id -__v -contacts"
      );
    } catch (err) {
      res.status(403);
      res.send();
    }

    res.status(200);
    res.json(letter);
  });

  app.post("/letter", requireLogin, async (req, res) => {
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

  app.delete("/letter", requireLogin, async (req, res) => {
    const q = req.query;
    const { _id } = q;

    try {
      var letter = await Letter.findByIdAndDelete(_id);
    } catch (err) {
      res.status(403);
      res.send();
    }

    res.status(200);
    res.send();
  });
};
