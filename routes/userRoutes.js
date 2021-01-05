const mongoose = require("mongoose");
const Letter = mongoose.model("letters");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");

module.exports = (app) => {
  app.get("/letters", requireLogin, async (req, res) => {
    const query = await Letter.find(req.query);

    res.status(200);
    res.send(query);
  });

  app.post("/letters", requireLogin, async (req, res) => {
    const { title, receiver, content, sender } = req.body;

    const payload = {
      _id: uuidv4(),
      title,
      date: new Date(),
      sender,
      receiver,
      content,
      isDraft: false,
    };

    const newLetter = new Letter(payload);

    newLetter.save((err) => {
      if (err) console.log("An error occured\n\n", err);
    });
    res.status(200);
    res.send();
  });
};
