var express = require('express');
var bodyParser = require("body-parser");
var app = express();
//var recipesController = require('./recipesController');
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
        console.log('data received: ' + data);
        res.json(data);
    });
})

app.get('/loadDefault', function(req, res) {
    fileParser.loadDefaultFiles(function(data) {
        console.log('default files: ' + data);
        res.json(data);
    });
})


app.post('/addFiles', function(req, res) {
    fileParser.addFilesToDatabase(req.body.files, function(data) {
        console.log('files added', req.body.files.forEach(function(element) {
            console.log(element);
        }));
        res.send('files added');
    })
})

app.post('/search', function(req, res) {
    fileParser.search(req.body.ignoreList, req.body.searchPhrase, function(data) {
        res.json(data);
    })
})
//app.get('/admin/getUnmodified', recipesController.getUnmodifiedRecipes);
//
//app.get('/admin/getModified/:time', function(req, res) {
//	recipesController.getModifiedRecipes(req.params.time, function(data) {
//        if (data.status) {
//            res.json(data.data);
//        } else {
//            res.status(301);
//            res.send();
//        }
//    });
//});
//
//app.post('/admin/updateSteps/:recipeName', function(req, res) {
//
//    recipesController.updateSteps(req.params.recipeName, req.body.steps,req.body.prepare, req.body.cook, req.body.total, function(data) {
//        if (data.status) res.status(200);
//        else res.status(301);
//        res.send();
//    });
//});
//
//app.get('/checkClient/:email', function(req, res) {
//	recipesController.getClient(req.params.email, function(data) {
//        res.json(data);
//	})
//})
//
//app.post('/admin/addToFavorites/:recipeName', function(req, res) {
//    recipesController.addFavorite(req.params.recipeName, req.body.email, function(data) {
//            if (data.status) {
//                res.status(200);
//            } else {
//                res.status(301);
//            }
//        res.send();
//    });
//})
//
//app.post('/admin/getFavorites', function(req, res) {
//    recipesController.getFavorites(req.body.favor, function(data) {
//        res.json(data);
//    });
//})


app.listen(port);
console.log('listening on port 3000');
