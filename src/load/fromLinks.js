define([
	'rcu',
	'load/single'
], function (
	rcu,
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
	return function loadFromLinks ( baseUrl, cache ) {
		var promise = new Ractive.Promise( function ( resolve, reject ) {
			var links, pending;

			links = toArray( document.querySelectorAll( 'link[rel="ractive"]' ) );
			pending = links.length;

			links.forEach( function ( link ) {
				var name = getNameFromLink( link );

				loadSingle( link.getAttribute( 'href' ), baseUrl, cache ).then( function ( Component ) {
					Ractive.components[ name ] = Component;

					if ( !--pending ) {
						resolve();
					}
				}, reject );
			});
		});

		return promise;
	};

	function getNameFromLink ( link ) {
		return link.getAttribute( 'name' ) || rcu.getName( link.getAttribute( 'href' ) );
	}

	function toArray ( arrayLike ) {
		var arr = [], i = arrayLike.length;

		while ( i-- ) {
			arr[i] = arrayLike[i];
		}

		return arr;
	}

});
