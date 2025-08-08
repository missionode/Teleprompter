document.addEventListener('DOMContentLoaded', () => {
    const mainUi = document.getElementById('main-ui');
    const teleprompterView = document.getElementById('teleprompter-view');
    const teleprompterText = document.getElementById('teleprompter-text');
    const scriptInput = document.getElementById('script-input');

    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const downloadBtn = document.getElementById('download-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');
    const fontFamilySelect = document.getElementById('font-family-select');
    const themeToggle = document.getElementById('theme-toggle');
    const mirrorToggle = document.getElementById('mirror-toggle');

    let isPlaying = false;
    let isPaused = false;
    let scrollSpeed = parseFloat(localStorage.getItem('scrollSpeed')) || 1;
    let fontSize = parseFloat(localStorage.getItem('fontSize')) || 2;
    let fontFamily = localStorage.getItem('fontFamily') || 'Inter, sans-serif';
    let isDarkTheme = localStorage.getItem('theme') === 'dark';
    let isMirrored = localStorage.getItem('isMirrored') === 'true';
    let animationFrameId;

    // --- State and UI Initialization ---
    const applySettings = () => {
        // Apply font size and family
        teleprompterText.style.fontSize = `${fontSize}rem`;
        teleprompterText.style.fontFamily = fontFamily;
        scriptInput.style.fontFamily = fontFamily;
        
        // Apply theme
        document.body.classList.toggle('dark', isDarkTheme);
        document.body.classList.toggle('bg-gray-100', !isDarkTheme);
        document.body.classList.toggle('bg-gray-900', isDarkTheme);
        document.body.classList.toggle('text-gray-800', !isDarkTheme);
        document.body.classList.toggle('text-gray-200', isDarkTheme);
        themeToggle.classList.toggle('bg-blue-500', isDarkTheme);
        themeToggle.classList.toggle('bg-gray-200', !isDarkTheme);
        themeToggle.firstElementChild.style.transform = isDarkTheme ? 'translateX(1.25rem)' : 'translateX(0)';

        // Apply mirror mode
        teleprompterText.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
        mirrorToggle.classList.toggle('bg-blue-500', isMirrored);
        mirrorToggle.classList.toggle('bg-gray-200', !isMirrored);
        mirrorToggle.firstElementChild.style.transform = isMirrored ? 'translateX(1.25rem)' : 'translateX(0)';
    
        // Update slider values
        speedSlider.value = scrollSpeed;
        speedValue.textContent = scrollSpeed;
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = `${fontSize}rem`;
        fontFamilySelect.value = fontFamily;
    };

    applySettings();

    // --- Teleprompter Logic ---
    const animateScroll = () => {
        if (!isPaused) {
            teleprompterView.scrollTop += scrollSpeed;
            if (teleprompterView.scrollTop + teleprompterView.clientHeight >= teleprompterView.scrollHeight) {
                // Stop scrolling at the end
                isPlaying = false;
                pauseBtn.firstElementChild.classList.replace('fa-pause', 'fa-play');
                return;
            }
        }
        animationFrameId = requestAnimationFrame(animateScroll);
    };

    const startTeleprompter = () => {
        if (!isPlaying) {
            isPlaying = true;
            isPaused = false;
            mainUi.classList.add('hidden');
            teleprompterView.classList.remove('hidden');
            teleprompterText.innerHTML = `<pre class="whitespace-pre-wrap">${scriptInput.value}</pre>`;
            teleprompterView.scrollTop = 0;
            pauseBtn.firstElementChild.classList.replace('fa-play', 'fa-pause');
            animateScroll();
        }
    };

    const stopTeleprompter = () => {
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);
        mainUi.classList.remove('hidden');
        teleprompterView.classList.add('hidden');
    };

    const togglePause = () => {
        isPaused = !isPaused;
        pauseBtn.firstElementChild.classList.toggle('fa-pause', !isPaused);
        pauseBtn.firstElementChild.classList.toggle('fa-play', isPaused);
    };

    // --- Event Listeners ---
    startBtn.addEventListener('click', startTeleprompter);
    stopBtn.addEventListener('click', stopTeleprompter);
    pauseBtn.addEventListener('click', togglePause);

    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

    speedSlider.addEventListener('input', (e) => {
        scrollSpeed = parseFloat(e.target.value);
        speedValue.textContent = scrollSpeed;
        localStorage.setItem('scrollSpeed', scrollSpeed);
    });

    fontSizeSlider.addEventListener('input', (e) => {
        fontSize = parseFloat(e.target.value);
        fontSizeValue.textContent = `${fontSize}rem`;
        localStorage.setItem('fontSize', fontSize);
        teleprompterText.style.fontSize = `${fontSize}rem`;
    });

    fontFamilySelect.addEventListener('change', (e) => {
        fontFamily = e.target.value;
        localStorage.setItem('fontFamily', fontFamily);
        teleprompterText.style.fontFamily = fontFamily;
        scriptInput.style.fontFamily = fontFamily;
    });

    themeToggle.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
        applySettings();
    });

    mirrorToggle.addEventListener('click', () => {
        isMirrored = !isMirrored;
        localStorage.setItem('isMirrored', isMirrored);
        applySettings();
    });

    // File Download
    downloadBtn.addEventListener('click', () => {
        const scriptText = scriptInput.value;
        const blob = new Blob([scriptText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'script.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
