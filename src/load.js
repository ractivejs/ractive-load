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

	rcu.init( window.Ractive );

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
