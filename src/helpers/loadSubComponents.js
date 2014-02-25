define([
	'utils/get',
	'utils/resolvePath',
	'helpers/makeComponent'
], function (
	get,
	resolvePath,
	makeComponent
) {

	'use strict';

	return function loadSubComponents ( imports, baseUrl ) {
		return new Ractive.Promise( function ( resolve, reject ) {
			var remaining = imports.length, result = {};

			imports.forEach( function ( toImport ) {
				var resolvedPath;

				resolvedPath = resolvePath( toImport.href, baseUrl );

				get( resolvedPath ).then( function ( template ) {
					return makeComponent( template, resolvedPath );
				}).then( function ( Component ) {
					result[ toImport.name ] = Component;

					if ( !--remaining ) {
						resolve( result );
					}
				}, reject );
			});

			if ( !remaining ) {
				resolve( result );
			}
		});
	};

});
