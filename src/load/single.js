define([
	'rcu',
	'utils/get'
], function (
	rcu,
	get
) {

	'use strict';

	var promises = {};

	return loadSingle;

	// Load a single component:
	//
	//     Ractive.load( 'path/to/foo' ).then( function ( Foo ) {
	//       var foo = new Foo(...);
	//     });
	function loadSingle ( path, baseUrl ) {
		var promise, url;

		url = rcu.resolve( path, baseUrl );

		// if this component has already been requested, don't
		// request it again
		if ( !promises[ url ] ) {
			promise = get( url ).then( function ( template ) {
				return new Ractive.Promise( function ( fulfil, reject ) {
					rcu.make( template, {
						url: url,
						loadImport: loadImport,
						require: ractiveRequire,
						onerror: reject
					}, fulfil );
				});
			});

			promises[ url ] = promise;
		}

		return promises[ url ];
	}

	function loadImport ( name, path, baseUrl, callback ) {
		loadSingle( path, baseUrl ).then( callback );
	}

	function ractiveRequire ( name ) {
		var dependency, qualified;

		dependency = Ractive.lib[ name ] || window[ name ];

		if(!dependency && typeof require === 'function'){
			dependency = require(name);
		}

		if ( !dependency ) {
			qualified = !/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test( name ) ? '["' + name + '"]' : '.' + name;
			throw new Error( 'Ractive.load() error: Could not find dependency "' + name + '". It should be exposed as Ractive.lib' + qualified + ' or window' + qualified );
		}

		return dependency;
	}

});
