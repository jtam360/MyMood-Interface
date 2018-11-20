var express = require("express");
var httpApp = express();
var httpsApp = express();
var http = require("http");
var https = require("https");
var fs = require("fs");
var path = require("path");
var bodyParser = require("body-parser");
var session = require("express-session");
var cookieParser = require("cookie-parser");

var helmet = require("helmet");
var ONE_YEAR = 31536000;

httpsApp.use(helmet.hsts({
  maxAge: ONE_YEAR,
  includeSubdomains: true,
  force: true
}));

httpsApp.use(helmet());
httpsApp.use(express.static(path.join(__dirname, "public")));

var cipher = ["ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES256-CBC-SHA384",
  "ECDHE-RSA-AES256-CBC-SHA256",
  "ECDHE-ECDSA-AES128-GCM-SHA256",
  "ECDHE-RSA-AES128-GCM-SHA256",
  "DHE-RSA-AES128-GCM-SHA256",
  "DHE-RSA-AES256-GCM-SHA384",
  "!aNULL",
  "!MD5",
  "!DSS"].join(":");
  
// Redirect to URL based on the specified path
httpApp.get("*", function(req, res) {
  res.redirect("https://" + req.headers.host + req.url);
});

// Go to login.html when user visits domain name
httpsApp.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/login.html");
});

// Throw a 404 "page not found" error and redirect user to error page
httpsApp.use(function(req, res) {
  res.status(404);
  res.sendFile(__dirname + "/public/error.html");
});

var options = {
  key: fs.readFileSync("/etc/letsencrypt/live/mymood.me/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/mymood.me/fullchain.pem"),
  ciphers: cipher
};

httpApp.listen(8080);
httpsApp.listen(3000);