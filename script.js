// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');

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

// Cursor animation for title
const cursor = document.querySelector('.title-cursor');
if (cursor) {
  setInterval(() => {
    cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
  }, 500);
}

// Add hover effect to links
const linkButtons = document.querySelectorAll('.link-button');
linkButtons.forEach(button => {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
  });
});

// Add subtle animation to description paragraphs
const descriptionParagraphs = document.querySelectorAll('.description p');
descriptionParagraphs.forEach((p, index) => {
  p.style.opacity = '0';
  p.style.transform = 'translateY(10px)';
  p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  
  setTimeout(() => {
    p.style.opacity = '1';
    p.style.transform = 'translateY(0)';
  }, 300 + (index * 200));
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Toggle theme with Escape key
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setTheme(!isCurrentlyDark);
    localStorage.setItem('theme', !isCurrentlyDark ? 'dark' : 'light');
  }
});