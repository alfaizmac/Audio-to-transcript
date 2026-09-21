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

# Whisper supported languages with their codes
WHISPER_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'hi': 'Hindi',
    'ar': 'Arabic',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'pl': 'Polish',
    'sv': 'Swedish',
    'fi': 'Finnish',
    'da': 'Danish',
    'no': 'Norwegian',
    'el': 'Greek',
    'cs': 'Czech',
    'ro': 'Romanian',
    'hu': 'Hungarian',
    'th': 'Thai',
    'id': 'Indonesian',
    'vi': 'Vietnamese'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def transcribe_with_whisper(file_path, language=None, task='transcribe'):
    """Transcribe audio using OpenAI Whisper with optional language specification"""
    try:
        print(f"Loading Whisper model...")
        
        # Use base model for faster processing
        model = whisper.load_model("base")
        
        print(f"Transcribing file: {file_path}")
        print(f"Language: {language if language else 'auto-detect'}")
        
        start_time = time.time()
        
        # Prepare transcription options
        options = {
            'verbose': False,
            'task': task  # 'transcribe' or 'translate'
        }
        
        # Add language if specified
        if language and language in WHISPER_LANGUAGES:
            options['language'] = language
        
        # Transcribe the audio
        result = model.transcribe(file_path, **options)
        
        end_time = time.time()
        
        print(f"Transcription completed in {end_time - start_time:.2f} seconds")
        print(f"Detected language: {result.get('language', 'unknown')}")
        
        # Extract segments with timestamps
        segments = []
        if "segments" in result:
            for segment in result["segments"]:
                segments.append({
                    "text": segment["text"].strip(),
                    "start": segment.get("start", 0),
                    "end": segment.get("end", 0)
                })
        else:
            # Fallback if no segments
            segments.append({
                "text": result.get("text", "").strip(),
                "start": 0,
                "end": 0
            })
        
        # Format transcript with timestamps
        formatted_transcript = format_transcript_with_timestamps(segments)
        
        # Add detected language info
        detected_lang = result.get('language', 'unknown')
        lang_name = WHISPER_LANGUAGES.get(detected_lang, detected_lang)
        
        return formatted_transcript, segments, detected_lang, lang_name, None
        
    except Exception as e:
        print(f"Error in transcribe_with_whisper: {str(e)}")
        return None, None, None, None, f"Whisper transcription failed: {str(e)}"

def format_transcript_with_timestamps(segments):
    """Format the transcript with timestamps"""
    formatted_lines = []
    
    for segment in segments:
        # Format timestamp (HH:MM:SS or MM:SS)
        start_time = format_time(segment["start"])
        end_time = format_time(segment["end"])
        formatted_lines.append(f"[{start_time} - {end_time}] {segment['text']}")
    
    return "\n\n".join(formatted_lines)

def format_time(seconds, include_ms=False):
    """Convert seconds to HH:MM:SS or MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    
    if include_ms:
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"
        else:
            return f"{minutes:02d}:{secs:06.3f}"
    else:
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{int(secs):02d}"
        else:
            return f"{minutes:02d}:{int(secs):02d}"

@app.route('/')
def index():
    return render_template('index.html', languages=WHISPER_LANGUAGES)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload MP3, WAV, M4A, MP4, M4V, or WEBM'}), 400
    
    # Get language and task from form data
    language = request.form.get('language', '').strip()
    if language == 'auto':
        language = None
    
    task = request.form.get('task', 'transcribe')
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.' + file.filename.rsplit('.', 1)[1].lower()) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        file_size = os.path.getsize(temp_path)
        print(f"Processing file: {file.filename}, Size: {file_size / (1024*1024):.2f} MB")
        print(f"Language setting: {language if language else 'auto-detect'}")
        print(f"Task: {task}")
        
        # Use Whisper for transcription
        formatted_transcript, segments, detected_lang, lang_name, error = transcribe_with_whisper(
            temp_path, 
            language=language,
            task=task
        )
        
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except:
            pass
        
        if error:
            return jsonify({'error': error}), 500
        
        # If transcript is empty, provide a helpful message
        if not formatted_transcript.strip():
            formatted_transcript = "No speech detected in the audio file. This might be due to:\n- Background noise only\n- Very low volume\n- No spoken content\n- Audio quality issues"
            segments = []
            detected_lang = 'unknown'
            lang_name = 'Unknown'
        
        return jsonify({
            'transcript': formatted_transcript,
            'segments': segments,
            'detected_language': detected_lang,
            'language_name': lang_name,
            'user_language': language if language else 'auto',
            'task': task,
            'file_size': f"{file_size / (1024*1024):.2f} MB",
            'message': 'Transcription completed successfully!'
        })
    
    except Exception as e:
        print(f"Error in transcribe route: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

# Error handler for file too large
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 500MB'}), 413

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')