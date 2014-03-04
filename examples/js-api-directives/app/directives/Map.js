define([
  'angular',
  'app',
  'esri/map'
], function (angular, app, Map) {
  app.directive('map', function(){
    return {
      restrict: 'E',
      controller: function($scope){
      },
      compile: function(element, attrs){
      },
      link: function(scope, element, attrs, controller){
      }
    };
  });
});