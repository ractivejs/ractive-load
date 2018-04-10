import buble from 'rollup-plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
	input: 'src/load.js',
	plugins: [ nodeResolve({ jsnext: true }), buble()],
	output: {
		globals: { ractive: 'Ractive' },
		name: 'Ractive.load'
	},
	external: [ 'ractive' ]
};
