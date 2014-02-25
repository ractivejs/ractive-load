module.exports = function ( grunt ) {
	return {
		bundle: {
			src: 'tmp/Ractive.load.js',
			dest: 'Ractive.load.js'
		},
		options: {
			process: true,
			banner: grunt.file.read( 'wrapper/banner.js' ),
			footer: grunt.file.read( 'wrapper/footer.js' )
		}
	};
};
