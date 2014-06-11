define([
	'load/single'
], function (
	loadSingle
) {

	'use strict';

	// Load multiple components:
	//
	//     Ractive.load({
	//       foo: 'path/to/foo.html',
	//       bar: 'path/to/bar.html'
	//     }).then( function ( components ) {
	//       var foo = new components.foo(...);
	//       var bar = new components.bar(...);
	//     });
	return function loadMultiple ( map, baseUrl, cache ) {
		var promise = new Ractive.Promise( function ( resolve, reject ) {
			var pending = 0, result = {}, name, load;

			load = function ( name ) {
				var path = map[ name ];

				loadSingle( path, baseUrl, baseUrl, cache ).then( function ( Component ) {
					result[ name ] = Component;

					if ( !--pending ) {
						resolve( result );
					}
				}, reject );
			};

			for ( name in map ) {
				if ( map.hasOwnProperty( name ) ) {
					pending += 1;
					load( name );
				}
			}
		});

		return promise;
	};

});
