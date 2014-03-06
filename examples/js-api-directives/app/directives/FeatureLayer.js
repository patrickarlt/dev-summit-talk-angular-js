define([
  'app',
  'esri/layers/FeatureLayer'
], function (app, FeatureLayer) {
  app.directive('esriFeatureLayer', function(){
    return {
      restrict: 'E',
      require: ["esriFeatureLayer", "^esriMap"],
      replace: true,
      controller: function($scope, $element, $attrs){
        var layer = new FeatureLayer($attrs.url);

        this.getLayer = function(){
          return layer;
        };
      },
      link: function(scope, element, attrs, controllers){
        var layerController = controllers[0];
        var mapController = controllers[1];

        mapController.addLayer(layerController.getLayer());
      }
    };
  });
});