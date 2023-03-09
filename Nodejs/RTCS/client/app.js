const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8000;
const indexFile = __dirname + './index.html'
// console.log(indexFile);
const openUrl = "http://localhost:" + port + "/";

app.listen(port, () => {
  console.log(`Static file server running at => [ ${openUrl} ] CTRL + C to shutdown`);
});

// serve your css as static
app.use(express.static(__dirname));

// get our app to use body parser 
// app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  res.sendFile(indexFile);
});

const open = require('open');
// opens the url in the default browser 
open(openUrl);