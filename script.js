const themeCheckbox = document.querySelector('#theme-checkbox');

if (themeCheckbox) {
  const setTheme = (isLight) => {
    document.documentElement.style.animation = 'themeTransition 0.6s ease';
    
    setTimeout(() => {
      if (isLight) {
        document.documentElement.classList.add('light');
        themeCheckbox.checked = true;
      } else {
        document.documentElement.classList.remove('light');
        themeCheckbox.checked = false;
      }
    }, 100);
    
    setTimeout(() => {
      document.documentElement.style.animation = '';
    }, 700);
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
  
  textElement.textContent = '';
  
  function type() {
    if (i < text.length) {
      textElement.textContent += text.charAt(i);
      i++;
      setTimeout(type, 150);
    }
  }
  
  setTimeout(type, 500);
}

function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 40;
  
  particlesContainer.innerHTML = '';
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    particle.style.left = `${Math.random() * 100}vw`;
    
    const size = Math.random() * 3 + 1;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    const duration = Math.random() * 15 + 10;
    particle.style.animationDuration = `${duration}s`;
    
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    particlesContainer.appendChild(particle);
  }
}

function setupMusicControls() {
  const musicToggle = document.getElementById('music-toggle');
  const bgMusic = document.getElementById('bg-music');
  const volumeSlider = document.getElementById('volume-slider');
  
  const savedVolume = localStorage.getItem('musicVolume');
  const savedPlayState = localStorage.getItem('musicEnabled');
  
  if (savedVolume) {
    const volume = parseFloat(savedVolume);
    bgMusic.volume = volume;
    volumeSlider.value = volume * 100;
  } else {
    // Default volume at 30%
    bgMusic.volume = 0.3;
    volumeSlider.value = 30;
  }
  
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    bgMusic.volume = volume;
    localStorage.setItem('musicVolume', volume.toString());
  });
  
  musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        musicToggle.classList.add('active');
        localStorage.setItem('musicEnabled', 'true');
      }).catch(error => {
        console.log('Autoplay prevented:', error);
        musicToggle.title = "Click to enable music (autoplay blocked)";
      });
    } else {
      bgMusic.pause();
      musicToggle.classList.remove('active');
      localStorage.setItem('musicEnabled', 'false');
    }
  });
  
  const musicEnabled = savedPlayState === 'true';
  if (musicEnabled) {
    bgMusic.play().then(() => {
      musicToggle.classList.add('active');
    }).catch(() => {
      document.addEventListener('click', () => {
        if (musicEnabled && bgMusic.paused) {
          bgMusic.play();
          musicToggle.classList.add('active');
        }
      }, { once: true });
    });
  }
}

// Sound effects for button hover
function setupSoundEffects() {
  let audioContext;
  
  function initAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  
  function createHoverSound(frequency = 440) {
    if (!audioContext || audioContext.state === 'suspended') {
      return;
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
  
  // Add hover sound to buttons
  document.querySelectorAll('.link-button').forEach((button, index) => {
    const frequencies = [440, 523.25, 659.25]; // Different notes for each button
    button.addEventListener('mouseenter', () => {
      initAudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      createHoverSound(frequencies[index % frequencies.length]);
    });
  });
  
  // Add hover sound to footer links
  document.querySelectorAll('.footer-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      initAudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      createHoverSound(349.23); // Lower frequency for footer links
    });
  });
  
  // Add click sound to theme toggle
  document.querySelector('.theme-switch').addEventListener('click', () => {
    initAudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = themeCheckbox.checked ? 523.25 : 392.00;
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  typeWriter();
  createParticles();
  setupMusicControls();
  setupSoundEffects();
});