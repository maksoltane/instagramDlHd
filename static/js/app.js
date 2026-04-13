const urlInput = document.getElementById('url');
const withAudioCheckbox = document.getElementById('withAudio');
const output = document.getElementById('output');
const loader = document.getElementById('loader');
const btnDownload = document.getElementById('btnDownload');
const btnFormats = document.getElementById('btnFormats');
const btnCookies = document.getElementById('btnCookies');

const API_BASE = '';
let downloadInProgress = false;

function toggleAudio() {
    withAudioCheckbox.checked = !withAudioCheckbox.checked;
}

function showOutput(message, type = 'info') {
    output.textContent = message;
    output.className = 'output ' + type;
}

function showLoader(show) {
    loader.style.display = show ? 'block' : 'none';
}

function setButtonsDisabled(disabled) {
    btnDownload.disabled = disabled;
    btnFormats.disabled = disabled;
    btnCookies.disabled = disabled;
}

function validateUrl(url) {
    if (!url.trim()) {
        showOutput('Veuillez entrer une URL Instagram', 'error');
        return false;
    }

    if (!url.includes('instagram.com')) {
        showOutput('URL invalide. Utilisez une URL Instagram valide', 'error');
        return false;
    }

    return true;
}

async function updateCookies() {
    showLoader(true);
    setButtonsDisabled(true);

    try {
        const response = await fetch(`${API_BASE}/update-cookies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
            showOutput(`${data.message}\n\nVous pouvez telecharger des stories et videos privees.`, 'success');
        } else {
            showOutput(`${data.error}\n\nConnectez-vous a Instagram dans Chrome puis reessayez.`, 'error');
        }
    } catch (error) {
        showOutput(`Erreur de connexion au serveur:\n${error.message}`, 'error');
    } finally {
        showLoader(false);
        setButtonsDisabled(false);
    }
}

async function getFormats() {
    const url = urlInput.value.trim();
    if (!validateUrl(url)) return;

    showLoader(true);
    setButtonsDisabled(true);

    try {
        const response = await fetch(`${API_BASE}/formats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const formatsText = data.formats
                .split('\n')
                .slice(0, 30)
                .join('\n');
            showOutput(`Formats disponibles:\n\n${formatsText}`, 'info');
        } else {
            showOutput(`Erreur:\n${data.error || 'Impossible de recuperer les formats'}`, 'error');
        }
    } catch (error) {
        showOutput(`Erreur de connexion:\n${error.message}`, 'error');
    } finally {
        showLoader(false);
        setButtonsDisabled(false);
    }
}

async function downloadVideo() {
    const url = urlInput.value.trim();
    if (!validateUrl(url)) return;

    if (downloadInProgress) {
        showOutput('Un telechargement est deja en cours...', 'info');
        return;
    }

    downloadInProgress = true;
    showLoader(true);
    setButtonsDisabled(true);

    const withAudio = withAudioCheckbox.checked;

    try {
        showOutput('Telechargement en cours...\n\nVeuillez patienter...', 'info');

        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                withAudio
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            let details = '';
            if (data.mediaType === 'image') {
                details = 'Type: Image haute resolution';
            } else {
                const audioText = withAudio ? 'audio + video fusionnes' : 'video seule';
                details = `Format: ${audioText}`;
            }

            // Afficher le message de succès
            output.className = 'output success';
            output.innerHTML = '';

            // Miniature si disponible
            if (data.thumbnail) {
                const thumbContainer = document.createElement('div');
                thumbContainer.style.cssText = 'text-align:center;margin-bottom:12px;';
                const img = document.createElement('img');
                img.src = `/thumbnail/${data.thumbnail}`;
                img.alt = 'Miniature';
                img.style.cssText = 'max-width:200px;max-height:150px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);';
                thumbContainer.appendChild(img);
                output.appendChild(thumbContainer);
            }

            const text = document.createElement('pre');
            text.style.cssText = 'margin:0;white-space:pre-wrap;font:inherit;';
            text.textContent = `${data.message}\n\nFichier sauvegarde dans: ~/Downloads\n${details}\nVerifiez votre dossier Downloads`;
            output.appendChild(text);

            setTimeout(() => {
                showOutput('Pret pour un nouveau telechargement !', 'info');
            }, 8000);
        } else {
            const errorMsg = data.error || 'Erreur inconnue';
            showOutput(
                `Erreur lors du telechargement:\n\n${errorMsg}`,
                'error'
            );
        }
    } catch (error) {
        showOutput(
            `Erreur de connexion:\n${error.message}\n\n` +
            `Assurez-vous que le serveur Flask est lance:\n` +
            `python app.py`,
            'error'
        );
    } finally {
        showLoader(false);
        setButtonsDisabled(false);
        downloadInProgress = false;
    }
}

// Raccourci clavier: Entree pour telecharger
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        downloadVideo();
    }
});

// Affichage initial
showOutput('Pret ! Entrez une URL Instagram (video, reel, story ou image) et cliquez sur "Telecharger"', 'info');

// ===== TABS =====
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (tab === 'download' && i === 0) || (tab === 'splitter' && i === 1));
    });
    document.getElementById('tab-download').classList.toggle('active', tab === 'download');
    document.getElementById('tab-splitter').classList.toggle('active', tab === 'splitter');
}

