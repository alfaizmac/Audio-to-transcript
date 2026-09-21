# MP3 Transcriber 🎵→📝

A web-based application that converts MP3 and other audio files to text transcripts using OpenAI's Whisper AI model. Handles large files (up to 500MB) and works completely offline after setup.

<table>
<tr>
<td style="vertical-align: top;">

### 🌟 Features

- Drag & Drop Interface - Easy file uploads
- Large File Support - Up to 500MB files
- Multiple Formats - MP3, WAV, M4A, MP4, M4V, WEBM
- Offline Processing - No internet required after setup
- High Accuracy - Uses OpenAI Whisper AI model
- Responsive Design - Works on desktop and mobile
- Real-time Progress - See transcription status

</td>
<td style="vertical-align: top;">

### 🛠 Tech Stack

- **Backend:** Python, Flask, OpenAI Whisper, PyTorch
- **Frontend:** HTML5, CSS3, JavaScript
- **Audio Processing:** FFmpeg
- **Platform:** Cross-platform (Windows, Mac, Linux)

</td>
<td style="vertical-align: top;">

### 📋 Prerequisites

- **Windows:** WSL (Windows Subsystem for Linux)
- **Python:** 3.8 or higher
- **FFmpeg:** For audio processing
- **Disk Space:** 2GB+ free space (for AI models)

</td>
</tr>
</table>

# 🚀 Quick Setup

## Step 1: Install WSL (Windows Users Only)

Open PowerShell as Administrator and run:

powershell:

```
wsl --install
```

This installs Ubuntu Linux on Windows. Restart your computer when prompted.

## Step 2: Set Up the Project

Open WSL Ubuntu

```
# Navigate to your project

cd "/mnt/a/Q2Q technologies Video Editing/mp3-transcriber"

# Create virtual environment (if doesn't exist)

python3 -m venv venv

# Activate virtual environment

source venv/bin/activate
```

## Step 3: Install System Dependencies

bash:

```
# Update package list and install FFmpeg

sudo apt update
sudo apt install ffmpeg python3-full -y
```

## Step 4: Install Python Dependencies

bash:

```
# Make sure virtual environment is activated (you should see (venv))

pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install openai-whisper
pip install Flask ffmpeg-python
```

## Step 5: Run the Application

bash:

```
python app.py
```

# ⚡ Performance Notes

- First run will download the AI model (~150MB) - be patient!
- Transcription speed: ~1-2x realtime on CPU
- A 1-hour audio file takes approximately 2-5 minutes
- Expected warning: "FP16 is not supported on CPU; using FP32 instead" - This is normal!
