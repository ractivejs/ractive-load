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

	var load = function load ( url ) {
		var baseUrl = load.baseUrl;

		if ( !url ) {
			return loadFromLinks( baseUrl );
		}

		if ( typeof url === 'object' ) {
			return loadMultiple( url, baseUrl );
		}

		return loadSingle( url, baseUrl );
	};

	load.baseUrl = '';

	return load;

});
