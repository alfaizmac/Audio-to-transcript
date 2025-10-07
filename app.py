from flask import Flask, request, render_template, jsonify
import whisper
import os
import tempfile
import time

app = Flask(__name__)

# INCREASE MAX FILE SIZE - 500MB limit for large audio files
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a', 'mp4', 'm4v', 'webm'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def transcribe_with_whisper(file_path):
    """Transcribe audio using OpenAI Whisper (works offline)"""
    try:
        print(f"Loading Whisper model...")
        
        # Use base model for faster processing (options: tiny, base, small, medium, large)
        model = whisper.load_model("base")
        
        print(f"Transcribing file: {file_path}")
        
        # Transcribe the audio
        start_time = time.time()
        result = model.transcribe(file_path)
        end_time = time.time()
        
        print(f"Transcription completed in {end_time - start_time:.2f} seconds")
        
        # Return the transcribed text
        return result["text"], None
        
    except Exception as e:
        return None, f"Whisper transcription failed: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload MP3, WAV, M4A, MP4, M4V, or WEBM'}), 400
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.' + file.filename.rsplit('.', 1)[1].lower()) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        file_size = os.path.getsize(temp_path)
        print(f"Processing file: {file.filename}, Size: {file_size / (1024*1024):.2f} MB")
        
        # Use Whisper for transcription
        transcript, error = transcribe_with_whisper(temp_path)
        
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except:
            pass
        
        if error:
            return jsonify({'error': error}), 500
        
        # If transcript is empty, provide a helpful message
        if not transcript.strip():
            transcript = "No speech detected in the audio file. This might be due to:\n- Background noise only\n- Very low volume\n- No spoken content\n- Audio quality issues"
        
        return jsonify({
            'transcript': transcript,
            'file_size': f"{file_size / (1024*1024):.2f} MB",
            'message': 'Transcription completed successfully using Whisper!'
        })
    
    except Exception as e:
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

# Error handler for file too large
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 500MB'}), 413

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')