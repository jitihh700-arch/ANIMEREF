// ANIMEREF - Application JavaScript

// État global
const AppState = {
    currentUser: JSON.parse(localStorage.getItem('animeRefUser')) || null,
    users: JSON.parse(localStorage.getItem('animeRefUsers')) || {
        'admin': { 
            id: 'admin_1', 
            username: 'admin', 
            email: 'admin@animeref.com', 
            password: 'admin123', 
            isAdmin: true, 
            videos: [],
            joinDate: new Date().toLocaleDateString('fr-FR')
        }
    },
    videos: JSON.parse(localStorage.getItem('animeRefVideos')) || [],
    history: JSON.parse(localStorage.getItem('animeRefHistory')) || [],
    comments: JSON.parse(localStorage.getItem('animeRefComments')) || {},
    likes: JSON.parse(localStorage.getItem('animeRefLikes')) || {},
    subscriptions: JSON.parse(localStorage.getItem('animeRefSubs')) || {},
    views: JSON.parse(localStorage.getItem('animeRefViews')) || {},
    currentVideoId: null,
    uploadStep: 1,
    currentVideoFile: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Navigation
    initNavigation();
    
    // Authentification
    initAuth();
    
    // Vidéo
    initVideo();
    
    // Upload
    initUpload();
    
    // Recherche
    initSearch();
    
    // Dons
    initDonations();
    
    // Sidebar
    initSidebar();
    
    // Initial render
    updateUI();
    renderLibrary();
    renderHistory();
    
    // Message de bienvenue
    setTimeout(() => {
        showMessage('Bienvenue sur ANIMEREF !', 'success');
    }, 1000);
}

// ==================== NAVIGATION ====================
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
            showSection(sectionId);
        });
    });
    
    // Navigation sidebar
    document.querySelector('.sidebar-item[data-section="home"]').addEventListener('click', function() {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById('nav-home').classList.add('active');
        showSection('home-section');
    });
}

function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

