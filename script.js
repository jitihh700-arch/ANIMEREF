// ANIMEREF - Application JavaScript

// État global
const AppState = {
    isAdmin: localStorage.getItem('animeRefAdmin') === 'true',
    videos: JSON.parse(localStorage.getItem('animeRefVideos')) || [],
    history: JSON.parse(localStorage.getItem('animeRefHistory')) || [],
    comments: JSON.parse(localStorage.getItem('animeRefComments')) || {},
    likes: JSON.parse(localStorage.getItem('animeRefLikes')) || {},
    currentVideoId: null,
    selectedVideos: new Set()
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Navigation
    initNavigation();
    
    // Bouton admin
    initAdminToggle();
    
    // Événements vidéo
    initVideoEvents();
    
    // Commentaires
    initComments();
    
    // Importation
    initImport();
    
    // Bibliothèque
    renderLibrary();
    
    // Historique
    renderHistory();
    
    // Mise à jour UI
    updateAdminUI();
    
    // Message de bienvenue
    showMessage('Bienvenue sur ANIMEREF !', 'success');
}

// Navigation
function initNavigation() {
    // Navigation principale
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.id.replace('nav-', '') + '-section';
            
            // Mettre à jour la navigation
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Afficher la section
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Navigation sidebar
    document.querySelector('.sidebar-item[data-section="home"]').addEventListener('click', function() {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById('nav-home').classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('home-section').classList.add('active');
    });
}

// Mode Admin
function initAdminToggle() {
    document.getElementById('admin-toggle').addEventListener('click', function() {
        AppState.isAdmin = !AppState.isAdmin;
        localStorage.setItem('animeRefAdmin', AppState.isAdmin);
        updateAdminUI();
        showMessage(AppState.isAdmin ? 'Mode admin activé' : 'Mode admin désactivé', 'success');
    });
}

function updateAdminUI() {
    const adminText = document.getElementById('admin-text');
    const deleteBtn = document.getElementById('delete-btn');
    const adminImport = document.getElementById('admin-import');
    const nonAdminMessage = document.getElementById('non-admin-message');
    const libraryControls = document.getElementById('library-controls');
    
    if (AppState.isAdmin) {
        adminText.textContent = 'Mode Admin (ON)';
        adminText.parentElement.style.color = '#f47521';
        deleteBtn.style.display = 'inline-flex';
        adminImport.style.display = 'block';
        nonAdminMessage.style.display = 'none';
        libraryControls.style.display = 'block';
    } else {
        adminText.textContent = 'Mode Admin';
        adminText.parentElement.style.color = '';
        deleteBtn.style.display = 'none';
        adminImport.style.display = 'none';
        nonAdminMessage.style.display = 'block';
        libraryControls.style.display = 'none';
    }
}

// Vidéo
function initVideoEvents() {
    const videoElement = document.getElementById('video-element');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const likeBtn = document.getElementById('like-btn');
    
    playBtn.addEventListener('click', () => {
        if (videoElement.src) {
            videoElement.play();
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        videoElement.pause();
    });
    
    deleteBtn.addEventListener('click', () => {
        if (AppState.currentVideoId && AppState.isAdmin) {
            deleteVideo(AppState.currentVideoId);
        }
    });
    
    likeBtn.addEventListener('click', () => {
        if (AppState.currentVideoId) {
            toggleLike(AppState.currentVideoId);
        }
    });
    
    // Quand la vidéo est lue
    videoElement.addEventListener('play', function() {
        if (AppState.currentVideoId) {
            updateVideoViews(AppState.currentVideoId);
            addToHistory(AppState.currentVideoId);
        }
    });
}

function loadVideo(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    const videoElement = document.getElementById('video-element');
    const noVideo = document.getElementById('no-video');
    const videoTitle = document.getElementById('video-title');
    const viewsCount = document.getElementById('views-count');
    
    AppState.currentVideoId = videoId;
    
    videoElement.src = video.url;
    videoElement.style.display = 'block';
    noVideo.style.display = 'none';
    videoTitle.textContent = video.title;
    viewsCount.textContent = video.views || 0;
    
    // Mettre à jour les likes
    updateLikeButton(videoId);
    
    // Charger les commentaires
    renderComments(videoId);
    
    // Lire automatiquement
    videoElement.play().catch(e => {
        console.log('Lecture automatique bloquée');
    });
}

// Bibliothèque
function renderLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    
    if (AppState.videos.length === 0) {
        libraryGrid.innerHTML = '<p class="empty-message">Aucune vidéo importée.</p>';
        return;
    }
    
    libraryGrid.innerHTML = '';
    
    AppState.videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.dataset.id = video.id;
        
        videoCard.innerHTML = `
            ${AppState.isAdmin ? `
                <div style="position: absolute; top: 10px; left: 10px;">
                    <input type="checkbox" class="video-checkbox" data-id="${video.id}" 
                           onchange="toggleVideoSelection('${video.id}')">
                </div>
            ` : ''}
            <div class="video-thumbnail" style="background: #000; height: 160px; display: flex; align-items: center; justify-content: center; color: #666;">
                <i class="fas fa-film" style="font-size: 40px;"></i>
            </div>
            <div class="video-card-content">
                <div class="video-card-title">${video.title}</div>
                <div class="video-card-details">
                    <span>${video.views || 0} vues</span>
                    <span>${video.date || 'Date inconnue'}</span>
                </div>
                ${AppState.isAdmin ? `
                    <div class="video-card-actions">
                        <button onclick="deleteVideo('${video.id}')" class="btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Écouteur pour charger la vidéo
        videoCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('video-checkbox') && 
                !e.target.closest('.video-card-actions')) {
                loadVideo(video.id);
                // Aller à la section accueil
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.getElementById('nav-home').classList.add('active');
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById('home-section').classList.add('active');
            }
        });
        
        libraryGrid.appendChild(videoCard);
    });
}

