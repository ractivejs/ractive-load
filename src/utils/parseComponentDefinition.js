define([
	'utils/getName',
	'utils/extractFragment'
], function (
	getName,
	extractFragment
) {

	'use strict';

	var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;

	return function parseComponentDefinition ( source ) {
		var template, links, imports, scripts, script, styles, match, modules, i, item;

		template = Ractive.parse( source, {
			noStringify: true,
			interpolateScripts: false,
			interpolateStyles: false
		});

		links = [];
		scripts = [];
		styles = [];
		modules = [];

		// Extract certain top-level nodes from the template. We work backwards
		// so that we can easily splice them out as we go
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

		// Extract names from links
		imports = links.map( function ( link ) {
			var href, name;

			href = link.a.href && link.a.href[0];
			name = ( link.a.name && link.a.name[0] ) || getName( href );

			if ( typeof name !== 'string' ) {
				throw new Error( 'Error parsing link tag' );
			}

			return {
				name: name,
				href: href
			};
		});

		script = scripts.map( extractFragment ).join( ';' );

		while ( match = requirePattern.exec( script ) ) {
			modules.push( match[1] || match[2] );
		}

		// TODO glue together text nodes, where applicable

		return {
			template: template,
			imports: imports,
			script: script,
			css: styles.map( extractFragment ).join( ' ' ),
			modules: modules
		};
	};

});
