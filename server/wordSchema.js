var mongoose = require('mongoose');
var schema = mongoose.Schema;


var hitsSchema = new schema({
    text_id:Number,
    hits_num:Number
});


var words = new schema({
	name: {type:String, required:true, index:1, unique:true},
    //postings:Number,
    hits:[hitsSchema],
}, {collection: "word"});

var wordsList = mongoose.model('word', words);

module.exports = wordsList;
