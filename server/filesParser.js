var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var stopWords = require('./stopWords.js');
var fs = require('fs');
var Word = require('./wordSchema.js');
var File = require('./fileSchema.js');
var prependFile = require('prepend-file');

var texts = new Array('flat_file_database.txt', 'laptop.txt', 'red_angus.txt', 'sherlock.txt', 'UNIX.txt');
var wordsMap = new Map();

var filesToLoad = 0;
var filesLoaded = 0;

var firstUpdate = true;
var needToDisable = true;

exports.loadDefaultFiles = loadDefaultFiles;
exports.getAvailableDataFiles = getAvailableDataFiles;
exports.search = search;

function addFilesToDatabase(files, callback) {
    filesToLoad = files.length;
    for (var i = 0; i < filesToLoad; i++) {
        (function(num) {
            fs.readFile('../database_files/' + files[i], 'utf8', function(err, data) {
                addIdToFile(data, num + texts.length, function(items) {
                    callback(items);
                });
            });
        })(i)
    }
}

function loadDefaultFiles(callback) {
    filesToLoad = texts.length;
    var counter = 0;
    for (var i = 0; i < filesToLoad; i++) {
        (function(num) {
            fs.readFile('./databaseFiles/' + texts[num], 'utf8', function(err, data) {
                if (!data) {
                    (function(num) {
                        fs.readFile('../database_files/' + texts[num], 'utf8', function(err, data) {
                            addIdToFile(data, num, function(items) {
                                callback(items);
                            });
                        });
                    })(num)
                } else counter++;
                if (counter == texts.length) callback(texts);
            })
        })(i)
    }
}



function getAvailableDataFiles(callback) {
    fs.readdir('../database_files/', function(err, items) {
        for (var i =0; i < items.length; i++) {
            if (texts.indexOf(items[i]) != -1 || items[i] === ".DS_Store") items.splice(i--, 1);
        }
        callback(items);
    });
}



function addIdToFile(data, textId, callback) {
    prependFile('./databaseFiles/' + texts[textId], 'id:' + textId + '\n' + data, function(err) {
        if (err) {
            console.log('failed writing id to file - ' + err);
        }
    });
    var lines = data.split('\n');
    saveNewFile(lines[0].trim(), lines[1].trim(), textId);
    for (var i = 1; i < lines.length; i++) {
        lines[i] = lines[i].trim();
        //var lineWords = lines[i].match(/\S+/g);
        var lineWords = lines[i].split(/\W+/);
        wordsIndexer(lineWords, textId);
    }
    filesLoaded++;
    console.log(filesLoaded);
    if (filesLoaded == filesToLoad) {
        updateDatabase(function(items) {
            callback(items);
        });
        wordsMap.clear();
    }
    //if (counter == 4) wordsMap.forEach(logMapElements);
}

function saveNewFile(line1, preface, id) {
    var firstLine = line1.split(",");
    var subject = firstLine[0];
    var date = firstLine[1].slice(0, firstLine[1].length-1);

    var newFile = new File({
        id: id,
        date: date,
        subject: subject,
        preface: preface
    });
    newFile.save(function(err, doc) {
        if (err) console.log("failed to save file in database: " + err);
        else console.log("updated file database");
    });
}

function wordsIndexer(splitedLine, textId) {
    for (var i = 0; i < splitedLine.length; i++) {
        if (splitedLine[i] == '') continue;
//        if (stopWords.search(splitedLine[i].toLowerCase()) != -1) continue;
        if (wordsMap.has(splitedLine[i].toLowerCase())) {
            var data = wordsMap.get(splitedLine[i].toLowerCase());
            var j, flag = false;
            for (j = 0; j < data.length; j++) {
                if (data[j].text_id == textId) {
                    data[j].hits_num += 1;
                    flag = true;
                }
            }
            if (!flag) {
                data.push({text_id:textId, hits_num:1});
            }
        }
        else {
            wordsMap.set(splitedLine[i].toLowerCase(), [{text_id:textId, hits_num: 1}])
        }
    }
}

function updateDatabase(callback) {
    console.log('updating databsase');
    if (firstUpdate) {
        wordsMap.forEach(updateNewWord);
        firstUpdate = false;
    } else {
        wordsMap.forEach(function(value, key) {
            Word.findOne().where('name', key).exec(function(err, doc) {
                if (err)  {
                    console.log('err: ' + err);
                    return;
                }
                if (doc) {
                    doc.update({$push:{hits: value}}).exec(function(err) {
                        if (err) console.log('failed to update the word ' + doc.name + ' hits');
                    });
                } else {
                    updateNewWord(value, key);
                }
            })
        });
    }
    callback(texts);
}

function updateNewWord(value, key) {
    var newWord = new Word({
        name: key,
        hits: value
    });
    newWord.save(function(err, doc) {
        if (err) console.log('failed to save a word, error is: ' + err);
    });
}

function search(filesToIgnore, searchPhrase, callback) {
    var ignoreIdList;
    if (filesToIgnore) {
        ignoreIdList = convertFileNameToId(filesToIgnore);
        needToDisable = true;
    } else
        needToDisable = false;
    Word.find({"name": {"$regex": searchPhrase, "$options": "i"}}).select('-_id').exec(function(err, data){
//        console.log(data);
//        callback(data);
        var relevantTexts = [];
        for (var i = 0; i < data.length; i++) {
            var size = data[i].hits.length;
            for (var j = 0; j < size; j++) {
                var id = data[i].hits[j].text_id;
                if (relevantTexts.indexOf(id) == -1) relevantTexts.push(id);
            }
        }
        File.find({'id': {$in: relevantTexts}}).select('-_id').exec(function(err, answer) {
            if (err) console.log('failed to gfetch files data');
            else {
                callback([data, relevantTexts]);
            }
        })
    })
}

