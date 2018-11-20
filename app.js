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
var schedule = require("node-schedule");
var AWS = require("aws-sdk");

// Reads environment variables from text file
require("dotenv").config();
AWS.config.update({accessKeyId: process.env.ACCESS_KEY, secretAccessKey: process.env.SECRET_ACCESS_KEY, region: "us-west-1"});

var docClient = new AWS.DynamoDB.DocumentClient();
var params = {
  TableName: "Interactions"
};

var helmet = require("helmet");
var HELMET_TTL_SECONDS = 31536000;

httpsApp.use(helmet.hsts({
  maxAge: HELMET_TTL_SECONDS,
  includeSubdomains: true,
  force: true
}));

httpsApp.use(helmet());
httpsApp.use(express.static(path.join(__dirname, "public")));
httpsApp.use(express.urlencoded({
  extended: true
}));
httpsApp.use(bodyParser.json());

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
  
/*
Update the JSON at midnight of every Monday
ScheduleJob("minute" "hour" "dayOfMonth" "month" "dayOfWeek")
* = any value
*/
var updateJSON = schedule.scheduleJob("0 0 * * 1", function() {
  var jsonData = {}
  jsonData.databaseContent = []
  docClient.scan(params).eachPage((err, data, done) => {
    if (data != null) {
      for (let index = 0; index < data.Items.length; index++) {
        const element = data.Items[index];
        jsonData.databaseContent.push(element);
      }
      fs.writeFile("public/assets/json/interactions.json", JSON.stringify(jsonData, null, "\t"), function(err) {
        if (err) throw err;
        console.log("JSON updated.");
      });
    }
    done();
  });
});
  
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