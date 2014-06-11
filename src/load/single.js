define([
	'rcu',
	'utils/get',
	'load/modules'
], function (
	rcu,
	get,
	modules
) {

	'use strict';

	var promises = {},
		global = ( typeof window !== 'undefined' ? window : {} );

	return loadSingle;

	// Load a single component:
	//
	//     Ractive.load( 'path/to/foo' ).then( function ( Foo ) {
	//       var foo = new Foo(...);
	//     });
	function loadSingle ( path, parentUrl, baseUrl, cache ) {
		var promise, url;

		url = rcu.resolve( path, path[0] === '.' ? parentUrl : baseUrl );

		// if this component has already been requested, don't
		// request it again
		if ( !cache || !promises[ url ] ) {
			promise = get( url ).then( function ( template ) {
				return new Ractive.Promise( function ( fulfil, reject ) {
					rcu.make( template, {
						url: url,
						loadImport: function ( name, path, parentUrl, callback ) {
							// if import has a relative URL, it should resolve
							// relative to this (parent). Otherwise, relative
							// to load.baseUrl
							loadSingle( path, parentUrl, baseUrl ).then( callback, reject );
						},
						require: ractiveRequire
					}, fulfil, reject );
				});
			});

			promises[ url ] = promise;
		}

		return promises[ url ];
	}

	function ractiveRequire ( name ) {
		var dependency, qualified;

		dependency = modules.hasOwnProperty( name ) ? modules[ name ] :
		             global.hasOwnProperty( name ) ? global[ name ] : null;

		if ( !dependency && typeof require === 'function' ) {
			try {
				dependency = require( name );
			} catch (e) {
				if (typeof process !== 'undefined') {
					dependency = require( process.cwd() + '/' + name );
				} else {
					throw e;
				}
			}
		}

		if ( !dependency ) {
			qualified = !/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test( name ) ? '["' + name + '"]' : '.' + name;
			throw new Error( 'Ractive.load() error: Could not find dependency "' + name + '". It should be exposed as Ractive.lib' + qualified + ' or window' + qualified );
		}

		return dependency;
	}

});
