const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

const db = new sqlite3.Database("./database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    price INTEGER,
    description TEXT,
    image TEXT,
    video TEXT
  )
`);

const storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post(
  "/api/menu",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  (req, res) => {
    const { title, category, price, description } = req.body;

    const image = req.files.image
      ? "/uploads/" + req.files.image[0].filename
      : "";

    const video = req.files.video
      ? "/uploads/" + req.files.video[0].filename
      : "";

    db.run(
      `INSERT INTO menu (title, category, price, description, image, video)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, category, price, description, image, video],
      function () {
        res.json({ success: true, id: this.lastID });
      }
    );
  }
);

app.get("/api/menu", (req, res) => {
  db.all("SELECT * FROM menu", [], (err, rows) => {
    res.json(rows);
  });
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});