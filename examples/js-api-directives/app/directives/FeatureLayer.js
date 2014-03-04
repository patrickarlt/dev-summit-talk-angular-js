define([
  'angular',
  'app',
  'esri/layers/FeatureLayer'
], function (angular, app, FeatureLayer) {
  app.directive('featureLayer', function(){
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