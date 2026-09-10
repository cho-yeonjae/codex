const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const artworkDirectory = __dirname;

app.use(express.static(artworkDirectory, { index: "index.html" }));

app.listen(port, host, () => {
  console.log(`Artwork is available at http://localhost:${port}`);
});
