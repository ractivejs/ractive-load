/*

	Ractive.load
	===================

	Version 0.1.0.

	<< description goes here... >>

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'Ractive' )` or `define([ 'Ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/Ractive.js'></script>
	    <script src='lib/Ractive.load.js'></script>

	Or, if you're using a module loader, require this module:

	    // requiring the plugin will 'activate' it - no need to use
	    // the return value
	    require( 'Ractive.load' );

	<< more specific instructions for this plugin go here... >>

*/

(function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'Ractive' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'Ractive' ], factory );
	}

	// browser global
	else if ( global.Ractive ) {
		factory( global.Ractive );
	}

	else {
		throw new Error( 'Could not find Ractive! It must be loaded before the Ractive.load plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive ) {

	'use strict';

	Ractive.load = function ( url, callback, onError ) {
		if ( !url || typeof url === 'function' ) {
			callback = url;
			return loadFromLinks( callback, onError );
		}

		if ( typeof url === 'object' ) {
			return loadMultiple( url, callback, onError );
		}

		return loadSingle( url, callback, onError );
	};

	return Ractive.load;

	function loadFromLinks ( callback, onerror ) {
		var promise = new Ractive.Promise( function ( resolve, reject ) {
			var links, pending;

			links = toArray( document.querySelectorAll( 'link[rel="ractive"]' ) );
			pending = links.length;

			links.forEach( function ( link ) {
				var name = getNameFromLink( link );

				loadSingle( link.getAttribute( 'href' ) ).then( function ( Component ) {
					Ractive.components[ name ] = Component;

					if ( !--pending ) {
						resolve();
					}
				}, reject );
			});
		});

		if ( callback ) {
			promise.then( callback, onerror );
		}

		return promise;
	}

	function loadMultiple ( map, callback, onerror ) {
		var promise = new Ractive.Promise( function ( resolve, reject ) {
			var pending = 0, result = {}, name, load;

			load = function ( name ) {
				var url = map[ name ];

				loadSingle( url ).then( function ( Component ) {
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
		});

		if ( callback ) {
			promise.then( callback, onerror );
		}

		return promise;
	}

	function loadSingle ( path, callback, onerror ) {
		var promise, url;

		url = resolvePath( path, Ractive.baseUrl, true );

		promise = get( url ).then( function ( template ) {
			return makeComponent( template, url );
		}, throwError );

		if ( callback ) {
			promise.then( callback, onerror );
		}

		return promise;
	}

	function makeComponent ( template, baseUrl ) {
		var links,
			scripts,
			script,
			styles,
			i,
			item,
			scriptElement,
			oldComponent,
			exports,
			Component,
			pendingImports,
			imports,
			importPromise;

		template = Ractive.parse( template, {
			noStringify: true,
			interpolateScripts: false,
			interpolateStyles: false
		});

		links = [];
		scripts = [];
		styles = [];

		i = template.length;
		while ( i-- ) {
			item = template[i];

			if ( item && item.t === 7 ) {
				if ( item.e === 'link' && ( item.a && item.a.rel[0] === 'ractive' ) ) {
					links.push( template.splice( i, 1 )[0] );
				}

				if ( item.e === 'script' && ( !item.a || !item.a.type || item.a.type[0] === 'text/javascript' ) ) {
					scripts.push( template.splice( i, 1 )[0] );
				}

				if ( item.e === 'style' && ( !item.a || !item.a.type || item.a.type[0] === 'text/css' ) ) {
					styles.push( template.splice( i, 1 )[0] );
				}
			}
		}


		// import any sub-components
		pendingImports = links.length;
		imports = {};

		importPromise = new Ractive.Promise( function ( resolve, reject ) {

			links.forEach( function ( link ) {
				var href, name, resolvedPath;

				href = link.a.href && link.a.href[0];
				name = ( link.a.name && link.a.name[0] ) || getName( href );

				if ( typeof name !== 'string' ) {
					reject( 'Error parsing link tag' );
					return;
				}

				resolvedPath = resolvePath( href, baseUrl );

				get( resolvedPath ).then( function ( template ) {
					return makeComponent( template, resolvedPath );
				}).then( function ( Component ) {
					imports[ name ] = Component;

					if ( !--pendingImports ) {
						resolve( imports );
					}
				}, reject );
			});

			if ( !pendingImports ) {
				resolve( imports );
			}
		});

		// TODO glue together text nodes, where applicable

		// extract script
		script = scripts.map( extractFragment ).join( ';' );

		// once all subcomponents have been imported (if any), create this component
		return importPromise.then( function ( imports ) {
			var head, options;

			head = document.getElementsByTagName( 'head' )[0];
			options = { template: template, components: imports };

			if ( styles.length ) {
				options.css = styles.map( extractFragment ).join( ' ' );
			}

			Component = Ractive.extend( options );

			if ( script ) {
				scriptElement = document.createElement( 'script' );
				scriptElement.innerHTML = '(function () {' + script + '}());';

				oldComponent = window.component;

				window.component = {};
				head.appendChild( scriptElement );

				exports = window.component.exports;

				if ( typeof exports === 'function' ) {
					Component = exports( Component );
				} else if ( typeof exports === 'object' ) {
					Component = Component.extend( exports );
				}

				head.removeChild( scriptElement );
				window.component = oldComponent;
			}

			return Component;
		});
	}


	function getName ( path ) {
		var pathParts, filename, lastIndex;

		pathParts = path.split( '/' );
		filename = pathParts.pop();

		lastIndex = filename.lastIndexOf( '.' );
		if ( lastIndex !== -1 ) {
			filename = filename.substr( 0, lastIndex );
		}

		return filename;
	}

	function getNameFromLink ( link ) {
		return link.getAttribute( 'name' ) || getName( link.getAttribute( 'href' ) );
	}

	function throwError ( err ) {
		throw err;
	}

	function get ( url ) {
		return new Ractive.Promise( function ( resolve, reject ) {
			var xhr, onload, loaded;

			xhr = new XMLHttpRequest();
			xhr.open( 'GET', url );

			onload = function () {
				if ( ( xhr.readyState !== 4 ) || loaded ) {
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
		});
	}

	function toArray ( arrayLike ) {
		var arr = [], i = arrayLike.length;

		while ( i-- ) {
			arr[i] = arrayLike[i];
		}

		return arr;
	}

	function resolvePath ( relativePath, base, force ) {
		var pathParts, relativePathParts, part;

		// `force` is `true` if this comes from a top-level call
		// (i.e. from `Ractive.load()`) - in this case, all paths
		// should be treated as relative to Ractive.baseUrl
		if ( !force ) {
			if ( relativePath.charAt( 0 ) !== '.' ) {
				// not a relative path!
				return relativePath;
			}
		} else {
			if ( base && base.charAt( base.length - 1 ) !== '/' ) {
				// e.g. `Ractive.baseUrl === 'imports'` - should be
				// treated as `imports/`
				base += '/';
			}
		}

		// 'foo/bar/baz.html' -> ['foo', 'bar', 'baz.html']
		pathParts = ( base || '' ).split( '/' );
		relativePathParts = relativePath.split( '/' );

		// ['foo', 'bar', 'baz.html'] -> ['foo', 'bar']
		pathParts.pop();

		while ( part = relativePathParts.shift() ) {
			if ( part === '..' ) {
				pathParts.pop();
			} else if ( part !== '.' ) {
				pathParts.push( part );
			}
		}

		return pathParts.join( '/' );
	}

	function extractFragment ( item ) {
		return item.f;
	}

}));