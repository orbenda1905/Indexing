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

function getWordTextList(word, data) {
    var wordData = null;
    for (var i = 0; i < data.length; i ++) {
        if (data[i].name == word) wordData = data[i];
    }
    if (wordData == null) return [];
    var list = [];
    for (var i = 0; i < wordData.hits.length; i++) {
        list.push(wordData.hits[i].text_id);
    }
    return list;
}

function getInsideBrackets(splitedPhrase, index) {//calling only when opening brackets
//    console.log('brackets');
    if (index >= splitedPhrase.length) return;
    var bracketsNum = 0;
    var word1 = splitedPhrase[index++];
    var logic = splitedPhrase[index++];
    var word2 = splitedPhrase[index++];
    var answer = [];
    if (word2 == '(') {
        bracketsNum++;
        word2 = getInsideBrackets(splitedPhrase, index);
    }
//    console.log('brackets =>  word1 = ' + word1 + ' logic = ' + logic + ' word2 = ' + word2);
    if (logic == 'OR') {
        answer = doOrLogic(word1, word2);
    } else if (logic == 'AND') {
        answer = doAndLogic(word1, word2);
    } else if (logic == 'NOT') {
        answer = doNotLogic(word1, word2);
    }
    if (bracketsNum) {
        for (; index < splitedPhrase.length; index++) {
            if (splitedPhrase[index] == '(') bracketsNum++;
            if (splitedPhrase[index] == ')') bracketsNum--;
            if (!bracketsNum) {
                index++;
                break;
            }
        }
    }
    return calculateLogic(answer, splitedPhrase, index);
}

//var phrase = '"angus" OR word OR ( file OR ( "word1" NOT word2 ) AND word3 ) NOT files';
////var phrase = 'angus AND file';
//var data = [{"name":"angus","hits":[{"text_id":2}]},
//            {"name":"file","hits":[{"text_id":0}]},
//            {"name":"files","hits":[{"text_id":0}]},
//            {"name":"filesystem","hits":[{"text_id":4}]},
//            {"name":"word","hits":[{"text_id":3}, {"text_id":0}]},
//            {"name":"josh","hits":[{"text_id":2}]},
//           {"name":"word1","hits":[{"text_id":0}, {"text_id":1}]},
//           {"name":"word2","hits":[{"text_id":2}, {"text_id":4}]},
//           {"name":"word3","hits":[{"text_id":1}, {"text_id":6}]}];
//var list = phrase.split(" ");
////console.log('list = ' + list);
//convertWordsToList(list, data);
////console.log('after convertion = ' + list);
//var finalList = calculateLogic(list[0], list, 1);
//console.log(finalList);

function calculateLogic(word1, data, index) {
//    console.log('calculate');
    if (index >= data.length || data[index] ==')') return word1;
    var bracketsNum = 0;
    var logic = data[index++];
    var word2 = data[index++];
    //console.log('converting: word1 = ' + word1 + ' logic = ' + logic + ' word2 = ' + word2)
    var answer = [];
    if (word2 == '(') {
        bracketsNum++;
        word2 = getInsideBrackets(data, index);
    }
//    console.log('calculate => word1 = ' + word1 + ' logic = ' + logic + ' word2 = ' + word2);
    if (logic == 'OR') {
        answer = doOrLogic(word1, word2);
    } else if (logic == 'AND') {
        answer = doAndLogic(word1, word2);
    } else if (logic == 'NOT') {
        answer = doNotLogic(word1, word2);
    }
    if (bracketsNum) {
        for (; index < data.length; index++) {
            if (data[index] == '(') bracketsNum++;
            if (data[index] == ')') bracketsNum--;
            if (!bracketsNum) {
                index++;
                break;
            }
        }
    }
    return calculateLogic(answer, data, index);
}

function doAndLogic(l1, l2) {
    var list = [];
    for (var i = 0; i < l1.length; i++ ){
        var id = l1[i];
        if (l2.indexOf(id) != -1)
            list.push(id);
    }
    return list;
}

function doNotLogic(l1, l2) {
    var list = [];
    for (var i = 0; i < l1.length; i++) {
        var id = l1[i];
        if (l2.indexOf(id) == -1)
             list.push(id);
    }
    return list;
}

function doOrLogic(l1, l2) {
    var list = l1.slice();
    for (var i = 0; i < l2.length; i++) {
        var id = l2[i];
        if (list.indexOf(id) == -1) list.push(id);
    }
    return list;
}

function convertWordsToList(list, data) {
    for (var i = 0; i < list.length; i++) {
        var word = list[i];
        if (word == 'AND' || word == 'OR' || word == 'NOT' || word == '(' || word == ')')
            continue;
        if (word.includes('"')) {
            word = word.replace('"', '').replace('"', '');
        }
        var wordList = getWordTextList(word, data);
        list.splice(i,1,wordList);
    }
}

