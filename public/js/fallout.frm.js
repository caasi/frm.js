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

  var header_from_data_view = function (result, data_view) {
    result.version =      data_view.getUint32(0x0000, false);
    result.fps =          data_view.getUint16(0x0004, false);
    result.actionFrame =  data_view.getUint16(0x0006, false);
    result.frameNumber =  data_view.getUint16(0x0008, false);
    result.size =         data_view.getUint32(0x003A, false);
  };

  var frames_from_data_view_of_orientation = function (result, data_view, i) {
    var j, k, frame, head, canvas, context, image;
    
    if (result.frames === undefined) result.frames = [];
    if (result.shiftX === undefined) result.shiftX = [];
    if (result.shiftY === undefined) result.shiftY = [];
    if (result.offset === undefined) result.offset = [];
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
  };

  var form_FRM = function(result) {
    var _frame = 0, _orientation = 2;

    result.x = result.y = 0;

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
  };

  var get_data_recursively = function(source, responses, from, to, success) {
    var xhr;

    if (from >= to) {
      success(responses);
      return;
    }

    xhr = new XMLHttpRequest();
    xhr.open("GET", source + from, true);
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function(e) {
      if (this.readyState === 4 && this.status === 200) {
        responses[from] = this.response;
        get_data_recursively(source, responses, from + 1, to, success);
      }
    };

    xhr.send();
  };

  FRM = {
    ORIENTATION_NUMBER: 6,
    create: function(url, success) {
      var i, result, tmp, xhr, source, data_view;

      if ($.isNumeric(url[url.length - 1])) {
        result = {};
        source = url.substring(0, url.length - 1);
        
        get_data_recursively(source, [], 0, FRM.ORIENTATION_NUMBER, function(responses) {
          for (i = 0; i < FRM.ORIENTATION_NUMBER; ++i) {
            data_view = new DataView(responses[i]);

            header_from_data_view(i === 0 ? result : {}, data_view);
            frames_from_data_view_of_orientation(result, data_view, i);
          }

          form_FRM(result);

          success(result);
        });
        
        return;
      }

      xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onreadystatechange = function(e) {
        var _frame = 0, _orientation = 2;

        if (this.readyState === 4 && this.status === 200) {
          data_view = new DataView(this.response);

          result = {};
          header_from_data_view(result, data_view);
          for (i = 0; i < FRM.ORIENTATION_NUMBER; ++i) {
            frames_from_data_view_of_orientation(result, data_view, i);
          }

          form_FRM(result);

          success(result);
        }
      };
      xhr.send();
    }
  };
})();
