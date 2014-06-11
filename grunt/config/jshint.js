module.exports = {
	main: 'src/**/*.js',
	options: {
		strict: true,
		unused: true,
		undef: true,
		smarttabs: true,
		boss: true,
		evil: true,
		sub: true,
		globals: {
			define: true,
			module: true,
			require: true,
			window: true,
			document: true,
			XMLHttpRequest: true,
			Ractive: true,
			setTimeout: true,
			global: true,
			fs: true,
			process: true
		}
	}
};
