// lets require all our apps components before initalizing our app
require([
  'angular',
  'app',
  'app/controllers/MainCtrl'
], function(angular) {
  // since we didn't include ng-app anywhere in our HTML angular hasn't started yet
  // angular.bootstrap is the same as putting ng-app="app" on the body, but we control when it is called
  angular.bootstrap(document.body, ['app']);
});