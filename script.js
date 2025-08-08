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
    const flipBtn = document.getElementById('flip-btn');
    const hiddenCanvas = document.getElementById('hidden-canvas');
    const ctx = hiddenCanvas.getContext('2d');

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];
    let animationFrameId;
    let scrollSpeed = 1;
    let isFrontCamera = true;
    let stream;
    let cameraDevices = [];
    let isFlipped = false;
    let shouldSaveFlipped = false;

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
    
    // --- Camera & Manual Control Logic ---
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
        if (cameraDevices.length > 1) {
            const newDevice = isFrontCamera ? cameraDevices[0] : cameraDevices[1];
            await getCameraStream(newDevice.deviceId);
        } else {
            alert('Only one camera device found.');
        }
    });

    flipBtn.addEventListener('click', () => {
        isFlipped = !isFlipped;
        if (isFlipped) {
            cameraFeed.style.transform = 'scaleX(-1) scaleY(-1)';
            teleprompterText.style.transform = 'scaleY(-1)';
            flipBtn.classList.add('bg-blue-500');
        } else {
            cameraFeed.style.transform = 'scaleX(-1) scaleY(1)';
            teleprompterText.style.transform = 'scaleY(1)';
            flipBtn.classList.remove('bg-blue-500');
        }
        shouldSaveFlipped = isFlipped;
    });
    
    // --- Recording and Canvas Logic ---
    const startRecording = () => {
        recordedChunks = [];
        const options = { mimeType: 'video/mp4' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn('MP4 not supported, falling back to WebM.');
            options.mimeType = 'video/webm';
        }
        
        const canvasStream = hiddenCanvas.captureStream();
        mediaRecorder = new MediaRecorder(canvasStream, options);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `teleprompter-video-${timestamp}.${mediaRecorder.mimeType.split('/')[1]}`;
            
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
        drawCanvas();
    };

    const stopRecording = () => {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.classList.remove('record-pulse');
        recordIcon.classList.add('bg-white');
        recordIcon.classList.remove('rounded-md', 'w-6', 'h-6', 'bg-red-500');
        cancelAnimationFrame(animationFrameId);
        cancelAnimationFrame(drawCanvasAnimation);
    };

    recordBtn.addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    let drawCanvasAnimation;
    const drawCanvas = () => {
        const videoWidth = cameraFeed.videoWidth;
        const videoHeight = cameraFeed.videoHeight;
        hiddenCanvas.width = videoWidth;
        hiddenCanvas.height = videoHeight;

        ctx.clearRect(0, 0, videoWidth, videoHeight);

        // Apply flip transformation to the canvas if the "Flip" button is active
        if (shouldSaveFlipped) {
            ctx.save();
            ctx.translate(videoWidth / 2, videoHeight / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(cameraFeed, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
            ctx.restore();
        } else {
            ctx.drawImage(cameraFeed, 0, 0, videoWidth, videoHeight);
        }

        drawCanvasAnimation = requestAnimationFrame(drawCanvas);
    };

    // --- Teleprompter Scrolling Logic ---
    const startTeleprompterScroll = () => {
        const teleprompterContainer = document.getElementById('teleprompter-text');
        teleprompterContainer.scrollTop = 0;
        const animateScroll = () => {
            teleprompterContainer.scrollTop += scrollSpeed;
            if (teleprompterContainer.scrollTop + teleprompterContainer.clientHeight < teleprompterContainer.scrollHeight) {
                animationFrameId = requestAnimationFrame(animateScroll);
            } else {
                stopRecording();
            }
        };
        animateScroll();
    };
});
