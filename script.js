const themeCheckbox = document.querySelector('#theme-checkbox');

if (themeCheckbox) {
  const setTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      themeCheckbox.checked = true;
    } else {
      document.documentElement.classList.remove('dark');
      themeCheckbox.checked = false;
    }
  };

  themeCheckbox.addEventListener('change', () => {
    const isDark = themeCheckbox.checked;
    setTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
  setTheme(isDark);
}