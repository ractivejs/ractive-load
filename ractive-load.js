/*

	ractive-load - v0.1.3 - 2014-04-17
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

	/*

	rcu (Ractive component utils) - 0.1.0 - 2014-04-14
	==============================================================

	Copyright 2014 Rich Harris and contributors

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
	var rcuamd = function() {

		var Ractive;
		var getName = function getName( path ) {
			var pathParts, filename, lastIndex;
			pathParts = path.split( '/' );
			filename = pathParts.pop();
			lastIndex = filename.lastIndexOf( '.' );
			if ( lastIndex !== -1 ) {
				filename = filename.substr( 0, lastIndex );
			}
			return filename;
		};
		var parse = function( getName ) {
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

			function extractFragment( item ) {
				return item.f;
			}
		}( getName );
		var make = function( parse ) {
			return function makeComponent( source, config, callback ) {
				var definition, url, make, loadImport, imports, loadModule, modules, remainingDependencies, onloaded, onerror, errorMessage, ready;
				config = config || {};
				url = config.url || '';
				loadImport = config.loadImport;
				loadModule = config.loadModule;
				onerror = config.onerror;
				definition = parse( source );
				make = function() {
					var options, fn, component, exports, Component, prop;
					options = {
						template: definition.template,
						css: definition.css,
						components: imports
					};
					if ( definition.script ) {
						if ( Ractive.defaults.debug ) {
							definition.script += '\n//# sourceURL=' + url.replace( '.html', '.js' );
						}
						try {
							fn = new Function( 'component', 'require', 'Ractive', definition.script );
						} catch ( err ) {
							errorMessage = 'Error creating function from component script: ' + err.message || err;
							if ( onerror ) {
								onerror( errorMessage );
							} else {
								throw new Error( errorMessage );
							}
						}
						try {
							fn( component = {}, config.require, Ractive );
						} catch ( err ) {
							errorMessage = 'Error executing component script: ' + err.message || err;
							if ( onerror ) {
								onerror( errorMessage );
							} else {
								throw new Error( errorMessage );
							}
						}
						exports = component.exports;
						if ( typeof exports === 'object' ) {
							for ( prop in exports ) {
								if ( exports.hasOwnProperty( prop ) ) {
									options[ prop ] = exports[ prop ];
								}
							}
						}
					}
					Component = Ractive.extend( options );
					callback( Component );
				};
				remainingDependencies = definition.imports.length + ( loadModule ? definition.modules.length : 0 );
				if ( remainingDependencies ) {
					onloaded = function() {
						if ( !--remainingDependencies ) {
							if ( ready ) {
								make();
							} else {
								setTimeout( make, 0 );
							}
						}
					};
					if ( definition.imports.length ) {
						if ( !loadImport ) {
							throw new Error( 'Component definition includes imports (e.g. `<link rel="ractive" href="' + definition.imports[ 0 ].href + '">`) but no loadImport method was passed to rcu.make()' );
						}
						imports = {};
						definition.imports.forEach( function( toImport ) {
							loadImport( toImport.name, toImport.href, url, function( Component ) {
								imports[ toImport.name ] = Component;
								onloaded();
							} );
						} );
					}
					if ( loadModule && definition.modules.length ) {
						modules = {};
						definition.modules.forEach( function( name ) {
							loadModule( name, name, url, function( Component ) {
								modules[ name ] = Component;
								onloaded();
							} );
						} );
					}
				} else {
					setTimeout( make, 0 );
				}
				ready = true;
			};
		}( parse );
		var resolve = function resolvePath( relativePath, base ) {
			var pathParts, relativePathParts, part;
			if ( relativePath.charAt( 0 ) !== '.' ) {
				return relativePath;
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
		var rcu = function( parse, make, resolve, getName ) {
			return {
				init: function( copy ) {
					Ractive = copy;
				},
				parse: parse,
				make: make,
				resolve: resolve,
				getName: getName
			};
		}( parse, make, resolve, getName );
		return rcu;
	}();

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

	var load_single = function( rcu, get ) {

		var promises = {};
		return loadSingle;

		function loadSingle( path, baseUrl ) {
			var promise, url;
			url = rcu.resolve( path, baseUrl );
			if ( !promises[ url ] ) {
				promise = get( url ).then( function( template ) {
					return new Ractive.Promise( function( fulfil, reject ) {
						rcu.make( template, {
							url: url,
							loadImport: loadImport,
							require: ractiveRequire,
							onerror: reject
						}, fulfil );
					} );
				} );
				promises[ url ] = promise;
			}
			return promises[ url ];
		}

		function loadImport( name, path, baseUrl, callback ) {
			loadSingle( path, baseUrl ).then( callback );
		}

		function ractiveRequire( name ) {
			var dependency, qualified;
			dependency = Ractive.lib[ name ] || window[ name ];
			if ( !dependency ) {
				qualified = !/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test( name ) ? '["' + name + '"]' : '.' + name;
				throw new Error( 'Ractive.load() error: Could not find dependency "' + name + '". It should be exposed as Ractive.lib' + qualified + ' or window' + qualified );
			}
			return dependency;
		}
	}( rcuamd, utils_get );

	var load_fromLinks = function( rcu, loadSingle ) {

		return function loadFromLinks( baseUrl ) {
			var promise = new Ractive.Promise( function( resolve, reject ) {
				var links, pending;
				links = toArray( document.querySelectorAll( 'link[rel="ractive"]' ) );
				pending = links.length;
				links.forEach( function( link ) {
					var name = getNameFromLink( link );
					loadSingle( link.getAttribute( 'href' ), baseUrl ).then( function( Component ) {
						Ractive.components[ name ] = Component;
						if ( !--pending ) {
							resolve();
						}
					}, reject );
				} );
			} );
			return promise;
		};

		function getNameFromLink( link ) {
			return link.getAttribute( 'name' ) || rcu.getName( link.getAttribute( 'href' ) );
		}

		function toArray( arrayLike ) {
			var arr = [],
				i = arrayLike.length;
			while ( i-- ) {
				arr[ i ] = arrayLike[ i ];
			}
			return arr;
		}
	}( rcuamd, load_single );

	var load_multiple = function( loadSingle ) {

		return function loadMultiple( map, baseUrl ) {
			var promise = new Ractive.Promise( function( resolve, reject ) {
				var pending = 0,
					result = {}, name, load;
				load = function( name ) {
					var url = map[ name ];
					loadSingle( url, baseUrl ).then( function( Component ) {
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
			return promise;
		};
	}( load_single );

	var load = function( rcu, loadFromLinks, loadSingle, loadMultiple ) {

		rcu.init( Ractive );
		var load = function load( url ) {
			var baseUrl = load.baseUrl;
			if ( !url ) {
				return loadFromLinks( baseUrl );
			}
			if ( typeof url === 'object' ) {
				return loadMultiple( url, baseUrl );
			}
			return loadSingle( url, baseUrl );
		};
		load.baseUrl = '';
		return load;
	}( rcuamd, load_fromLinks, load_single, load_multiple );


	Ractive.lib = Ractive.lib || {};
	Ractive.load = load;

	return load;

} ) );
