var Palette;
var FRM;

(function(){
  Palette = function() {
    var i;

    /*
    var getColor = function(c) {
      if (c < 0 || c >= 64) c = 0;
      return c * 4;
    };
    */

    this.R = [];
    this.G = [];
    this.B = [];

    for (i = 0; i < 256; ++i) {
      this.R[i] = palette_source[i * 3];
      this.G[i] = palette_source[i * 3 + 1];
      this.B[i] = palette_source[i * 3 + 2];
    }
  };

  FRM = {
    ORIENTATION_NUMBER: 6,
    create: function(url, success) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onreadystatechange = function(e) {
        var i, j, k, x, y, frame, head, canvas, context, image;
        var _frame = 0, _orientation = 2;
        var result = {};

        if (this.readyState === 4 && this.status === 200) {
          data_view = new DataView(this.response);
          result.x = 0;
          result.y = 0;
          result.version =      data_view.getUint32(0x0000, false);
          result.fps =          data_view.getUint16(0x0004, false);
          result.actionFrame =  data_view.getUint16(0x0006, false);
          result.frameNumber =  data_view.getUint16(0x0008, false);
          result.size =         data_view.getUint32(0x003A, false);
          result.shiftX = [];
          result.shiftY = [];
          result.offset = [];
          result.frames = [];
          for (i = 0; i < FRM.ORIENTATION_NUMBER; ++i) {
            result.frames[i] = [];
            result.shiftX[i] =  data_view.getInt16(0x000A + i * 2, false);
            result.shiftY[i] =  data_view.getInt16(0x0016 + i * 2, false);
            result.offset[i] =  data_view.getUint32(0x0022 + i * 4, false);
            head = 0x003E + result.offset[i];
            for (j = 0; j < result.frameNumber; ++j) {
              frame = {};
              frame.width =     data_view.getUint16(head, false);
              frame.height =    data_view.getUint16(head + 2, false);
              frame.size =      data_view.getUint32(head + 4, false);
              frame.offsetX =   data_view.getInt16(head + 8, false);
              frame.offsetY =   data_view.getInt16(head + 10, false);
              frame.colorIndex = [];
              for (k = 0; k < frame.size; ++k) {
                frame.colorIndex[k] = data_view.getUint8(head + 12 + k);
              }

              /* create images */
              canvas = document.createElement("canvas");
              canvas.width = frame.width;
              canvas.height = frame.height;
              context = canvas.getContext("2d");
              image = context.createImageData(canvas.width, canvas.height);
              for (y = 0; y < image.height; ++y) {
                for (x = 0; x < image.width; ++x) {
                  k = y * image.width + x;
                  image.data[k * 4] = palette_source[frame.colorIndex[k] * 3];
                  image.data[k * 4 + 1] = palette_source[frame.colorIndex[k] * 3 + 1];
                  image.data[k * 4 + 2] = palette_source[frame.colorIndex[k] * 3 + 2];
                  image.data[k * 4 + 3] = frame.colorIndex[k] === 0 ? 0 : 255;
                }
              }
              context.putImageData(image, 0, 0);
              frame.image = canvas;

              result.frames[i][j] = frame;

              /* modify frame offset */
              if (j > 0) {
                result.frames[i][j].offsetX += result.frames[i][j - 1].offsetX;
                result.frames[i][j].offsetY += result.frames[i][j - 1].offsetY;
              }

              head += frame.size + 12;
            }
          }

          result.frame = function(n) {
            if ($.isNumeric(n)) _frame = ~~((n + this.frameNumber) % this.frameNumber);
            return _frame;
          };

          result.orientation = function(o) {
            if ($.isNumeric(o)) _orientation = ~~((o + FRM.ORIENTATION_NUMBER) % FRM.ORIENTATION_NUMBER);
            return _orientation;
          };

          result.draw = function(context) {
            var frame = this.frames[this.orientation()][this.frame()];

            context.drawImage(
              frame.image,
              this.x - ~~(frame.width / 2) + frame.offsetX + this.shiftX[this.orientation()],
              this.y - frame.height + frame.offsetY + this.shiftY[this.orientation()]
            );
          };

          success(result);
        }
      };
      xhr.send();
    }
  };
})();
