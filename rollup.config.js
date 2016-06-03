import buble from 'rollup-plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
	entry: 'src/load.js',
	moduleName: 'Ractive.load',
	plugins: [
		buble(),
		nodeResolve({
			jsnext: true,
			skip: [ 'ractive' ]
		})
	],
	external: [ 'ractive' ],
	globals: { ractive: 'Ractive' }
};
