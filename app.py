#!/usr/bin/env python3
"""
Instagram Video Downloader - Backend Flask
Permet de télécharger des vidéos Instagram en meilleure résolution disponible
avec ou sans son.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import subprocess
import os
import re
import json
import tempfile
import zipfile
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuration
DOWNLOADS_DIR = os.path.expanduser("~/Downloads")


def get_cookie_args():
    """Retourne les arguments yt-dlp pour l'authentification Chrome."""
    return ['--cookies-from-browser', 'chrome']


def get_story_args(url):
    """Si l'URL cible une story spécifique, retourne --no-playlist."""
    if re.search(r'/stories/[^/]+/\d+', url):
        return ['--no-playlist']
    return []


def detect_media_type(url):
    """Détecte si l'URL est une image ou une vidéo et retourne (type, metadata)."""
    cmd = ['yt-dlp'] + get_cookie_args() + get_story_args(url) + ['--ignore-no-formats-error', '--dump-json', url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            first_line = result.stdout.strip().split('\n')[0]
            info = json.loads(first_line)
            vcodec = info.get('vcodec', 'none')
            if vcodec == 'none' or vcodec is None:
                return 'image', info
            return 'video', info
    except Exception:
        pass
    return 'video', None


def strip_metadata(filepath):
    """Supprime les métadonnées EXIF/XMP d'un fichier image."""
    try:
        subprocess.run(
            ['exiftool', '-all=', '-overwrite_original', filepath],
            capture_output=True, text=True, timeout=15
        )
    except Exception:
        pass


def download_image(url):
    """Télécharge une image Instagram via gallery-dl (haute résolution)."""
    try:
        result = subprocess.run(
            ['gallery-dl', '--cookies-from-browser', 'chrome', '--directory', '.', '-d', DOWNLOADS_DIR, url],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode == 0 and result.stdout.strip():
            filepath = result.stdout.strip().split('\n')[-1]
            strip_metadata(filepath)
            return True, os.path.basename(filepath)
        return False, result.stderr or "Échec du téléchargement"
    except Exception as e:
        return False, str(e)


@app.route('/update-cookies', methods=['POST'])
def update_cookies():
    """Teste l'accès aux cookies Chrome via yt-dlp"""
    try:
        result = subprocess.run(
            ['yt-dlp', '--cookies-from-browser', 'chrome', '--dump-json',
             'https://www.instagram.com/instagram/'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'Cookies Chrome OK - Authentification Instagram active'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Impossible de lire les cookies. Connectez-vous à Instagram dans Chrome.'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erreur: {str(e)}'
        }), 500


@app.route('/formats', methods=['POST'])
def get_formats():
    """
    Récupère tous les formats disponibles pour une URL Instagram
    """
    data = request.json
    url = data.get('url', '').strip()
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    if 'instagram.com' not in url:
        return jsonify({'error': 'Invalid Instagram URL'}), 400

    cmd = ['yt-dlp'] + get_cookie_args() + get_story_args(url) + ['-F', url]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'formats': result.stdout
            })
        else:
            return jsonify({
                'success': False,
                'error': result.stderr or 'Unknown error'
            }), 500
            
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Request timeout (30s)'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/download', methods=['POST'])
def download_media():
    """
    Télécharge une vidéo ou image Instagram
    """
    data = request.json
    url = data.get('url', '').strip()
    with_audio = data.get('withAudio', True)

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    if 'instagram.com' not in url:
        return jsonify({'error': 'Invalid Instagram URL'}), 400

    media_type, info = detect_media_type(url)

    # --- Image : téléchargement via gallery-dl (haute résolution) ---
    if media_type == 'image':
        success, detail = download_image(url)
        if success:
            return jsonify({
                'success': True,
                'message': '✅ Image téléchargée avec succès',
                'mediaType': 'image',
                'details': detail
            })
        else:
            return jsonify({'success': False, 'error': detail}), 500

    # --- Vidéo : yt-dlp avec re-encodage H.264 ---
    cmd = ['yt-dlp'] + get_cookie_args() + get_story_args(url)

    if with_audio:
        cmd.extend([
            '-f', 'bestvideo+bestaudio/best',
            '--merge-output-format', 'mp4',
            '--ppa', 'ffmpeg:-c:v libx264 -crf 18 -preset fast -c:a aac -map_metadata -1'
        ])
    else:
        cmd.extend([
            '-f', 'bestvideo',
            '--recode-video', 'mp4',
            '--ppa', 'VideoConvertor+ffmpeg_o:-c:v libx264 -crf 18 -preset fast -map_metadata -1',
            '--no-audio'
        ])

    cmd.extend([
        '-o', '%(upload_date)s_%(title)s_%(uploader)s.%(ext)s',
        '--progress',
        url
    ])

    try:
        result = subprocess.run(
            cmd,
            cwd=DOWNLOADS_DIR,
            capture_output=True,
            text=True,
            timeout=600
        )

        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': '✅ Vidéo téléchargée avec succès',
                'mediaType': 'video',
                'withAudio': with_audio,
                'details': result.stderr[-500:] if result.stderr else ''
            })
        else:
            error_msg = result.stderr or result.stdout or 'Unknown error'
            return jsonify({
                'success': False,
                'error': error_msg[-500:]
            }), 500

    except subprocess.TimeoutExpired:
        return jsonify({
            'error': 'Download timeout: File too large or connection too slow'
        }), 500
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500


