define([
  'app'
], function (app) {

  // define our map controller and register it with our app
  app.controller("MapCtrl", function($scope){

    // expose a method for handling clicks
    $scope.click = function(e){
      console.log("click handler", e);
      $scope.center = [e.mapPoint.x,e.mapPoint.y];
    };

    // listen for click broadcasts
    $scope.$on("map.click", function(event, e){
      console.log("broadcast", event, e);
    });
  });

});