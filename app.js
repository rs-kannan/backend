const express = require("express");
const app = express();
app.use(express.json());
const mongoose = require("mongoose");
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");
var nodemailer = require("nodemailer");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
const jwt = require("jsonwebtoken");
const JWT_SECRET =
  "qwertyuioplkjhgfdsazxcvbnm0192837465!@#$%^&*()_+-={}[]:<>?,./";

mongoose
  .connect("mongodb+srv://kannansrinivasanrs:p0qxP8ubFK4McUD8@cluster0.j3fmjso.mongodb.net/", {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("database connected");
  })
  .catch((error) => {
    console.log(error);
  });


require("./userDetails");
const User = mongoose.model("UserInfo");
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const encryptedpassword = await bcrypt.hash(password, 10);
  try {
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.send({ error: "User Exits" });
    }

    await User.create({ email, password: encryptedpassword });
    res.send({ status: "ok" });
  } catch (error) {
    res.send({ status: "error" });
  }
});


app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.send({ status: "0" });
  } else {
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({}, JWT_SECRET);
      if (res.status(201)) {
        return res.send({ status: "ok", data: token });
      } else {
        return res.send({ status: "error" });
      }
    }
    res.send({ status: "error", error: "Invalid password" });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.send({ status: "User not exits" });
    } else {
      const secret = JWT_SECRET + oldUser.password;
      const token = jwt.sign(
        { email: oldUser.email, id: oldUser._id },
        secret,
        {
          expiresIn: "5m",
        }
      );
      const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
      console.log(link);
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "kannansrinivasanrs@gmail.com",
          pass: "mekqvzxizcjdnryi",
        },
      });

      var mailOptions = {
        from: "kannansrinivasanrs@gmail.com",
        to: oldUser.email,
        subject: "Password reset link",
        text: link,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }
  } catch (error) {
    res.send({ error });
  }
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(id,"ids")
  console.log(token,"token")   
  
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User not Exits!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    res.send("Token or ID are not matching with User!!");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User not Exits!!" });
  }
  const secret = JWT_SECRET + oldUser.password;

  try {
    console.log("string")
    const verify = jwt.verify(token, secret);
    const encryptedpassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      { _id: id },
      { $set: { password: encryptedpassword } }
    );
    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    res.send("Something is Wrong!!");
  }
});

app.listen(5000, () => {
  console.log("server is running");
});
