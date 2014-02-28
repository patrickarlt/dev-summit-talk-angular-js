/*! esri-leaflet-demographics - v0.0.1-beta.1 - 2014-02-27
*   Copyright (c) 2014 Environmental Systems Research Institute, Inc.
*   Apache License*/
(function (L) {

  // function to ensure namespaces exist
  function namespace(ns, root) {
    root = root || window;

    var parent = root,
        parts = ns.split('.'),
        part;

    while (part = parts.shift()) {
      if (!parent[part]) {
        parent[part] = {};
      }
      parent = parent[part];
    }

    return parent;
  }

  function debounce(fn, delay, context) {
    var timer = null;
    return function () {
      context = this || context;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  // serialize params to query string
  function serialize(params) {
    var qs = '';

    for (var param in params) {
      if (params.hasOwnProperty(param)) {
        var key = param;
        var value = params[param];
        qs += encodeURIComponent(key);
        qs += '=';
        qs += encodeURIComponent(value);
        qs += '&';
      }
    }

    return qs.substring(0, qs.length - 1);
  }

  function post(url, params, callback) {
    var httpRequest = new XMLHttpRequest();

    params.f = 'json';

    httpRequest.onreadystatechange = function () {
      var response;
      if (httpRequest.readyState === 4) {
        try {
          response = JSON.parse(httpRequest.responseText);
        } catch (e) {
          response = {
            error: 'Could not parse response as JSON.'
          };
        }
        callback(response);
      }
    };

    httpRequest.open('POST', url, true);
    httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    httpRequest.send(serialize(params));
  }

  function get(url, params, callback) {
    var callbackId = 'c' + (Math.random() * 1e9).toString(36).replace('.', '_');

    params.f = 'json';
    params.callback = 'L.esri.Demographics._callback.' + callbackId;

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url + '?' + serialize(params);
    script.id = callbackId;

    L.esri.Demographics._callback[callbackId] = L.Util.bind(function (response) {
      callback(response);
      document.body.removeChild(script);
      delete L.esri.Demographics._callback[callbackId];
    }, this);

    document.body.appendChild(script);
  }

  // ensure the namespaces exist
  namespace('L.esri.Demographics');

  var sharedMethods = {
    _setupMetadata: function () {
      get('http://arcgis.com/sharing/rest/content/items/' + this.itemId, {}, L.bind(function (metadata) {
        this._serviceUrl = metadata.url.split('?')[0] + '/';
        if (!this.options.title) {
          this.options.title = metadata.title;
        }
        this.fire('metadata', {
          metadata: metadata,
          bounds: L.latLngBounds([[metadata.extent[0][1], metadata.extent[0][0]], [metadata.extent[1][1], metadata.extent[1][0]]])
        });
        this._checkIfReady();
      }, this));
    },
    _setupItemData: function () {
      get('http://arcgis.com/sharing/rest/content/items/' + this.itemId + '/data/', {}, L.bind(function (itemData) {
        this._renderers = [];
        this._layers = {};
        this._queryFields = itemData.thematicGroup.fieldNames;
        for (var i = 0; i < itemData.layers.length; i++) {
          var layer = itemData.layers[i];
          var renderer = layer.layerDefinition;
          renderer.id = layer.id;
          this._renderers.push(renderer);
          this._layers[layer.id] = layer.name.replace(/[0-9]/g, '');
        }

        this._checkIfReady();

      }, this));
    },
    _checkIfReady: function () {
      if (this._map && this._serviceUrl && this._renderers) {
        this._update();
      }

      if (!this._ready && this._serviceUrl && this._renderers) {
        this.ready = true;
        this.fire('ready');
      }
    },
    _getScale: function () {
      var inchesPerMeter = 39.37;
      var screenDPI = 96.0;
      var bounds = this._map.getBounds();
      var size = this._map.getSize();
      var ne = this._map.options.crs.project(bounds._northEast);
      var sw = this._map.options.crs.project(bounds._southWest);
      return (Math.abs(ne.x - sw.x) / size.x) * inchesPerMeter * screenDPI;
    },
    _renderersForScale: function () {
      var renderers = [];
      var scale = this._getScale();
      for (var i = 0; i < this._renderers.length; i++) {
        var renderer = this._renderers[i];
        if (scale <= renderer.minScale && scale >= renderer.maxScale) {
          renderers.push(renderer);
        }
      }

      if (!renderers.length) {
        renderers.push(this._renderers[this._renderers.length - 1]);
      }

      return renderers;
    },
    _sourceLayerIdForScale: function () {
      var renderers = this._renderersForScale();
      for (var i = 0; i < renderers.length; i++) {
        if (renderers[i].drawingInfo) {
          return renderers[i].source.mapLayerId;
        }
      }
    },
    _getLayerNameByID: function (id) {
      if (this._layers[id]) {
        return this._layers[id];
      }
      for (var i = 0; i < this._renderers.length; i++) {
        if (this._renderers[i].source.mapLayerId === id) {
          return this._layers[this._renderers[i].id];
        }
      }
    }
  };

  L.esri.Demographics.DemographicLayer = L.Class.extend({
    includes: L.Mixin.Events,
    ready: false,
    _fieldCache: [],
    options: {
      token: false,
      detectRetina: false,
      opacity: 0.5,
      debounce: 150,
      position: 'front'
    },
    initialize: function (key, options) {
      L.Util.setOptions(this, options);

      if (L.esri.Demographics._keys[key]) {
        this.itemId = L.esri.Demographics._keys[key];
      } else {
        throw ('L.esri.Demographics.DemographicLayer: A key from a layer file is required');
      }

      this._setupItemData();
      this._setupMetadata();
    },
    onAdd: function (map) {
      this._map = map;

      this._moveHandler = debounce(this._update, this.options.debounce, this);

      map.on('moveend', this._moveHandler, this);

      this._update();
    },
    onRemove: function (map) {
      if (this._currentImage) {
        this._map.removeLayer(this._currentImage);
      }
      map.off('moveend', this._moveHandler, this);
    },
    addTo: function (map) {
      map.addLayer(this);
      return this;
    },
    _getImageUrl: function (callback) {
      var bounds = this._map.getBounds();
      var size = this._map.getSize();
      var ne = this._map.options.crs.project(bounds._northEast);
      var sw = this._map.options.crs.project(bounds._southWest);
      var multiplier = (this.options.detectRetina && L.Browser.retina) ? 2 : 1;

      post(this._serviceUrl + 'export', {
        bbox: [sw.x, sw.y, ne.x, ne.y].join(','),
        size: (size.x * multiplier) + ',' + (size.y * multiplier),
        format: 'png32',
        transparent: true,
        dpi: 96 * multiplier,
        opacity: 1,
        f: 'json',
        bboxSR: 3857,
        imageSR: 3857,
        dynamicLayers: JSON.stringify(this._renderersForScale()),
        token: this.options.token
      }, L.Util.bind(function (response) {

        // if there is a invalid token error...
        if (response.error && (response.error.code === 499 || response.error.code === 498))  {

          // if we have already asked for authentication
          if (!this._authenticating) {

            // ask for authentication
            this._authenticating = true;

            // ask for authentication. developer should fire the retry() method with the new token
            this.fire('authenticationrequired', {
              retry: L.Util.bind(function (token) {

                // we are no longer authenticating
                this._authenticating = false;

                // set the new token
                this.options.token = token;

                this._getImageUrl(callback);
              }, this)
            });
          }
        } else {
          callback(response);
        }
      }, this));
    },
    _update: function () {
      var zoom = this._map.getZoom();

      if (!this._serviceUrl || !this._renderers)  {
        return false;
      }

      if (this._animatingZoom) {
        return;
      }

      if (this._map._panTransition && this._map._panTransition._inProgress) {
        return;
      }

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }

      var bounds = this._map.getBounds();
      bounds._southWest.wrap();
      bounds._northEast.wrap();

      this._getImageUrl(L.Util.bind(function (response) {
        var image = new L.ImageOverlay(response.href + '?token=' + this.options.token, bounds, {
          opacity: 0
        }).addTo(this._map);

        image.once('load', function (e) {
          var newImage = e.target;
          var oldImage = this._currentImage;

          if (newImage._bounds.equals(this._map.getBounds())) {
            this.fire('newimage');
            this._currentImage = newImage;

            if (this.options.position === 'front') {
              this._currentImage.bringToFront();
            } else {
              this._currentImage.bringToBack();
            }

            this._currentImage.setOpacity(this.options.opacity);

            if (oldImage) {
              this._map.removeLayer(oldImage);
            }

          } else {
            this._map.removeLayer(newImage);
          }

          this.fire('load', {
            bounds: bounds
          });

        }, this);
      }, this));

      this.fire('loading', {
        bounds: bounds
      });
    },
    query: function (latlng, callback) {
      if (this.ready)  {
        this._runQuery(latlng, callback);
      } else {
        this.once('ready', L.Util.bind(function () {
          this._runQuery(latlng, callback);
        }, this));
      }
    },
    getAttribution: function () {
      return 'demographic data from <a href="http://www.arcgis.com/features/maps/index.html">Esri</a>';
    },
    _runQuery: function (latlng, callback) {
      //@ TODO refactor
      var url = this._serviceUrl + 'dynamicLayer/query';
      var layer = this._sourceLayerIdForScale();
      var params = {
        f: 'json',
        returnGeometry: true,
        spatialRel: 'esriSpatialRelWithin',
        geometry: latlng.lng + ',' + latlng.lat,
        geometryType: 'esriGeometryPoint',
        inSR: 4326,
        outSR: 4326,
        layer: JSON.stringify({
          source: {
            type: 'mapLayer',
            mapLayerId: layer
          }
        }),
        token: this.options.token
      };

      var featuresToGeoJSON = L.Util.bind(function (response) {
        var features = {
          type: 'FeatureCollection',
          features: []
        };
        for (var i = response.features.length - 1; i >= 0; i--) {
          var feature = response.features[i];
          var geojson = {
            type: 'Feature',
            id: feature.attributes.ID,
            geometry: {
              type: 'Polygon',
              coordinates: feature.geometry.rings
            },
            properties: {}
          };

          for (var key in feature.attributes) {
            if (feature.attributes.hasOwnProperty(key)) {
              geojson.properties[key] = {
                fieldName: key,
                value: feature.attributes[key],
                description: response.fieldAliases[key]
              };
            }
          }

          geojson.properties.LAYER_NAME = {
            fieldName: 'LAYER_NAME',
            value: this._getLayerNameByID(layer),
            description: 'Map layer'
          };

          features.features.push(geojson);
        }
        return features;
      }, this);

      var cb = L.Util.bind(function (response) {
        // if there is a invalid token error...
        if (response.error && (response.error.code === 499 || response.error.code === 498))  {

          // if we have already asked for authentication
          if (!this._authenticating) {

            // ask for authentication
            this._authenticating = true;

            // ask for authentication. developer should fire the retry() method with the new token
            this.fire('authenticationrequired', {
              retry: L.Util.bind(function (token) {
                // we are no longer authenticating
                this._authenticating = false;

                // set the new token
                this.options.token = token;

                this._runQuery(latlng, callback);
              }, this)
            });
          }
        } else if (response.error) {
          callback(response);
        } else {
          callback(featuresToGeoJSON(response));
        }

      }, this);

      if (this._fieldCache[layer]) {
        params.outFields = this._fieldCache[layer];
        post(url, params, cb);
      } else {
        get(this._serviceUrl + layer, {
          f: 'json',
          token: this.options.token
        }, L.Util.bind(function (response) {

          // if there is a invalid token error...
          if (response.error && (response.error.code === 499 || response.error.code === 498))  {

            // if we have already asked for authentication
            if (!this._authenticating) {

              // ask for authentication
              this._authenticating = true;

              // ask for authentication. developer should fire the retry() method with the new token
              this.fire('authenticationrequired', {
                retry: L.Util.bind(function (token) {
                  // we are no longer authenticating
                  this._authenticating = false;

                  // set the new token
                  this.options.token = token;

                  this.query(latlng, callback);
                }, this)
              });
            }
          } else {
            var validFields = [];
            for (var i = 0; i < response.fields.length; i++) {
              var field = response.fields[i];
              if (this._queryFields.indexOf(field.name) >= 0) {
                validFields.push(field.name);
              }
            }
            this._fieldCache[layer] = validFields;
            params.outFields = validFields;
            post(url, params, cb);
          }
        }, this));
      }
    }
  });

  L.esri.Demographics.DemographicLayer.include(sharedMethods);

  L.esri.Demographics.demographicLayer = function (key, options) {
    return new L.esri.Demographics.DemographicLayer(key, options);
  };

  L.esri.Demographics._callback = {};
  L.esri.Demographics._keys = {};
  L.esri.Demographics._addKeys = function (keys) {
    for (var i = keys.length - 1; i >= 0; i--) {
      L.esri.Demographics._keys[keys[i].key] = keys[i].id;
    }
  };

  L.esri.Demographics.Legend = L.Control.extend({
    includes: L.Mixin.Events,
    ready: false,
    options: {
      position: 'bottomleft'
    },

    initialize: function (key, options) {
      L.Util.setOptions(this, options);

      if (L.esri.Demographics._keys[key]) {
        this.itemId = L.esri.Demographics._keys[key];
      } else {
        throw ('L.esri.DemographicLayer: A key is required');
      }

      this._setupItemData();
      this._setupMetadata();
    },

    onAdd: function (map) {
      this._map = map;
      this._container = L.DomUtil.create('div', 'esri-legend-container leaflet-bar');

      this._update();

      return this._container;
    },

    onRemove: function (map) {
      if (this._currentImage) {
        this._map.removeLayer(this._currentImage);
      }
      map.off('moveend', this._moveHandler, this);
      return;
    },

    renderLegend: function (legendDefinition) {
      this.fire('load');
      this._container.innerHTML = '';
      for (var i = 0; i < legendDefinition.layers.length; i++) {
        var layer = legendDefinition.layers[i];
        if (layer.legend.length && layer.legend[0].label && layer.legend[0].label) {
          var layerContainer = L.DomUtil.create('div', 'esri-legend-layer', this._container);
          L.DomUtil.create('h4', 'esri-legend-header', layerContainer).textContent = this.options.title;
          var legendList = L.DomUtil.create('ul', 'esri-legend-list', layerContainer);
          for (var x = 0; x < layer.legend.length; x++) {
            var legend = layer.legend[x];
            if (legend.label && legend.imageData) {
              var itemContainer = L.DomUtil.create('li', 'esri-legend-list-item', legendList);
              L.DomUtil.create('img', 'esri-legend-image', itemContainer).src = 'data:' + legend.contentType + ';base64,' + legend.imageData;
              L.DomUtil.create('span', 'esri-legend-description', itemContainer).textContent = legend.label;
            }
          }
        }
      }
      this.fire('render');
    },

    _getLegend: function (callback) {
      post(this._serviceUrl + 'legend', {
        token: this.options.token,
        dynamicLayers: JSON.stringify(this._renderersForScale())
      }, callback);
    },

    _update: function () {
      if (!this._serviceUrl || !this._renderers)  {
        return;
      }

      this.fire('loading');

      this._getLegend(L.Util.bind(function (response) {
        // if there is a invalid token error...
        if (response.error && (response.error.code === 499 || response.error.code === 498))  {

          // if we have already asked for authentication
          if (!this._authenticating) {

            // ask for authentication
            this._authenticating = true;

            // ask for authentication. developer should fire the retry() method with the new token
            this.fire('authenticationrequired', {
              retry: L.Util.bind(function (token) {
                // we are no longer authenticating
                this._authenticating = false;

                // set the new token
                this.options.token = token;

                this._update();
              }, this)
            });
          }
        } else {
          this.renderLegend(response);
        }
      }, this));
    }
  });

  L.esri.Demographics.Legend.include(sharedMethods);

  L.esri.Demographics.legend = function (key, options) {
    return new L.esri.Demographics.Legend(key, options);
  };
})(L);