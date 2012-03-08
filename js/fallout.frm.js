var Palette;
var Frame;
var FrameSet;

(function(){
  var UNSIGNED = File.UNSIGNED;
  var SIGNED = File.SIGNED;

  Palette = function(data) {
    var i;

    var getColor = function(c) {
      if (c < 0 || c >= 64) c = 0;
      return c * 4;
    };

    this.R = [];
    this.G = [];
    this.B = [];

    for (i = 0; i < 256; ++i) {
      this.R[i] = getColor(data.read(1, UNSIGNED));
      this.G[i] = getColor(data.read(1, UNSIGNED));
      this.B[i] = getColor(data.read(1, UNSIGNED));
    }
  };

  Frame = function(data, palette) {
    var i, j, x, y;

    this.width =        data.readX(2, UNSIGNED);
    this.height =       data.readX(2, UNSIGNED);
    this.size =         data.readX(4, UNSIGNED);
    this.offsetX =      data.readX(2, SIGNED);
    this.offsetY =      data.readX(2, SIGNED);

    this.colorIndex = [];
    for (i = 0; i < this.size; ++i) {
      this.colorIndex[i] = data.read(1, UNSIGNED);
    }

    /* create images */
    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    var context = canvas.getContext("2d");
    var _image = context.createImageData(canvas.width, canvas.height);

    for (y = 0; y < _image.height; ++y) {
      for (x = 0; x < _image.width; ++x) {
        j = y * _image.width + x;
        _image.data[j * 4] = palette.R[this.colorIndex[j]];
        _image.data[j * 4 + 1] = palette.G[this.colorIndex[j]];
        _image.data[j * 4 + 2] = palette.B[this.colorIndex[j]];
        _image.data[j * 4 + 3] = this.colorIndex[j] === 0 ? 0 : 255;
      }
    }

    context.putImageData(_image, 0, 0);
    this.image = canvas;
  };

  FrameSet = function(data, palette) {
    var _frame = 0;
    var _orientation = 2;
    var i, j, k;

    this.x = 0;
    this.y = 0;

    this.version =      data.readX(4, UNSIGNED);
    this.fps =          data.readX(2, UNSIGNED);
    this.actionFrame =  data.readX(2, UNSIGNED);
    this.frameNumber =  data.readX(2, UNSIGNED);

    this.shiftX = [];
    for (i = 0; i < FrameSet.ORIENTATION_NUMBER; ++i) {
      this.shiftX[i] =  data.readX(2, SIGNED);
    }

    this.shiftY = [];
    for (i = 0; i < FrameSet.ORIENTATION_NUMBER; ++i) {
      this.shiftY[i] =  data.readX(2, SIGNED);
    }

    this.offset = [];
    for (i = 0; i < FrameSet.ORIENTATION_NUMBER; ++i) {
      this.offset[i] =  data.readX(4, UNSIGNED);
    }

    this.size =         data.readX(4, UNSIGNED);

    this.frames = [];
    for (i = 0; i < FrameSet.ORIENTATION_NUMBER; ++i) {
      this.frames[i] =  [];
      for (j = 0; j < this.frameNumber; ++j) {
        this.frames[i][j] = new Frame(data, palette);
        // fix offsets
        if (j > 0) {
          this.frames[i][j].offsetX += this.frames[i][j-1].offsetX;
          this.frames[i][j].offsetY += this.frames[i][j-1].offsetY;
        }
      }
    }

    this.frame = function(n) {
      if ($.isNumeric(n)) _frame = ~~((n + this.frameNumber) % this.frameNumber);
      return _frame;
    };

    this.orientation = function(o) {
      if ($.isNumeric(o)) _orientation = ~~((o + FrameSet.ORIENTATION_NUMBER) % FrameSet.ORIENTATION_NUMBER);
      return _orientation;
    };

    this.draw = function(context) {
      var frame = this.frames[this.orientation()][this.frame()];

      context.drawImage(
        frame.image,
        this.x - ~~(frame.width / 2) + frame.offsetX + this.shiftX[this.orientation()],
        this.y - frame.height + frame.offsetY + this.shiftY[this.orientation()]
      );
    };
  };

  FrameSet.ORIENTATION_NUMBER = 6;
})();
