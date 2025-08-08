document.addEventListener('DOMContentLoaded', () => {
    const scriptInput = document.getElementById('script-input');
    const teleprompterText = document.getElementById('teleprompter-text');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const speedSlider = document.getElementById('speed-slider');
    const sizeSlider = document.getElementById('size-slider');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    let animationFrameId;
    let isPaused = false;
    let currentPosition = 0;
    let startTime;
    let scrollSpeed = 1; // Default speed
    let lastTimestamp = 0;
    const scrollStep = 0.5; // Controls the smoothness

    // Load settings from localStorage
    const savedSpeed = localStorage.getItem('teleprompterSpeed');
    const savedSize = localStorage.getItem('teleprompterSize');
    const savedTheme = localStorage.getItem('teleprompterTheme');

    if (savedSpeed) {
        speedSlider.value = savedSpeed;
        scrollSpeed = savedSpeed;
    }

    if (savedSize) {
        sizeSlider.value = savedSize;
        teleprompterText.style.fontSize = `${savedSize}px`;
    }

    if (savedTheme === 'dark') {
        body.classList.add('dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Scroll animation loop
    function animateScroll(timestamp) {
        if (!startTime) startTime = timestamp;
        if (isPaused) {
            lastTimestamp = timestamp;
            animationFrameId = requestAnimationFrame(animateScroll);
            return;
        }

        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        if (teleprompterText.offsetHeight < teleprompterText.parentElement.offsetHeight) {
             currentPosition += (scrollSpeed * scrollStep);
        } else {
             currentPosition += (scrollSpeed * scrollStep) * (teleprompterText.offsetHeight / teleprompterText.parentElement.offsetHeight);
        }
        
        teleprompterText.style.transform = `translateY(-${currentPosition}px)`;

        // Check if the scroll is finished
        if (currentPosition > teleprompterText.offsetHeight + teleprompterText.parentElement.offsetHeight) {
            stopTeleprompter();
            return;
        }

        animationFrameId = requestAnimationFrame(animateScroll);
    }

    // Event listeners for controls
    startBtn.addEventListener('click', () => {
        const script = scriptInput.value.trim();
        if (script) {
            teleprompterText.innerHTML = script.replace(/\n/g, '<br>');
            teleprompterText.style.fontSize = `${sizeSlider.value}px`;
            teleprompterText.style.transform = `translateY(${teleprompterText.parentElement.offsetHeight}px)`;
            currentPosition = -teleprompterText.parentElement.offsetHeight;
            isPaused = false;
            startTime = null;
            lastTimestamp = 0;
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            animationFrameId = requestAnimationFrame(animateScroll);
        }
    });

    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    });

    stopBtn.addEventListener('click', stopTeleprompter);

    function stopTeleprompter() {
        cancelAnimationFrame(animationFrameId);
        teleprompterText.style.transform = `translateY(0)`;
        isPaused = false;
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    // Event listeners for settings
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    speedSlider.addEventListener('input', (e) => {
        scrollSpeed = e.target.value;
        localStorage.setItem('teleprompterSpeed', scrollSpeed);
    });

    sizeSlider.addEventListener('input', (e) => {
        teleprompterText.style.fontSize = `${e.target.value}px`;
        localStorage.setItem('teleprompterSize', e.target.value);
    });

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        const isDarkMode = body.classList.contains('dark');
        localStorage.setItem('teleprompterTheme', isDarkMode ? 'dark' : 'light');
        themeToggleBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
});