// ==================== AUTHENTIFICATION ====================
function initAuth() {
    // Boutons
    document.getElementById('login-btn').addEventListener('click', () => showModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => showModal('register-modal'));
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Formulaires
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const user = AppState.users[username];
    
    if (user && user.password === password) {
        AppState.currentUser = user;
        localStorage.setItem('animeRefUser', JSON.stringify(user));
        
        updateUI();
        closeModal('login-modal');
        showMessage(`Bienvenue ${username} !`, 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('login-form').reset();
    } else {
        showMessage('Identifiants incorrects', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (password !== confirm) {
        showMessage('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (AppState.users[username]) {
        showMessage('Ce nom d\'utilisateur existe déjà', 'error');
        return;
    }
    
    const userId = 'user_' + Date.now();
    const user = {
        id: userId,
        username: username,
        email: email,
        password: password,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=f47521&color=fff`,
        joinDate: new Date().toLocaleDateString('fr-FR'),
        videos: [],
        subscribers: 0
    };
    
    AppState.users[username] = user;
    AppState.currentUser = user;
    
    localStorage.setItem('animeRefUsers', JSON.stringify(AppState.users));
    localStorage.setItem('animeRefUser', JSON.stringify(user));
    
    updateUI();
    closeModal('register-modal');
    showMessage(`Compte créé pour ${username} !`, 'success');
    
    // Réinitialiser le formulaire
    document.getElementById('register-form').reset();
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('animeRefUser');
    
    updateUI();
    showMessage('Déconnexion réussie', 'success');
}

// ==================== VIDÉO ====================
function initVideo() {
    const videoElement = document.getElementById('video-element');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const likeBtn = document.getElementById('like-btn');
    const subscribeBtn = document.getElementById('subscribe-btn');
    const deleteBtn = document.getElementById('delete-video-btn');
    
    playBtn.addEventListener('click', () => {
        if (videoElement.src) {
            videoElement.play();
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        videoElement.pause();
    });
    
    likeBtn.addEventListener('click', () => {
        if (AppState.currentVideoId) {
            toggleLike(AppState.currentVideoId);
        }
    });
    
    subscribeBtn.addEventListener('click', () => {
        if (AppState.currentVideoId) {
            const video = AppState.videos.find(v => v.id === AppState.currentVideoId);
            if (video) {
                toggleSubscription(video.author);
            }
        }
    });
    
    deleteBtn.addEventListener('click', () => {
        if (AppState.currentVideoId) {
            deleteVideo(AppState.currentVideoId);
        }
    });
    
    // Compteur de vues (30 secondes)
    let viewTimer = null;
    videoElement.addEventListener('play', function() {
        if (AppState.currentVideoId && AppState.currentUser) {
            viewTimer = setTimeout(() => {
                countView(AppState.currentVideoId);
            }, 30000); // 30 secondes
        }
    });
    
    videoElement.addEventListener('pause', function() {
        if (viewTimer) {
            clearTimeout(viewTimer);
        }
    });
}

function loadVideo(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    AppState.currentVideoId = videoId;
    
    const videoElement = document.getElementById('video-element');
    const noVideo = document.getElementById('no-video');
    const videoTitle = document.getElementById('current-video-title');
    const videoViews = document.getElementById('video-views');
    const videoDate = document.getElementById('video-date');
    const videoAuthor = document.getElementById('video-author');
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    const deleteBtn = document.getElementById('delete-video-btn');
    const subscribeBtn = document.getElementById('subscribe-btn');
    
    // Mettre à jour le lecteur
    videoElement.src = video.url;
    videoElement.style.display = 'block';
    noVideo.style.display = 'none';
    
    // Mettre à jour les infos
    videoTitle.textContent = video.title;
    videoViews.innerHTML = `<i class="fas fa-eye"></i> ${video.views || 0} vues`;
    videoDate.textContent = video.uploadDate || '-';
    videoAuthor.textContent = video.author || '-';
    
    // Mettre à jour les likes
    const isLiked = AppState.likes[videoId] || false;
    likeBtn.innerHTML = isLiked ? 
        `<i class="fas fa-heart"></i> <span id="like-count">${isLiked ? 1 : 0}</span>` : 
        `<i class="far fa-heart"></i> <span id="like-count">0</span>`;
    likeBtn.style.color = isLiked ? '#e53935' : '';
    
    // Afficher/masquer les boutons
    const isOwner = AppState.currentUser && 
                   (video.authorId === AppState.currentUser.id || AppState.currentUser.username === 'admin');
    const isSubscribed = AppState.currentUser && 
                        AppState.subscriptions[AppState.currentUser.id]?.includes(video.author);
    
    deleteBtn.style.display = isOwner ? 'inline-flex' : 'none';
    subscribeBtn.style.display = AppState.currentUser && !isOwner ? 'inline-flex' : 'none';
    subscribeBtn.innerHTML = isSubscribed ? 
        '<i class="fas fa-user-check"></i> Abonné' : 
        '<i class="fas fa-user-plus"></i> S\'abonner';
    
    // Charger les commentaires
    renderComments(videoId);
    
    // Ajouter à l'historique
    addToHistory(videoId);
    
    // Lire la vidéo
    videoElement.play().catch(e => {
        console.log('Lecture automatique bloquée');
    });
}

function countView(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    // Vérifier si déjà compté aujourd'hui
    const today = new Date().toDateString();
    const viewKey = `${videoId}_${AppState.currentUser?.id || 'anonymous'}_${today}`;
    
    if (AppState.views[viewKey]) return;
    
    // Incrémenter les vues
    video.views = (video.views || 0) + 1;
    AppState.views[viewKey] = true;
    
    // Sauvegarder
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    localStorage.setItem('animeRefViews', JSON.stringify(AppState.views));
    
    // Mettre à jour l'affichage
    document.getElementById('video-views').innerHTML = `<i class="fas fa-eye"></i> ${video.views} vues`;
    
    // Mettre à jour la bibliothèque
    renderLibrary();
}

function addToHistory(videoId) {
    if (!AppState.currentUser) return;
    
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    // Supprimer l'entrée existante si elle existe
    AppState.history = AppState.history.filter(entry => 
        !(entry.videoId === videoId && entry.userId === AppState.currentUser.id)
    );
    
    // Ajouter la nouvelle entrée
    const historyEntry = {
        videoId: videoId,
        userId: AppState.currentUser.id,
        title: video.title,
        author: video.author,
        date: new Date().toLocaleString('fr-FR'),
        timestamp: Date.now()
    };
    
    AppState.history.unshift(historyEntry);
    
    // Limiter à 50 entrées
    if (AppState.history.length > 50) {
        AppState.history.pop();
    }
    
    // Sauvegarder
    localStorage.setItem('animeRefHistory', JSON.stringify(AppState.history));
    
    // Mettre à jour l'affichage
    renderHistory();
}

// ==================== UPLOAD ====================
function initUpload() {
    // Étape 1: Sélection du fichier
    document.getElementById('video-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            AppState.currentVideoFile = file;
            
            // Afficher les infos du fichier
            document.getElementById('file-info').style.display = 'block';
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-size').textContent = formatFileSize(file.size);
            
            // Activer le bouton suivant
            document.getElementById('step1-next').disabled = false;
        }
    });
    
    // Navigation des étapes
    document.getElementById('step1-next').addEventListener('click', goToStep2);
    document.getElementById('step2-back').addEventListener('click', goToStep1);
    document.getElementById('step2-next').addEventListener('click', goToStep3);
    document.getElementById('step3-back').addEventListener('click', goToStep2);
    document.getElementById('submit-video').addEventListener('click', uploadVideo);
    
    // Vérification copyright
    document.getElementById('copyright-agree').addEventListener('change', function() {
        document.getElementById('submit-video').disabled = !this.checked;
    });
}

function goToStep2() {
    AppState.uploadStep = 2;
    updateUploadUI();
}

function goToStep1() {
    AppState.uploadStep = 1;
    updateUploadUI();
}

function goToStep3() {
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;
    
    if (!title.trim()) {
        showMessage('Veuillez donner un titre à votre vidéo', 'error');
        return;
    }
    
    // Vérification copyright
    const hasCopyright = checkForCopyright(title + ' ' + description);
    
    if (hasCopyright) {
        document.getElementById('copyright-result').innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>ATTENTION : Contenu protégé détecté</strong>
                <p>Votre vidéo semble contenir des références à du contenu protégé.</p>
                <p>Assurez-vous qu'il s'agit de votre création originale.</p>
            </div>
        `;
    } else {
        document.getElementById('copyright-result').innerHTML = `
            <div class="message success">
                <i class="fas fa-check-circle"></i>
                <strong>Aucun contenu protégé détecté</strong>
                <p>Votre vidéo peut être publiée.</p>
            </div>
        `;
    }
    
    AppState.uploadStep = 3;
    updateUploadUI();
}

function updateUploadUI() {
    // Masquer toutes les étapes
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    
    // Afficher l'étape courante
    document.getElementById(`step${AppState.uploadStep}`).style.display = 'block';
    
    // Mettre à jour les indicateurs
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        indicator.classList.remove('active', 'completed');
        
        if (index + 1 < AppState.uploadStep) {
            indicator.classList.add('completed');
        } else if (index + 1 === AppState.uploadStep) {
            indicator.classList.add('active');
        }
    });
}

function checkForCopyright(text) {
    const lowerText = text.toLowerCase();
    const copyrightTerms = [
        'crunchyroll', 'netflix', 'disney', 'hulu', 'amazon prime',
        'épisode', 'saison', 'vf', 'vostfr', 'streaming',
        'attack on titan', 'naruto', 'one piece', 'dragon ball',
        'studio ghibli', 'toei animation'
    ];
    
    return copyrightTerms.some(term => lowerText.includes(term));
}

function uploadVideo() {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour uploader une vidéo', 'error');
        showModal('login-modal');
        return;
    }
    
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;
    const file = AppState.currentVideoFile;
    
    // Créer l'URL de la vidéo
    const videoURL = URL.createObjectURL(file);
    const videoId = 'video_' + Date.now();
    
    // Créer l'objet vidéo
    const video = {
        id: videoId,
        title: title || 'Vidéo sans titre',
        description: description,
        url: videoURL,
        authorId: AppState.currentUser.id,
        author: AppState.currentUser.username,
        views: 0,
        likes: 0,
        uploadDate: new Date().toLocaleDateString('fr-FR'),
        timestamp: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        isOriginal: true
    };
    
    // Ajouter aux vidéos
    AppState.videos.unshift(video);
    
    // Ajouter aux vidéos de l'utilisateur
    if (!AppState.currentUser.videos) {
        AppState.currentUser.videos = [];
    }
    AppState.currentUser.videos.push(videoId);
    
    // Mettre à jour l'utilisateur
    AppState.users[AppState.currentUser.username] = AppState.currentUser;
    
    // Sauvegarder
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    localStorage.setItem('animeRefUsers', JSON.stringify(AppState.users));
    localStorage.setItem('animeRefUser', JSON.stringify(AppState.currentUser));
    
    // Réinitialiser le formulaire
    resetUploadForm();
    
    // Mettre à jour l'interface
    renderLibrary();
    renderMyVideos();
    
    // Charger la vidéo
    loadVideo(videoId);
    
    // Retour à l'accueil
    showSection('home-section');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('nav-home').classList.add('active');
    
    showMessage('Vidéo publiée avec succès !', 'success');
}

function resetUploadForm() {
    AppState.uploadStep = 1;
    AppState.currentVideoFile = null;
    
    // Réinitialiser les champs
    document.getElementById('upload-form').reset();
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('copyright-result').innerHTML = '';
    document.getElementById('copyright-agree').checked = false;
    
    updateUploadUI();
}

// ==================== BIBLIOTHÈQUE ====================
function renderLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    
    if (AppState.videos.length === 0) {
        libraryGrid.innerHTML = '<p class="empty-message">Aucune vidéo importée.</p>';
        return;
    }
    
    libraryGrid.innerHTML = '';
    
    AppState.videos.forEach(video => {
        const videoCard = createVideoCard(video);
        libraryGrid.appendChild(videoCard);
    });
}

