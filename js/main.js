(function($) {
  $(document).ready(function() {
    var ORIENTATION_NUMBER = 6;
    var UNSIGNED = false;
    var SIGNED = true;

    var DataReader = function(data) {
      var _head = 0;
      var _data = data;

      this.size = data.length;

      this.read = function(len, signed) {
        var result = 0;
        var i;

        for (i = 0; i < len; ++i) {
          result += _data[_head + i] << (i * 8);
        }

        if (signed) {
          if (result >= (1 << (8 * len - 1))) {
            result -= (1 << (8 * len));
          }
        }

        _head += len;

        return result;
      };

      this.readX = function(len, signed) {
        var result = 0;
        var i;

        for (i = 0; i < len; ++i) {
          result += _data[_head + i] << ((len - 1 - i) * 8);
        }

        if (signed) {
          if (result >= (1 << (8 * len - 1))) {
            result -= (1 << (8 * len));
          }
        }

        _head += len;

        return result;
      };
    };

    var Frame = function(data) {
      var i;

      this.width =        data.readX(2, UNSIGNED);
      this.height =       data.readX(2, UNSIGNED);
      this.size =         data.readX(4, UNSIGNED);
      this.offsetX =      data.readX(2, SIGNED);
      this.offsetY =      data.readX(2, SIGNED);

      this.colorIndex = [];
      for (i = 0; i < this.size; ++i) {
        this.colorIndex[i] = data.read(1, UNSIGNED);
      }

      this.image = null;
    };

    var FrameSet = function(data) {
      var i, j, k;

      this.version =      data.readX(4, UNSIGNED);
      this.fps =          data.readX(2, UNSIGNED);
      this.actionFrame =  data.readX(2, UNSIGNED);
      this.frameNumber =  data.readX(2, UNSIGNED);

      this.shiftX = [];
      for (i = 0; i < ORIENTATION_NUMBER; ++i) {
        this.shiftX[i] =  data.readX(2, SIGNED);
      }

      this.shiftY = [];
      for (i = 0; i < ORIENTATION_NUMBER; ++i) {
        this.shiftY[i] =  data.readX(2, SIGNED);
      }

      this.offset = [];
      for (i = 0; i < ORIENTATION_NUMBER; ++i) {
        this.offset[i] =  data.readX(4, UNSIGNED);
      }

      this.size =         data.readX(4, UNSIGNED);

      this.frames = [];
      for (i = 0; i < ORIENTATION_NUMBER * this.frameNumber; ++i) {
        this.frames[i] =  [];
        for (j = 0; j < this.frameNumber; ++j) {
          this.frames[i][j] = new Frame(data);
          // fix offsets
          if (j > 0) {
            this.frames[i][j].offsetX += this.frames[i][j-1].offsetX;
            this.frames[i][j].offsetY += this.frames[i][j-1].offsetY;
          }
        }
      }

      this.x = 0;
      this.y = 0;
      var _frame = 0;
      var _orientation = 2;
      /*
      var _clearRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
      */

      this.frame = function(n) {
        if ($.isNumeric(n)) _frame = ~~((n + this.frameNumber) % this.frameNumber);
        return _frame;
      };

      this.orientation = function(o) {
        if ($.isNumeric(o)) _orientation = ~~((o + ORIENTATION_NUMBER) % ORIENTATION_NUMBER);
        return _orientation;
      };

      this.draw = function(context) {
        //context.fillRect(_clearRect.x, _clearRect.y, _clearRect.width, _clearRect.height);

        var frame = this.frames[this.orientation()][this.frame()];

        /*
        _clearRect.x = this.x - frame.width / 2;
        _clearRect.y = this.y - frame.height;
        _clearRect.width = frame.width;
        _clearRect.height = frame.height;
        */

        context.drawImage(
          frame.image,
          this.x - ~~(frame.width / 2) + frame.offsetX + this.shiftX[this.orientation()],
          this.y - frame.height + frame.offsetY + this.shiftY[this.orientation()]
        );
      };
    };

    var timerID = 0;

    var page = {
      palette: ko.observable(),
      src: ko.observable("./frm/_HMJMPSAA.FRM"),
      load: function() {
        if (this.src().substr(-3, 3).toLowerCase() !== "frm") {
          console.log("not a frm");
          return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.src(), true);
        xhr.responseType = "arraybuffer";
        xhr.onreadystatechange = function(e) {
          if (this.readyState === 4 && this.status === 200) {
            var i, j, k, x, y;

            /* clear timeout */
            clearTimeout(timerID);

            /* prepare data */
            var frm = new Uint8Array(this.response);
            var frameSet = new FrameSet(new DataReader(frm));

            /* create images */
            var palette = page.palette();

            for (i = 0; i < ORIENTATION_NUMBER; ++i) {
              for (j = 0; j < frameSet.frameNumber; ++j) {
                var frame = frameSet.frames[i][j];
                var canvas = document.createElement("canvas");
                canvas.width = frame.width;
                canvas.height = frame.height;
                var context = canvas.getContext("2d");
                var image = context.createImageData(canvas.width, canvas.height);

                for (y = 0; y < image.height; ++y) {
                  for (x = 0; x < image.width; ++x) {
                    k = y * image.width + x;
                    image.data[k * 4] = palette.R[frame.colorIndex[k]];
                    image.data[k * 4 + 1] = palette.G[frame.colorIndex[k]];
                    image.data[k * 4 + 2] = palette.B[frame.colorIndex[k]];
                    image.data[k * 4 + 3] = frame.colorIndex[k] === 0 ? 0 : 255;
                  }
                }

                context.putImageData(image, 0, 0);

                frame.image = canvas;
              }
            }

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
          };
        };
        xhr.send();
      }
    };

    $.get("./frm/color.pal", function(data) {
      var len = data.length;
      var i, result;

      var getColor = function(c) {
        if (c < 0 || c >= 64) c = 0;
        return c * 4;
      };

      result = {
        R: [],
        G: [],
        B: []
      };

      for (i = 0; i < 256; ++i) {
        result.R[i] = getColor(data[i * 3].charCodeAt(0));
        result.G[i] = getColor(data[i * 3 + 1].charCodeAt(0));
        result.B[i] = getColor(data[i * 3 + 2].charCodeAt(0));
      }

      page.palette(result);
      page.load();
    });

    ko.applyBindings(page);
  });
})(jQuery);
