import buble from 'rollup-plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
	input: 'src/load.js',
	plugins: [
		buble(),
		nodeResolve({
			jsnext: true
		})
	],
	output: {
		name: 'Ractive.load',
		globals: { ractive: 'Ractive' }
	}
};
