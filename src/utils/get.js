define( function () {

	'use strict';

	return function get ( url ) {
		return new Ractive.Promise( function ( resolve, reject ) {
			var xhr, onload, loaded;

			xhr = new XMLHttpRequest();
			xhr.open( 'GET', url );

			onload = function () {
				if ( ( xhr.readyState !== 4 ) || loaded ) {
					return;
				}

				resolve( xhr.responseText );
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

});
