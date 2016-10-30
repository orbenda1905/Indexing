var list = new Array();


list.push('a');



exports.search = function(word) {
    return list.indexOf(word);
    return list.includes(word);
}
