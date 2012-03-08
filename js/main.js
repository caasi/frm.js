
(function($) {
  $(document).ready(function() {
    var ORIENTATION_NUMBER = FrameSet.ORIENTATION_NUMBER;
    var UNSIGNED = File.UNSIGNED;
    var SIGNED = File.SIGNED;

    var timerID = 0;

    var page = {
      palette: ko.observable(),
      src: ko.observable("./frm/_HMJMPSAA.FRM"),
      load: function() {
        var self = this;

        if (this.src().substr(-3, 3).toLowerCase() !== "frm") {
          console.log("not a frm");
          return;
        }

        var file = new File();
        file.open(this.src(), function(data) {
          var i, j, k, x, y;

          /* clear timeout */
          clearTimeout(timerID);

          /* prepare data */
          var frameSet = new FrameSet(file, self.palette());

          var isMouseDown = false;
          var globalCanvas = $("#canvas").get(0);
          var context = globalCanvas.getContext("2d");
          context.fillStyle = $(globalCanvas).css("background-color");
          context.fillRect(0, 0, globalCanvas.width, globalCanvas.height);

          var computeOrientation = function(x, y) {
            return (Math.atan2(y - frameSet.y, x - frameSet.x) * 180 / Math.PI + 90) / 60;
          };

          $(globalCanvas).mousedown(function(e) {
            isMouseDown = true;
            var offset = $(this).offset();
            var local = {
              x: e.pageX - offset.left,
              y: e.pageY - offset.top
            };
            frameSet.orientation(computeOrientation(local.x, local.y));
          }).mousemove(function(e) {
            if (isMouseDown) {
              var offset = $(this).offset();
              var local = {
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
              };
              frameSet.orientation(computeOrientation(local.x, local.y));
            }
          }).mouseup(function(e) {
            isMouseDown = false;
          });

          if (frameSet.fps === 0) frameSet.fps = 8;
          frameSet.x = globalCanvas.width / 2;
          frameSet.y = 3 * globalCanvas.height / 5;

          var timeCallback = function() {
            context.fillRect(0, 0, globalCanvas.width, globalCanvas.height);

            frameSet.draw(context);
            frameSet.frame(frameSet.frame() + 1);

            timerID = setTimeout(function () {
              timeCallback();
            }, 1000 / frameSet.fps);
          };

          timeCallback();
        });
      }
    };

    var palFile = new File();
    palFile.open("./frm/color.pal", function() {
      page.palette(new Palette(palFile));
      page.load();
    });

    ko.applyBindings(page);
  });
})(jQuery);