@app.route('/split-video', methods=['POST'])
def split_video():
    """Découpe une vidéo en N morceaux égaux via ffmpeg, sauvegarde dans ~/Downloads."""
    if 'video' not in request.files:
        return jsonify({'error': 'Aucun fichier vidéo envoyé'}), 400

    video_file = request.files['video']
    parts = request.form.get('parts', '2')

    try:
        parts = int(parts)
        if not 2 <= parts <= 10:
            raise ValueError
    except ValueError:
        return jsonify({'error': 'Nombre de morceaux invalide (2-10)'}), 400

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, video_file.filename)
        video_file.save(input_path)

        # Obtenir la durée avec ffprobe
        probe = subprocess.run(
            ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1', input_path],
            capture_output=True, text=True, timeout=30
        )
        if probe.returncode != 0 or not probe.stdout.strip():
            return jsonify({'error': 'Impossible de lire la durée de la vidéo'}), 500

        duration = float(probe.stdout.strip())
        part_duration = duration / parts
        base_name = Path(video_file.filename).stem
        ext = Path(video_file.filename).suffix or '.mp4'

        # Découper avec ffmpeg et sauvegarder dans ~/Downloads
        created_files = []
        for i in range(parts):
            start = i * part_duration
            out_name = f"{base_name}_part{i + 1}{ext}"
            out_path = os.path.join(DOWNLOADS_DIR, out_name)

            cmd = [
                'ffmpeg', '-y', '-i', input_path,
                '-ss', f'{start:.3f}', '-t', f'{part_duration:.3f}',
                '-c', 'copy', '-avoid_negative_ts', '1',
                out_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                return jsonify({'error': f'Erreur ffmpeg partie {i+1}: {result.stderr[-300:]}'}), 500

            file_size = os.path.getsize(out_path)
            created_files.append({
                'name': out_name,
                'size': file_size,
                'start': round(start, 1),
                'duration': round(part_duration, 1)
            })

        return jsonify({
            'success': True,
            'totalDuration': round(duration, 1),
            'parts': parts,
            'files': created_files
        })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok'
    })


@app.route('/', methods=['GET'])
def index():
    """Serve the frontend"""
    return send_file('index.html', mimetype='text/html')


if __name__ == '__main__':
    # Créer le répertoire s'il n'existe pas
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    
    print("=" * 60)
    print("🎬 Instagram Video Downloader")
    print("=" * 60)
    print(f"✅ Server running at: http://localhost:8080")
    print(f"📂 Downloads folder: {DOWNLOADS_DIR}")
    print(f"🍪 Cookies: Chrome browser")
    print("=" * 60)
    
    app.run(host='0.0.0.0', debug=True, port=8080, use_reloader=False)