function renderMyVideos() {
    const myVideosGrid = document.getElementById('my-videos-grid');
    if (!myVideosGrid) return;
    
    if (!AppState.currentUser) {
        myVideosGrid.innerHTML = '<p class="empty-message">Connectez-vous pour voir vos vidéos.</p>';
        return;
    }
    
    const userVideos = AppState.videos.filter(v => v.authorId === AppState.currentUser.id);
    
    if (userVideos.length === 0) {
        myVideosGrid.innerHTML = '<p class="empty-message">Vous n\'avez pas encore uploadé de vidéos.</p>';
        return;
    }
    
    myVideosGrid.innerHTML = '';
    
    userVideos.forEach(video => {
        const videoCard = createVideoCard(video, true);
        myVideosGrid.appendChild(videoCard);
    });
}

function createVideoCard(video, showDelete = false) {
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';
    videoCard.dataset.id = video.id;
    
    videoCard.innerHTML = `
        <div class="video-thumbnail">
            <i class="fas fa-play-circle"></i>
        </div>
        <div class="video-card-content">
            <div class="video-card-title">${video.title}</div>
            <div class="video-card-author">Par ${video.author}</div>
            <div class="video-card-details">
                <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                <span>${video.uploadDate || ''}</span>
            </div>
            ${showDelete ? `
                <div class="video-card-actions">
                    <button onclick="deleteVideo('${video.id}')" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    videoCard.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-danger')) {
            loadVideo(video.id);
            showSection('home-section');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.getElementById('nav-home').classList.add('active');
        }
    });
    
    return videoCard;
}

