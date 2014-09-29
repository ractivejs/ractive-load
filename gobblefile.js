var fs = require( 'fs' ),
	path = require( 'path' ),
	moment = require( 'moment' ),
	gobble = require( 'gobble' ),

	src,
	node_modules,
	compiled,
	beautified,
	uglified,
	today = moment(),

	demo;

src = gobble( 'src' );
node_modules = gobble( 'node_modules', { static: true });

compiled = gobble([ src, node_modules ])
	.transform( 'requirejs', {
		name: 'load',
		out: 'ractive-load.js',
		optimize: 'none',
		paths: {
			rcu: 'rcu/rcu.amd'
		}
	})
	.transform( 'amdclean', {
		wrap: {
			start: fs.readFileSync( path.join( __dirname, 'wrapper/intro.js' ) ).toString(),
			end: fs.readFileSync( path.join( __dirname, 'wrapper/outro.js' ) ).toString()
		}
	})
	.transform( 'replace', {
		version: require( './package.json' ).version,
		year: today.format( 'YYYY' ),
		date: today.format( 'YYYY-MM-DD' )
	});

beautified = compiled.transform( 'jsbeautify', {
	indentWithTabs: true,
	spaceBeforeConditional: true,
	spaceInParen: true
});

uglified = compiled.transform( 'uglifyjs', { ext: '.min.js' });

demo = gobble([
	'demo',
	node_modules.grab( 'ractive' ).include( 'ractive.js' ),
	beautified
]).moveTo( 'demo' );

module.exports = gobble([ demo, beautified, uglified ]);