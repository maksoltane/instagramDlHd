# 📥 Instagram Video Downloader

Application web locale pour télécharger des vidéos Instagram en meilleure résolution disponible, avec ou sans son.

## ✨ Fonctionnalités

- ✅ Interface web moderne et intuitive
- 📺 Télécharge en meilleure résolution disponible
- 🔊 Option pour inclure/exclure le son
- 🍪 Importation automatique des cookies Chrome
- 📊 Affichage des formats disponibles
- ⚡ Exécution locale (aucun serveur externe)
- 🎨 Design responsive et attrayant

## 🛠️ Prérequis

### macOS
```bash
# Vérifier Python 3
python3 --version

# Installer yt-dlp
brew install yt-dlp

# Ou avec pip
pip install yt-dlp
```

### Linux
```bash
# Ubuntu/Debian
sudo apt install python3-pip

# Installer yt-dlp
pip install yt-dlp
```

### Windows
```bash
# Télécharger Python depuis https://www.python.org
# Puis:
pip install yt-dlp
```

## 📦 Installation

### 1. Clonez ou téléchargez les fichiers

```bash
# Créer le dossier
mkdir ~/Instagram-Downloader
cd ~/Instagram-Downloader
```

### 2. Placez les fichiers suivants dans le dossier :
- `app.py` (backend Flask)
- `index.html` (interface web)
- `run.sh` (script de démarrage)

### 3. Lancez le script de démarrage

```bash
chmod +x run.sh
./run.sh
```

**Ou manuellement :**

```bash
# Installer les dépendances
pip install flask flask-cors yt-dlp

# Lancer le serveur
python3 app.py
```

## 🚀 Utilisation

1. **Ouvrez votre navigateur** : `http://localhost:5000`

2. **Collez l'URL Instagram** de la vidéo que vous voulez télécharger

3. **Choisissez l'option audio** :
   - ✓ **Avec le son** : Meilleure qualité (fichier plus volumineux)
   - Sans le son : Vidéo seule (fichier léger)

4. **Cliquez sur "Télécharger"**

5. **Trouvez votre vidéo** dans `~/Downloads`

### Boutons disponibles

- **🔄 Importer Cookies** : Récupère vos cookies Chrome (pour les vidéos privées)
- **👁️ Voir formats** : Affiche tous les formats disponibles pour la vidéo
- **⬇️ Télécharger** : Lance le téléchargement

## 🍪 Gestion des Cookies

### Pour les vidéos privées ou protégées :

1. Cliquez sur **"🔄 Importer Cookies"**
2. Assurez-vous d'être **connecté à Instagram dans Chrome**
3. L'application importera automatiquement vos cookies

**Note** : Les cookies sont lus localement et stockés dans `~/Downloads/instagram_cookies.txt`

## 📁 Structure des fichiers

```
~/Instagram-Downloader/
├── app.py              # Backend Flask
├── index.html          # Interface web
├── run.sh             # Script de démarrage
└── venv/              # Environnement virtuel (créé automatiquement)

~/Downloads/
├── instagram_cookies.txt  # Cookies exportés (créé automatiquement)
└── videos...          # Vidéos téléchargées
```

## 🎬 Format de nommage

Les vidéos sont nommées selon le format :
```
[DATE]_[TITRE]_[CRÉATEUR].mp4
```

Exemple :
```
2025-02-10_Summer_Vibes_john_doe.mp4
```

## ⚙️ Options de configuration

### Modifier le dossier de destination

Éditez `app.py` ligne 13 :
```python
DOWNLOADS_DIR = os.path.expanduser("~/Downloads")  # Remplacez par votre chemin
```

### Changer le port

Éditez `app.py` dernière ligne :
```python
app.run(debug=True, port=5000)  # Changez le port ici
```

## 🐛 Dépannage

### Erreur : "yt-dlp: not found"
```bash
pip install yt-dlp
```

### Erreur : "Chrome cookies not found"
- Assurez-vous que Chrome est installé
- Essayez sans cookies (pour les vidéos publiques)

### Erreur : "Cannot access Chrome cookies"
- Fermez complètement Chrome
- Relancez l'application

### Erreur : "Connection refused"
- Vérifiez que le serveur Flask tourne : `python3 app.py`
- Vérifiez que le port 5000 n'est pas utilisé

### Aucun format FHD disponible
- Instagram compresse les vidéos selon leur type
- Les Reels peuvent être en 720×1280 maximum
- C'est une limitation d'Instagram, pas de l'application

## 🔒 Sécurité

- ✅ Aucun morceau de code du streaming n'est stocké
- ✅ Les cookies sont lus **localement uniquement**
- ✅ Aucune données ne quitte votre ordinateur
- ✅ Pas de serveur central
- ✅ L'application tourne sur votre machine

## 📝 Licence

Libre d'utilisation pour usage personnel

## ⚠️ Respect du droit d'auteur

Cette application est faite pour télécharger vos propres contenus ou du contenu libre d'utilisation.

**Respectez le droit d'auteur** et les conditions d'utilisation d'Instagram.

## 🆘 Support

### Vérifier le statut du serveur
```bash
curl http://localhost:5000/health
```

### Voir les logs
Consultez la console où vous avez lancé `python3 app.py`

### Réinitialiser
```bash
rm -rf venv
rm -f ~/Downloads/instagram_cookies.txt
./run.sh
```

## 📚 Ressources

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Instagram](https://www.instagram.com/)

## 🎯 Cas d'usage

- 📸 Télécharger vos propres posts
- 🎬 Sauvegarder des Reels publics
- 📹 Archiver des vidéos importantes
- 💾 Avoir une copie locale de vos contenus

## ✅ Checklist de démarrage

- [ ] Python 3 installé
- [ ] yt-dlp installé
- [ ] Flask installé (`pip install flask flask-cors`)
- [ ] Fichiers `app.py` et `index.html` placés
- [ ] Serveur lancé (`python3 app.py`)
- [ ] Navigateur à `http://localhost:5000`
- [ ] URL Instagram colée
- [ ] Téléchargement lancé
- [ ] Vidéo trouvée dans `~/Downloads`

## 🎉 Bon téléchargement !

Profitez de votre application Instagram Downloader locale ! 🚀
