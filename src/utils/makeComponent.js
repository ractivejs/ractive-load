define([
	'utils/get',
	'utils/resolvePath',
	'utils/warn',
	'utils/parseComponentDefinition',
	'utils/ractiveRequire'
], function (
	get,
	resolvePath,
	warn,
	parseComponentDefinition,
	ractiveRequire
) {

	'use strict';

	var noConflict = {},
		head = document.getElementsByTagName( 'head' )[0],
		makeComponent;

	makeComponent = function ( source, baseUrl ) {
		var definition;

		definition = parseComponentDefinition( source );

		// import any sub-components (if any), then...
		return loadSubComponents( definition.imports, baseUrl ).then( function ( subComponents ) {
			var options, scriptElement, exports, Component, prop;

			options = {
				template: definition.template,
				css: definition.css,
				components: subComponents
			};

			if ( definition.script ) {
				scriptElement = document.createElement( 'script' );
				scriptElement.innerHTML = '(function (component, Ractive, require) {' + definition.script + '}(component, Ractive, require));';

				noConflict.component = window.component;
				noConflict.Ractive = window.Ractive;
				noConflict.require = window.require;

				window.component = options;

				window.Ractive = Ractive;
				window.require = ractiveRequire;

				head.appendChild( scriptElement );

				exports = window.component.exports;

				if ( typeof exports === 'function' ) {
					warn( 'The function form has been deprecated. Use `component.exports = {...}` instead. You can access the `Ractive` variable if you need to.' );

					Component = exports( Ractive );
					Component.css = definition.css;
				} else if ( typeof exports === 'object' ) {
					for ( prop in exports ) {
						if ( exports.hasOwnProperty( prop ) ) {
							options[ prop ] = exports[ prop ];
						}
					}
				}

				// tidy up after ourselves
				head.removeChild( scriptElement );

				window.component = noConflict.component;
				window.Ractive = noConflict.Ractive;
				window.require = noConflict.require;
			}

			// no script tag, or component wasn't exported
			if ( !Component ) {
				Component = Ractive.extend( options );
			}

			return Component;
		});
	};

	return makeComponent;


	function loadSubComponents ( imports, baseUrl ) {
		return new Ractive.Promise( function ( resolve, reject ) {
			var remaining = imports.length, result = {};

			imports.forEach( function ( toImport ) {
				var resolvedPath;

				resolvedPath = resolvePath( toImport.href, baseUrl );

				get( resolvedPath ).then( function ( template ) {
					return makeComponent( template, resolvedPath );
				}).then( function ( Component ) {
					result[ toImport.name ] = Component;

					if ( !--remaining ) {
						resolve( result );
					}
				}, reject );
			});

			if ( !remaining ) {
				resolve( result );
			}
		});
	}


});
