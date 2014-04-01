module.exports = {
	main: 'src/**/*.js',
	options: {
		strict: true,
		unused: true,
		undef: true,
		smarttabs: true,
		boss: true,
		evil: true,
		globals: {
			define: true,
			module: true,
			require: true,
			window: true,
			document: true,
			XMLHttpRequest: true,
			Ractive: true,
			setTimeout: true
		}
	}
};
