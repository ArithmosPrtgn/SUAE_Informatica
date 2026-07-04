document.querySelectorAll('details.subjectSelection').forEach(el => {
    el.addEventListener('click', e => {
        if (!e.target.closest('summary')) return;
        if (!el.open) return;
        e.preventDefault();
        el.classList.add('is-closing');
        el.addEventListener('transitionend', () => {
            el.classList.remove('is-closing');
            el.removeAttribute('open');
        }, { once: true });
    });
});