// ==================== HISTORIQUE ====================
function renderHistory() {
    const historyList = document.getElementById('history-list');
    
    if (!AppState.currentUser || AppState.history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">Aucune vidéo visionnée.</p>';
        return;
    }
    
    // Filtrer l'historique de l'utilisateur
    const userHistory = AppState.history
        .filter(entry => entry.userId === AppState.currentUser.id)
        .slice(0, 20); // Limiter à 20 entrées
    
    if (userHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-message">Aucune vidéo visionnée.</p>';
        return;
    }
    
    historyList.innerHTML = '';
    
    userHistory.forEach(entry => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div class="history-thumbnail-small">
                <i class="fas fa-play-circle"></i>
            </div>
            <div class="history-info">
                <div class="history-title">${entry.title}</div>
                <div class="history-details">
                    <span>${entry.author}</span>
                    <span>•</span>
                    <span>${entry.date}</span>
                </div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            const video = AppState.videos.find(v => v.id === entry.videoId);
            if (video) {
                loadVideo(video.id);
                showSection('home-section');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.getElementById('nav-home').classList.add('active');
            }
        });
        
        historyList.appendChild(historyItem);
    });
}

// ==================== COMMENTAIRES ====================
function initComments() {
    const submitBtn = document.getElementById('submit-comment');
    const commentInput = document.getElementById('comment-input');
    
    if (submitBtn && commentInput) {
        submitBtn.addEventListener('click', addComment);
        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addComment();
        });
    }
}

