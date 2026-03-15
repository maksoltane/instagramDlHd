# Prompt pour Claude Code - Application Web Instagram Downloader

## Objectif
Créer une application web locale (HTML/CSS/JS + Python Flask) qui permet de télécharger des vidéos Instagram en meilleure résolution disponible, avec option audio/vidéo séparée ou fusionnée.

## Architecture Technique

### Backend (Python Flask)
- **Framework** : Flask
- **Dépendances** : flask, yt-dlp, sqlite3, shutil
- **Port** : 5000
- **CORS** : Activé pour localhost

### Frontend (HTML/CSS/JS)
- **Interface** : Single Page Application
- **Design** : Modern, responsive, gradient background
- **Features** : 
  - Input URL
  - Checkbox "Avec son" (audio + vidéo fusionné vs vidéo seule)
  - Bouton "Voir les formats disponibles"
  - Bouton "Télécharger"
  - Bouton "Importer Cookies Chrome"
  - Zone de logs/résultats
  - Indicateur de progression

## Fonctionnalités Détaillées

### 1. Extraction des Cookies Chrome
- Lire la base de données Chrome Cookies (~/Library/Application Support/Google/Chrome/Default/Cookies)
- Exporter au format Netscape compatible yt-dlp
- Sauvegarder dans ~/Downloads/instagram_cookies.txt
- Permettre l'import manuel via bouton

### 2. Récupération des Formats
- Endpoint POST /formats
- Afficher tous les formats disponibles (résolution, codec, bitrate)
- Format JSON pour l'interface

### 3. Téléchargement de Vidéo
- Endpoint POST /download
- Paramètres :
  - url (string) : URL Instagram
  - withAudio (boolean) : inclure l'audio ou non
- Options selon withAudio :
  - True : `-f "bestvideo+bestaudio[ext=m4a]" --merge-output-format mp4`
  - False : `-f "bestvideo" --merge-output-format mp4` (vidéo seule)
- Nommage : `%(upload_date)s_%(title)s_%(uploader)s.%(ext)s`
- Répertoire destination : ~/Downloads
- Logs en temps réel (via streaming ou callback)

## Structure des Fichiers
```
~/Downloads/
├── app.py                    # Backend Flask
├── index.html                # Frontend
├── instagram_cookies.txt      # Cookies (généré automatiquement)
└── videos/                   # Dossier des téléchargements
```

## API Endpoints

### POST /update-cookies
Récupère les cookies Chrome et les exporte
**Response**: `{ "success": true, "message": "Cookies importés" }`

### POST /formats
Récupère la liste des formats disponibles
**Request**: `{ "url": "https://www.instagram.com/..." }`
**Response**: `{ "formats": "[JSON format list]" }`

### POST /download
Télécharge la vidéo
**Request**: 
```json
{
  "url": "https://www.instagram.com/p/...",
  "withAudio": true
}
```
**Response**: `{ "success": true, "message": "Téléchargement terminé", "filename": "..." }`

## UI/UX Requirements

### Layout
- Container central (max-width: 700px)
- Gradient background (violet/indigo)
- Carte blanche avec ombre
- Padding: 40px
- Mobile responsive

### Éléments
1. **Titre** : "📥 yt-dlp Instagram Downloader"
2. **Input URL** : placeholder="https://www.instagram.com/p/..."
3. **Checkbox** : "✓ Avec le son (audio + vidéo fusionné)"
   - Coché par défaut
   - Icône à côté
4. **Boutons** (flex layout horizontal) :
   - 🔄 Importer Cookies Chrome (gris)
   - 👁️ Voir formats (bleu clair)
   - ⬇️ Télécharger (bleu foncé/gradient)
5. **Loader** : Spinner animé + texte "Traitement..."
6. **Output Zone** : 
   - Background gris clair
   - Scrollable (max-height: 300px)
   - Monospace font
   - Codes couleur : vert (success), rouge (error), bleu (info)

### Animations
- Transition boutons au hover (translateY -2px)
- Spinner continu 1s
- Border color change au focus input

## Validation & Erreurs

### Validation
- URL non vide
- URL commence par https://www.instagram.com
- Afficher messages d'erreur clairs

### Gestion Erreurs
- Try/catch sur fetch
- Messages d'erreur yt-dlp
- Gestion timeout (30s)
- Vérifier existence cookies Chrome

## Notes de Sécurité
- Ne pas stocker mots de passe
- Cookies lus localement uniquement
- Exécution yt-dlp avec arguments échappés
- CORS restreint à localhost

## Technologies Spécifiques
- **Animation CSS** : keyframes pour spinner
- **Fetch API** : appels async/await
- **Flask** : render_json, jsonify
- **SQLite3** : lecture cookies
- **Subprocess** : exécution yt-dlp avec capture output

## Cas d'Usage Prioritaires
1. Utilisateur entre URL Instagram → voit formats → télécharge en meilleure qualité
2. Première utilisation → importe cookies Chrome → télécharge
3. Teste "Sans son" → obtient vidéo seule (léger)
4. Teste "Avec son" → obtient MP4 fusionné (qualité max)

## Spécifications Supplémentaires
- Faire 3 versions de boutons "Télécharger" selon le paramètre withAudio
- Affichage clair de la qualité sélectionnée
- Empêcher double-clic (bouton désactivé pendant le téléchargement)
- Auto-clear output après 10 secondes de succès
- Lire la doc yt-dlp pour format string correct
