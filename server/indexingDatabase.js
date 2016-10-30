var mongoose = require('mongoose');

mongoose.connect("mongodb://orbenda1905:orbenda1905@ds063856.mlab.com:63856/words");
var conn = mongoose.connection;
conn.on('error', function(err) {
	console.log('connection error ' + err);
});
conn.once('open', function() {
	console.log('connection established!!');
});
