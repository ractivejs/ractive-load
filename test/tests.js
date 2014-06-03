(function () {

	'use strict';

	var assert, load;

	if ( typeof require === 'function' ) {
		assert = require( 'assert' );
		load = require( '../ractive-load' );
		load.baseUrl = __dirname + '/';
	} else {
		assert = chai.assert;
		load = Ractive.load;
	}

	describe( 'ractive-load', function () {
		it( 'should load a simple component', function ( done ) {
			var promise = load( 'sample/1/simple.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<h1>Hello world!</h1>' );
				done();
			}).catch( done );
		});

		it( 'should load a nested component', function ( done ) {
			var promise = load( 'sample/2/nested-outer.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<div><p>this is a nested component</p></div>' );
				done();
			}).catch( done );
		});

		it( 'should load a nested component with relative paths', function ( done ) {
			var promise = load( 'sample/3/nested-outer.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<div><p>this is a nested component</p></div>' );
				done();
			}).catch( done );
		});

		it( 'should load multiple nested components with mix of relative-to-parent and relative-to-base paths', function ( done ) {
			var promise = load( 'sample/4/nested-top.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<div><div><p>this is a nested component</p></div></div>' );
				done();
			}).catch( done );
		});
	});

	function throwError( err ) {
		setTimeout( function () {
			throw err;
		});
	}

}());

