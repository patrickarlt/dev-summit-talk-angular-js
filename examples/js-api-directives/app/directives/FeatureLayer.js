define([
  'angular',
  'app',
  'esri/layers/FeatureLayer'
], function (angular, app, FeatureLayer) {
  app.directive('esriFeatureLayer', function(){
    return {
      restrict: 'EA',
      require: '^esriMap',
      replace: true,
      transclude: true,
      scope: {},
      link: function(scope, element, attrs, mapController){
        console.group("fl link");
        console.log("scope", scope);
        console.log("element", element);
        console.log("attrs", attrs);
        console.log("controller", mapController);
        console.groupEnd("link");

        var layer = new FeatureLayer(attrs.url);

        mapController.addLayer(layer);
      }
    };
  });
});