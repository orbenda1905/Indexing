var mongoose = require('mongoose');
var schema = mongoose.Schema;

var fileSchema = new schema({
	id: Number,
    source:String,
    date: String,
	subject: {type:String, required:true, index:1, unique:true},
	preface: String
}, {collection: "files"});

var file  = mongoose.model('files', fileSchema);

module.exports = file;

