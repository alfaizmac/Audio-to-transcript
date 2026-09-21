let currentFile = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('audioFile');
const fileInfo = document.getElementById('fileInfo');
const transcribeBtn = document.getElementById('transcribeBtn');
const languageSelect = document.getElementById('languageSelect');
const taskSelect = document.getElementById('taskSelect');

// Drag and drop functionality
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
        const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.m4v', '.webm'];
        const fileExt = '.' + file.name.toLowerCase().split('.').pop();
        
        if (file.type.startsWith('audio/') || validExtensions.includes(fileExt)) {
            currentFile = file;
            fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
            transcribeBtn.disabled = false;
        } else {
            showError('Please select a valid audio file (MP3, WAV, M4A, MP4, M4V, or WEBM)');
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
    
    // Get user settings
    const language = languageSelect.value;
    const task = taskSelect.value;
    const outputFormat = document.querySelector('input[name="outputFormat"]:checked').value;
    
    // Reset UI
    loading.style.display = 'block';
    loading.innerHTML = `
        <div class="spinner"></div>
        <p>Processing ${(currentFile.size / (1024*1024)).toFixed(2)} MB file...</p>
        <p>Language: ${language === 'auto' ? 'Auto-detecting' : languageSelect.options[languageSelect.selectedIndex].text}</p>
        <p>Task: ${task === 'transcribe' ? 'Transcription' : 'Translation to English'}</p>
        <p>This may take several minutes for large files.</p>
    `;
    result.style.display = 'none';
    error.style.display = 'none';
    transcribeBtn.disabled = true;

    const formData = new FormData();
    formData.append('audio', currentFile);
    formData.append('language', language);
    formData.append('task', task);

    try {
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Display transcript
            let transcriptText = data.transcript;
            
            // If user wants plain text, remove timestamps
            if (outputFormat === 'plain_text') {
                transcriptText = transcriptText.replace(/\[\d{2}:\d{2}:\d{2} - \d{2}:\d{2}:\d{2}\] /g, '')
                    .replace(/\[\d{2}:\d{2} - \d{2}:\d{2}\] /g, '');
            }
            
            document.getElementById('transcript').textContent = transcriptText;
            
            // Display result info
            const languageInfo = data.detected_language ? 
                `Detected Language: ${data.language_name} (${data.detected_language})` : 
                `Language: ${language === 'auto' ? 'Auto-detected' : languageSelect.options[languageSelect.selectedIndex].text}`;
            
            document.getElementById('resultInfo').innerHTML = `
                <p>${languageInfo}</p>
                <p>File Size: ${data.file_size} | Task: ${data.task}</p>
            `;
            
            result.style.display = 'block';
            showSuccess(data.message || 'Transcription completed successfully!');
            
            // Store data for download
            currentTranscriptData = {
                text: transcriptText,
                originalText: data.transcript,
                fileName: currentFile.name,
                language: data.language_name,
                detectedLanguage: data.detected_language,
                task: data.task,
                fileSize: data.file_size
            };
            
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

function downloadTranscript() {
    if (!currentTranscriptData) return;
    
    const format = document.querySelector('input[name="outputFormat"]:checked').value;
    const textToDownload = format === 'plain_text' ? 
        currentTranscriptData.text : 
        currentTranscriptData.originalText;
    
    // Create metadata header
    const metadata = `Audio Transcription Results
=======================
File: ${currentTranscriptData.fileName}
Language: ${currentTranscriptData.language} (${currentTranscriptData.detectedLanguage})
Task: ${currentTranscriptData.task}
File Size: ${currentTranscriptData.fileSize}
Generated: ${new Date().toLocaleString()}

`;
    
    const fullContent = metadata + textToDownload;
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const baseName = currentTranscriptData.fileName.replace(/\.[^/.]+$/, "");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    a.href = url;
    a.download = `${baseName}_transcript_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSuccess('Transcript downloaded!');
}

function resetForm() {
    currentFile = null;
    fileInput.value = '';
    fileInfo.textContent = 'No file selected';
    transcribeBtn.disabled = true;
    
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    
    // Reset settings to defaults
    languageSelect.value = 'auto';
    taskSelect.value = 'transcribe';
    document.querySelector('input[name="outputFormat"][value="with_timestamps"]').checked = true;
    
    showSuccess('Form reset. Ready for new transcription.');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'error';
    
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'success';
    
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize
resetForm();