// Suppression vidéo
function deleteVideo(videoId) {
    if (!AppState.isAdmin) {
        showMessage('Admin requis pour supprimer', 'error');
        return;
    }
    
    const index = AppState.videos.findIndex(v => v.id === videoId);
    if (index === -1) return;
    
    // Libérer l'URL
    URL.revokeObjectURL(AppState.videos[index].url);
    
    // Supprimer
    AppState.videos.splice(index, 1);
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    
    // Mettre à jour
    renderLibrary();
    
    // Si vidéo en cours
    if (AppState.currentVideoId === videoId) {
        const videoElement = document.getElementById('video-element');
        const noVideo = document.getElementById('no-video');
        
        videoElement.src = '';
        videoElement.style.display = 'none';
        noVideo.style.display = 'flex';
        document.getElementById('video-title').textContent = 'Aucune vidéo sélectionnée';
        AppState.currentVideoId = null;
    }
    
    showMessage('Vidéo supprimée', 'success');
}

function toggleVideoSelection(videoId) {
    if (AppState.selectedVideos.has(videoId)) {
        AppState.selectedVideos.delete(videoId);
    } else {
        AppState.selectedVideos.add(videoId);
    }
}

// Importation - MODIFIÉ : PAS DE LIMITE DE TAILLE
function initImport() {
    const uploadForm = document.getElementById('upload-form');
    
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!AppState.isAdmin) {
            showMessage('Admin requis pour importer', 'error');
            return;
        }
        
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const videoFile = document.getElementById('video-file').files[0];
        
        if (!videoFile) {
            showMessage('Sélectionnez un fichier vidéo', 'error');
            return;
        }
        
        // CRITIQUE : SUPPRIMÉ LA LIMITE 50MB
        // if (videoFile.size > 50 * 1024 * 1024) {
        //     showMessage('Fichier trop volumineux (max 50MB)', 'error');
        //     return;
        // }
        
        // Créer URL
        const videoURL = URL.createObjectURL(videoFile);
        const videoId = 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Créer objet vidéo
        const video = {
            id: videoId,
            title: title || 'Vidéo sans titre',
            description: description,
            url: videoURL,
            views: 0,
            date: new Date().toLocaleDateString('fr-FR'),
            timestamp: Date.now()
        };
        
        // Ajouter
        AppState.videos.unshift(video);
        localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
        
        // Réinitialiser formulaire
        uploadForm.reset();
        
        // Mettre à jour
        renderLibrary();
        showMessage('Vidéo importée avec succès ! Taille: ' + formatFileSize(videoFile.size), 'success');
        
        // Charger si première vidéo
        if (AppState.videos.length === 1) {
            loadVideo(videoId);
        }
    });
}

// Fonction pour formater la taille
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
}

// Commentaires
function initComments() {
    const submitBtn = document.getElementById('submit-comment');
    const commentInput = document.getElementById('comment-input');
    
    submitBtn.addEventListener('click', addComment);
    
    commentInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addComment();
        }
    });
}

