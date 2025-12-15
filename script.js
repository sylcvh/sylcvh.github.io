// Theme toggle functionality with switch
const themeCheckbox = document.getElementById('theme-checkbox');

const setTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
    themeCheckbox.checked = true;
  } else {
    document.documentElement.classList.remove('dark');
    themeCheckbox.checked = false;
  }
};

// Check if theme toggle exists before adding event listener
if (themeCheckbox) {
  themeCheckbox.addEventListener('change', () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setTheme(!isCurrentlyDark);
    localStorage.setItem('theme', !isCurrentlyDark ? 'dark' : 'light');
  });
}

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

// Underline animation on page load and hover
document.addEventListener('DOMContentLoaded', () => {
  const linkItems = document.querySelectorAll('.link-item');
  
  linkItems.forEach((item, index) => {
    const underline = item.querySelector('.link-underline');
    
    // Initial animation
    setTimeout(() => {
      underline.style.transform = 'scaleX(0.2)';
      setTimeout(() => {
        underline.style.transform = 'scaleX(0)';
      }, 800);
    }, 1000 + (index * 200));
    
    // Hover effect
    item.addEventListener('mouseenter', () => {
      underline.style.transform = 'scaleX(1)';
      underline.style.transition = 'transform 0.3s ease';
    });
    
    item.addEventListener('mouseleave', () => {
      underline.style.transform = 'scaleX(0)';
      underline.style.transition = 'transform 0.3s ease';
    });
  });
});

// Add keyboard navigation for theme toggle
document.addEventListener('keydown', (e) => {
  if (e.key === 't' || e.key === 'T') {
    // Toggle theme with T key
    if (themeCheckbox) {
      themeCheckbox.checked = !themeCheckbox.checked;
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      setTheme(!isCurrentlyDark);
      localStorage.setItem('theme', !isCurrentlyDark ? 'dark' : 'light');
    }
  }
});

// Add smooth transitions for theme changes
document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';