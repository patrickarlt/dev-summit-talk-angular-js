require([
  'angular',
  'app',
  'app/controllers/MainCtrl',
  'app/directives/Map',
  'app/directives/FeatureLayer'
], function(angular) {
  angular.bootstrap(document.body, ['app']);
});