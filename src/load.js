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

		if ( !url ) {
			return loadFromLinks( baseUrl );
		}

		if ( typeof url === 'object' ) {
			return loadMultiple( url, baseUrl );
		}

		return loadSingle( url, baseUrl, baseUrl );
	};

	load.baseUrl = '';
	load.modules = modules;

	return load;

});
