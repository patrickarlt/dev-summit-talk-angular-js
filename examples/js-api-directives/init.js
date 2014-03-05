require([
  'angular',
  'app',
  'app/controllers/MapCtrl',
  'app/directives/Map',
  'app/directives/FeatureLayer'
], function(angular) {
  angular.bootstrap(document.body, ['app']);
});