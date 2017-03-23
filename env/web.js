var http = require('http');
var express = require('express');
var fs = require("fs");

var app = express();
var path = __dirname;
path = path + "/..";
app.use(express.static(path));

app.post('*', function(req, res) {
    var filePath = '..' + req.path;
    fs.readFile(filePath, function (error, fileData) {
        if (error) {
            console.log('读取失败' + error);
        } else {
            res.send(fileData);
        }
    });
});

var port = 8003;
console.log("cii path:" + path);
console.log("listen:" + port);
app.listen(port);