const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
  const setTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      themeToggle.textContent = '☀️';
    } else {
      document.documentElement.classList.remove('dark');
      themeToggle.textContent = '🌙';
    }
  };

  themeToggle.addEventListener('click', () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setTheme(!isCurrentlyDark);
    localStorage.setItem('theme', !isCurrentlyDark ? 'dark' : 'light');
  });

  // Initial theme setup
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
  setTheme(isDark);
}