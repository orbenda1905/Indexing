var mongoose = require('mongoose');
var schema = mongoose.Schema;

var fileSchema = new schema({
	id: Number,
    date: String,
	subject: {type:String, required:true, unique:true},
	preface: String
}, {collection: "files"});

var file  = mongoose.model('files', fileSchema);

module.exports = file;

