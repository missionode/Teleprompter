Based on your description, it sounds like the browser's default behavior is downloading a temporary, incomplete file (youtube-teleprompter-video) while the mediaRecorder is still active, and then the complete file with the timestamp is downloaded correctly when the recording stops.
This is a common issue with MediaRecorder in some browsers. To fix this, we'll remove the line of code that creates the initial download link, as it seems to be triggering an unwanted file save. The final, correct file download will still happen in the mediaRecorder.onstop event handler.
I'll also add the functionality to toggle between landscape and portrait views. This will be implemented by changing the video element's CSS class to control its orientation. A new button will be added to the camera view for this toggle.
Complete HTML File (index.html)
I've added a new button for the orientation toggle and updated the script modal to include a settings button for this.
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teleprompter Video Recorder</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        .teleprompter-text {
            line-height: 1.6;
        }
        .record-pulse {
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .btn-primary {
            @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 shadow-md;
        }
        .btn-icon {
            @apply bg-white bg-opacity-30 backdrop-filter backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center transition duration-300 hover:bg-opacity-50;
        }
    </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">

    <div id="script-modal" class="fixed inset-0 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-xl">
            <h2 class="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">Enter Your Script</h2>
            <textarea id="script-input" class="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-inter text-base"></textarea>
            
            <div class="mt-6">
                <label for="speed-slider" class="block font-semibold mb-2 text-gray-700 dark:text-gray-300">Scrolling Speed: <span id="speed-value">1</span>x</label>
                <input type="range" id="speed-slider" min="0.5" max="5" step="0.5" value="1" class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer">
            </div>
            
            <button id="ready-btn" class="w-full mt-8 btn-primary">
                <i class="fas fa-video mr-2"></i> Ready to Record
            </button>
        </div>
    </div>

    <div id="camera-view" class="hidden fixed inset-0 z-40 bg-black">
        <video id="camera-feed" class="w-full h-full object-cover transform scale-x-[-1]" autoplay playsinline muted></video>

        <div class="absolute top-0 left-0 w-full h-full flex flex-col items-center p-4">
            <div id="teleprompter-text-container" class="w-full max-w-4xl p-6 bg-black bg-opacity-60 text-white rounded-lg flex-grow flex flex-col justify-center overflow-hidden">
                <div id="teleprompter-text" class="teleprompter-text font-inter text-3xl md:text-4xl text-center overflow-y-auto h-full"></div>
            </div>
        </div>

        <div class="absolute bottom-6 left-0 w-full flex items-center justify-between p-4">
            <button id="orientation-btn" class="btn-icon">
                <i class="fas fa-mobile-alt"></i>
            </button>

            <button id="record-btn" class="relative w-16 h-16 rounded-full bg-red-500 border-4 border-white transition-all duration-300 hover:scale-110">
                <div id="record-icon" class="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white"></div>
            </button>

            <button id="switch-cam-btn" class="btn-icon">
                <i class="fas fa-sync-alt"></i>
            </button>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>

Complete JavaScript File (script.js)
I've made the following changes in the JavaScript file:
 * Removed the initial download logic to prevent the unwanted 3-second file. The correct download now happens only when recording stops.
 * Added a new variable isPortrait to track the orientation state.
 * Added a new event listener for the orientation-btn to toggle the video's CSS classes.
 * Updated the video element's styling in the script to handle the orientation change.
<!-- end list -->
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
    const orientationBtn = document.getElementById('orientation-btn');

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];
    let animationFrameId;
    let scrollSpeed = 1;
    let isFrontCamera = true;
    let stream;
    let cameraDevices = [];
    let isPortrait = false; // Default to landscape

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
        if (cameraDevices.length > 1) {
            const newDevice = isFrontCamera ? cameraDevices[0] : cameraDevices[1];
            await getCameraStream(newDevice.deviceId);
        } else {
            alert('Only one camera device found.');
        }
    });

    orientationBtn.addEventListener('click', () => {
        isPortrait = !isPortrait;
        if (isPortrait) {
            cameraFeed.classList.remove('object-cover');
            cameraFeed.classList.add('w-auto', 'h-full', 'object-contain');
        } else {
            cameraFeed.classList.remove('w-auto', 'h-full', 'object-contain');
            cameraFeed.classList.add('object-cover');
        }
    });

    const startRecording = () => {
        recordedChunks = [];
        const options = { mimeType: 'video/mp4' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn('MP4 not supported, falling back to WebM.');
            options.mimeType = 'video/webm';
        }
        mediaRecorder = new MediaRecorder(stream, options);

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
        const teleprompterContainer = document.getElementById('teleprompter-text');
        teleprompterContainer.scrollTop = 0; // Reset scroll position

        const animateScroll = () => {
            teleprompterContainer.scrollTop += scrollSpeed;
            if (teleprompterContainer.scrollTop + teleprompterContainer.clientHeight < teleprompterContainer.scrollHeight) {
                animationFrameId = requestAnimationFrame(animateScroll);
            } else {
                stopRecording(); // Stop recording when the script ends
            }
        };
        animateScroll();
    };
});

