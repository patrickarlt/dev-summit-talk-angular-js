/*global angular:true */

(function(angular){

  var root = location.pathname.replace(new RegExp(/\/[^\/]+$/), '');

  define('angular', function() {
    return angular;
  });

  require({
    async: true,
    packages: [{
      name: 'app',
      location: root + 'app'
    }]
  });

}(angular));