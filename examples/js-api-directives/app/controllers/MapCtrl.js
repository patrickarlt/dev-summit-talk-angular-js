define([
  'app'
], function (app) {

  app.controller("MapCtrl", function($scope){
    $scope.click = function(e){
      console.log("click handler", e);
      $scope.center = [e.mapPoint.x,e.mapPoint.y];
    };

    $scope.$on("map.click", function(event, e){
      console.log("broadcast", event, e);
    });
  });

});