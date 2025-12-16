const themeCheckbox = document.querySelector('#theme-checkbox');

if (themeCheckbox) {
  const setTheme = (isLight) => {
    if (isLight) {
      document.documentElement.classList.add('light');
      themeCheckbox.checked = true;
    } else {
      document.documentElement.classList.remove('light');
      themeCheckbox.checked = false;
    }
  };

  themeCheckbox.addEventListener('change', () => {
    const isLight = themeCheckbox.checked;
    setTheme(isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });

  const savedTheme = localStorage.getItem('theme');
  const isLight = savedTheme === 'light';
  setTheme(isLight);
}

function typeWriter() {
  const textElement = document.getElementById('typing-text');
  const cursorElement = document.getElementById('typing-cursor');
  const text = "Sylco™";
  let i = 0;
  
  function type() {
    if (i < text.length) {
      textElement.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, 150);
    } else {
      cursorElement.style.animation = 'blink 1s infinite';
    }
  }
  
  setTimeout(type, 500);
}

document.addEventListener('DOMContentLoaded', typeWriter);