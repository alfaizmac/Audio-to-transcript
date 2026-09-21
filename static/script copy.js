let currentFile = null;

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('audioFile');
const fileInfo = document.getElementById('fileInfo');
const transcribeBtn = document.getElementById('transcribeBtn');

// Drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    uploadArea.classList.add('dragover');
}

function unhighlight() {
    uploadArea.classList.remove('dragover');
}

// Handle file drop
uploadArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle file input change
fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('audio/') || 
            file.name.toLowerCase().endsWith('.mp3') ||
            file.name.toLowerCase().endsWith('.wav') ||
            file.name.toLowerCase().endsWith('.m4a')) {
            
            currentFile = file;
            fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
            transcribeBtn.disabled = false;
        } else {
            showError('Please select a valid audio file (MP3, WAV, or M4A)');
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function transcribeAudio() {
    if (!currentFile) return;

    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    
    // Reset UI
    loading.style.display = 'block';
    loading.innerHTML = `
        <div class="spinner"></div>
        <p>Processing ${(currentFile.size / (1024*1024)).toFixed(2)} MB file...</p>
        <p>This may take several minutes for large files.</p>
    `;
    result.style.display = 'none';
    error.style.display = 'none';
    transcribeBtn.disabled = true;

    const formData = new FormData();
    formData.append('audio', currentFile);

    try {
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('transcript').textContent = data.transcript;
            result.style.display = 'block';
            showSuccess('Transcription completed successfully!');
        } else {
            showError(data.error || 'An error occurred during transcription');
        }
    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        loading.style.display = 'none';
        transcribeBtn.disabled = false;
    }
}

function copyTranscript() {
    const transcript = document.getElementById('transcript').textContent;
    navigator.clipboard.writeText(transcript).then(() => {
        showSuccess('Transcript copied to clipboard!');
    }).catch(err => {
        showError('Failed to copy transcript: ' + err);
    });
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'error';
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'success';
}