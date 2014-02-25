define( function () {

	'use strict';

	return function toArray ( arrayLike ) {
		var arr = [], i = arrayLike.length;

		while ( i-- ) {
			arr[i] = arrayLike[i];
		}

		return arr;
	};

});
