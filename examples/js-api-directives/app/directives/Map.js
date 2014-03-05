define([
  'angular',
  'app',
  'esri/map',
  'esri/geometry/Point'
], function (angular, app, Map, Point) {
  app.directive('esriMap', function(){

    function linker(scope, element, attrs, controller){

      scope.$watch("center", function (newCenter, oldCenter) {
        if(newCenter !== oldCenter){
          controller.centerAt(newCenter);
        }
      });

    }

    return {
      restrict: 'E',
      compile: function($element, $attrs){

        $element.removeAttr("id");
        $element.append("<div id=" + $attrs.id + "></div>");

        return linker;
      },
      controller: function($scope, $element, $attrs){

        var map = new Map($attrs.id, {
          center: $scope.center,
          zoom: $scope.zoom,
          basemap: $scope.basemap
        });

        map.on("click", function(e){
          // emit a message that bubbles up scopes, listen for it on your scope
          $scope.$emit("map.click", e);

          // use the scopes click fuction to handle the event
          $scope.$apply(function() {
            $scope.click.call($scope, e);
          });
        });

        this.addLayer = function(layer){
          return map.addLayer(layer);
        };

        this.centerAt = function(center){
          var point = new Point({
            x: center[0],
            y: center[1],
            spatialReference: {
              wkid:102100
            }
          });

          map.centerAt(point);
        };
      }
    };
  });
});