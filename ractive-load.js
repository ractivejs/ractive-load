/*

	ractive-load - v0.3.0 - 2014-07-05
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

	// AMD environment
	if ( typeof define === 'function' && define.amd ) {
		define( [ 'ractive' ], factory );
	}

	// Common JS (i.e. node/browserify)
	else if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		module.exports = factory( require( 'ractive' ), require( 'fs' ), require( 'path' ) );
	}

	// browser global
	else if ( global.Ractive ) {
		factory( global.Ractive );
	} else {
		throw new Error( 'Could not find Ractive! It must be loaded before the Ractive.load plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function( Ractive, fs, path ) {

	'use strict';

	/*

	rcu (Ractive component utils) - 0.2.0 - 2014-07-05
	==============================================================

	Copyright 2014 Rich Harris and contributors
	Released under the MIT license.

*/
	var rcu = function() {

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
			return function parse( source ) {
				var parsed, template, links, imports, scripts, script, styles, match, modules, i, item;
				parsed = Ractive.parse( source, {
					noStringify: true,
					interpolateScripts: false,
					interpolateStyles: false
				} );
				if ( parsed.v !== 1 ) {
					throw new Error( 'Mismatched template version! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app' );
				}
				links = [];
				scripts = [];
				styles = [];
				modules = [];
				template = parsed.t;
				i = template.length;
				while ( i-- ) {
					item = template[ i ];
					if ( item && item.t === 7 ) {
						if ( item.e === 'link' && ( item.a && item.a.rel === 'ractive' ) ) {
							links.push( template.splice( i, 1 )[ 0 ] );
						}
						if ( item.e === 'script' && ( !item.a || !item.a.type || item.a.type === 'text/javascript' ) ) {
							scripts.push( template.splice( i, 1 )[ 0 ] );
						}
						if ( item.e === 'style' && ( !item.a || !item.a.type || item.a.type === 'text/css' ) ) {
							styles.push( template.splice( i, 1 )[ 0 ] );
						}
					}
				}
				while ( /^\s*$/.test( template[ 0 ] ) ) {
					template.shift();
				}
				while ( /^\s*$/.test( template[ template.length - 1 ] ) ) {
					template.pop();
				}
				imports = links.map( function( link ) {
					var href, name;
					href = link.a.href;
					name = link.a.name || getName( href );
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
					template: parsed,
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
		var eval2 = function() {
			var _eval, isBrowser, isNode, head, Module;
			_eval = eval;
			if ( typeof document !== 'undefined' ) {
				isBrowser = true;
				head = document.getElementsByTagName( 'head' )[ 0 ];
			} else if ( typeof process !== 'undefined' ) {
				isNode = true;
				Module = ( require.nodeRequire || require )( 'module' );
			}

			function eval2( script, options ) {
				options = typeof options === 'function' ? {
					callback: options
				} : options || {};
				if ( options.sourceURL ) {
					script += '\n//# sourceURL=' + options.sourceURL;
				}
				try {
					return _eval( script );
				} catch ( err ) {
					if ( isNode ) {
						locateErrorUsingModule( script, options.sourceURL || '' );
						return;
					} else if ( isBrowser && err.name === 'SyntaxError' ) {
						locateErrorUsingDataUri( script );
					}
					throw err;
				}
			}
			eval2.Function = function() {
				var i, args = [],
					body, wrapped;
				i = arguments.length;
				while ( i-- ) {
					args[ i ] = arguments[ i ];
				}
				body = args.pop();
				wrapped = '(function (' + args.join( ', ' ) + ') {\n' + body + '\n})';
				return eval2( wrapped );
			};

			function locateErrorUsingDataUri( code ) {
				var dataURI, scriptElement;
				dataURI = 'data:text/javascript;charset=utf-8,' + encodeURIComponent( code );
				scriptElement = document.createElement( 'script' );
				scriptElement.src = dataURI;
				scriptElement.onload = function() {
					head.removeChild( scriptElement );
				};
				head.appendChild( scriptElement );
			}

			function locateErrorUsingModule( code, url ) {
				var m = new Module();
				try {
					m._compile( 'module.exports = function () {\n' + code + '\n};', url );
				} catch ( err ) {
					console.error( err );
					return;
				}
				m.exports();
			}
			return eval2;
		}();
		var make = function( parse, eval2 ) {
			return function make( source, config, callback, errback ) {
				var definition, url, createComponent, loadImport, imports, loadModule, modules, remainingDependencies, onloaded, ready;
				config = config || {};
				url = config.url || '';
				loadImport = config.loadImport;
				loadModule = config.loadModule;
				definition = parse( source );
				createComponent = function() {
					var options, Component, script, factory, component, exports, prop;
					options = {
						template: definition.template,
						partials: definition.partials,
						css: definition.css,
						components: imports
					};
					if ( definition.script ) {
						try {
							script = definition.script + '\n//# sourceURL=' + url.substr( url.lastIndexOf( '/' ) + 1 ) + '.js';
							factory = new eval2.Function( 'component', 'require', 'Ractive', definition.script );
							component = {};
							factory( component, config.require, Ractive );
							exports = component.exports;
							if ( typeof exports === 'object' ) {
								for ( prop in exports ) {
									if ( exports.hasOwnProperty( prop ) ) {
										options[ prop ] = exports[ prop ];
									}
								}
							}
							Component = Ractive.extend( options );
						} catch ( err ) {
							errback( err );
							return;
						}
						callback( Component );
					} else {
						Component = Ractive.extend( options );
						callback( Component );
					}
				};
				remainingDependencies = definition.imports.length + ( loadModule ? definition.modules.length : 0 );
				if ( remainingDependencies ) {
					onloaded = function() {
						if ( !--remainingDependencies ) {
							if ( ready ) {
								createComponent();
							} else {
								setTimeout( createComponent, 0 );
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
					setTimeout( createComponent, 0 );
				}
				ready = true;
			};
		}( parse, eval2 );
		var resolve = function resolvePath( relativePath, base ) {
			var pathParts, relativePathParts, part;
			if ( !base || relativePath.charAt( 0 ) === '/' ) {
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

	var utils_get = function() {

		var get;
		if ( typeof XMLHttpRequest === 'function' ) {
			get = function( url ) {
				return new Ractive.Promise( function( fulfil, reject ) {
					var xhr, onload, loaded;
					xhr = new XMLHttpRequest();
					xhr.open( 'GET', url );
					onload = function() {
						if ( xhr.readyState !== 4 || loaded ) {
							return;
						}
						fulfil( xhr.responseText );
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
		} else {
			get = function( url ) {
				return new Ractive.Promise( function( fulfil, reject ) {
					fs.readFile( url, function( err, result ) {
						if ( err ) {
							return reject( err );
						}
						fulfil( result.toString() );
					} );
				} );
			};
		}
		return get;
	}();

	var load_modules = {};

	var load_single = function( rcu, get, modules ) {

		var promises = {}, global = typeof window !== 'undefined' ? window : {};
		return loadSingle;

		function loadSingle( path, parentUrl, baseUrl, cache ) {
			var promise, url;
			url = rcu.resolve( path, path[ 0 ] === '.' ? parentUrl : baseUrl );
			if ( !cache || !promises[ url ] ) {
				promise = get( url ).then( function( template ) {
					return new Ractive.Promise( function( fulfil, reject ) {
						rcu.make( template, {
							url: url,
							loadImport: function( name, path, parentUrl, callback ) {
								loadSingle( path, parentUrl, baseUrl ).then( callback, reject );
							},
							require: ractiveRequire
						}, fulfil, reject );
					} );
				} );
				promises[ url ] = promise;
			}
			return promises[ url ];
		}

		function ractiveRequire( name ) {
			var dependency, qualified;
			dependency = modules.hasOwnProperty( name ) ? modules[ name ] : global.hasOwnProperty( name ) ? global[ name ] : null;
			if ( !dependency && typeof require === 'function' ) {
				try {
					dependency = require( name );
				} catch ( e ) {
					if ( typeof process !== 'undefined' ) {
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
	}( rcu, utils_get, load_modules );

	var load_fromLinks = function( rcu, loadSingle ) {

		return function loadFromLinks( baseUrl, cache ) {
			var promise = new Ractive.Promise( function( resolve, reject ) {
				var links, pending;
				links = toArray( document.querySelectorAll( 'link[rel="ractive"]' ) );
				pending = links.length;
				links.forEach( function( link ) {
					var name = getNameFromLink( link );
					loadSingle( link.getAttribute( 'href' ), baseUrl, cache ).then( function( Component ) {
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
	}( rcu, load_single );

	var load_multiple = function( loadSingle ) {

		return function loadMultiple( map, baseUrl, cache ) {
			var promise = new Ractive.Promise( function( resolve, reject ) {
				var pending = 0,
					result = {}, name, load;
				load = function( name ) {
					var path = map[ name ];
					loadSingle( path, baseUrl, baseUrl, cache ).then( function( Component ) {
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

	var load = function( rcu, loadFromLinks, loadSingle, loadMultiple, modules ) {

		rcu.init( Ractive );
		var load = function load( url ) {
			var baseUrl = load.baseUrl;
			var cache = load.cache !== false;
			if ( !url ) {
				return loadFromLinks( baseUrl, cache );
			}
			if ( typeof url === 'object' ) {
				return loadMultiple( url, baseUrl, cache );
			}
			return loadSingle( url, baseUrl, baseUrl, cache );
		};
		load.baseUrl = '';
		load.modules = modules;
		return load;
	}( rcu, load_fromLinks, load_single, load_multiple, load_modules );


	// Ractive.lib is deprecated. Remove this in a few versions' time
	try {
		Object.defineProperty( Ractive, 'lib', {
			get: function() {
				console && console.warn && console.warn( '`Ractive.lib` has been deprecated. Use `Ractive.load.modules` as a module registry instead' );
				return load.modules;
			}
		} );
	} catch ( err ) {}

	Ractive.load = load;
	return load;

} ) );
