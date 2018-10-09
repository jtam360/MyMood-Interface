//Search Function
var search = search || (function() {
  var args = {};
  return {
    init : function(Args) {
      args = Args;
    },
    
    searchRows : function() {
      var $rows = $(args[0] + " tr:not(:first)");
      $("tr:nth-child(odd)").each(function() {
        $(this).addClass("zebra-stripe");
      });

      $("#searchInput").keyup(function() {
        var val = $.trim($(this).val()).replace(/ +/g, " ").toLowerCase();
        $rows.show().filter(function() {
          var text = $(this).text().replace(/\s+/g, " ").toLowerCase();
          return !~text.indexOf(val);
        }).hide();
        
        $(args[0] + " tr:visible").each(function(e) {
          if (e % 2 == 1) {
            $(this).addClass("zebra-stripe");
          } else {
            $(this).removeClass("zebra-stripe");
          }
        });
      });
    }
  };
}());