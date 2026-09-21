# MP3 Transcriber 🎵→📝

A web-based application that converts MP3 and other audio/video files into text transcripts using OpenAI's Whisper AI model. Handles large files (up to 500MB) and runs completely offline after the first setup.

<table>
<tr>
<td style="vertical-align: top;">

### 🌟 Features

- Drag & Drop Interface - Easy file uploads
- Large File Support - Up to 500MB files
- Multiple Formats - MP3, WAV, M4A, MP4, M4V, WEBM
- Offline Processing - No internet required after setup
- Language Selection - Auto-detect or pick from 26 languages
- Translate to English - Optional translation task
- Timestamps - Output with or without time markers
- Copy & Download - Save the transcript as a .txt file

</td>
<td style="vertical-align: top;">

### 🛠 Tech Stack

- **Backend:** Python, Flask, OpenAI Whisper, PyTorch
- **Frontend:** HTML5, CSS3, JavaScript
- **Audio Processing:** FFmpeg
- **Platform:** Cross-platform (Windows, macOS, Linux)

</td>
<td style="vertical-align: top;">

### 📋 Prerequisites

- **Python:** 3.8 or higher
- **FFmpeg:** Must be on your system PATH
- **Disk Space:** 2GB+ free (for the AI model)
- **RAM:** 4GB+ recommended

</td>
</tr>
</table>

---

# 🚀 Setup on a New Device

Follow these steps in order. They work on any machine — you do **not** need WSL.

## Step 1: Copy the project

Copy the **entire `mp3-transcriber` folder** to the new machine. Keep the folder structure intact:

```
mp3-transcriber/
├── app.py
├── requirements.txt
├── static/
│   ├── script.js
│   └── style.css
└── templates/
    └── index.html
```

> ⚠️ **Do not copy the `venv` folder.** A virtual environment hardcodes the absolute path of the machine it was created on, so a copied `venv` will fail on a new device (or even in a new folder on the same device). If a `venv` folder came along with the copy, delete it and create a fresh one in Step 3.

## Step 2: Install FFmpeg

Whisper needs FFmpeg to decode audio.

**Windows (PowerShell as Administrator):**
```powershell
winget install Gyan.FFmpeg
```
Close and reopen your terminal afterwards so the PATH change takes effect.

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu / Debian / WSL:**
```bash
sudo apt update && sudo apt install ffmpeg -y
```

Verify it worked:
```
ffmpeg -version
```
If this prints a version number, you're good. If it says "not recognized" or "command not found", FFmpeg is not on your PATH and transcription will fail.

## Step 3: Create a virtual environment

Open a terminal **inside the project folder** (the one containing `app.py`).

**Windows (PowerShell or CMD):**
```powershell
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux / WSL:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should now see `(venv)` at the start of your prompt. Keep it active for every command below.

> **Windows note:** if activation is blocked with a "running scripts is disabled" error, run this once in PowerShell, then try again:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

## Step 4: Install Python dependencies

```bash
pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

Installing the CPU-only build of PyTorch first keeps the download to roughly 200MB instead of several GB. If the machine has an NVIDIA GPU and you want to use it, skip that line and install the CUDA build from https://pytorch.org/get-started/locally/ instead.

## Step 5: Run the app

```bash
python app.py
```

Then open **http://127.0.0.1:5000** in a browser.

The very first transcription downloads the Whisper `base` model (~150MB). This happens once and is cached in your user folder, not in the project.

## Step 6: Use it

1. Drag an audio or video file onto the upload area (or click **Choose File**).
2. Pick a language, or leave it on **Auto Detect**.
3. Choose **Transcribe** (same language) or **Translate to English**.
4. Choose **With Timestamps** or **Plain Text**.
5. Click **Start Transcription** and wait — progress is printed in the terminal.
6. **Copy to Clipboard** or **Download Transcript** when it finishes.

---

# 🔧 Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `ModuleNotFoundError: No module named 'flask'` / `'whisper'` | The virtual environment isn't active, or dependencies aren't installed. Activate `venv` and re-run Step 4. |
| Activation fails, or `pip` points at a path from another machine | The `venv` was copied from another device or folder. Delete `venv` and redo Steps 3-4. |
| `FileNotFoundError: [WinError 2]` during transcription | FFmpeg isn't installed or isn't on PATH. Redo Step 2 and reopen the terminal. |
| `jinja2.exceptions.TemplateNotFound: index.html` | `app.py` was moved away from its `templates/` and `static/` folders. Keep the whole folder together. |
| `Port 5000 is in use` | Another app is using that port. Change the port in the last line of `app.py`, e.g. `app.run(debug=True, host='0.0.0.0', port=5001)`. |
| Transcription is very slow | Normal on CPU — roughly 1-2x realtime. A 1-hour file takes about 30-60 minutes on a typical laptop. |
| `FP16 is not supported on CPU; using FP32 instead` | Expected warning, not an error. Ignore it. |
| Page loads but nothing happens on upload | Hard-refresh the browser (Ctrl+Shift+R) to clear a cached `script.js`. |

---

# ⚡ Performance Notes

- First run downloads the AI model (~150MB) — be patient.
- Transcription speed on CPU is roughly 1-2x realtime.
- The `base` model is set in `app.py` (`whisper.load_model("base")`). Swapping it for `small` or `medium` improves accuracy but is noticeably slower; `tiny` is faster and less accurate.
- Maximum upload size is 500MB, set by `MAX_CONTENT_LENGTH` in `app.py`.

---

# 🔒 Before Sharing on a Network

`app.py` currently runs with `debug=True` and `host='0.0.0.0'`, which exposes Flask's interactive debugger to everyone on the network — and that debugger can execute code on the host machine. For local use only this is fine. If the app will be reachable by others, change the last lines of `app.py` to:

```python
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0')
```

---

# 📁 Project Structure

```
mp3-transcriber/
├── app.py              # Flask server + Whisper transcription logic
├── requirements.txt    # Python dependencies
├── .gitignore          # Excludes venv/
├── README.md           # This file
├── static/
│   ├── script.js       # Upload, transcription request, copy/download
│   └── style.css       # Styling
└── templates/
    └── index.html      # Web interface
```
