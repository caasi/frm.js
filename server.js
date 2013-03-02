var fs = require("fs"),
    express = require("express"),
    app = express(),
    static_path = "public/",
    frm_path = "frm/Hammering Richard/FRMs/";

app.use(express.static("public"));

app.get("/", function(req, res) {
  res.sendfile("public/index.htm");
});

app.get("/js/list.js", function(req, res) {
  var tmp, result = {
    "Hammering Richard": {}
  };

  tmp = result["Hammering Richard"];

  fs.readdir(static_path + frm_path, function(err, files) {
    files.forEach(function(value) {
      var name, postfix;
      if (value.substr(-4, 4) === ".frm") {
        name = value.substr(0, value.length - 6);
        if (tmp[name] === undefined) {
          tmp[name] = {};
        }
        postfix = value.substr(-6, 2);
        tmp[name][postfix] = frm_path + value;
      }
    });
    res.send("var frmlist = " + JSON.stringify(result));
  });
});

app.listen(2241);