function addComment() {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour commenter', 'error');
        showModal('login-modal');
        return;
    }
    
    if (!AppState.currentVideoId) {
        showMessage('Sélectionnez d\'abord une vidéo', 'error');
        return;
    }
    
    const text = document.getElementById('comment-input').value.trim();
    if (!text) return;
    
    // Initialiser les commentaires pour cette vidéo
    if (!AppState.comments[AppState.currentVideoId]) {
        AppState.comments[AppState.currentVideoId] = [];
    }
    
    const comment = {
        id: 'comment_' + Date.now(),
        author: AppState.currentUser.username,
        text: text,
        date: new Date().toLocaleString('fr-FR')
    };
    
    AppState.comments[AppState.currentVideoId].unshift(comment);
    localStorage.setItem('animeRefComments', JSON.stringify(AppState.comments));
    
    // Réinitialiser le champ
    document.getElementById('comment-input').value = '';
    
    // Mettre à jour l'affichage
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
        `;
        
        commentsList.appendChild(commentElement);
    });
}

// ==================== LIKES ====================
function toggleLike(videoId) {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour aimer une vidéo', 'error');
        showModal('login-modal');
        return;
    }
    
    AppState.likes[videoId] = !AppState.likes[videoId];
    localStorage.setItem('animeRefLikes', JSON.stringify(AppState.likes));
    
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    const isLiked = AppState.likes[videoId];
    
    likeBtn.innerHTML = isLiked ? 
        `<i class="fas fa-heart"></i> <span id="like-count">1</span>` : 
        `<i class="far fa-heart"></i> <span id="like-count">0</span>`;
    likeBtn.style.color = isLiked ? '#e53935' : '';
    
    showMessage(isLiked ? 'Vidéo aimée !' : 'Vidéo désaimée', 'info');
}

// ==================== ABONNEMENTS ====================
function toggleSubscription(author) {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour vous abonner', 'error');
        showModal('login-modal');
        return;
    }
    
    const userId = AppState.currentUser.id;
    
    // Initialiser les abonnements
    if (!AppState.subscriptions[userId]) {
        AppState.subscriptions[userId] = [];
    }
    
    const isSubscribed = AppState.subscriptions[userId].includes(author);
    
    if (isSubscribed) {
        // Se désabonner
        AppState.subscriptions[userId] = AppState.subscriptions[userId].filter(a => a !== author);
        showMessage(`Désabonné de ${author}`, 'info');
    } else {
        // S'abonner
        AppState.subscriptions[userId].push(author);
        showMessage(`Abonné à ${author} !`, 'success');
    }
    
    localStorage.setItem('animeRefSubs', JSON.stringify(AppState.subscriptions));
    
    // Mettre à jour le bouton
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.innerHTML = isSubscribed ? 
            '<i class="fas fa-user-plus"></i> S\'abonner' : 
            '<i class="fas fa-user-check"></i> Abonné';
    }
    
    renderSubscriptions();
}

function renderSubscriptions() {
    const subscriptionsList = document.getElementById('subscriptions-list');
    if (!subscriptionsList) return;
    
    if (!AppState.currentUser) {
        subscriptionsList.innerHTML = '<p class="empty-message">Connectez-vous pour voir vos abonnements.</p>';
        return;
    }
    
    const userSubs = AppState.subscriptions[AppState.currentUser.id] || [];
    
    if (userSubs.length === 0) {
        subscriptionsList.innerHTML = '<p class="empty-message">Vous n\'êtes abonné à personne.</p>';
        return;
    }
    
    subscriptionsList.innerHTML = '';
    
    userSubs.forEach(author => {
        const user = AppState.users[author];
        if (!user) return;
        
        const subItem = document.createElement('div');
        subItem.className = 'subscription-item';
        
        subItem.innerHTML = `
            <div class="avatar">
                ${author.charAt(0).toUpperCase()}
            </div>
            <div class="subscription-info">
                <div class="subscription-name">${author}</div>
                <div class="subscription-stats">${user.videos?.length || 0} vidéos</div>
            </div>
            <button onclick="unsubscribe('${author}')" class="btn btn-danger btn-sm">
                <i class="fas fa-user-minus"></i>
            </button>
        `;
        
        subscriptionsList.appendChild(subItem);
    });
}

function unsubscribe(author) {
    if (!AppState.currentUser) return;
    
    const userId = AppState.currentUser.id;
    if (AppState.subscriptions[userId]) {
        AppState.subscriptions[userId] = AppState.subscriptions[userId].filter(a => a !== author);
        localStorage.setItem('animeRefSubs', JSON.stringify(AppState.subscriptions));
        renderSubscriptions();
        showMessage(`Désabonné de ${author}`, 'info');
    }
}

// ==================== RECHERCHE ====================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
        
        searchBtn.addEventListener('click', performSearch);
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    if (!query) return;
    
    const results = AppState.videos.filter(video => 
        video.title.toLowerCase().includes(query) || 
        video.description?.toLowerCase().includes(query) ||
        video.author.toLowerCase().includes(query)
    );
    
    if (results.length === 0) {
        showMessage('Aucun résultat trouvé', 'info');
        return;
    }
    
    // Afficher les résultats
    const libraryGrid = document.getElementById('library-grid');
    libraryGrid.innerHTML = '';
    
    results.forEach(video => {
        const videoCard = createVideoCard(video);
        libraryGrid.appendChild(videoCard);
    });
    
    // Aller à la bibliothèque
    showSection('library-section');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('nav-library').classList.add('active');
}

// ==================== DONS ====================
function initDonations() {
    const donateBtn = document.getElementById('donate-btn');
    const sidebarDonate = document.getElementById('sidebar-donate');
    const confirmDonate = document.getElementById('confirm-donate');
    
    if (donateBtn) {
        donateBtn.addEventListener('click', () => showModal('donate-modal'));
    }
    
    if (sidebarDonate) {
        sidebarDonate.addEventListener('click', () => showModal('donate-modal'));
    }
    
    if (confirmDonate) {
        confirmDonate.addEventListener('click', processDonation);
    }
}

function processDonation() {
    const amount = document.getElementById('donate-amount').value;
    const method = document.getElementById('donate-method').value;
    
    if (!amount || amount < 1) {
        showMessage('Veuillez entrer un montant valide', 'error');
        return;
    }
    
    let message = `Merci pour votre don de ${amount}€ !\n\n`;
    
    if (method === 'mobile') {
        message += `📱 Envoyez ${amount}€ au : 07 09 65 63 59\n`;
        message += `💸 L'argent arrivera directement sur mon téléphone`;
    } else if (method === 'paypal') {
        message += `💳 PayPal : jitihh700@gmail.com\n`;
        message += `💰 Mentionnez "ANIMEREF" dans le message`;
    }
    
    alert(message);
    closeModal('donate-modal');
    
    // Réinitialiser
    document.getElementById('donate-amount').value = '5';
    
    showMessage('Merci pour votre soutien ! ❤️', 'success');
}