function convertFileNameToId(filesToIgnore) {
    var idList = [];
    for (var i = 0; i < filesToIgnore.length; i++) {
        idList.push(texts.indexOf(filesToIgnore[i]));
    }
    return idList;
}

function logMapElements(value, key, map) {
    console.log("m[" + key + "] = " + JSON.stringify(value));
}

////fetching cleint data
//function getClient(email, callback) {
//	var query = clients.findOne().where('email', email);
//	query.exec(function(err, doc) {
//		if (err) {
//			var error1 = "error searching fo client";
//			console.log(error1);
//			callback({type: false, data: error1});
//		} else if (!doc) {
//			//person is not exist
//			var client = new clients({
//				favorite: [],
//				email: email,
//				type: 'Cooker'
//			});
//			client.save(function(err, doc) {
//				if (err) {
//					var error2 = "failed creating new client";
//					console.log(error2);
//					callback({type: false, data: error2});
//				} else {
//					console.log("new client created:\n" + doc);
//					callback({type: true, data: doc});
//				}
//			});
//		} else {
//			callback({type: true, data: doc});
//		}
//	})
//}
//
//
//function getFiles(files) {
//
//}
//
////increaing likes to recipe
//function increaseLikes(recipeName, callback) {
//    console.log("increasing likes");
//	getRecipe(recipeName, function(doc) {
//        if (doc.status) {
//            var query = doc.data.update({$inc: {likes: 1}});
//            query.exec(function(err) {
//			if (err) {
//				console.log("failed incrementing the 'like' of recipe");
//			} else {
//				console.log("likes updated");
//			}
//            callback();
//            });
//        } else {
//            callback();
//        }
//
//	});
//}
//
////decreasing like to recipe
//function decreaseLikes(recipeName, callback) {
//	getRecipe(recipeName, function(doc) {
//        if (doc.data) {
//            if (doc.data.likes == 0) {
//            callback();
//            return;
//            }
//            var query = doc.data.update({$inc: {likes: -1}});
//            query.exec(function(err) {
//                if (err) {
//                    console.log("failed decrementing the 'like' of recipe");
//                } else {
//                    console.log("likes decremented");
//                }
//                callback();
//            });
//        } else {
//            callback();
//        }
//	});
//}
//
////fetching specific recipe
//function getRecipe(recipeName, callback) {
//	var query = recipes.findOne().where('name', recipeName);
//    query.exec(function(err, doc){
//		if (err) {
//            var error = "failed to find the recipe";
//			console.log(error);
//            callback({status: false, data: error});
//		} else{
//			callback({status: true, data: doc});
//		}
//    });
//}
//
//exports.getRecipe = getRecipe;
//
////getting all the recipes that the admin still didn't make steps
//exports.getUnmodifiedRecipes = function(req, res) {
//	var query = recipes.find();
//	query.where('modified', false).select('-_id');
//	query.exec(function(err, docs) {
//        if (err) {
//            res.json({error: "failed to load recipes"})
//        } else  {
//            res.json(docs);
//        }
//
//	});
//}
//
////the recipes that are ready to display for the client
//exports.getModifiedRecipes = function(time, callback) {
//	var query = recipes.find();
//	query.where('timers.total', time).select('-_id');
//	query.exec(function(err, docs) {
//        if (err || !docs) {
//            callback({status: false});
//        } else {
//            callback({status: true, data: docs});
//        }
//	})
//}
//
////updating the steps that the admin has made for specific recipe
//exports.updateSteps = function(recipeName, steps, prep, cook, total, callback) {
//	getRecipe(recipeName, function(doc) {
//        if (doc.status) {
//            doc.data.set('steps', steps);
//            doc.data.set('modified', true);
//            doc.data.set('timers.preparation', prep);
//            doc.data.set('timers.cooking', cook);
//            doc.data.set('timers.total', total);
//            doc.data.save(function(err) {
//			if (err) {
//
//				console.log("failed saving");
//                callback({status: false});
//			}
//			else{
//				console.log("updating complete");
//                callback({status: true});
//			}
//		});
//        }
//	});
//}
//
//
//
//exports.getClient = getClient;
//
////add recipe to client's favorites
//exports.addFavorite = function(recipeName, email, callback) {
//    getClient(email, function(answer) {
//        if (!answer.type) {
//            callback({status: false});
//        } else {
//            var client = answer.data;
//            var size = client.favorite.length;
//            var exist = false
//            for (var i = 0; i < size; i++) {
//                if (client.favorite[i] == recipeName) {
//                    exist = true;
//                    break;
//                }
//            }
//            var query;
//            if (exist) query = client.update({$pull:{favorite: recipeName}});
//            else query = client.update({$push:{favorite: recipeName}});
//            query.exec(function(err) {
//				if (err) {
//					console.log('failed to update client');
//                    callback({status: false});
//				} else {
//					console.log('success in updating client');
//                    if (exist) {
//                        decreaseLikes(recipeName, function() {
//                            callback({status: true});
//                        });
//                    }else{
//                        increaseLikes(recipeName, function() {
//                            callback({status: true});
//                        });
//                    }
//
//				}
//			});
//        }
//    });
//}
//
////receiving "favor" = name list of client's favorits recipes
////retreiving those favorites recipes
////"favor" is an Array
//exports.getFavorites = function(favor, callback) {
//    recipes.find({'name': { $in: favor}}, function(err, data) {
//        if (err) {
//            console.log(err);
//        } else {
//            console.log(data);
//            callback(data);
//        }
//    })
//}


