const scriptElement = document.currentScript;
const sourceFolder = scriptElement?.dataset.sourceFolder || '/';
const sourceFolderUrl = new URL(sourceFolder.endsWith('/') ? sourceFolder : `${sourceFolder}/`, document.baseURI);
const structureUrl = new URL('estrutura.json', sourceFolderUrl);
const contentUrl = new URL('conteudo.json', sourceFolderUrl);

const state = {
	structure: null,
	content: [],
	selectedName: null,
	selectedLabel: null,
	menuRoot: null,
	mainArea: null,
	navSubtitle: null,
	navTitle: null,
	navIcon: null
};

function normalizeArray(value) {
	return Array.isArray(value) ? value : value ? [value] : [];
}

function getContentName(entry) {
	return entry?.nomeS || entry?.nomeSS || '';
}

function getContentKey(entry) {
	if (entry?.nomeS) {
		return `section:${entry.nomeS}`;
	}

	if (entry?.nomeSS) {
		return `subsection:${entry.nomeSS}`;
	}

	return '';
}

function getContentEntryByName(name) {
	return state.content.find((entry) => entry.nomeS === name || entry.nomeSS === name) || null;
}

function getCalloutClass(category) {
	if (!category) {
		return 'callout';
	}

	if (category === 'affirmative') {
		return 'affirmative yes';
	}

	return category;
}

function getCalloutIcon(category) {
	const icons = {
		info: 'info',
		warning: 'warning',
		tip: 'lightbulb',
		critical: 'close',
		example: 'electric_bolt',
		yes: 'check',
		affirmative: 'check',
		question: 'question_exchange',
		bug: 'bug_report'
	};

	return icons[category] || category || 'info';
}

function createMenuLabel(text, iconName) {
	const label = document.createElement('span');
	label.className = 'navigationArticleLabel';

	if (iconName) {
		const icon = document.createElement('span');
		icon.className = 'material-symbols-rounded navigationArticleIcon';
		icon.textContent = iconName;
		label.append(icon);
	}

	const textNode = document.createElement('span');
	textNode.className = 'navigationArticleText';
	textNode.textContent = text;
	label.append(textNode);

	return label;
}

function getCalloutLabel(item) {
	if (item?.titulo) {
		return item.titulo;
	}

	if (item?.['titulo:']) {
		return item['titulo:'];
	}

	if (!item?.categoria) {
		return 'Informação';
	}

	const labels = {
		info: 'Informação',
		warning: 'Aviso',
		tip: 'Dica',
		critical: 'Perigo',
		example: 'Exemplo',
		yes: 'Afirmativo',
		affirmative: 'Afirmativo',
		question: 'Questão',
		bug: 'Bug'
	};

	return labels[item.categoria] || item.categoria;
}

function createCallout(item) {
	const callout = document.createElement('div');
	callout.className = `calloutBox ${getCalloutClass(item.categoria)}`.trim();

	const header = document.createElement('div');
	const headerGroup = document.createElement('div');
	const icon = document.createElement('span');
	icon.className = 'material-symbols-rounded foregroundCallOutIcon';
	icon.textContent = getCalloutIcon(item?.categoria);

	const title = document.createElement('h3');
	title.textContent = getCalloutLabel(item);
	if (!title.textContent.endsWith(':')) {
		title.textContent += ':';
	}

	const toggleButton = document.createElement('button');
	toggleButton.className = 'toggleContent';
	const toggleIcon = document.createElement('span');
	toggleIcon.className = 'material-symbols-rounded iconM';
	toggleIcon.textContent = 'keyboard_arrow_up';
	toggleButton.append(toggleIcon);

	headerGroup.append(icon, title);
	header.append(headerGroup, toggleButton);

	const body = document.createElement('h4');
	body.innerHTML = item?.texto || '';

	const backgroundIcon = document.createElement('span');
	backgroundIcon.className = 'material-symbols-rounded backgroundCallOutIcon';
	backgroundIcon.textContent = getCalloutIcon(item?.categoria);

	toggleButton.addEventListener('click', () => {
		callout.classList.toggle('collapsed');
	});

	callout.append(header, body, backgroundIcon);
	return callout;
}

