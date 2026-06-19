document.addEventListener('DOMContentLoaded', function() {
    const themeCheckbox = document.getElementById('theme-checkbox');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('metalTheme', theme);

        if (themeCheckbox) {
            themeCheckbox.checked = theme === 'light';
        }

        if (themeMeta) {
            const bg = theme === 'light' ? '#f5f7fb' : '#0a0a0a';
            themeMeta.setAttribute('content', bg);
        }
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('metalTheme');
    const initialTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');
    applyTheme(initialTheme);

    if (prefersDark.addEventListener) {
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('metalTheme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', function() {
            applyTheme(this.checked ? 'light' : 'dark');
        });

        const themeSwitch = document.querySelector('.theme-switch');
        if (themeSwitch) {
            themeSwitch.addEventListener('click', (e) => {
                if (e.target === themeCheckbox) {
                    return;
                }
                e.preventDefault();
                themeCheckbox.checked = !themeCheckbox.checked;
                applyTheme(themeCheckbox.checked ? 'light' : 'dark');
            });

            themeSwitch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    themeCheckbox.checked = !themeCheckbox.checked;
                    applyTheme(themeCheckbox.checked ? 'light' : 'dark');
                }
            });
        }
    }
});