// ==================== SIDEBAR ====================
function initSidebar() {
    // Admin toggle
    document.getElementById('admin-toggle').addEventListener('click', function() {
        if (AppState.currentUser?.username === 'admin') {
            AppState.currentUser.isAdmin = !AppState.currentUser.isAdmin;
            localStorage.setItem('animeRefUser', JSON.stringify(AppState.currentUser));
            
            const adminText = document.getElementById('admin-text');
            adminText.textContent = AppState.currentUser.isAdmin ? 'Admin (ON)' : 'Mode Admin';
            adminText.parentElement.style.color = AppState.currentUser.isAdmin ? '#f47521' : '';
            
            showMessage(AppState.currentUser.isAdmin ? 'Mode admin activé' : 'Mode admin désactivé', 'success');
            updateUI();
        } else {
            showMessage('Seul l\'administrateur peut activer ce mode', 'error');
        }
    });
    
    // Mes vidéos
    document.getElementById('my-videos-btn').addEventListener('click', function() {
        if (!AppState.currentUser) {
            showMessage('Connectez-vous pour voir vos vidéos', 'error');
            showModal('login-modal');
            return;
        }
        
        showSection('my-videos-section');
        renderMyVideos();
        
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    });
    
    // Abonnements
    document.getElementById('subscriptions-btn').addEventListener('click', function() {
        if (!AppState.currentUser) {
            showMessage('Connectez-vous pour voir vos abonnements', 'error');
            showModal('login-modal');
            return;
        }
        
        showSection('subscriptions-section');
        renderSubscriptions();
        
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    });
    
    // Vider l'historique
    document.getElementById('clear-history-btn').addEventListener('click', function() {
        if (!AppState.currentUser) {
            showMessage('Connectez-vous pour gérer votre historique', 'error');
            return;
        }
        
        if (confirm('Voulez-vous vraiment vider tout votre historique ?')) {
            AppState.history = AppState.history.filter(entry => entry.userId !== AppState.currentUser.id);
            localStorage.setItem('animeRefHistory', JSON.stringify(AppState.history));
            renderHistory();
            showMessage('Historique vidé', 'success');
        }
    });
}

