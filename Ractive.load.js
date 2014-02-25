/*

	Ractive.load - v0.1.1 - 2014-02-24
	===================================================================

	Next-generation DOM manipulation - http://ractivejs.org
	Follow @RactiveJS for updates

	-------------------------------------------------------------------

	Copyright 2014 Rich Harris

	Permission is hereby granted, free of charge, to any person
	obtaining a copy of this software and associated documentation
	files (the "Software"), to deal in the Software without
	restriction, including without limitation the rights to use,
	copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following
	conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.

*/

( function( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'Ractive' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define( [ 'Ractive' ], factory );
	}

	// browser global
	else if ( global.Ractive ) {
		factory( global.Ractive );
	} else {
		throw new Error( 'Could not find Ractive! It must be loaded before the Ractive.load plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function( Ractive ) {

	'use strict';

	var utils_toArray = function toArray( arrayLike ) {
		var arr = [],
			i = arrayLike.length;
		while ( i-- ) {
			arr[ i ] = arrayLike[ i ];
		}
		return arr;
	};

	var utils_getName = function getName( path ) {
		var pathParts, filename, lastIndex;
		pathParts = path.split( '/' );
		filename = pathParts.pop();
		lastIndex = filename.lastIndexOf( '.' );
		if ( lastIndex !== -1 ) {
			filename = filename.substr( 0, lastIndex );
		}
		return filename;
	};

	var utils_getNameFromLink = function( getName ) {

		return function getNameFromLink( link ) {
			return link.getAttribute( 'name' ) || getName( link.getAttribute( 'href' ) );
		};
	}( utils_getName );

	var utils_resolvePath = function resolvePath( relativePath, base, force ) {
		var pathParts, relativePathParts, part;
		if ( !force ) {
			if ( relativePath.charAt( 0 ) !== '.' ) {
				return relativePath;
			}
		} else {
			if ( base && base.charAt( base.length - 1 ) !== '/' ) {
				base += '/';
			}
		}
		pathParts = ( base || '' ).split( '/' );
		relativePathParts = relativePath.split( '/' );
		pathParts.pop();
		while ( part = relativePathParts.shift() ) {
			if ( part === '..' ) {
				pathParts.pop();
			} else if ( part !== '.' ) {
				pathParts.push( part );
			}
		}
		return pathParts.join( '/' );
	};

	var utils_get = function get( url ) {
		return new Ractive.Promise( function( resolve, reject ) {
			var xhr, onload, loaded;
			xhr = new XMLHttpRequest();
			xhr.open( 'GET', url );
			onload = function() {
				if ( xhr.readyState !== 4 || loaded ) {
					return;
				}
				resolve( xhr.responseText );
				loaded = true;
			};
			xhr.onload = xhr.onreadystatechange = onload;
			xhr.onerror = reject;
			xhr.send();
			if ( xhr.readyState === 4 ) {
				onload();
			}
		} );
	};

	/*global console */
	var utils_warn = function() {

		if ( console && typeof console.warn === 'function' ) {
			return function() {
				console.warn.apply( console, arguments );
			};
		}
		return function() {};
	}();

	var helpers_extractFragment = function extractFragment( item ) {
		return item.f;
	};

	var helpers_parseComponentDefinition = function( getName, extractFragment ) {

		var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
		return function parseComponentDefinition( source ) {
			var template, links, imports, scripts, script, styles, match, modules, i, item;
			template = Ractive.parse( source, {
				noStringify: true,
				interpolateScripts: false,
				interpolateStyles: false
			} );
			links = [];
			scripts = [];
			styles = [];
			modules = [];
			i = template.length;
			while ( i-- ) {
				item = template[ i ];
				if ( item && item.t === 7 ) {
					if ( item.e === 'link' && ( item.a && item.a.rel[ 0 ] === 'ractive' ) ) {
						links.push( template.splice( i, 1 )[ 0 ] );
					}
					if ( item.e === 'script' && ( !item.a || !item.a.type || item.a.type[ 0 ] === 'text/javascript' ) ) {
						scripts.push( template.splice( i, 1 )[ 0 ] );
					}
					if ( item.e === 'style' && ( !item.a || !item.a.type || item.a.type[ 0 ] === 'text/css' ) ) {
						styles.push( template.splice( i, 1 )[ 0 ] );
					}
				}
			}
			imports = links.map( function( link ) {
				var href, name;
				href = link.a.href && link.a.href[ 0 ];
				name = link.a.name && link.a.name[ 0 ] || getName( href );
				if ( typeof name !== 'string' ) {
					throw new Error( 'Error parsing link tag' );
				}
				return {
					name: name,
					href: href
				};
			} );
			script = scripts.map( extractFragment ).join( ';' );
			while ( match = requirePattern.exec( script ) ) {
				modules.push( match[ 1 ] || match[ 2 ] );
			}
			return {
				template: template,
				imports: imports,
				script: script,
				css: styles.map( extractFragment ).join( ' ' ),
				modules: modules
			};
		};
	}( utils_getName, helpers_extractFragment );

	var helpers_ractiveRequire = function ractiveRequire( name ) {
		var dependency, qualified;
		dependency = Ractive.lib[ name ] || window[ name ];
		if ( !dependency ) {
			qualified = !/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test( name ) ? '["' + name + '"]' : '.' + name;
			throw new Error( 'Ractive.load() error: Could not find dependency "' + name + '". It should be exposed as Ractive.lib' + qualified + ' or window' + qualified );
		}
		return dependency;
	};

	var helpers_loadSubComponents = function( get, resolvePath, makeComponent ) {

		return function loadSubComponents( imports, baseUrl ) {
			return new Ractive.Promise( function( resolve, reject ) {
				var remaining = imports.length,
					result = {};
				imports.forEach( function( toImport ) {
					var resolvedPath;
					resolvedPath = resolvePath( toImport.href, baseUrl );
					get( resolvedPath ).then( function( template ) {
						return makeComponent( template, resolvedPath );
					} ).then( function( Component ) {
						result[ toImport.name ] = Component;
						if ( !--remaining ) {
							resolve( result );
						}
					}, reject );
				} );
				if ( !remaining ) {
					resolve( result );
				}
			} );
		};
	}( utils_get, utils_resolvePath, helpers_makeComponent );

	var helpers_makeComponent = function( warn, parseComponentDefinition, ractiveRequire, loadSubComponents ) {

		var noConflict = {}, head = document.getElementsByTagName( 'head' )[ 0 ];
		return function makeComponent( source, baseUrl ) {
			var definition;
			definition = parseComponentDefinition( source );
			return loadSubComponents( definition.imports, baseUrl ).then( function( subComponents ) {
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
						Component = Ractive.extend( options );
					}
					head.removeChild( scriptElement );
					window.component = noConflict.component;
					window.Ractive = noConflict.Ractive;
					window.require = noConflict.require;
				} else {
					Component = Ractive.extend( {
						template: definition.template,
						css: definition.css,
						components: subComponents
					} );
				}
				return Component;
			} );
		};
	}( utils_warn, helpers_parseComponentDefinition, helpers_ractiveRequire, helpers_loadSubComponents );

	var load_single = function( resolvePath, get, makeComponent ) {

		var promises = {};
		return function loadSingle( path, callback, onerror ) {
			var promise, url;
			url = resolvePath( path, Ractive.baseUrl, true );
			if ( !promises[ url ] ) {
				promise = get( url ).then( function( template ) {
					return makeComponent( template, url );
				}, function( err ) {
					throw err;
				} );
				if ( callback ) {
					promise.then( callback, onerror );
				}
				promises[ url ] = promise;
			}
			return promises[ url ];
		};
	}( utils_resolvePath, utils_get, helpers_makeComponent );

	var load_fromLinks = function( toArray, getNameFromLink, loadSingle ) {

		return function loadFromLinks( callback, onerror ) {
			var promise = new Ractive.Promise( function( resolve, reject ) {
				var links, pending;
				links = toArray( document.querySelectorAll( 'link[rel="ractive"]' ) );
				pending = links.length;
				links.forEach( function( link ) {
					var name = getNameFromLink( link );
					loadSingle( link.getAttribute( 'href' ) ).then( function( Component ) {
						Ractive.components[ name ] = Component;
						if ( !--pending ) {
							resolve();
						}
					}, reject );
				} );
			} );
			if ( callback ) {
				promise.then( callback, onerror );
			}
			return promise;
		};
	}( utils_toArray, utils_getNameFromLink, load_single );

	var load_multiple = function( loadSingle ) {

		return function loadMultiple( map, callback, onerror ) {
			var promise = new Ractive.Promise( function( resolve, reject ) {
				var pending = 0,
					result = {}, name, load;
				load = function( name ) {
					var url = map[ name ];
					loadSingle( url ).then( function( Component ) {
						result[ name ] = Component;
						if ( !--pending ) {
							resolve( result );
						}
					}, reject );
				};
				for ( name in map ) {
					if ( map.hasOwnProperty( name ) ) {
						pending += 1;
						load( name );
					}
				}
			} );
			if ( callback ) {
				promise.then( callback, onerror );
			}
			return promise;
		};
	}( load_single );

	var load = function( loadFromLinks, loadSingle, loadMultiple ) {

		return function load( url, callback, onError ) {
			if ( !url || typeof url === 'function' ) {
				callback = url;
				return loadFromLinks( callback, onError );
			}
			if ( typeof url === 'object' ) {
				return loadMultiple( url, callback, onError );
			}
			return loadSingle( url, callback, onError );
		};
	}( load_fromLinks, load_single, load_multiple );


	Ractive.lib = Ractive.lib || {};
	Ractive.load = load;

	return load;

} ) );
