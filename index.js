const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();
const URL = process.env.DB;
const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "success",
  });
});

app.post("/", async (req, res) => {
  try {
    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;
    const connection = await MongoClient.connect(URL);
    const db = connection.db("Authentic");
    const user = await db.collection("user").insertOne(req.body);
    await connection.close();
    res.json({ message: "successful" });
  } catch (error) {
    console.log(error);
    res.json({ message: "something went wrong" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const connection = await MongoClient.connect(URL);
    const db = connection.db("Authentic");
    const user = await db.collection("user").findOne({ email: req.body.email });
    if (user) {
      const password = await bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (password) {
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
          expiresIn: "1d",
        });
        res.json({ message: "login sucessful", token });
      } else {
        res.status(404).json({ message: "passsword is incorrect" });
      }
    } else {
      res.status(404).json({
        message: "email or password is incorrect",
      });
    }

    await connection.close();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "something went wrong",
    });
  }
});

app.post("/forget-password", async (req, res) => {
  try {
    const { email } = req.body;
    const connection = await MongoClient.connect(URL);
    const db = connection.db("Authentic");
    const user = await db.collection("user").findOne({ email: email });
    if (!user) {
      res.status(400).json({ message: "user not found" });
    }
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "18mech094@gmail.com",
        pass: "zomy sxdu unhk uujj",
      },
    });

    var mailOptions = {
      from: "18mech094@gmail.com",
      to: email,
      subject: "Reset your account  password",
      text: `http://localhost:3000/reset-password${user._id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal error" });
  }
});

app.listen(4050, () => {
  console.log("server started in port localhost:4050");
});

