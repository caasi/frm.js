(function($) {
  $(document).ready(function() {
    $("#frmplayer").frmplayer({
      width: 300,
      height: 300,
      fps: 8
    });

    $(".frmlink").each(function(index) {
      $(this).click(function(e) {
        e.preventDefault();
        $(".frmlink.actived").removeClass("actived");
        $(this).addClass("actived");
        $("#frmplayer").frmplayer("load", this.href);
      });
    });
  });
})(jQuery);
