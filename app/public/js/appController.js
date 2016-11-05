var indexingApp = angular.module('indexing',["ui.router"]);

//var globalData = {
//    lastPickedRecipe : null
//
//};

////time picking display
//function show_value(x) {
//    document.getElementById("slider_value").innerHTML=x;
//}

//to support a small bug when pressing "my recipe"
//at "TimeBar" template and then pressing "back"
//in the browser
//var lastModifiedRecipe = {
//
//}


indexingApp.config(function($stateProvider, $urlRouterProvider){



		// For any unmatched url, send to /route1
	$urlRouterProvider.otherwise("/")

    $stateProvider.
    state('home', {
        url: "/",
    }).
        state('home.searchResult', {
            url: "/results",
            templateUrl: "./templates/searchResults.html",
            controller: "showSearchResults"
    }).
            state('home.searchResult.displayFile', {
                url: "/results/showFile",
                templateUrl: "./templates/displayFile.html",
                controller: "displayFileContent"
    })

//	$stateProvider.
//	 state('login', {
//		url: "/",
//		controller: "loginCtrl"
//	 }).
//	 state('admin', {
//		  url: "/adminPage",
//		  templateUrl: "./templates/adminPage.html",
//		  controller: 'quickyCtrl'
//	}).
//		  state('admin.recipeDisplay', {
//			url: "/displayRecipe/:recipeName",
//			templateUrl: './templates/recipeDisplay.html',
//			controller: 'displayRecipe'
//		}).
//	 state('cooker', {
//		  url: "/home",
//		  templateUrl: "./templates/home.html",
//		  controller: 'ClientHome'
//	 }).
//	 state('recipesByTime', {
//		  url: "/displayByTime/:favorite",
//            params :{
//        favorite: null
//    },
//		  templateUrl: './templates/recipesClient.html',
//		  controller: 'displayByTime'
//	 }).
//	 state('specificRecipe', {
//			 url: "/displayByTime/specific/:recipeName",
//			 templateUrl: "./templates/ingredientsClient.html",
//			 controller: 'recipeIngredients'
//			 }).
//     state("timeBar", {
//            url: "/displayByTime/specific/timeBar/:recipeName",
//            templateUrl: "./templates/timeBar.html",
//            controller: "timeBarControl"
//    })

})

indexingApp.controller('arrangeFiles', function($scope, $http) {
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
        for (var i = 0; i < size; i++) {
            if ($scope.unloadedFiles[i].enable) {
                tempList.push($scope.unloadedFiles.splice(i,1));
                --i;
                --size;
            }
        }
        $http.post('http://localhost:3000/addFiles', {files: tempList}).success(function(data) {
            if (data != 'files added') {
                console.log('failed to upload the following files:\n' + tempList);
            } else {
                for (var j = 0; j < size; j++) {
                    $scope.loadedFiles.push(tempList[j]);
                }
            }
        })
    }

    $scope.searchPhrase = function(phrase) {
        if (checkPhraseSyntax(phrase) == false) return;
        var size = $scope.loadedFiles.length;
        var tempList = [];
        for (var i = 0; i < size; i++) {
            if (!$scope.loadedFiles[i].enable) tempList.push($scope.loadedFiles[i].name);
        }
        $http.post("http://localhost:3000/search", {ignoreList: tempList, searchPhrase: phrase}).success(function(data) {
            console.log('words:\n' + data.words + '\ntexts:\n' + data.texts);
        })
    }
})

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

