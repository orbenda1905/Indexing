var mongoose = require('mongoose');

mongoose.connect("put your mongo collection here");
var conn = mongoose.connection;
conn.on('error', function(err) {
	console.log('connection error ' + err);
});
conn.once('open', function() {
	console.log('connection established!!');
});
