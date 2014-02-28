  L.Map.addInitHook(function() {
    Reveal.addEventListener( 'slidechanged', L.bind(function() {
      this.invalidateSize();
    }, this), false);
  });