async function copyTextToClipboard(text, button) {
	try {
		await navigator.clipboard.writeText(text);

		const icon = button.querySelector('.material-symbols-rounded');
		if (!icon) {
			return;
		}

		const originalIcon = icon.textContent;
		icon.textContent = 'check';
		icon.style.color = 'var(--altYesColor)';
		button.style.color = 'var(--altYesColor)';

		setTimeout(() => {
			icon.textContent = originalIcon;
			button.style.color = 'var(--invertedNonAccentColor)';
			icon.style.color = 'var(--invertedNonAccentColor)';
		}, 2000);
	} catch (error) {
		console.error('Falha ao copiar o código:', error);
	}
}

function createCodeBlock(item) {
	const codeBlock = document.createElement('div');
	codeBlock.className = 'codeBlock';

	const header = document.createElement('div');
	header.className = 'cBHeader';

	const title = document.createElement('h3');
	title.textContent = item?.titulo || 'Código';

	const button = document.createElement('button');
	button.className = 'cBButton';
	button.setAttribute('aria-label', 'Copiar código');

	const icon = document.createElement('span');
	icon.className = 'material-symbols-rounded iconM iconMNeedsSpace';
	icon.textContent = 'content_copy';

	const label = document.createElement('h4');
	label.textContent = 'Copiar';

	button.append(icon, label);
	header.append(title, button);

	const pre = document.createElement('pre');
	pre.tabIndex = 0;
	const code = document.createElement('code');
	code.textContent = item?.texto || '';
	pre.append(code);

	button.addEventListener('click', () => {
		copyTextToClipboard(code.textContent || '', button);
	});

	codeBlock.append(header, pre);
	return codeBlock;
}

function createTableBlock(item) {
	const wrapper = document.createElement('div');
	wrapper.className = item.tipo;

	const table = document.createElement('table');
	table.className = 'contentTable';

	const headRow = document.createElement('tr');
	normalizeArray(item.heads).forEach((head) => {
		const cell = document.createElement('th');
		cell.textContent = head;
		headRow.append(cell);
	});

	const thead = document.createElement('thead');
	thead.append(headRow);
	table.append(thead);

	const tbody = document.createElement('tbody');
	normalizeArray(item.itens).forEach((row) => {
		const rowElement = document.createElement('tr');
		normalizeArray(row).forEach((cellValue) => {
			const cell = document.createElement('td');
			cell.textContent = cellValue;
			rowElement.append(cell);
		});
		tbody.append(rowElement);
	});

	table.append(tbody);
	wrapper.append(table);
	return wrapper;
}

function createImageBlock(item) {
	const wrapper = document.createElement('div');
	wrapper.className = 'imageDiv';

	const img = document.createElement('img');
	img.className = 'imageItem'
	img.src = item.fileLocation || '';
	img.alt = item.legenda || item.caption || '';
	wrapper.append(img);

	const caption = item.legenda || item.caption;
	if (caption) {
		const captionEl = document.createElement('p');
		captionEl.textContent = caption;
		wrapper.append(captionEl);
	}

	return wrapper;
}

function createGenericBlock(item) {
	const wrapper = document.createElement('div');
	wrapper.className = item.tipo;
	if (item.texto) {
		wrapper.innerHTML = item.texto;
	}
	return wrapper;
}

function createContentBlock(item) {
	if (!item?.tipo) {
		return null;
	}

	if (item.tipo === 'p') {
		const paragraph = document.createElement('p');
		paragraph.innerHTML = item.texto || '';
		return paragraph;
	}

	if (item.tipo === 'callout') {
		return createCallout(item);
	}

	if (item.tipo === 'code') {
		return createCodeBlock(item);
	}

	if (item.tipo === 'tabelaHeaderVert' || item.tipo === 'tabelaHeaderHor') {
		return createTableBlock(item);
	}

	if (item.tipo === 'image') {
		return createImageBlock(item);
	}

	return createGenericBlock(item);
}

