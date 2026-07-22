import { build } from 'esbuild';

await build({
	entryPoints: ['/js/'],
	bundle: true,
	minify: true,
	outfile: '_site/js/bundle.js'
});