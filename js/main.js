(function($) {
  $(document).ready(function() {
    $("#frmplayer").frmplayer({
      width: 300,
      height: 300,
      fps: 8
    });

    var $select = $("<select></select>");

    $.each(frmlist, function(prefix, value) {
      $.each(value, function(postfix, path) {
        var readable = FRMPostfixs[postfix];
        if (readable === undefined) {
          readable = postfix;
        }
        $select.append($("<option value=\"" + path + "\">" + prefix + ": " + readable + "</option>"));
      });
    });

    $select.change(function(e) {
      $("#frmplayer").frmplayer("load", $(this).val());
    });

    $("#list").append($select);
  });
})(jQuery);
