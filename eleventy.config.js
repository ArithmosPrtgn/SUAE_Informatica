export default function (eleventyConfig) {
	eleventyConfig.setTemplateFormats(['html', 'njk']);

	eleventyConfig.htmlTemplateEngine = false;

	eleventyConfig.addPassthroughCopy('css');
	eleventyConfig.addPassthroughCopy('js');
	eleventyConfig.addPassthroughCopy('resources');
	eleventyConfig.addPassthroughCopy('informaticaVida');
	eleventyConfig.addPassthroughCopy('linguagens');
	eleventyConfig.addPassthroughCopy('sistemasOperacionais');
	eleventyConfig.addPassthroughCopy('sitewide');

	return {
		dir: {
			input: '.',
			output: 'dist',
			includes: 'sitewide'
		}
	};
}