//quickyApp.controller('loginCtrl', function($scope, $http, $location) {
//
//    //fetching the client's data
//    $scope.checkEmail = function(email, user) {
//        globalData.googleData = user;
//        console.log(user);
//		$http.get("https://quickyfinal.herokuapp.com/checkClient/" + email).success(function(data) {
//            globalData.userData= data.data;
//			$scope.removeOnClick();
//		});
//	}
//
//    //clearing index.html
//	$scope.removeOnClick = function() {
//		var login = angular.element( document.querySelector( '#gConnect' ) );
//        var logo = angular.element( document.querySelector( '#logo' ) );
//		login.remove();
//        logo.remove();
//        if(globalData.userData.type == "Admin") {
//            document.getElementsByTagName('body')[0].className = "cover";
//        }
//
//		if (globalData.userData.type == "Admin") {
//			$http.get("https://quickyfinal.herokuapp.com/admin/getUnmodified").success(function(data) {
//                if (data.type == "error") {
//                    globalData.recipes = {};
//                    console.log("getUnmodified service returned an error:\n"+data.data);
//                } else {
//                    globalData.recipes = data;
//                    $location.path('/adminPage');
//                }
//            });
//		} else {
//			$location.path('/home');
//		}
//	}
//});
//
//quickyApp.controller('unloadedFiles', function($scope, $http) {
//    console.log('unloadedFiles');
//    $scope.optionalFiles = [];
//    $http.get('http://localhost:3000/').success(function(data) {
//        $scope.optionalFiles = data;
//    })
//})
//
//quickyApp.controller('displayRecipe', function($scope, $stateParams) {
//
//	var recipes = globalData.recipes;
//	var size = globalData.recipes.length;
//	for (var i = 0; i < size; i++) {
//		if (recipes[i].name === $stateParams.recipeName) {
//			$scope.correctRecipe = recipes[i];
//			break;
//		}
//	}
//});
//
//quickyApp.controller('quickyCtrl', function($scope, $http){
//    $scope.steps = [];
//    $scope.preparation = [];
//    $scope.cooking = [];
//    $scope.name = globalData.googleData.displayName;
//    $scope.notModified = globalData.recipes;
//    var preparationTime = 0;
//    var cookingTime = 0;
//    var mainTotalTime = 0;
//    var sideTotalTime = 0;
//
//
//    //building all the steps that the admin inserting
//    $scope.addPreparationSteps = function (prepare, prepTime, prepKind) {
//        $scope.preparation.push({action: prepare, time: prepTime, kind: prepKind, imageURL: "../images/VeganGreenChiliMacAndCheese/1.png"});
//        preparationTime += prepTime;
//        if (prepKind == "main") mainTotalTime += prepTime;
//        else sideTotalTime += prepTime;
//    };
//
//	$scope.addCookingSteps = function (toCook, cookTime, cookKind) {
//        $scope.cooking.push({action: toCook, time: cookTime, kind: cookKind, imageURL: "../images/SpicyBuffaloChickpeaWraps/3.png"});
//        cookingTime += cookTime;
//        if (cookKind == "main") mainTotalTime += cookTime;
//        else sideTotalTime += cookTime;
//	};
//
//    //updating the steps in mLab
//	$scope.setSteps = function(recipeName) {
//        $scope.steps.push($scope.preparation);
//		$scope.steps.push($scope.cooking);
//		var prep = {
//
//		}
//		prep.preparation = $scope.preparation;
//		prep.cooking = $scope.cooking;
//        var totalTime = 0;
//        if (sideTotalTime > mainTotalTime) totalTime = sideTotalTime;
//        else totalTime = mainTotalTime;
//
//		$http.post("https://quickyfinal.herokuapp.com/admin/updateSteps/" + recipeName, {steps: prep, prepare: preparationTime, cook: cookingTime, total: totalTime }).success(function(data) {
//				if (data.status == 301) {
//					 console.log("updateSteps service has failed");
//				}
//		  });
//		$scope.preparation = [];
//		$scope.cooking = [];
//		$scope.steps = [];
//	}
//});
//
//quickyApp.controller('ClientHome', function($scope, $http, $location) {
//	 //marking each favorite recipes according to client data
//	 $scope.markUserFavorites = function() {
//		  var size = globalData.recipes.length;
//		  var favSize = globalData.userData.favorite.length;
//		  for (var i = 0; i < size; i++) {
//				globalData.recipes[i].favorite = "notFavorite";
//				for(var j = 0; j < favSize; j++) {
//				    if (globalData.recipes[i].name == globalData.userData.favorite[j]) {
//				        globalData.recipes[i].favorite = 'favorite';
//                        break;
//				    }
//				}
//		  }
//	 }
//
//     //modified recipes = recipes with steps (has been modified by the admin already)
//	 $scope.getAllModified = function() {
//		  var elem = angular.element( document.querySelector('#timeInput'));
//		  var time = elem[0].value;
//		  $http.get('https://quickyfinal.herokuapp.com/admin/getModified/' + time).success(function(data) {
//				if (data.status == 301) {
//					 console.log("getModified service has failed");
//				} else {
//					 globalData.recipes = data;
//					 $scope.markUserFavorites();
//					 $location.path('/displayByTime/' + 0);
//				}
//		  });
//	 }
//})
//
//quickyApp.controller('displayByTime', function($scope, $http, $stateParams) {
//
//
//    $scope.checkIfInFavorites = function(recipeName) {
//        var size = globalData.userData.favorite.length;
//        var answer = false;
//        for (var i = 0; i < size; i++) {
//            if (globalData.userData.favorite[i] == recipeName) {
//                answer = true;
//            }
//        }
//        return answer;
//    }
//
//    //if the client pressed "My Recipe"
//    var favorite = parseInt($stateParams.favorite, 10);
//    if (favorite > 0) {
//        $http.post('https://quickyfinal.herokuapp.com/admin/getFavorites', {favor: globalData.userData.favorite}).success(function(data) {
//            globalData.recipes = data;
//
//            var size = globalData.recipes.length;
//            var favSize ; globalData.userData.favorite.length;
//            for (var i = 0; i < size; i++) {
//                globalData.recipes[i].favorite = "favorite";
//            }
//
//            $scope.modifiedRecipes = data;
//        })
//    } else {
//        $scope.modifiedRecipes = globalData.recipes;
//    }
//
//    //when the client click on favorite icon we need to check if to clear from favorites or to add to favorites
//    $scope.addToFavorites = function($index, recipeName) {
//        if ($scope.checkIfInFavorites($scope.modifiedRecipes[$index].name)) {
//				//we want to clear it from favorites(because it 's already favorited)
//            $http.post('https://quickyfinal.herokuapp.com/admin/addToFavorites/' + recipeName, {email: globalData.userData.email})
//                .success(function(data) {
//                    if (data.status == 301) {
//                        console.log('addFavorite service had failed');
//                    }
//                    globalData.recipes[$index].favorite = 'notFavorite';
//                    $scope.modifiedRecipes[$index].favorite = 'notFavorite';
//                    var indexOfRecipe = globalData.userData.favorite.indexOf(recipeName);
//                    if (indexOfRecipe > -1) {
//                        globalData.userData.favorite.splice(indexOfRecipe, 1);
//                    }
//                });
//        }else {
//            $http.post('https://quickyfinal.herokuapp.com/admin/addToFavorites/' + recipeName, {email: globalData.userData.email})
//                .success(function(data) {
//                    if (data.status == 301) {
//				        console.log('addFavorite service had failed');
//				    }
//				    globalData.recipes[$index].favorite = 'favorite';
//				    $scope.modifiedRecipes[$index].favorite = 'favorite';
//				    globalData.userData.favorite.push(recipeName);
//				});
//        }
//    }
//
//    //------Filter By Category--------
//    $scope.showOnlyEntree = function() {
//        $scope.modifiedRecipes = globalData.recipes.slice(0);
//        var size = globalData.recipes.length;
//        for(var i=0; i < size; i++){
//            if($scope.modifiedRecipes[i].category != "Entree") {
//                $scope.modifiedRecipes.splice(i,1);
//                i--;
//                size--;
//            }
//        }
//    }
//    $scope.showOnlyLunch = function() {
//        $scope.modifiedRecipes = globalData.recipes.slice(0);
//        var size = globalData.recipes.length;
//        for(var i=0; i < size; i++){
//            if($scope.modifiedRecipes[i].category != "Lunch") {
//                $scope.modifiedRecipes.splice(i,1);
//                i--;
//                size--;
//            }
//        }
//    }
//    $scope.showOnlyPasta = function() {
//        $scope.modifiedRecipes = globalData.recipes.slice(0);
//        var size = globalData.recipes.length;
//        for(var i=0; i < size; i++){
//            if($scope.modifiedRecipes[i].category != "Pasta") {
//                $scope.modifiedRecipes.splice(i,1);
//                i--;
//                size--;
//            }
//        }
//    }
//    $scope.showOnlyAppetizer = function() {
//        $scope.modifiedRecipes = globalData.recipes.slice(0);
//        var size = globalData.recipes.length;
//        for(var i=0; i < size; i++){
//            if($scope.modifiedRecipes[i].category != "Appetizer") {
//                $scope.modifiedRecipes.splice(i,1);
//                i--;
//                size--;
//            }
//        }
//    }
//    $scope.showOnlyDessert = function() {
//        $scope.modifiedRecipes = globalData.recipes.slice(0);
//        var size = globalData.recipes.length;
//        for(var i=0; i < size; i++){
//            if($scope.modifiedRecipes[i].category != "Dessert") {
//                $scope.modifiedRecipes.splice(i,1);
//                i--;
//                size--;
//            }
//        }
//    }
//    $scope.showOnlyEasyQuicky = function() {
//        $scope.modifiedRecipes = globalData.recipes.slice(0);
//        var size = globalData.recipes.length;
//        for(var i=0; i < size; i++){
//            if($scope.modifiedRecipes[i].features != "Easy quicky") {
//                $scope.modifiedRecipes.splice(i,1);
//                i--;
//                size--;
//            }
//        }
//    }
//})
//
//quickyApp.controller('recipeIngredients', function($scope, $stateParams, $location) {
//    var recipes = globalData.recipes;
//	var size = globalData.recipes.length;
//	for (var i = 0; i < size; i++) {
//		if (recipes[i].name === $stateParams.recipeName) {
//            globalData.lastPickedRecipe = recipes[i];
//			$scope.correctRecipe = recipes[i];
//			break;
//		}
//	}
//
//    $scope.startCooking = function() {
//        $location.path('/displayByTime/specific/timeBar/' + $scope.correctRecipe.name)
//    }
//})
//
////this creates the last page where we can see the timeBars
//quickyApp.controller('timeBarControl', function($scope, $stateParams, $http) {
//    $scope.correctRecipe = globalData.lastPickedRecipe;
//    function createList(prep, cook) {
//        var array = [];
//        for (var i of prep) {
//            array.push({value: i.time, img: i.imageURL});
//        }
//        for (var i of cook) {
//            array.push({value: i.time, img: i.imageURL});
//        }
//        return array;
//    }
//    var ingredients = $scope.correctRecipe.ingredients;
//    var mainKind = ingredients.main.kind;
//    var sideKind = ingredients.side.kind;
//    var mainPreparation = [];
//    var sidePreparation = [];
//    var mainCooking = [];
//    var sideCooking = [];
//    $scope.kinds = {};
//
//    for (var prep of $scope.correctRecipe.steps.preparation) {
//        if (prep.kind == mainKind) mainPreparation.push(prep);
//        else sidePreparation.push(prep);
//    }
//    for (var cook of $scope.correctRecipe.steps.cooking) {
//        if (cook.kind == mainKind) mainCooking.push(cook);
//        else sideCooking.push(cook);
//    }
//    $scope.kinds.main = {preparation: mainPreparation, cooking: mainCooking};
//    $scope.kinds.side = {preparation: sidePreparation, cooking: sideCooking};
//    var mainList = createList($scope.kinds.main.preparation, $scope.kinds.main.cooking);
//    var sideList = createList($scope.kinds.side.preparation, $scope.kinds.side.cooking);
//
//    //setting the timeBars for progress display
//    timeKnots.draw("#timeline1", mainList, {horizontalLayout: false, color: "#FFFF00", color2: "#a0b91b", height: 400, width:50, class: "mainList",  background: "#a32323"});
//
//    timeKnots.draw("#timeline2", sideList, {horizontalLayout: false, color: "#FF0000", color2: "#a0b91b", height: 400, width:50, class: "sideList",  background: "#a32323"});
//
//    timeKnots.makeTimeController("#timeline3", [{}], {color: "#2f972f", height: 400, width: 50, id: "timer", radius: 10, value: $scope.correctRecipe.timers.total });
//
//    $scope.getRecipeIndex = function(recipeName) {
//        var size = globalData.recipes.length;
//        for (var i = 0; i < size; i++) {
//            if (globalData.recipes[i].name == recipeName) {
//                return i;
//            }
//        }
//    }
//    $scope.checkIfInFavorites = function(recipeName) {
//        var size = globalData.userData.favorite.length;
//        var answer = false;
//        for (var i = 0; i < size; i++) {
//            if (globalData.userData.favorite[i] == recipeName) {
//                answer = true;
//            }
//        }
//        return answer;
//    }
//
//    //here we check if we need to remove the recipe from user's favorites or to add it to favorites
//    $scope.addToFavorites = function() {
//
//        if ($scope.checkIfInFavorites($scope.correctRecipe.name)) {
//
//            $http.post('https://quickyfinal.herokuapp.com/admin/addToFavorites/' + $scope.correctRecipe.name, {email: globalData.userData.email})
//            .success(function(data) {
//                if (data.status == 301) {
//                    console.log('addFavorite service had failed');
//                }
//                globalData.recipes[$scope.getRecipeIndex($scope.correctRecipe.name)].favorite = 'notFavorite';
//                $scope.correctRecipe.favorite = 'notFavorite';
//                var indexOfRecipe = globalData.userData.favorite.indexOf($scope.correctRecipe.name);
//                if (indexOfRecipe > -1) {
//                    globalData.userData.favorite.splice(indexOfRecipe, 1);
//                }
//            });
//        }else {
//            $http.post('https://quickyfinal.herokuapp.com/admin/addToFavorites/' + $scope.correctRecipe.name, {email: globalData.userData.email})
//            .success(function(data) {
//            if (data.status == 301) {
//                console.log('addFavorite service had failed');
//            }
//            globalData.recipes[$scope.getRecipeIndex($scope.correctRecipe.name)].favorite = 'favorite';
//            $scope.correctRecipe.favorite = 'favorite';
//            globalData.userData.favorite.push($scope.correctRecipe.name);
//            });
//        }
//    }
//})