function setSelectedState(selectionName, selectionLabel) {
	state.selectedName = selectionName;
	state.selectedLabel = selectionLabel;

	if (state.navSubtitle) {
		state.navSubtitle.textContent = selectionLabel;
	}

	if (state.navTitle) {
		state.navTitle.textContent = state.structure?.tituloPrincipal || state.navTitle.textContent;
	}

	document.title = `${state.structure?.tituloPrincipal || 'SUAE'} - ${selectionLabel}`;

	if (state.menuRoot) {
		state.menuRoot.querySelectorAll('li[data-content-name]').forEach((item) => {
			const isSelected = item.dataset.contentName === selectionName;
			item.dataset.current = String(isSelected);
			item.style.fontWeight = isSelected ? '700' : '400';
		});

		const currentSession = state.menuRoot.querySelector('#settings > div > h4');
		if (currentSession) {
			currentSession.textContent = `${state.structure?.tituloPrincipal || 'SUAE'} / ${selectionLabel}`;
		}
	}
}

function renderContent(selectionName) {
	const entry = getContentEntryByName(selectionName) || state.content[0];
	if (!entry || !state.mainArea) {
		return;
	}

	const selectionLabel = getContentName(entry);
	const blocks = normalizeArray(entry.conteudo).map(createContentBlock).filter(Boolean);

	const article = document.createElement('section');
	article.className = 'articleContent';

	const title = document.createElement('h1');
	title.textContent = selectionLabel;
	article.append(title, ...blocks);

	state.mainArea.replaceChildren(article);
	setSelectedState(selectionLabel, selectionLabel);
	hljs?.highlightAll?.();
}

function renderSelectionByPath(contentName, displayLabel) {
	const entry = getContentEntryByName(contentName);
	if (!entry) {
		return;
	}

	const label = displayLabel || getContentName(entry);
	state.mainArea?.replaceChildren();
	const blocks = normalizeArray(entry.conteudo).map(createContentBlock).filter(Boolean);

	const article = document.createElement('section');
	article.className = 'articleContent';

	const title = document.createElement('h1');
	title.textContent = getContentName(entry);
	article.append(title, ...blocks);

	state.mainArea?.append(article);
	setSelectedState(getContentName(entry), label);
	hljs?.highlightAll?.();
}

function decorateNavigationMenu(root) {
	state.menuRoot = root;

	const currentMenuTitle = root.querySelector('#settings > div > h4');
	if (currentMenuTitle && state.structure) {
		currentMenuTitle.textContent = `${state.structure.tituloPrincipal} / ${state.selectedLabel || getContentName(state.content[0])}`;
	}

	const templateList = root.querySelector('#firstOneNAL');
	if (!templateList || !state.structure) {
		return;
	}

	const generatedList = document.createElement('ul');
	generatedList.id = 'firstOneNAL';
	generatedList.className = 'navigationArticleList google-sans-flex-regular';

	state.structure.secao.forEach((section) => {
		const hasSubSections = Array.isArray(section.subSections) && section.subSections.length > 0;

		if (!hasSubSections) {
			const parentEntry = getContentEntryByName(section.nomeS);
			const parentItem = document.createElement('li');
			parentItem.append(createMenuLabel(section.nomeS, section.iconGMS));
			parentItem.dataset.contentName = section.nomeS;
			parentItem.dataset.contentKey = getContentKey(parentEntry || section);
			parentItem.tabIndex = 0;
			generatedList.append(parentItem);
			return;
		}

		const details = document.createElement('details');
		details.className = 'detailsForHeader';

		const summary = document.createElement('summary');
		summary.append(createMenuLabel(section.nomeS, section.iconGMS));

		const body = document.createElement('div');
		body.className = 'detailsForHeader-body';

		const nestedList = document.createElement('ul');
		nestedList.className = 'navigationArticleList';

		section.subSections.forEach((subSection) => {
			const nestedItem = document.createElement('li');
			nestedItem.append(createMenuLabel(subSection.nomeSS));
			nestedItem.dataset.contentName = subSection.nomeSS;
			nestedItem.dataset.contentKey = `subsection:${subSection.nomeSS}`;
			nestedItem.dataset.parentName = section.nomeS;
			nestedItem.tabIndex = 0;
			nestedList.append(nestedItem);
		});

		body.append(nestedList);
		details.append(summary, body);
		generatedList.append(details);
	});

	templateList.replaceWith(generatedList);

	generatedList.addEventListener('click', (event) => {
		const clickedItem = event.target.closest('li[data-content-name]');
		if (!clickedItem || !generatedList.contains(clickedItem)) {
			return;
		}

		const contentName = clickedItem.dataset.contentName;
		const parentName = clickedItem.dataset.parentName;
		const displayLabel = parentName ? `${parentName} / ${contentName}` : contentName;
		renderSelectionByPath(contentName, displayLabel);
		window.SUAEHamburgerMenu?.close?.();
	});

	generatedList.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		const clickedItem = event.target.closest('li[data-content-name]');
		if (!clickedItem || !generatedList.contains(clickedItem)) {
			return;
		}

		event.preventDefault();
		const contentName = clickedItem.dataset.contentName;
		const parentName = clickedItem.dataset.parentName;
		const displayLabel = parentName ? `${parentName} / ${contentName}` : contentName;
		renderSelectionByPath(contentName, displayLabel);
		window.SUAEHamburgerMenu?.close?.();
	});
}

