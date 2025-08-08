document.addEventListener('DOMContentLoaded', () => {
    const scriptModal = document.getElementById('script-modal');
    const cameraView = document.getElementById('camera-view');
    const scriptInput = document.getElementById('script-input');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const readyBtn = document.getElementById('ready-btn');
    const cameraFeed = document.getElementById('camera-feed');
    const teleprompterText = document.getElementById('teleprompter-text');
    const recordBtn = document.getElementById('record-btn');
    const recordIcon = document.getElementById('record-icon');
    const switchCamBtn = document.getElementById('switch-cam-btn');

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];
    let animationFrameId;
    let scrollSpeed = 1;
    let isFrontCamera = true;
    let stream;
    let cameraDevices = [];

    // --- Modal & Settings Handlers ---
    speedSlider.addEventListener('input', (e) => {
        scrollSpeed = parseFloat(e.target.value);
        speedValue.textContent = scrollSpeed;
    });

    readyBtn.addEventListener('click', () => {
        if (scriptInput.value.trim() === '') {
            alert('Please enter a script.');
            return;
        }
        scriptModal.classList.add('hidden');
        cameraView.classList.remove('hidden');
        teleprompterText.innerHTML = scriptInput.value.replace(/\n/g, '<br>');
        startCamera();
    });

    // --- Camera & Recording Logic ---
    const getCameraStream = async (deviceId) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: deviceId ? { exact: deviceId } : undefined },
                audio: true,
            });
            cameraFeed.srcObject = stream;
        } catch (err) {
            console.error('Error accessing media devices.', err);
            alert('Could not access camera. Please check your permissions.');
        }
    };

    const getCameras = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraDevices = devices.filter(device => device.kind === 'videoinput');
    };

    const startCamera = async () => {
        await getCameras();
        if (cameraDevices.length > 0) {
            await getCameraStream(cameraDevices[0].deviceId);
        } else {
            alert('No camera devices found.');
        }
    };

    switchCamBtn.addEventListener('click', async () => {
        isFrontCamera = !isFrontCamera;
        await getCameras();
        if (cameraDevices.length > 0) {
            const newDevice = isFrontCamera ? cameraDevices[0] : cameraDevices[1] || cameraDevices[0];
            await getCameraStream(newDevice.deviceId);
        }
    });

    const startRecording = () => {
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            a.download = 'youtube-teleprompter-video.webm';
            a.click();
            window.URL.revokeObjectURL(url);
            alert('Video saved successfully!');
        };
        mediaRecorder.start();
        isRecording = true;
        recordBtn.classList.add('record-pulse');
        recordIcon.classList.remove('bg-white');
        recordIcon.classList.add('rounded-md', 'w-6', 'h-6', 'bg-red-500');
        startTeleprompterScroll();
    };

    const stopRecording = () => {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.classList.remove('record-pulse');
        recordIcon.classList.add('bg-white');
        recordIcon.classList.remove('rounded-md', 'w-6', 'h-6', 'bg-red-500');
        cancelAnimationFrame(animationFrameId);
    };

    recordBtn.addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    // --- Teleprompter Scrolling Logic ---
    const startTeleprompterScroll = () => {
        teleprompterText.scrollTop = 0; // Reset scroll position
        
        const animateScroll = () => {
            teleprompterText.scrollTop += scrollSpeed;
            if (teleprompterText.scrollTop + teleprompterText.clientHeight < teleprompterText.scrollHeight) {
                animationFrameId = requestAnimationFrame(animateScroll);
            } else {
                stopRecording(); // Stop recording when the script ends
            }
        };
        animateScroll();
    };
});
