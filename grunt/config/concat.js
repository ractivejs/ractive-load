module.exports = function ( grunt ) {
	return {
		bundle: {
			src: 'tmp/ractive-load.js',
			dest: 'ractive-load.js'
		},
		options: {
			process: true,
			banner: grunt.file.read( 'wrapper/banner.js' ),
			footer: grunt.file.read( 'wrapper/footer.js' )
		}
	};
};
