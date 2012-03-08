var File;

(function() {
  File = function() {
    var _head = 0;
    var _data;

    this.open = function(url, success) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onreadystatechange = function(e) {
          if (this.readyState === 4 && this.status === 200) {
            _data = new Uint8Array(this.response);
            success();
          }
        };
        xhr.send();
    };

    this.read = function(len, signed) {
      var result = 0;
      var i;

      for (i = 0; i < len; ++i) {
        result += _data[_head + i] << (i * 8);
      }

      if (signed && (result >= (1 << (8 * len - 1)))) {
        result -= (1 << (8 * len));
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

      if (signed && (result >= (1 << (8 * len - 1)))) {
          result -= (1 << (8 * len));
      }

      _head += len;

      return result;
    };
  };

  File.UNSIGNED = false;
  File.SIGNED = true;
})();