// ===== VIDEO SPLITTER =====
const fileDrop = document.getElementById('fileDrop');
const videoFileInput = document.getElementById('videoFileInput');
const fileListEl = document.getElementById('fileList');
const splitOutput = document.getElementById('splitOutput');
const btnSplit = document.getElementById('btnSplit');
let videoFiles = []; // { file, parts, status, result }

function formatSize(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo';
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}m${s.toString().padStart(2, '0')}s` : `${s}s`;
}

function addFiles(files) {
    for (const f of files) {
        if (f.type.startsWith('video/')) {
            videoFiles.push({ file: f, parts: 2, status: 'pending', result: null, error: null });
        }
    }
    renderFileList();
}

function removeFile(index, e) {
    e.stopPropagation();
    videoFiles.splice(index, 1);
    renderFileList();
}

function updateParts(index, parts, e) {
    e.stopPropagation();
    videoFiles[index].parts = parseInt(parts);
}

function toggleAccordion(index) {
    const el = document.getElementById(`file-item-${index}`);
    el.classList.toggle('open');
}

function renderFileList() {
    fileListEl.innerHTML = '';
    btnSplit.style.display = videoFiles.length > 0 ? 'block' : 'none';
    fileDrop.classList.toggle('has-file', videoFiles.length > 0);

    videoFiles.forEach((item, i) => {
        const statusIcon = { pending: '', processing: '...', done: 'OK', error: 'ERR' }[item.status];
        const itemClass = item.status === 'done' ? 'done' : item.status === 'error' ? 'error' : '';
        const isOpen = item.status === 'done' || item.status === 'error' ? 'open' : '';

        let bodyContent = '';
        if (item.status === 'done' && item.result) {
            bodyContent = item.result.files.map((f, j) => `
                <div class="part-row">
                    ${f.thumbnail ? `<img class="part-row-thumb" src="/thumbnail/${f.thumbnail}" alt="Miniature">` : `<span class="part-row-icon">&#128196;</span>`}
                    <span class="part-row-name">${f.name}</span>
                    <span class="part-row-info">${formatSize(f.size)}</span>
                    <span class="part-row-info">${formatTime(f.start)} &rarr; ${formatTime(f.start + f.duration)}</span>
                </div>
            `).join('');
        } else if (item.status === 'error') {
            bodyContent = `<div class="file-item-error">${item.error}</div>`;
        } else if (item.status === 'processing') {
            bodyContent = `<div class="file-item-placeholder">Decoupage en cours...</div>`;
        } else {
            bodyContent = `<div class="file-item-placeholder">Cliquez sur "Decouper" pour lancer le traitement</div>`;
        }

        const div = document.createElement('div');
        div.className = `file-item ${itemClass} ${isOpen}`;
        div.id = `file-item-${i}`;
        div.innerHTML = `
            <div class="file-item-header" onclick="toggleAccordion(${i})">
                <span class="file-item-chevron">&#9654;</span>
                <span class="file-item-status">${statusIcon}</span>
                <span class="file-item-name" title="${item.file.name}">${item.file.name}</span>
                <span class="file-item-size">${formatSize(item.file.size)}</span>
                <select onclick="event.stopPropagation()" onchange="updateParts(${i}, this.value, event)" ${item.status !== 'pending' ? 'disabled' : ''}>
                    ${[2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}" ${n === item.parts ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
                ${item.status === 'pending' ? `<button class="file-item-remove" onclick="removeFile(${i}, event)" title="Retirer">&times;</button>` : ''}
            </div>
            <div class="file-item-body">
                <div class="file-item-body-inner">${bodyContent}</div>
            </div>
        `;
        fileListEl.appendChild(div);
    });
}

videoFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        addFiles(e.target.files);
        videoFileInput.value = '';
    }
});

fileDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDrop.classList.add('dragover');
});

fileDrop.addEventListener('dragleave', () => {
    fileDrop.classList.remove('dragover');
});

fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.classList.remove('dragover');
    addFiles(e.dataTransfer.files);
});

async function splitAllVideos() {
    if (videoFiles.length === 0) return;

    btnSplit.disabled = true;
    splitOutput.textContent = `Decoupage de ${videoFiles.length} video(s)...`;
    splitOutput.className = 'output info';

    let successCount = 0;

    for (let i = 0; i < videoFiles.length; i++) {
        const item = videoFiles[i];
        if (item.status === 'done') { successCount++; continue; }

        item.status = 'processing';
        renderFileList();

        splitOutput.textContent = `Traitement ${i + 1}/${videoFiles.length} : ${item.file.name} (${item.parts} morceaux)...`;

        try {
            const formData = new FormData();
            formData.append('video', item.file);
            formData.append('parts', item.parts);

            const response = await fetch(`${API_BASE}/split-video`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erreur serveur');
            }

            const data = await response.json();
            item.status = 'done';
            item.result = data;
            successCount++;

        } catch (err) {
            console.error(err);
            item.status = 'error';
            item.error = err.message;
        }

        renderFileList();
    }

    splitOutput.textContent = `Termine ! ${successCount}/${videoFiles.length} video(s) decoupee(s) - fichiers dans ~/Downloads`;
    splitOutput.className = successCount === videoFiles.length ? 'output success' : 'output info';
    btnSplit.disabled = false;
}
