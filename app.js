document.addEventListener('DOMContentLoaded', () => {
    const scriptInput = document.getElementById('script-input');
    const teleprompterText = document.getElementById('teleprompter-text');
    const teleprompterDisplay = document.getElementById('teleprompter-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const saveBtn = document.getElementById('save-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const speedSlider = document.getElementById('speed-slider');
    const sizeSlider = document.getElementById('size-slider');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    let isRunning = false;
    let isPaused = false;

    // Load settings from localStorage
    const savedSpeed = localStorage.getItem('teleprompterSpeed');
    const savedSize = localStorage.getItem('teleprompterSize');
    const savedTheme = localStorage.getItem('teleprompterTheme');

    if (savedSpeed) speedSlider.value = savedSpeed;
    if (savedSize) teleprompterText.style.fontSize = `${savedSize}px`;
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Function to start the teleprompter scroll
    const startTeleprompter = () => {
        const script = scriptInput.value.trim();
        if (!script) return;

        teleprompterText.innerHTML = script.replace(/\n/g, '<br>');
        teleprompterText.style.fontSize = `${sizeSlider.value}px`;
        
        // Reset and prepare for scrolling
        teleprompterText.style.transition = 'none';
        teleprompterText.style.transform = `translateY(${teleprompterDisplay.offsetHeight}px)`;
        
        // Force reflow to apply the reset
        teleprompterText.offsetHeight; 

        // Calculate scroll duration based on speed and content height
        const contentHeight = teleprompterText.offsetHeight;
        const containerHeight = teleprompterDisplay.offsetHeight;
        const totalDistance = contentHeight + containerHeight;
        const speedMultiplier = 10000; // Adjust for desired speed
        const duration = totalDistance / (speedSlider.value / 10 * speedMultiplier);

        // Apply the transition to start scrolling
        teleprompterText.style.transition = `transform ${duration}s linear`;
        teleprompterText.style.transform = `translateY(-${contentHeight}px)`;

        isRunning = true;
        isPaused = false;
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
    };

    // Function to pause the teleprompter
    const pauseTeleprompter = () => {
        if (!isRunning) return;

        const style = window.getComputedStyle(teleprompterText);
        const transformMatrix = new WebKitCSSMatrix(style.transform);
        const currentY = transformMatrix.m42;

        teleprompterText.style.transition = 'none';
        teleprompterText.style.transform = `translateY(${currentY}px)`;
        isPaused = true;
        pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    };

    // Function to resume the teleprompter
    const resumeTeleprompter = () => {
        if (!isPaused) return;

        const style = window.getComputedStyle(teleprompterText);
        const currentY = new WebKitCSSMatrix(style.transform).m42;
        const contentHeight = teleprompterText.offsetHeight;
        const remainingDistance = Math.abs(currentY) + contentHeight;
        
        const speedMultiplier = 10000;
        const remainingDuration = remainingDistance / (speedSlider.value / 10 * speedMultiplier);

        teleprompterText.style.transition = `transform ${remainingDuration}s linear`;
        teleprompterText.style.transform = `translateY(-${contentHeight}px)`;
        
        isPaused = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    };

    // Function to stop the teleprompter
    const stopTeleprompter = () => {
        isRunning = false;
        isPaused = false;
        teleprompterText.style.transition = 'none';
        teleprompterText.style.transform = `translateY(${teleprompterDisplay.offsetHeight}px)`;
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    };

    // Function to save the script
    const saveScript = () => {
        const text = scriptInput.value;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'teleprompter_script.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Event listeners
    startBtn.addEventListener('click', startTeleprompter);
    pauseBtn.addEventListener('click', () => {
        if (isPaused) {
            resumeTeleprompter();
        } else {
            pauseTeleprompter();
        }
    });
    stopBtn.addEventListener('click', stopTeleprompter);
    saveBtn.addEventListener('click', saveScript);

    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

    speedSlider.addEventListener('input', () => {
        localStorage.setItem('teleprompterSpeed', speedSlider.value);
    });

    sizeSlider.addEventListener('input', () => {
        teleprompterText.style.fontSize = `${sizeSlider.value}px`;
        localStorage.setItem('teleprompterSize', sizeSlider.value);
    });

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        const isDarkMode = body.classList.contains('dark');
        localStorage.setItem('teleprompterTheme', isDarkMode ? 'dark' : 'light');
        themeToggleBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
});