function clearNOTWord(list, data) {
    for (var i = 0; i < list.length; i++) {
        var word = list[i];
        if (word == 'NOT') {
//            if ()
        }
    }
}

function clearWordFromData(word, data) {
    if (word.includes('"')) {
        word = word.replace('"', '').replace('"', '');
    }
    for (var i = 0; i < data.length; i++) {
        if (data[i].name == word) {
            data.splice(i, 1);
            break;
        }
    }
}

//var phrase = '"angus" NOT word OR ( file NOT ( "word1" AND word2 ) AND word3 ) NOT files';
//var list = phrase.split(" ");
//var data = [{"name":"angus","hits":[{"text_id":2}]},
//            {"name":"file","hits":[{"text_id":0}]},
//            {"name":"files","hits":[{"text_id":0}]},
//            {"name":"filesystem","hits":[{"text_id":4}]},
//            {"name":"word","hits":[{"text_id":3}, {"text_id":0}]},
//            {"name":"josh","hits":[{"text_id":2}]},
//           {"name":"word1","hits":[{"text_id":0}, {"text_id":1}]},
//           {"name":"word2","hits":[{"text_id":2}, {"text_id":4}]},
//           {"name":"word3","hits":[{"text_id":1}, {"text_id":6}]}];
//clearNOTwordsFromData(list, data);
//console.log(data);

function clearNOTwordsFromData(list, data) {
    var brackets = 0;
    var NOT = false;
    for (var i = 0; i < list.length; i++) {
        var word = list[i];
//        console.log('word = ' + word  + ' NOT = ' + NOT);
        if (word == 'NOT') NOT = true;
        else if (word ==  '(') {
            if (NOT) brackets++;
        }
        else if (word == ')') {
            if (NOT) {
                if (--brackets == 0) NOT = false;
            }
        }
        else if (word == 'AND' || word == 'OR') continue;
        else {
            if (NOT) {
                clearWordFromData(word, data);
                if (brackets == 0) {
                    NOT = false;
                }
            }
        }
    }
}

//search([], 'the AND or OR angus NOT unix', function(data) {
//    console.log(JSON.stringify(data));
//})

//var words = [{"name":"angus","hits":[{"text_id":2,"hits_num":10,"_id":"58177bc4accd1c600091533f"}]},{"name":"or","hits":[{"text_id":0,"hits_num":2,"_id":"581b6484f79f34163de0af6c"},{"text_id":1,"hits_num":4,"_id":"581b6484f79f34163de0af6b"}]},{"name":"the","hits":[{"text_id":2,"hits_num":19,"_id":"58177bc4accd1c6000915368"},{"text_id":0,"hits_num":11,"_id":"58177bc4accd1c6000915366"},{"text_id":1,"hits_num":3,"_id":"58177bc4accd1c6000915365"}]}];
//
//getTextsData([0,1,2], words, function(data) {
//    console.log(data);
//});

function getTextsData(finalList, wordsList, callback) {
    File.find({'id': {$in: finalList}}).select('-_id').select('-__v').lean().exec(function(err, data) {
        for (var i = 0; i < data.length; i++) {
//            data[i].words = new Array();
//            var words = data[i].words;
            var textId = data[i].id;
            var words = [];
            for (var j = 0; j < wordsList.length; j++) {
                var wordName = wordsList[j].name;
                var wordHits = wordsList[j].hits;
                var wordHitsOnText = 0;
                for (var k = 0; k < wordHits.length; k++) {
                    if (wordHits[k].text_id == textId) {
                        wordHitsOnText = wordHits[k].hits_num;
                        break;
                    }
                }
                if (wordHitsOnText > 0) {
                    words.push({word: wordName, hits: wordHitsOnText});
                }
            }
            data[i].words = words;
//            Object.defineProperty(data[i], "words", words);

//            console.log(data[i]);
        }
        callback(data);
    })

}

function search(filesToIgnore, searchPhrase, callback) {
    var ignoreIdList;
    if (filesToIgnore) {
        ignoreIdList = convertFileNameToId(filesToIgnore);
        needToDisable = true;
    } else
        needToDisable = false;
    var words = parsePhraseForWords(searchPhrase);
    findWords(words, function(data) {
        var list = searchPhrase.split(" ");//[word, AND, (, word, OR, word, )]
//        if (list.length == 1) callback(data);//there is only one word to search for
        convertWordsToList(list, data);
//        startCalculateLogic(list, 0);

        var finalList = calculateLogic(list[0], list, 1);
        if (finalList.length == 0) {
            callback(finalList);
            return;
        }
        if (needToDisable) {
            for (var i = 0; i < ignoreIdList.length; i++) {
                var index = finalList.indexOf(ignoreIdList[i]);
                if (index != -1) {
                    finalList.splice(index, 1);
                }
            }
        }
        list = searchPhrase.split(" ");
        clearNOTwordsFromData(list, data);
        filterData(finalList, data);
        getTextsData(finalList, data, function(answer) {
            callback(answer);
        })
//        callback({words: data, texts: finalList});

    });
}

