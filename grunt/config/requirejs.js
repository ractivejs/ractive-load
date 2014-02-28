module.exports = {
	compile: {
		options: {
			out: 'tmp/Ractive.load.js',
			baseUrl: 'src/',
			name: 'load',
			optimize: 'none',
			logLevel: 2,
			onBuildWrite: function( name, path, contents ) {
				return require( 'amdclean' ).clean({
					code: contents
				}) + '\n';
			}
		}
	}
};
