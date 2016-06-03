/*global describe, before, it, chai, Ractive, __dirname */
(function () {

	'use strict';

	describe( 'ractive-load', function () {
		var assert, load;

		before( function () {
			if ( typeof require === 'function' ) {
				assert = require( 'assert' );
				load = require( '../dist/ractive-load.umd.js' );
				load.baseUrl = __dirname + '/';
			} else {
				assert = chai.assert;
				load = Ractive.load;
			}
		});

		it( 'should load a simple component', function () {
			return load( 'sample/1/simple.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<h1>Hello world!</h1>' );
			});
		});

		it( 'should load a nested component', function () {
			return load( 'sample/2/nested-outer.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<div><p>this is a nested component</p></div>' );
			});
		});

		it( 'should load a nested component with relative paths', function () {
			return load( 'sample/3/nested-outer.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<div><p>this is a nested component</p></div>' );
			});
		});

		it( 'should load multiple nested components with mix of relative-to-parent and relative-to-base paths', function () {
			return load( 'sample/4/nested-top.html' ).then( function ( Component ) {
				var ractive = new Component();
				assert.equal( ractive.toHTML(), '<div><div><p>this is a nested component</p></div></div>' );
			});
		});
	});

}());