//var data = [{"name":"angus","hits":[{"text_id":2}]},
//            {"name":"file","hits":[{"text_id":0}]},
//            {"name":"files","hits":[{"text_id":0}]},
//            {"name":"filesystem","hits":[{"text_id":4}]},
//            {"name":"word","hits":[{"text_id":3}, {"text_id":0}]},
//            {"name":"josh","hits":[{"text_id":2}]},
//           {"name":"word1","hits":[{"text_id":0}, {"text_id":1}]},
//           {"name":"word2","hits":[{"text_id":2}, {"text_id":4}]},
//           {"name":"word3","hits":[{"text_id":1}, {"text_id":6}]}];
//var finalList = [2,4,6];
//filterData(finalList, data);
//console.log(JSON.stringify(data));

//{"words":[{"name":"angus","hits":[{"text_id":2,"hits_num":10,"_id":"58177bc4accd1c600091533f"}]},{"name":"angus","hits":[{"text_id":2,"hits_num":10,"_id":"581b6484f79f34163de0b0dd"}]},{"name":"or","hits":[{"text_id":0,"hits_num":2,"_id":"58177bc4accd1c60009154cd"},{"text_id":1,"hits_num":4,"_id":"58177bc4accd1c60009154cc"}]},{"name":"or","hits":[{"text_id":0,"hits_num":2,"_id":"581b6484f79f34163de0af6c"},{"text_id":1,"hits_num":4,"_id":"581b6484f79f34163de0af6b"}]},{"name":"the","hits":[{"text_id":0,"hits_num":11,"_id":"581b6484f79f34163de0aed5"},{"text_id":1,"hits_num":3,"_id":"581b6484f79f34163de0aed4"},{"text_id":2,"hits_num":19,"_id":"581b6484f79f34163de0aed3"}]},{"name":"the","hits":[{"text_id":2,"hits_num":19,"_id":"58177bc4accd1c6000915368"},{"text_id":0,"hits_num":11,"_id":"58177bc4accd1c6000915366"},{"text_id":1,"hits_num":3,"_id":"58177bc4accd1c6000915365"}]}]}


function filterData(finalList, data) {
    for (var i = 0; i < data.length; i++) {
        var hits = data[i].hits;
        for (var j = 0; j < hits.length; j++) {
            var id = hits[j].text_id;
            if (finalList.indexOf(id) == -1) {
                hits.splice(j, 1);
                j--;
            }
        }
        if (hits.length == 0) {
            data.splice(i, 1);
            i--;
        }
    }
}



//findWords(['angus', 'file']);
//findWords(['word', 'truck', '"a"', 'find'])

function findWords(wordsList, callback) {
    for (var i = 0; i < wordsList.length; i++) {//checking with stopList
        var word = wordsList[i];
        if (word.includes('"')) {
            var newWord = word.replace('"', '').replace('"', '');
            wordsList[i] = newWord;
        } else {
            if (stopWords.search(word) != -1) {
                wordsList.splice(i,1);
                i--;
            }
        }
    }
    Word.find({'name': {$in: wordsList}}).select('-_id').select('-__v').exec(function(err, data) {
        callback(data);
    })
}



function parsePhraseForWords(phrase) {//saerching for the actual words in the phrase
    var size = phrase.length;
    var quotation = false;
    var listOfWords = [];
    var word;
    var char;
    var list = phrase.split(" ");
    for (var i = 0; i < list.length; i++) {
        word = list[i];
        if (word == 'AND' || word == 'OR' || word == 'NOT' || word == ')' || word == '(') continue;
        listOfWords.push(word);
    }
    return listOfWords;
}

function phraseNotLogic(phrase) {
    var logicWords = ['AND', 'OR', 'NOT'];
    for (var i = 0; i < logicWords.length; i++) {
        if (phrase.includes(logicWords[i]))
            return false;
    }
    return true;
}

function phraseNotHirarchial(phrase) {
    if (phrase.includes('(') || phrase.includes(')')) return false;
    return true;
}

function findOneWord(word, callback) {
    Word.find({"name": {"$regex": word, "$options": "i"}}).select('-_id').select('-__v').exec(function(err, data){
        var relevantTexts = [];
        for (var i = 0; i < data.length; i++) {
            var size = data[i].hits.length;
            for (var j = 0; j < size; j++) {
                var id = data[i].hits[j].text_id;
                console.log('id= ' + id);
                if (relevantTexts.indexOf(id) == -1) relevantTexts.push(id);
            }
        }
        File.find({'id': {$in: relevantTexts}}).select('-_id').select('-__v').exec(function(err, answer) {
            if (err) console.log('failed to gfetch files data');
            else {
                console.log('answer:\n' + data + " \n" + answer);
                callback({words: data, texts: answer});
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

//function logMapElements(value, key, map) {
//    console.log("m[" + key + "] = " + JSON.stringify(value));
//}
