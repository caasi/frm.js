(function($) {
  $(".nano").nanoScroller();

  $("#frmplayer").frmplayer({
    width: 300,
    height: 300,
    fps: 8
  });

  $(".frmlink").each(function(index) {
    $(this).click(function(e) {
      var $this = $(this);
      e.preventDefault();
      $(".frmlink.actived").removeClass("actived");
      $this.addClass("actived");
      $("#frmplayer").frmplayer(
        "load",
        this.href,
        function(files_total, file_current, loaded, total) {
          $this.find(".loader div").each(function(index) {
            var width = ~~(loaded / total * 100);

            if (files_total === 1 || index === file_current) {
              $(this).css("width", width + "%");
            }

            if (file_current === files_total - 1 && width === 100) {
              $(this).css("width", 0);
            }
          });
        });
    });
  });
})(jQuery);
