define([
	'rcu',
	'load/fromLinks',
	'load/single',
	'load/multiple',
	'load/modules'
], function (
	rcu,
	loadFromLinks,
	loadSingle,
	loadMultiple,
	modules
) {

	'use strict';

	rcu.init( Ractive );

	var load = function load ( url ) {
		var baseUrl = load.baseUrl;
		var cache = load.cache !== false;

		if ( !url ) {
			return loadFromLinks( baseUrl, cache );
		}

		if ( typeof url === 'object' ) {
			return loadMultiple( url, baseUrl, cache );
		}

		return loadSingle( url, baseUrl, baseUrl, cache );
	};

	load.baseUrl = '';
	load.modules = modules;

	return load;

});
