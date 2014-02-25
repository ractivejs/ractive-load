define([
	'utils/resolvePath',
	'utils/get',
	'helpers/makeComponent'
], function (
	resolvePath,
	get,
	makeComponent
) {

	'use strict';

	var promises = {};

	// Load a single component:
	//
	//     Ractive.load( 'path/to/foo' ).then( function ( Foo ) {
	//       var foo = new Foo(...);
	//     });
	return function loadSingle ( path, callback, onerror ) {
		var promise, url;

		url = resolvePath( path, Ractive.baseUrl, true );

		if ( !promises[ url ] ) {
			promise = get( url ).then( function ( template ) {
				return makeComponent( template, url );
			}, function ( err ) {
				throw err;
			});

			if ( callback ) {
				promise.then( callback, onerror );
			}

			promises[ url ] = promise;
		}

		return promises[ url ];
	};

});
