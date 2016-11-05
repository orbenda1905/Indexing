var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var fileParser = require('./filesParser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var port = process.env.PORT || 3000;


app.set('port', port);

app.use('/', express.static('./public'));
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type");
	next();
});

app.post('/files', function(req, res) {
    fileParser.getFiles(req.body.files);
});

app.get('/availableDataFiles', function(req, res) {
    fileParser.getAvailableDataFiles(function(data) {
        res.json(data);
    });
})

app.get('/loadDefault', function(req, res) {
    fileParser.loadDefaultFiles(function(data) {
        res.json(data);
    });
})


app.post('/addFiles', function(req, res) {
    fileParser.addFilesToDatabase(req.body.files, function(data) {
        console.log('loaded files: ' + data);
        res.send('files added');
    })
})

app.post('/search', function(req, res) {
    fileParser.search(req.body.ignoreList, req.body.searchPhrase, function(data) {
        res.json(data);
    })
})

app.post('/getText', function(req, res) {
    fileParser.getTextContent(req.body.textId, function(data) {
        res.send(data);
    })
})

app.listen(port);
console.log('listening on port 3000');
