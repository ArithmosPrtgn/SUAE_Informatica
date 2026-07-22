const hamburgerMenuUrl = '/sitewide/hb/hamburgerMenu.html';
let hamburgerMenuRoot = null;
let hamburgerMenuLoading = false;

const themeToggleHelperUrl = '/js/darkMode/themeToggle.js';
const saveAsHelperUrl = '/js/saveAs/index.js';

function ensureThemeToggleHelper() {
	if (window.PROOTThemeToggle) {
		return Promise.resolve(window.PROOTThemeToggle);
	}

	if (!window.__PROOTThemeTogglePromise) {
		window.__PROOTThemeTogglePromise = new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = themeToggleHelperUrl;
			script.onload = () => resolve(window.PROOTThemeToggle);
			script.onerror = () => reject(new Error('Theme toggle helper failed to load'));
			document.head.append(script);
		});
	}

	return window.__PROOTThemeTogglePromise;
}

function ensureSaveAsHelper() {
	if (window.PROOTSaveAs) {
		return Promise.resolve(window.PROOTSaveAs);
	}

	if (!window.__PROOTSaveAsPromise) {
		window.__PROOTSaveAsPromise = new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = saveAsHelperUrl;
			script.onload = () => {
				if (window.PROOTSaveAs) {
					resolve(window.PROOTSaveAs);
				} else {
					window.__PROOTSaveAsPromise = null;
					reject(new Error('saveAs script loaded but did not set window.PROOTSaveAs'));
				}
			};
			script.onerror = () => {
				window.__PROOTSaveAsPromise = null;
				reject(new Error('Save-as helper failed to load'));
			};
			document.head.append(script);
		});
	}

	return window.__PROOTSaveAsPromise;
}

function closeHamburgerMenu() {
	if (hamburgerMenuRoot) {
		const settings = hamburgerMenuRoot.querySelector('#settings');
		const hideContent = hamburgerMenuRoot.querySelector('#hideContent');

		if (!settings || !hideContent) {
			hamburgerMenuRoot.remove();
			hamburgerMenuRoot = null;
			return;
		}

		settings.classList.remove('appears');
		hideContent.classList.remove('appears');
		settings.addEventListener('transitionend', () => {
			if (hamburgerMenuRoot) {
				hamburgerMenuRoot.remove();
				hamburgerMenuRoot = null;
			}
		}, { once: true });
	}
}

window.PROOTHamburgerMenu = {
	close: closeHamburgerMenu,
	open: openHamburgerMenu
};

async function initGlobalTheme() {
	if (window.__PROOTThemeApplied) {
		return;
	}
	window.__PROOTThemeApplied = true;

	try {
		const themeToggle = await ensureThemeToggleHelper();
		if (themeToggle.applySavedTheme) {
			themeToggle.applySavedTheme();
		}
	} catch (error) {
		console.error('Erro ao aplicar tema salvo:', error);
		window.__PROOTThemeApplied = false;
	}
}

async function initHamburgerTheme() {
	const button = hamburgerMenuRoot?.querySelector('#themeComplex');
	if (!button || button.dataset.themeBound === 'true') {
		return;
	}

	const themeToggle = await ensureThemeToggleHelper();
	themeToggle.attach(button);
}

async function initHamburgerSaveAs() {
	const button = hamburgerMenuRoot?.querySelector('#saveOffline');
	if (!button || button.dataset.saveAsBound === 'true') {
		return;
	}

	const saveAs = await ensureSaveAsHelper();
	saveAs.attach(button);
}

async function openHamburgerMenu() {
	if (hamburgerMenuRoot || hamburgerMenuLoading) {
		return;
	}

	hamburgerMenuLoading = true;

	try {
		const response = await fetch(hamburgerMenuUrl);

		if (!response.ok) {
			throw new Error(`Erro ao carregar hamburguer menu: ${response.status}`);
		}

		const markup = await response.text();
		const parsed = new DOMParser().parseFromString(markup, 'text/html');
		const overlayNodes = Array.from(parsed.body?.children ?? []);

		if (overlayNodes.length === 0) {
			throw new Error('O hamburguer menu veio vazio.');
		}

		hamburgerMenuRoot = document.createElement('div');
		hamburgerMenuRoot.dataset.hamburgerMenuOverlay = 'true';
		hamburgerMenuRoot.append(...overlayNodes);
		document.body.append(hamburgerMenuRoot);

		window.PROOTArticlePage?.decorateHamburgerMenu?.(hamburgerMenuRoot);

		const hideContent = hamburgerMenuRoot.querySelector('#hideContent');
		const settings = hamburgerMenuRoot.querySelector('#settings');

		if (settings || hideContent) {
			if (settings) {
				settings.getBoundingClientRect();
			}
			if (hideContent) {
				hideContent.getBoundingClientRect();
			}
			requestAnimationFrame(() => {
				settings?.classList.add('appears');
				hideContent?.classList.add('appears');
			});
		}

		const closeButton = hamburgerMenuRoot.querySelector('#iQuit');

		if (closeButton) {
			closeButton.addEventListener('click', closeHamburgerMenu, { once: true });
		}

		initHamburgerTheme();
		initHamburgerSaveAs();
	} catch (error) {
		console.error('Erro ao abrir hamburguer menu:', error);
	} finally {
		hamburgerMenuLoading = false;
	}
}

function initHamburgerMenu() {
	const hamburgerButton = document.querySelector('#hamburguerB');

	if (!hamburgerButton || hamburgerButton.dataset.hamburgerMenuBound === 'true') {
		return;
	}

	hamburgerButton.dataset.hamburgerMenuBound = 'true';
	hamburgerButton.addEventListener('click', openHamburgerMenu);
}

document.addEventListener('headerLoaded', initHamburgerMenu);
document.addEventListener('DOMContentLoaded', initHamburgerMenu);

document.addEventListener('headerLoaded', initGlobalTheme);
document.addEventListener('DOMContentLoaded', initGlobalTheme);