define([
	'rcu.amd',
	'load/fromLinks',
	'load/single',
	'load/multiple'
], function (
	rcu,
	loadFromLinks,
	loadSingle,
	loadMultiple
) {

	'use strict';

	rcu.init( Ractive );

	return function load ( url ) {
		if ( !url ) {
			return loadFromLinks();
		}

		if ( typeof url === 'object' ) {
			return loadMultiple( url );
		}

		return loadSingle( url );
	};

});
