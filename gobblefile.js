var gobble = require( 'gobble' );
var path = require( 'path' );
var resolve = require( 'resolve' );
var Promise = require( 'es6-promise' ).Promise;

var babel = require( 'babel-core' );

gobble.cwd( __dirname );

var lib = gobble( 'src' )
	.transform( 'babel', {
		blacklist: [ 'es6.modules', 'useStrict' ],
		sourceMap: false
	})
	.transform( 'esperanto-bundle', {
		entry: 'load',
		dest: 'ractive-load',
		type: 'umd',
		name: 'Ractive.load',
		sourceMap: false,

		resolvePath: function ( importee, importer ) {
			return new Promise( function ( fulfil, reject ) {
				var callback = function ( err, result ) {
					if ( err ) {
						reject( err );
					} else {
						fulfil( result );
					}
				};

				resolve( importee, {
					basedir: path.dirname( importer ),
					packageFilter: function ( pkg ) {
						if ( pkg[ 'jsnext:main' ] ) {
							pkg.main = pkg[ 'jsnext:main' ];
							return pkg;
						}

						var err = new Error( 'package ' + pkg.name + ' does not supply a jsnext:main field' );
						err.code = 'ENOENT'; // hack
						reject( err );
						return {};
					}
				}, callback );
			});
		},

		transform: function ( code, path ) {
			// this is awkward - dependencies written in ES6 don't
			// get transpiled by the previous step. So we have to
			// hack around it. not ideal...
			if ( /node_modules/.test( path ) ) {
				return babel.transform( code, {
					blacklist: [ 'es6.modules', 'useStrict' ]
				}).code;
			}

			return code;
		}
	});

module.exports = gobble([
	lib,
	lib.transform( 'uglifyjs', { ext: '.min.js' })
]);