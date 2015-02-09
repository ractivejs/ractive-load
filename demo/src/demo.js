(function () {

	'use strict';

	var q, deindent, tabs, ws, onlyWhitespace, getSpaces, template, code, style;

	q = function ( selector ) {
		return document.querySelector( selector );
	};

	tabs = /^\t+/;
	ws = /^\s+/;
	onlyWhitespace = /^\s*$/;

	getSpaces = function ( num ) {
		var spaces = '';

		while ( num-- ) {
			spaces += ' ';
		}

		return spaces;
	};

	deindent = function ( str ) {
		var lines, minIndent;

		lines = str.split( '\n' );

		// remove blank lines at start or end
		if ( onlyWhitespace.test( lines[0] ) ) {
			lines.shift();
		}

		if ( lines.length && onlyWhitespace.test( lines[ lines.length - 1 ] ) ) {
			lines.pop();
		}

		// then, find the minimum number of spaces
		lines = lines.map( function ( line ) {
			var match, indent;

			// replace leading tabs with 2 spaces each
			line = line.replace( tabs, function ( match ) {
				return getSpaces( match.length * 2 );
			});

			// then see how indented this line is
			match = ws.exec( line );

			if ( match && !onlyWhitespace.test( line ) ) {
				indent = match[0].length;

				if ( minIndent === undefined ) {
					minIndent = indent;
				} else {
					minIndent = Math.min( minIndent, indent );
				}
			}
			
			return line;
		});

		// return the deintented result
		return lines.map( function ( line ) {
			return line.substring( minIndent );
		}).join( '\n' );
	};

	template = deindent( q( '#demo-template' ).innerHTML );
	code = deindent( q( '#demo-code' ).innerHTML );

	// insert demo code into the page
	q( '#demo-template-view' ).textContent = template;
	q( '#demo-code-view' ).textContent = code;

	// activate prettify.js
	prettyPrint();


	// if CSS transforms aren't supported, don't show the 'fork me' button.
	// Quick and dirty detect
	style = document.createElement( 'div' ).style;

	if ( style.transform !== undefined ) {
		document.body.className += 'transforms-enabled';
	} else {
		[ 'webkit', 'moz', 'ms', 'o' ].forEach( function ( vendor ) {
			if ( style[ vendor + 'Transform' ] !== undefined ) {
				document.body.className += 'transforms-enabled';
			}
		});
	}

}());