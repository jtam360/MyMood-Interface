// Load adminHeader if user is logged in or userHeader if not logged in
$(function() {
  if (document.cookie.indexOf("DatabaseSession=Valid") != -1) {
    $("#header").load("assets/adminHeader.html");
  }
  else {
    $("#header").load("assets/userHeader.html");
  }
});