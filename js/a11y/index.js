const a11yMenuUrl = '/sitewide/a11y/a11y.html';
let a11yMenuRoot = null;
let a11yMenuLoading = false;

function closeA11yMenu() {
	if (a11yMenuRoot) {
		const access = a11yMenuRoot.querySelector('#access');
		const hideContent = a11yMenuRoot.querySelector('#hideContent');

		if (!access || !hideContent) {
			a11yMenuRoot.remove();
			a11yMenuRoot = null;
			return;
		}

		access.classList.remove('appears');
		hideContent.classList.remove('appears');
		access.addEventListener('transitionend', () => {
			if (a11yMenuRoot) {
				a11yMenuRoot.remove();
				a11yMenuRoot = null;
			}
		}, { once: true });
	}
}

async function openA11yMenu() {
	if (a11yMenuRoot || a11yMenuLoading) {
		return;
	}

	a11yMenuLoading = true;

	try {
		const response = await fetch(a11yMenuUrl);

		if (!response.ok) {
			throw new Error(`Erro ao carregar menu de acessibilidade: ${response.status}`);
		}

		const markup = await response.text();
		const parsed = new DOMParser().parseFromString(markup, 'text/html');
		const overlayNodes = Array.from(parsed.body?.children ?? []);

		if (overlayNodes.length === 0) {
			throw new Error('O menu de acessibilidade veio vazio.');
		}

		a11yMenuRoot = document.createElement('div');
		a11yMenuRoot.dataset.a11yMenuOverlay = 'true';
		a11yMenuRoot.append(...overlayNodes);
		document.body.append(a11yMenuRoot);

		window.PROOTArticlePage?.decorateA11yMenu?.(a11yMenuRoot);

		const hideContent = a11yMenuRoot.querySelector('#hideContent');
		const access = a11yMenuRoot.querySelector('#access');

		if (access || hideContent) {
			if (access) {
				access.getBoundingClientRect();
			}
			if (hideContent) {
				hideContent.getBoundingClientRect();
			}
			requestAnimationFrame(() => {
				access?.classList.add('appears');
				hideContent?.classList.add('appears');
			});
		}

		const closeButton = a11yMenuRoot.querySelector('#iQuit');

		if (closeButton) {
			closeButton.addEventListener('click', closeA11yMenu, { once: true });
		}
	} catch (error) {
		console.error('Erro ao abrir menu de acessibilidade:', error);
	} finally {
		a11yMenuLoading = false;
	}
}

function initA11yMenu() {
	const a11yButton = document.querySelector('#accessibility');

	if (!a11yButton || a11yButton.dataset.a11yMenuBound === 'true') {
		return;
	}

	a11yButton.dataset.a11yMenuBound = 'true';
	a11yButton.addEventListener('click', openA11yMenu);
}

window.PROOTA11yMenu = {
	close: closeA11yMenu,
	open: openA11yMenu
};

document.addEventListener('headerLoaded', initA11yMenu);
document.addEventListener('DOMContentLoaded', initA11yMenu);