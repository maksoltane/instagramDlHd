#!/bin/bash

# Script d'installation et démarrage pour Instagram Downloader

set -e

echo "========================================"
echo "📥 Instagram Downloader"
echo "========================================"
echo ""

# Déterminer le système
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ macOS détecté"
    PYTHON_CMD="python3"
else
    echo "ℹ️ Linux/autres détecté"
    PYTHON_CMD="python3"
fi

# Vérifier que Python 3 est installé
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    echo "Installez Python 3 depuis https://www.python.org/"
    exit 1
fi

echo "✅ Python trouvé: $($PYTHON_CMD --version)"
echo ""

# Vérifier que yt-dlp est installé
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️ yt-dlp n'est pas installé"
    echo "Installation de yt-dlp..."
    pip install yt-dlp
else
    echo "✅ yt-dlp trouvé"
fi

echo ""

# Vérifier que Flask est installé
echo "📦 Vérification des dépendances Python..."

# Créer un venv si nécessaire
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    $PYTHON_CMD -m venv venv
fi

# Activer le venv
source venv/bin/activate

# Installer les dépendances
echo "📦 Installation des dépendances..."
pip install -q flask flask-cors gallery-dl

echo ""
echo "========================================"
echo "✅ Installation terminée !"
echo "========================================"
echo ""
echo "🚀 Démarrage du serveur..."
echo ""
echo "Ouvrez votre navigateur:"
echo "👉 http://localhost:8080"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Lancer l'application
$PYTHON_CMD app.py
