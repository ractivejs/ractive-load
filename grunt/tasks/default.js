module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'default', [
		'jshint',
		'gobble',
		'copy'
	]);

};
