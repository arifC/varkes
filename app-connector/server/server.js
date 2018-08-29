var express = require("express")
var Resource = require("express-resource")
var connector = require("./connector")
var fs = require("fs")
const path = require("path")

const bodyParser = require('body-parser');
const CONFIG = require("../config")
var app = express();
app.use(bodyParser.json());
//Get APi data from api.json if exists. We can move this code to somewhere else.
if (fs.existsSync(path.resolve(CONFIG.keyDir, CONFIG.apiFile))) {
    CONFIG.URLs = JSON.parse(fs.readFileSync(path.resolve(CONFIG.keyDir, CONFIG.apiFile)))
}
app.use(express.static('server/views'))
require("./middleware").defineMW(app)

app.resource('services', require("./resources/service"))

app.post(CONFIG.startConnUrl, function (req, res) {
    if (!req.body) res.sendStatus(400);

    connector.exportKeys(req.body.url, (data) => {

        fs.writeFileSync(path.resolve(CONFIG.keyDir, CONFIG.apiFile), JSON.stringify(data), "utf8")
        res.send(data)
        CONFIG.URLs = data
    })
});

app.get("/", function (req, res) {
    res.sendfile("server/views/index.html")
})

app.get("/metadata", function (req, res) {
    res.sendfile("swagger.yaml")
})

var server = app.listen(CONFIG.port, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("App connector listening at http://%s:%s", host, port)

});
module.exports = server