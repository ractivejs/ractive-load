
	// Ractive.lib is deprecated. Remove this in a few versions' time
	try {
		Object.defineProperty( Ractive, 'lib', {
			get: function () {
				console && console.warn && console.warn( '`Ractive.lib` has been deprecated. Use `Ractive.load.modules` as a module registry instead' );
				return _load_.modules;
			}
		});
	} catch ( err ) {}

	Ractive.load = _load_;
	return _load_;

}));
