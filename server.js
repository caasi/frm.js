var fs = require("fs"),
    express = require("express"),
    app = express(),
    static_path = "public/",
    frm_path = "frm/Art/critters/";

app.use(express.static("public"));

app.get("/", function(req, res) {
  res.sendfile("public/index.htm");
});

app.get("/js/list.js", function(req, res) {
  var result = {}

  fs.readdir(static_path + frm_path, function(err, files) {
    files.sort(function(a, b) {
      return a < b ? -1 : 1;
    }).forEach(function(value) {
      var prefix,
          prefix_len = 2,
          name,
          postfix,
          postfix_len = 2,
          ext = value.substr(-3, 3).toUpperCase();
      if (ext === "FRM" || ext === "FR0") {
        prefix = value.substr(0, prefix_len).toUpperCase();
        name = value.substr(2, value.length - prefix_len - postfix_len - 4).toUpperCase();
        postfix = value.substr(-6, postfix_len).toUpperCase();
        if (result[prefix] === undefined) {
          result[prefix] = {};
        }
        if (result[prefix][name] === undefined) {
          result[prefix][name] = {};
        }
        result[prefix][name][postfix] = frm_path + value;
      }
    });
    res.send("var frmlist = " + JSON.stringify(result));
  });
});

app.listen(8080);
