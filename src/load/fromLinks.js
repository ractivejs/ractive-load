define([
	'utils/toArray',
	'utils/getNameFromLink',
	'load/single'
], function (
	toArray,
	getNameFromLink,
	loadSingle
) {

	'use strict';

	// Create globally-available components from links found on the page:
	//
	//     <link rel='ractive' href='path/to/foo.html'>
	//
	// You can optionally add a name attribute, otherwise the file name (in
	// the example above, 'foo') will be used instead. The component will
	// be available as `Ractive.components.foo`:
	//
	//     Ractive.load().then( function () {
	//       var foo = new Ractive.components.foo(...);
	//     });
	return function loadFromLinks ( callback, onerror ) {
		var promise = new Ractive.Promise( function ( resolve, reject ) {
			var links, pending;

			links = toArray( document.querySelectorAll( 'link[rel="ractive"]' ) );
			pending = links.length;

			links.forEach( function ( link ) {
				var name = getNameFromLink( link );

				loadSingle( link.getAttribute( 'href' ) ).then( function ( Component ) {
					Ractive.components[ name ] = Component;

					if ( !--pending ) {
						resolve();
					}
				}, reject );
			});
		});

		if ( callback ) {
			promise.then( callback, onerror );
		}

		return promise;
	};

});
