/*global angular:true */

(function(angular){

  // get the root path from the URL
  var root = location.pathname.replace(new RegExp(/\/[^\/]+$/), '');

  // register a module called "angular" so we can use it with "require" later
  define('angular', function() {
    return angular;
  });

  // setup Dojo and register our application components
  require({
    async: true,
    packages: [{
      name: 'app',
      location: root + 'app'
    }]
  });

}(angular));