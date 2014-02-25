define([
	'load/fromLinks',
	'load/single',
	'load/multiple'
], function (
	loadFromLinks,
	loadSingle,
	loadMultiple
) {

	'use strict';

	return function load ( url, callback, onError ) {
		if ( !url || typeof url === 'function' ) {
			callback = url;
			return loadFromLinks( callback, onError );
		}

		if ( typeof url === 'object' ) {
			return loadMultiple( url, callback, onError );
		}

		return loadSingle( url, callback, onError );
	};

});
