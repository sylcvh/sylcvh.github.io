const themeSwitch = document.querySelector('.theme-switch input');

if (themeSwitch) {
  const setTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      themeSwitch.checked = true;
    } else {
      document.documentElement.classList.remove('dark');
      themeSwitch.checked = false;
    }
  };

  themeSwitch.addEventListener('change', () => {
    const isDark = themeSwitch.checked;
    setTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Initial theme setup
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
  setTheme(isDark);
}