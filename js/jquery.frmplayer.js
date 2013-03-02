(function($) {
  var methods = {
    init: function(options) {
      var settings = $.extend({
        "fps": 0,
        "width": 200,
        "height": 200,
        "orientation": 2,
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
        $this.data("settings", settings);
        
        var $canvas = $("<canvas width=\"" + settings.width + "\" height=\"" + settings.height + "\"></canvas>");
        $canvas.css("background-color", settings["background-color"]);
        $canvas.css("border-radius", settings["border-radius"]);

        $this.data("$canvas", $canvas);
        $this.after($canvas);
        $this.hide();

        methods.load.apply($(this), [$this.attr("href")]);
      });
    },
    load: function(url) {
      return this.each(function() {
        var $this = $(this);
        var $canvas = $this.data("$canvas");
        var settings = $this.data("settings");
        
        clearTimeout($this.data("tid"));

        var hasPalette = function() {
          /* new API */
          FRM.create(url, function(frm) {
            var canvas = $canvas.get()[0];
            var context = canvas.getContext("2d");
            context.fillStyle = settings["background-color"];

            var pos = settings["prefPosition"](canvas.width, canvas.height);
            frm.x = pos.x;
            frm.y = pos.y;
            frm.orientation(settings["orientation"]);
            
            if (settings["fps"]) {
              frm.fps = settings["fps"];
            }

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
              frm.orientation(computeOrientation(local.x, local.y, frm));
            }).mousemove(function(e) {
              if (isMouseDown) {
                var offset = $(this).offset();
                var local = {
                  x: e.pageX - offset.left,
                  y: e.pageY - offset.top
                };
                frm.orientation(computeOrientation(local.x, local.y, frm));
              }
            }).mouseup(function(e) {
              isMouseDown = false;
            });

            var loop = function() {
              context.fillRect(0, 0, canvas.width, canvas.height);
              frm.draw(context);
              frm.frame(frm.frame() + 1);
              
              var tid = setTimeout(function() {
                loop();
              }, 1000 / frm.fps);

              $this.data("tid", tid);
            };

            loop();
          });
        };

        if (url.substr(-3, 3).toLowerCase() === "frm") {
          hasPalette();
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
