const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
let bodyParser = require("body-parser");

require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

//creates user
app.post("/api/users", (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save((err, user) => {
    if (err) return err;
    res.json({ username: user.username, _id: user._id });
  });
});

//get all users
app.get("/api/users", (req, res) => {
  User.find((err, users) => {
    if (err) return err;
    res.json(users);
  });
});

//post exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  User.findById(req.params._id, (err, data) => {
    if (err) {
      res.json({ error: "Invalid user ID" });
      return;
    }

    const todayDate = new Date();
    const formattedDate = todayDate.toISOString().split("T")[0];
    const dateToApply = () => {
      if (req.body.date === "") return formattedDate;
      return req.body.date;
    };

    const newExercise = new Exercise({
      userId: req.params._id,
      duration: req.body.duration,
      date: dateToApply(),
      description: req.body.description,
    });

    newExercise.save((err, exercise) => {
      if (err) return err;
      res.json({
        _id: exercise._id,
        userId: exercise.userId,
        duration: exercise.duration,
        date: exercise.date,
        description: exercise.description,
      });
    });
  });
});

//gets user exercises log
app.get("/api/users/:_id/logs", async (req, res) => {
  const userInfo = await User.findById(req.params._id, "username");
  const limit = req.query.limit;
  const dateFrom = req.query.from;
  const dateTo = req.query.to;
  let findParams = {
    userId: req.params._id,
  };

  if (dateFrom) {
    findParams.date = { ...findParams.date, $gte: dateFrom };
  }

  if (dateTo) {
    findParams.date = { ...findParams.date, $lte: dateTo };
  }

  const logs = await Exercise.find(
    findParams,
    "description duration date"
  ).limit(limit);

  res.json({
    username: userInfo.username,
    count: logs.length,
    _id: userInfo._id,
    log: logs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
