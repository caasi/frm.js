(function($) {
  $(document).ready(function() {
    $("#frmplayer").frmplayer({
      width: 300,
      height: 300,
      fps: 8
    });

    var $select = $("<select></select>");

    $.each(frmlist, function(prefix, rest) {
      prefix = prefix.toUpperCase();
      var readablePrefix = FRMPrefixs[prefix] ? FRMPrefixs[prefix] : prefix;

      $.each(rest, function(appearance, rest) {
        appearance = appearance.toUpperCase();
        var readableAppearance = FRMAppearances[appearance] ? FRMAppearances[appearance] : appearance;
        var $group = $("<optgroup label=\"" + readablePrefix + " in " + readableAppearance + "\"></optgroup>");

        $.each(rest, function(postfix, path) {
          postfix = postfix.toUpperCase();
          var readable = FRMPostfixs[postfix] ? FRMPostfixs[postfix]: postfix;
          $group.append($("<option value=\"" + path + "\">" + readableAppearance + " - " + readable + " (" + postfix + ")" + "</option>"));
        });

        $select.append($group);
      });
    });

    $select.change(function(e) {
      $("#frmplayer").frmplayer("load", $(this).val());
    });

    $("#list").append($select);
  });
})(jQuery);
