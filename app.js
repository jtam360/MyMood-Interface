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
var file = __dirname + "/public/assets/json/interactions.json";
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
      // Sort the JSON by newest sessions on top
      jsonData.databaseContent.sort(function (a, b) {
        return new Date(b.time) - new Date(a.time);
      });
      fs.writeFile("public/assets/json/interactions.json", JSON.stringify(jsonData, null, 2), function(err) {
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

// Calculate how many pages to show in the pagination bar
httpsApp.post("/paginate", function(req, res) {
  var numItems = req.body.numItems;
  var json = JSON.parse(fs.readFileSync(file, 'utf8'));
  var numPages = Math.ceil(json.databaseContent.length / numItems)
  res.send({numPages: numPages});
});

// Search through JSON and add interaction information to temporary JSON, then send back to client
httpsApp.post("/search", function(req, res) {
  const SESSIONID_SLICE_START = 23;
  const SESSIONID_SLICE_END = 44;
  const USERID_SLICE_START = 18;
  const USERID_SLICE_END = 40;
  var filter = req.body.filter;
  var searchOption = req.body.searchValue;
  var json = JSON.parse(fs.readFileSync(file, 'utf8'));
  var jsonData = {};
  jsonData.interactions = []
  var counter = 0;
  for (var interaction in json.databaseContent) {
    if (searchOption == "session_id") {     
      if (json.databaseContent[interaction].sessionId.slice(SESSIONID_SLICE_START, SESSIONID_SLICE_END).toLowerCase().indexOf(filter.toLowerCase()) > -1) {
        jsonData.interactions.push({
          sessionId : json.databaseContent[interaction].sessionId,
          userId : json.databaseContent[interaction].userId,
          time : json.databaseContent[interaction].time
        });
        counter++;
      }
    }
    else if (searchOption == "user_id") {
      if (json.databaseContent[interaction].userId.slice(USERID_SLICE_START, USERID_SLICE_END).toLowerCase().indexOf(filter.toLowerCase()) > -1) {
        jsonData.interactions.push({
          sessionId : json.databaseContent[interaction].sessionId,
          userId : json.databaseContent[interaction].userId,
          time : json.databaseContent[interaction].time
        });
        counter++;
      }
    }
    else if (searchOption == "session_time") {
      if (json.databaseContent[interaction].time.toLowerCase().indexOf(filter.toLowerCase()) > -1) {
        jsonData.interactions.push({
          sessionId : json.databaseContent[interaction].sessionId,
          userId : json.databaseContent[interaction].userId,
          time : json.databaseContent[interaction].time
        });
        counter++;
      }
    }
    else if (searchOption == "responses") {
      for (var response in json.databaseContent[interaction].responses) {
        if (json.databaseContent[interaction].responses[response].toLowerCase().indexOf(filter.toLowerCase()) >-1) {
          jsonData.interactions.push({
            sessionId : json.databaseContent[interaction].sessionId,
            userId : json.databaseContent[interaction].userId,
            time : json.databaseContent[interaction].time
          });
          counter++;
          break;
        }
      }
    }
  }
  res.send(JSON.stringify(jsonData));
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