function addComment() {
    const text = document.getElementById('comment-input').value.trim();
    if (!text) return;
    
    if (!AppState.currentVideoId) {
        showMessage('Sélectionnez d\'abord une vidéo', 'error');
        return;
    }
    
    // Initialiser si nécessaire
    if (!AppState.comments[AppState.currentVideoId]) {
        AppState.comments[AppState.currentVideoId] = [];
    }
    
    const comment = {
        id: 'comment_' + Date.now(),
        author: 'Utilisateur',
        text: text,
        date: new Date().toLocaleString('fr-FR'),
        canDelete: AppState.isAdmin
    };
    
    AppState.comments[AppState.currentVideoId].unshift(comment);
    localStorage.setItem('animeRefComments', JSON.stringify(AppState.comments));
    
    // Réinitialiser
    document.getElementById('comment-input').value = '';
    
    // Mettre à jour
    renderComments(AppState.currentVideoId);
    showMessage('Commentaire publié', 'success');
}

function renderComments(videoId) {
    const commentsList = document.getElementById('comments-list');
    const comments = AppState.comments[videoId] || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="empty-message">Aucun commentaire. Soyez le premier !</p>';
        return;
    }
    
    commentsList.innerHTML = '';
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        
        commentElement.innerHTML = `
            <div class="comment-author">${comment.author}</div>
            <div class="comment-date">${comment.date}</div>
            <div class="comment-text">${comment.text}</div>
            ${comment.canDelete ? `
                <div class="comment-actions">
                    <button class="comment-action" onclick="deleteComment('${videoId}', '${comment.id}')">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            ` : ''}
        `;
        
        commentsList.appendChild(commentElement);
    });
}

function deleteComment(videoId, commentId) {
    if (!AppState.isAdmin) return;
    
    if (AppState.comments[videoId]) {
        AppState.comments[videoId] = AppState.comments[videoId].filter(c => c.id !== commentId);
        localStorage.setItem('animeRefComments', JSON.stringify(AppState.comments));
        renderComments(videoId);
    }
}

// Historique
function addToHistory(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    // Incrémenter vues
    video.views = (video.views || 0) + 1;
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    document.getElementById('views-count').textContent = video.views;
    
    // Ajouter à l'historique
    const historyEntry = {
        videoId: videoId,
        title: video.title,
        date: new Date().toLocaleString('fr-FR')
    };
    
    // Éviter les doublons
    AppState.history = AppState.history.filter(h => h.videoId !== videoId);
    AppState.history.unshift(historyEntry);
    
    // Limiter à 50 entrées
    if (AppState.history.length > 50) {
        AppState.history.pop();
    }
    
    localStorage.setItem('animeRefHistory', JSON.stringify(AppState.history));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    
    if (AppState.history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">Aucune vidéo visionnée.</p>';
        return;
    }
    
    historyList.innerHTML = '';
    
    AppState.history.forEach(entry => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div style="width: 120px; height: 70px; background: #000; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #666;">
                <i class="fas fa-film"></i>
            </div>
            <div class="history-info">
                <div class="history-title">${entry.title}</div>
                <div class="history-date">Visionné le ${entry.date}</div>
            </div>
        `;
        
        // Charger la vidéo au clic
        historyItem.addEventListener('click', () => {
            if (AppState.videos.some(v => v.id === entry.videoId)) {
                loadVideo(entry.videoId);
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.getElementById('nav-home').classList.add('active');
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById('home-section').classList.add('active');
            }
        });
        
        historyList.appendChild(historyItem);
    });
}

// Likes
function toggleLike(videoId) {
    AppState.likes[videoId] = !AppState.likes[videoId];
    localStorage.setItem('animeRefLikes', JSON.stringify(AppState.likes));
    updateLikeButton(videoId);
}

function updateLikeButton(videoId) {
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    
    const isLiked = AppState.likes[videoId] || false;
    
    likeBtn.innerHTML = isLiked ? 
        '<i class="fas fa-heart"></i> <span id="like-count">1</span>' : 
        '<i class="far fa-heart"></i> <span id="like-count">0</span>';
    
    likeBtn.style.color = isLiked ? '#e53935' : '#f47521';
}

// Vues
function updateVideoViews(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    video.views = (video.views || 0) + 1;
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    
    // Mettre à jour l'affichage
    if (AppState.currentVideoId === videoId) {
        document.getElementById('views-count').textContent = video.views;
    }
    
    // Mettre à jour la bibliothèque
    renderLibrary();
}

// Utilitaires
function showMessage(text, type) {
    // Créer un message temporaire
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '1000';
    message.style.maxWidth = '300px';
    message.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
}

// Fonctions globales pour HTML
window.toggleVideoSelection = toggleVideoSelection;
window.deleteVideo = deleteVideo;
window.deleteComment = deleteComment;
