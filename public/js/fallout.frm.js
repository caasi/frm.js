var Palette;
var PAL;
var FRM;

(function(){
  var palette;
  PAL = {
    create: function(url, success) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onreadystatechange = function(e) {
        var data_view, i, result;

        if (this.readyState === 4) {
          result = [];

          if (this.status === 200) {
            data_view = new DataView(this.response);

            for (i = 0; i < 256; ++i) {
              result[i] = {};
              result[i].r = data_view.getUint8(i * 3) * 4;
              result[i].g = data_view.getUint8(i * 3 + 1) * 4;
              result[i].b = data_view.getUint8(i * 3 + 2) * 4;
            }
          } else if (this.status === 404) {
            for (i = 0; i < 256; ++i) {
              result[i] = {};
              result[i].r = palette_fallback[i * 3];
              result[i].g = palette_fallback[i * 3 + 1];
              result[i].b = palette_fallback[i * 3 + 2];
            }
          }
          
          success(result);
        }
      };

      xhr.send();
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
    var j,
        k,
        x,
        y,
        frameset,
        frame,
        prev_frame,
        head,
        canvas,
        context,
        image;
    
    if (result.orientations === undefined) result.orientations = [];
    frameset = result.orientations[i] = {};
    frameset.frames = [];
    frameset.shiftX =  data_view.getInt16(0x000A + i * 2, false);
    frameset.shiftY =  data_view.getInt16(0x0016 + i * 2, false);
    frameset.offset =  data_view.getUint32(0x0022 + i * 4, false);
    head = 0x003E + frameset.offset;
    prev_frame = null;
    for (j = 0; j < result.frameNumber; ++j) {
      frame = {};
      frame.width =     data_view.getUint16(head, false);
      frame.height =    data_view.getUint16(head + 2, false);
      frame.size =      data_view.getUint32(head + 4, false);
      frame.offsetX =   data_view.getInt16(head + 8, false);
      frame.offsetY =   data_view.getInt16(head + 10, false);
      frame.offsetFixX = frame.offsetX + (prev_frame ? prev_frame.offsetFixX : 0);
      frame.offsetFixY = frame.offsetY + (prev_frame ? prev_frame.offsetFixY : 0);
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
          image.data[k * 4] = palette[frame.colorIndex[k]].r;
          image.data[k * 4 + 1] = palette[frame.colorIndex[k]].g;
          image.data[k * 4 + 2] = palette[frame.colorIndex[k]].b;
          image.data[k * 4 + 3] = frame.colorIndex[k] === 0 ? 0 : 255;
        }
      }
      context.putImageData(image, 0, 0);
      frame.image = canvas;

      frameset.frames[j] = frame;

      /* modify frame offset */
      if (prev_frame) {
        frame.offsetX += prev_frame.offsetX;
        frame.offsetY += prev_frame.offsetY;
      }

      prev_frame = frame;
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
      var frameset = this.orientations[this.orientation()],
          frame = frameset.frames[this.frame()];

      context.drawImage(
        frame.image,
        this.x - ~~(frame.width / 2) + frame.offsetX + frameset.shiftX,
        this.y - frame.height + frame.offsetY + frameset.shiftY
      );
    };
  };

  var get_data_recursively = function(source, responses, from, to, success, progress) {
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
        get_data_recursively(source, responses, from + 1, to, success, progress);
      }
    };
    xhr.addEventListener("progress", function(e) {
      if (e.lengthComputable) {
        progress(to, from, e.loaded, e.total);
      }
    }, false);
    xhr.send();
  };

  FRM = {
    ORIENTATION_NUMBER: 6,
    create: function(url, success, progress) {
      var i, result, tmp, xhr, source, data_view;

      if (palette === undefined) {
        PAL.create("./color.pal", function(pal) {
          palette = pal;
          FRM.create(url, success, progress);
        });
        return;
      }

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
        }, progress);
        
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
      xhr.addEventListener("progress", function(e) {
        if (e.lengthComputable) {
          progress(1, 0, e.loaded, e.total);
        }
      }, false);
      xhr.send();
    }
  };
})();