// ==================== UTILITAIRES ====================
function deleteVideo(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    const isOwner = AppState.currentUser && 
                   (video.authorId === AppState.currentUser.id || AppState.currentUser.isAdmin);
    
    if (!isOwner) {
        showMessage('Vous ne pouvez pas supprimer cette vidéo', 'error');
        return;
    }
    
    if (!confirm('Voulez-vous vraiment supprimer cette vidéo ?')) {
        return;
    }
    
    // Libérer l'URL
    URL.revokeObjectURL(video.url);
    
    // Supprimer
    AppState.videos = AppState.videos.filter(v => v.id !== videoId);
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    
    // Si c'était la vidéo en cours
    if (AppState.currentVideoId === videoId) {
        const videoElement = document.getElementById('video-element');
        const noVideo = document.getElementById('no-video');
        
        videoElement.src = '';
        videoElement.style.display = 'none';
        noVideo.style.display = 'flex';
        document.getElementById('current-video-title').textContent = 'Aucune vidéo sélectionnée';
        AppState.currentVideoId = null;
    }
    
    // Mettre à jour
    renderLibrary();
    renderMyVideos();
    
    showMessage('Vidéo supprimée', 'success');
}

function updateUI() {
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const usernameDisplay = document.getElementById('username-display');
    
    if (AppState.currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'flex';
        usernameDisplay.textContent = AppState.currentUser.username;
        
        // Afficher les éléments réservés aux utilisateurs connectés
        document.querySelectorAll('.user-only').forEach(el => {
            el.style.display = 'block';
        });
        
        // Mettre à jour le texte admin
        const adminText = document.getElementById('admin-text');
        if (adminText) {
            adminText.textContent = AppState.currentUser.isAdmin ? 'Admin (ON)' : 'Mode Admin';
            adminText.parentElement.style.color = AppState.currentUser.isAdmin ? '#f47521' : '';
        }
    } else {
        authSection.style.display = 'flex';
        userSection.style.display = 'none';
        
        // Masquer les éléments réservés aux utilisateurs connectés
        document.querySelectorAll('.user-only').forEach(el => {
            el.style.display = 'none';
        });
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showMessage(text, type) {
    // Supprimer les messages existants
    const existingMessages = document.querySelectorAll('.message.temporary');
    existingMessages.forEach(msg => msg.remove());
    
    // Créer le message
    const message = document.createElement('div');
    message.className = `message ${type} temporary`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         'info-circle'}"></i>
        ${text}
    `;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '1000';
    message.style.padding = '15px 20px';
    message.style.borderRadius = '8px';
    message.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    message.style.animation = 'slideIn 0.3s ease-out';
    
    document.body.appendChild(message);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        if (message.parentNode) {
            message.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => message.remove(), 300);
        }
    }, 3000);
}

// Fonctions globales
window.closeModal = closeModal;
window.deleteVideo = deleteVideo;
window.unsubscribe = unsubscribe;

// Initialiser les commentaires
initComments();
