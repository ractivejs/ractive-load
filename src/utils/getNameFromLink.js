define([
	'utils/getName'
], function (
	getName
) {

	'use strict';

	return function getNameFromLink ( link ) {
		return link.getAttribute( 'name' ) || getName( link.getAttribute( 'href' ) );
	};

});
