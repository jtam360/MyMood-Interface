var readJson = readJson || (function() {
  var args = {};
  return {
    init : function(Args) {
      args = Args;
    },
    
    // Read Json Function
    readContents : function() {
      $.getJSON("/assets/json/sessions.json", function(data) {
        var tblRow = "";
        var counter = 0;
        var oddClass = "";
        $.each(data.databaseContent, function(key, val) {
          if (args[0] == "#database_table") {
            counter += 1;
            if (counter % 2 == 1) {
              oddClass = "class=odd";
            }
            else {
              oddClass = "";
            }
            tblRow += "<tr " + oddClass + ">" + "<td onClick=\"document.location.href='session.html'; sessionStorage.setItem('id','" + val.session_id + "');\">"  + val.session_id.slice(23,44) + "..." + "</td>" +
            "<td>" + val.user_id.slice(18,40) + "..." + "</td>" + "<td>" + val.session_time + "</td>" + "</tr>";
          }
          else {
            if (val.session_id === sessionStorage.getItem("id")) {
              $.each(val.responses, function(i, data) {
                counter += 1;
                if (counter % 2 == 1) {
                  oddClass = "class=odd";
                }
                else {
                  oddClass = "";
                }
                tblRow += "<tr " + oddClass + ">" + "<td>" + data + "</td>" + "</tr>";
              });
            }
          }
        });
        $(args[0]).append(tblRow);
      });
    },
    
    // Zebra Striping
    zebraStripe : function() {
      // Go through all rows that are visible, filter old rows by odd and even
      var $allRows = $('tr:visible');
      var $oddRows = $allRows.filter(':odd');
      var $evenRows = $allRows.filter(':even');
      
      // Remove old classes, then add new ones
      $oddRows.removeClass('even').addClass('odd');
      $evenRows.removeClass('odd').addClass('even');
    }
  };
}());