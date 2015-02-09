var gobble = require( 'gobble' );
var lib = require( '../gobblefile' );

gobble.cwd( __dirname );

module.exports = gobble([
	'src',
	gobble( '../node_modules', { static: true }).grab( 'ractive' ).include( 'ractive.js' ),
	lib
]);