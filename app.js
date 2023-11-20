const express = require("express");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const Project = require("./models/Project");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const methodOverride = require("method-override");
const nodemailer = require("nodemailer");

mongoose.set("strictQuery", true);
mongoose
  .connect("mongodb://localhost/freelancer-project")
  .then((x) => console.log("db bağlandı"));

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // url deki datayı okumamızı sağlar.
app.use(express.json()); // url deki datayı jsona çevirir.
app.use(fileUpload());
app.use(
  methodOverride("_method", {
    methods: ["POST", "GET"],
  })
);

app.get("/", async (req, res) => {
  const projects = await Project.find().sort("-dateCreated");
  res.render("index", {
    projects,
  });
});

app.post("/", async (req, res) => {
  console.log(req.body);
  console.log(req.files.image);

  const uploadDIR = "public/uploads";
  if (!fs.existsSync(uploadDIR)) {
    fs.mkdirSync(uploadDIR);
  }

  let createdTime = Date.now();
  let uploadedImage = req.files.image;
  let uploadPath =
    __dirname + "/public/uploads/" + createdTime + uploadedImage.name;

  uploadedImage.mv(uploadPath, async () => {
    await Project.create({
      ...req.body,
      image: "/uploads/" + createdTime + uploadedImage.name,
    });
  });
  res.redirect("/");
});

app.put("/:id", async (req, res) => {
  const id = req.params.id;
  const project = await Project.findOne({ _id: id });
  project.title = req.body.title;
  project.description = req.body.description;
  project.save();
  res.redirect("/");
});

app.delete("/:id", async (req, res) => {
  const id = req.params.id;

  const project = await Project.findOne({ _id: id });
  let deletedImage = __dirname + "/public" + project.image;
  if (fs.existsSync(deletedImage)) {
    fs.unlinkSync(deletedImage);
  }
  await Project.findByIdAndDelete(id);
  res.redirect("/");
});

app.post("/contact", async (req, res) => {

  const outputMessage = ` 
    <h1>Mail Details</h1> 
    <ul> 
        <li>Name: ${req.body.name}</li> 
        <li>Email: ${req.body.email}</li> 
    </ul> 
    <h1>Message</h1> 
    <p>${req.body.message}</p> 
    `; //  bu kısım mailimizin gövdesi olacak.

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", //  gmaile yönlendiriyoruz.
    port: 465, //  portu 465 e ayarlıyoruz.
    secure: true, //  true for 465, false for other ports
    auth: {
      user: "drmuratgokduman@gmail.com", //  gmail accont: maili gönderecek olan adres
      pass: "eqocuuyuqcrxxyhc", //  gmail password yerine google account içinde güvenlik kısmında uygulama şifrelerine girilir ve uygulama şifresi oluşturulur. uygulama: posta cihaz: windows bilgisayar
    },
  });
  
  let info = await transporter.sendMail({
    from: '"Freelancer Contact Form" <drmuratgokduman@gmail.com>', //  gönderen adres
    to: "drmuratgokduman@gmail.com", //  alan adres
    subject: "Freelancer Contact Form New Message ✔", //  konu
    html: outputMessage, // mesajın gövdesi: yukarıda oluşturmuştuk
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  res.redirect("/");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`uygulama port ${port} üzerinde açıldı`);
});
