(function($) {
  var palette = null;

  var methods= {
    init: function(options) {
      var settings = $.extend({
        "palette": "./frm/color.pal",
        "fps": 0,
        "width": 200,
        "height": 200,
        "background-color": "#222",
        "border-radius": "8px",
        "prefPosition": function(width, height) {
          return {
            x: width / 2,
            y: height / 5 * 3
          };
        }
      }, options);

      return this.each(function() {
        var $this = $(this);
        var src = $this.attr("href");
        var frm = new File();

        var $canvas = $("<canvas width=\"" + settings.width + "\" height=\"" + settings.height + "\"></canvas>");
        $canvas.css("background-color", settings["background-color"]);
        $canvas.css("border-radius", settings["border-radius"]);
        $this.data("canvas", $canvas);
        $this.hide();
        $this.after($canvas);

        var hasPalette = function() {
          frm.open(src, function() {
            var frameset = new FrameSet(frm, palette);
            $this.data("frameset", frameset);

            var canvas = $canvas.get()[0];
            var context = canvas.getContext("2d");
            context.fillStyle = settings["background-color"];

            var pos = settings["prefPosition"](canvas.width, canvas.height);
            frameset.x = pos.x;
            frameset.y = pos.y;

            var computeOrientation = function(x, y, origin) {
              return (Math.atan2(y - origin.y, x - origin.x) * 180 / Math.PI + 90) / 60;
            };

            var isMouseDown = false;
            $canvas.mousedown(function(e) {
              isMouseDown = true;
              var offset = $(this).offset();
              var local = {
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
              };
              frameset.orientation(computeOrientation(local.x, local.y, frameset));
            }).mousemove(function(e) {
              if (isMouseDown) {
                var offset = $(this).offset();
                var local = {
                  x: e.pageX - offset.left,
                  y: e.pageY - offset.top
                };
                frameset.orientation(computeOrientation(local.x, local.y, frameset));
              }
            }).mouseup(function(e) {
              isMouseDown = false;
            });

            var loop = function() {
              context.fillRect(0, 0, canvas.width, canvas.height);
              frameset.draw(context);
              frameset.frame(frameset.frame() + 1);

              setTimeout(function() {
                loop();
              }, 1000 / frameset.fps);
            };

            loop();
          });
        };

        if (src.substr(-3, 3).toLowerCase() === "frm") {
          if(palette) {
            hasPalette();
          } else {
            var pal = new File();
            pal.open(settings.palette, function() {
              palette = new Palette(pal);
              hasPalette();
            });
          }
        }
      });
    }
  };

  $.fn.frmplayer = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error("Method " + method + "does not exist on jQuery.frmplayer");
    }
  };
})(jQuery);