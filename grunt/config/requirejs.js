module.exports = {
	compile: {
		options: {
			out: 'tmp/ractive-load.js',
			baseUrl: 'src/',
			name: 'load',
			optimize: 'none',
			logLevel: 2,
			paths: {
				rcu: '../node_modules/rcu/rcu.amd'
			},
			onBuildWrite: function( name, path, contents ) {
				return require( 'amdclean' ).clean({
					code: contents
				}) + '\n';
			}
		}
	}
};
