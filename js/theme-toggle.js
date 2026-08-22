document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('theme-checkbox');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!checkbox) return;

    const colors = { dark: '#07060f', light: '#f3f5fb' };

    function apply(next) {
        const theme = next === 'light' ? 'light' : 'dark';
        if (document.documentElement.getAttribute('data-theme') !== theme) {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('metalTheme', theme);
        checkbox.checked = theme === 'light';
        if (themeMeta) themeMeta.setAttribute('content', colors[theme]);
    }

    checkbox.addEventListener('change', () => {
        apply(checkbox.checked ? 'light' : 'dark');
    });

    apply(document.documentElement.getAttribute('data-theme'));
});
