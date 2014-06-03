define( function () {

	'use strict';

	var get;

	// Test for XHR to see if we're in a browser...
	if ( typeof XMLHttpRequest === 'function' ) {
		get = function ( url ) {
			return new Ractive.Promise( function ( fulfil, reject ) {
				var xhr, onload, loaded;

				xhr = new XMLHttpRequest();
				xhr.open( 'GET', url );

				onload = function () {
					if ( ( xhr.readyState !== 4 ) || loaded ) {
						return;
					}

					fulfil( xhr.responseText );
					loaded = true;
				};

				xhr.onload = xhr.onreadystatechange = onload;
				xhr.onerror = reject;
				xhr.send();

				if ( xhr.readyState === 4 ) {
					onload();
				}
			});
		};
	}

	// ...or in node.js
	else {
		get = function ( url ) {
			return new Ractive.Promise( function ( fulfil, reject ) {
				fs.readFile( url, function ( err, result ) {
					if ( err ) {
						return reject( err );
					}

					fulfil( result.toString() );
				});
			});
		};
	}

	return get;

});