function applyStructureToNav() {
	state.navTitle = document.getElementById('titleNav');
	state.navSubtitle = document.getElementById('subtitle');
	state.navIcon = document.getElementById('favicon');

	if (state.navTitle && state.structure?.tituloPrincipal) {
		state.navTitle.textContent = state.structure.tituloPrincipal;
	}

	const firstContent = state.content[0];
	const initialLabel = state.selectedLabel || getContentName(firstContent);

	if (state.navSubtitle) {
		state.navSubtitle.textContent = initialLabel;
	}

	document.title = `${state.structure?.tituloPrincipal || 'SUAE'} - ${initialLabel}`;

	if (state.navIcon && state.structure) {
		const iconNode = state.navIcon;

		if (state.structure.iconeLoc) {
			if (iconNode.tagName.toLowerCase() === 'img') {
				iconNode.setAttribute('src', state.structure.iconeLoc);
			} else {
				const replacement = document.createElement('img');
				replacement.id = iconNode.id || 'favicon';
				replacement.className = iconNode.className || '';
				replacement.setAttribute('src', state.structure.iconeLoc);
				replacement.setAttribute('alt', `Ícone de ${state.structure.tituloPrincipal}`);
				iconNode.replaceWith(replacement);
				state.navIcon = replacement;
			}
		} else if (state.structure.icone) {
			const parsedIcon = new DOMParser().parseFromString(state.structure.icone, 'image/svg+xml').querySelector('svg');
			if (parsedIcon) {
				parsedIcon.id = iconNode.id || 'favicon';
				const combinedClasses = new Set((`${iconNode.className || ''} ${parsedIcon.className?.baseVal || ''} ${parsedIcon.getAttribute('class') || ''}`).split(/\s+/).filter(Boolean));
				if (combinedClasses.size > 0) {
					parsedIcon.setAttribute('class', Array.from(combinedClasses).join(' '));
				}
				iconNode.replaceWith(parsedIcon);
				state.navIcon = parsedIcon;
			}
		}
	}
}

async function loadArticleData() {
	const [structureResponse, contentResponse] = await Promise.all([
		fetch(structureUrl),
		fetch(contentUrl)
	]);

	if (!structureResponse.ok) {
		throw new Error(`Falha ao carregar estrutura.json: ${structureResponse.status}`);
	}

	if (!contentResponse.ok) {
		throw new Error(`Falha ao carregar conteudo.json: ${contentResponse.status}`);
	}

	state.structure = await structureResponse.json();
	state.content = await contentResponse.json();
	state.selectedName = getContentName(state.content[0]);
	state.selectedLabel = state.selectedName;
}

async function initArticlePage() {
	state.mainArea = document.getElementById('mainArea');
	if (!state.mainArea) {
		return;
	}

	try {
		await loadArticleData();
		window.SUAEArticlePage = {
			decorateHamburgerMenu: decorateNavigationMenu,
			renderSelection: renderSelectionByPath,
			getState: () => state
		};
		applyStructureToNav();
		if (state.menuRoot) {
			decorateNavigationMenu(state.menuRoot);
		}
		renderSelectionByPath(state.selectedName, state.selectedLabel);
	} catch (error) {
		console.error('Erro ao carregar conteúdo da página:', error);
		state.mainArea.innerHTML = '<p>Não foi possível carregar o conteúdo desta página.</p>';
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initArticlePage, { once: true });
} else {
	initArticlePage();
}

document.addEventListener('headerLoaded', applyStructureToNav);