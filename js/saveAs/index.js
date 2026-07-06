(function () {
	if (window.SUAESaveAs) {
		return;
	}

	let printFrame = null;
	let isPrinting = false;

	function collectPrintableStyles() {
		return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
			.map((node) => node.outerHTML)
			.join('');
	}

	function buildPrintDocument(mainAreaHtml) {
		return `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    ${collectPrintableStyles()}
    <style>
        html, body {
            margin: 0;
            padding: 0;
            background: #fff;
        }

        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        #mainArea {
            width: 100%;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    ${mainAreaHtml}
</body>
</html>`;

	}

	function cleanupPrintFrame() {
		if (printFrame) {
			printFrame.remove();
			printFrame = null;
		}
		isPrinting = false;
	}

	function printMainAreaAsPdf() {
		if (isPrinting) {
			return;
		}

		const mainArea = document.querySelector('#mainArea');
		if (!mainArea) {
			console.warn('mainArea not found');
			return;
		}

		isPrinting = true;
		printFrame = document.createElement('iframe');
		printFrame.setAttribute('aria-hidden', 'true');
		printFrame.style.position = 'fixed';
		printFrame.style.right = '0';
		printFrame.style.bottom = '0';
		printFrame.style.width = '0';
		printFrame.style.height = '0';
		printFrame.style.border = '0';
		printFrame.style.opacity = '0';
		document.body.append(printFrame);

		const frameWindow = printFrame.contentWindow;
		if (!frameWindow) {
			cleanupPrintFrame();
			return;
		}

		frameWindow.addEventListener('afterprint', cleanupPrintFrame, { once: true });

		printFrame.addEventListener('load', () => {
			window.setTimeout(() => {
				frameWindow.focus();
				frameWindow.print();
			}, 100);
		}, { once: true });
		printFrame.srcdoc = buildPrintDocument(mainArea.outerHTML);
	}

	function attach(button) {
		if (!button || button.dataset.saveAsBound === 'true') {
			return;
		}

		button.dataset.saveAsBound = 'true';
		button.addEventListener('click', printMainAreaAsPdf);
	}

	window.SUAESaveAs = { attach };
})();