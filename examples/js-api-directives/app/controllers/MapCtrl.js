define([
  'angular',
  'app',
  'esri/layers/FeatureLayer'
], function (angular, app) {

  app.controller("MapCtrl", function($scope){

    $scope.center = [-73.97163391113281, 40.70579060224226];

    $scope.basemap = "topo";

    $scope.zoom = 14;

    $scope.click = function(e){
      console.log("click handler", e);
      $scope.center = [e.mapPoint.x,e.mapPoint.y];
      console.log($scope.center);
    };

    $scope.$on("map.click", function(event, e){
      console.log("broadcast", event, e);
    });
  });

});