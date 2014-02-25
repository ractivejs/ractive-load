/*global console */
define( function () {

	'use strict';

	if ( console && typeof console.warn === 'function' ) {
		return function () {
			console.warn.apply( console, arguments );
		};
	}

	return function () {};

});
