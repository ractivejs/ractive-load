define( function () {

	'use strict';

	return function ractiveRequire ( name ) {
		var dependency, qualified;

		dependency = Ractive.lib[ name ] || window[ name ];

		if ( !dependency ) {
			qualified = !/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test( name ) ? '["' + name + '"]' : '.' + name;
			throw new Error( 'Ractive.load() error: Could not find dependency "' + name + '". It should be exposed as Ractive.lib' + qualified + ' or window' + qualified );
		}

		return dependency;
	};

});


