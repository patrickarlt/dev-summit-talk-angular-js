define([
  'angular',
  'app'
], function (angular, app) {

  // define our controller and register it with our app
  app.controller("MainCtrl", function($scope){
    $scope.title = "Hello World";
  });

});