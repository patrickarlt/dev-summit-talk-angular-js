define([
  'angular',
  'app',
  'esri/layers/FeatureLayer'
], function (angular, app, FeatureLayer) {
  app.directive('esriFeatureLayer', function(){
    return {
      restrict: 'E',
      require: ["esriFeatureLayer", "^esriMap"],
      replace: true,
      transclude: true,
      controller: function($scope, $element, $attrs){
        var layer = new FeatureLayer($attrs.url);

        this.getLayer = function(){
          return layer;
        };
      },
      link: function(scope, element, attrs, controllers){
        console.group("fl link");
        console.log("scope", scope);
        console.log("element", element);
        console.log("attrs", attrs);
        console.log("controllers", controllers);
        console.groupEnd("link");

        var layerController = controllers[0];
        var mapController = controllers[1];

        mapController.addLayer(layerController.getLayer());
      }
    };
  });
});