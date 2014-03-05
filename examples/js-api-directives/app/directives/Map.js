define([
  'angular',
  'app',
  'esri/map'
], function (angular, app, Map) {
  app.directive('esriMap', function(){
    return {
      restrict: 'A',
      scope: {},
      controller: function($scope, $element, $attrs){
        console.group("map controller");
        console.log("scope", $scope);
        console.log("element", $element);
        console.log("$attrs", $attrs);
        console.groupEnd("controller");

        var lat = $attrs.center.split(",")[0];
        var lng = $attrs.center.split(",")[1];
        var map = new Map($element[0], {
          center: [lng, lat],
          zoom: $attrs.zoom,
          basemap: $attrs.basemap
        });

        this.addLayer = function(layer){
          map.addLayer(layer);
        };
      },

      link: function(scope, element, attrs, controller){
        console.group("map link");
        console.log("scope", scope);
        console.log("element", element);
        console.log("attrs", attrs);
        console.log("controller", controller);
        console.groupEnd("link");
      }
    };
  });
});