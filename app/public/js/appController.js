var indexingApp = angular.module('indexing',["ui.router"]);

var globalData = {};

function help() {
    var printWindow = window.open();
        printWindow.document.open('text/plain')
        printWindow.document.write(globalData.instructions);
        printWindow.document.close();
        printWindow.focus();
//        printWindow.close();
}

globalData.instructions = "<section>" +
                "<h1>Instruction</h1>" +
                "When loading the page, you can see the already “Loaded” files and what can be load.<br>" +
                "In order to load new file to the system, simply mark files from the “Unloaded” column and press “update” button.<br><br>" +

               "In order to disable files’ simply unmark them from the “Loaded” column’ and then search.<br>" +

                "<h2>Searching</h2>" +
                "There are few basic rules for searching:" +
                "<ul>" +
                    "<li>The phrase must be legal logically (each opening brackets must come with closing ones).</li>" +
                    "<li>The phrase must start with a word.</li>" +
                    "<li>Inside brackets there must be at least two words with logical operator.</li>" +
                    "<li>You must keep spacing between each part in the phrase -> W OP W ( W OP W ).</li>" +
                "</ul>" +
                "<br>" +
                "On each result there is a “plus” sign, by pressing it you will see the text with the marked words." +

            "</section>";


indexingApp.config(function($stateProvider, $urlRouterProvider){
	$urlRouterProvider.otherwise("/")

    $stateProvider.
    state('home', {
        cache: false,
        url: "/",
        templateUrl: "./templates/arrangeFiles.html",
        controller: 'arrangeFiles'
    }).
        state('home.searchResult', {
            cache: false,
            url: "/results?destination",
            templateUrl: "./templates/searchResults.html",
            controller: "showSearchResults"
    }).
            state('home.searchResult.displayFile', {
                url: "/results/showFile:text_id",
                templateUrl: "./templates/displayFile.html",
                controller: "displayFileContent"
    })
});

indexingApp.controller('arrangeFiles', function($scope, $http, $location, $state) {
    $scope.loadedFiles = [];
    $scope.unloadedFiles = [];
    $http.get('http://localhost:3000/loadDefault').success(function(data) {

        var size = data.length;
        for (var i = 0; i < size; i++) {
            $scope.loadedFiles.push({name: data[i], enable: true});
        }
        $http.get('http://localhost:3000/availableDataFiles').success(function(data) {
            var size = data.length;
            for (var i = 0; i < size; i++) {
                $scope.unloadedFiles.push({name: data[i], enable: false});
            }
        })
    });


    $scope.loadFilesToDB = function() {
        var size = $scope.unloadedFiles.length;
        var tempList = [];
        var enableList = [];
        for (var i = 0; i < size; i++) {
            if ($scope.unloadedFiles[i].enable) {
                var name = $scope.unloadedFiles[i].name;
                tempList.push(name);
                var temp = $scope.unloadedFiles[i];
                enableList.push(temp);
                $scope.unloadedFiles.splice(i, 1);
                --i;
                --size;
            }
        }
        $http.post('http://localhost:3000/addFiles', {files: tempList}).success(function(data) {
            if (data != 'files added') {
                console.log('failed to upload the following files:\n' + tempList);
            } else {
                for (var j = 0; j < enableList.length; j++) {
                    $scope.loadedFiles.push(enableList[j]);
                }
            }
        })
    }

    $scope.searchPhrase = function(phrase) {
        if (checkPhraseSyntax(phrase) == false) return alert('phrase is not legal');
        var size = $scope.loadedFiles.length;
        var tempList = [];
        for (var i = 0; i < size; i++) {
            if (!$scope.loadedFiles[i].enable) tempList.push($scope.loadedFiles[i].name);
        }
        $http.post("http://localhost:3000/search", {ignoreList: tempList, searchPhrase: phrase}).success(function(data) {
            globalData.results = data;
            globalData.searchPhrase = phrase;
            $state.transitionTo('home.searchResult', null, {'reload':true});
        })
    }
})

indexingApp.controller('showSearchResults', function($scope, $http, $location, $state) {

    $scope.results = globalData.results;
    $scope.phrase = globalData.searchPhrase;

    $scope.getFileContent = function(text_Id, words) {
        globalData.wordsToHighlight = words;
        $http.post('http://localhost:3000/getText', {textId: text_Id}).success(function(data) {
            globalData.textContent = data;
            $state.transitionTo('home.searchResult.displayFile', null, {'reload':true});
        })
    }

})

indexingApp.controller('displayFileContent', function($scope, $stateParams, $http) {

    document.getElementById('content').innerHTML = globalData.textContent;

    for (var i = 0; i < globalData.wordsToHighlight.length; i++) {
        highlight(document.getElementById('content'),globalData.wordsToHighlight[i].word,'highlight');
    }

    $scope.print = function() {
        var printWindow = window.open();
        printWindow.document.open('text/plain')
        printWindow.document.write(globalData.textContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
})

function highlight(container,what,spanClass) {
    var content = container.innerHTML,
        pattern = new RegExp(what, 'gi'),
        replaceWith = '<span ' + ( spanClass ? 'class="' + spanClass + '"' : '' ) + '">' + what + '</span>',
        highlighted = content.replace(pattern,replaceWith);
    return (container.innerHTML = highlighted) !== content;
}

function checkPhraseSyntax(phrase) {//returns true/false
    if (phrase.length == 0) return;
    var stack = [];
    var size = phrase.length;
    for (var i = 0; i < size; i++) {
        var char = phrase.charAt(i);
        if (char == '(') {
            stack.push(char);
        } else if (char == ')') {
            char = stack.pop();
            if (char != '(') return false;
        } else continue;
    }
    if (stack.length > 0) return false;
    return true;
}
