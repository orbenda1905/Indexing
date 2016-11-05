var list = new Array();


list.push('a');
list.push('find');



exports.search = function(word) {
    return list.indexOf(word);
}
