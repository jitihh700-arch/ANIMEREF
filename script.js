// Base de données simulée
let videos = [];
let users = [];
let currentUser = null;
let watchHistory = [];
let myVideos = [];
let uploadStep = 1;
let selectedFile = null;
let currentPlayingVideo = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initSampleData();
    loadVideos();
    loadWatchHistory();
    loadMyVideos();
    checkAuthStatus();
    
    // Écouteurs d'événements
    document.getElementById('videoFile').addEventListener('change', handleFileSelect);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchVideos();
    });
});

// Données d'exemple pour anime
function initSampleData() {
    // Vidéos d'exemple seulement si aucune vidéo existante
    if (videos.length === 0) {
        videos = [
            {
                id: 1,
                title: "One Piece",
                episode: 1024,
                description: "Épisode spécial - La grande bataille finale",
                channel: "Équipe One Piece",
                views: "1.2M",
                date: "Il y a 2 jours",
                duration: "23:45",
                thumbnail: "https://picsum.photos/320/180?random=one-piece",
                videoUrl: null,
                userId: 2,
                tags: ["Shonen", "Aventure", "Action"],
                likes: 12400,
                dislikes: 120,
                comments: [],
                visibility: "public"
            },
            {
                id: 2,
                title: "Attack on Titan",
                episode: 28,
                description: "L'attaque du Titan colossal",
                channel: "AnimeFan",
                views: "890K",
                date: "Il y a 1 semaine",
                duration: "24:30",
                thumbnail: "https://picsum.photos/320/180?random=aot",
                videoUrl: null,
                userId: 3,
                tags: ["Action", "Drame", "Fantasy"],
                likes: 8920,
                dislikes: 85,
                comments: [],
                visibility: "public"
            }
        ];
    }
    
    // Utilisateurs d'exemple
    if (users.length === 0) {
        users = [
            { id: 1, name: "Admin", email: "admin@animeref.com", password: "admin123" },
            { id: 2, name: "Équipe One Piece", email: "onepiece@example.com", password: "op123" },
            { id: 3, name: "AnimeFan", email: "fan@example.com", password: "fan123" }
        ];
    }
}

// Charger les vidéos
function loadVideos() {
    const sections = ['homeVideos', 'trendingVideos', 'animeListVideos'];
    
    sections.forEach(sectionId => {
        const grid = document.getElementById(sectionId);
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Filtrer seulement les vidéos publiques
        const publicVideos = videos.filter(v => v.visibility === "public");
        
        publicVideos.forEach(video => {
            const videoElement = createVideoCard(video);
            grid.appendChild(videoElement);
        });
        
        if (publicVideos.length === 0) {
            grid.innerHTML = '<p class="empty-state">Aucun anime disponible pour le moment.</p>';
        }
    });
}

// Créer une carte vidéo
function createVideoCard(video) {
    const div = document.createElement('div');
    div.className = 'video-card';
    div.onclick = () => openVideoModal(video);
    
    const episodeText = video.episode ? `Épisode ${video.episode}` : '';
    
    div.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title} ${episodeText}">
            <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title} ${episodeText}</h3>
            <p class="video-meta">${video.channel} • ${video.views} vues • ${video.date}</p>
        </div>
    `;
    
    return div;
}

// Ouvrir modal vidéo
function openVideoModal(video) {
    currentPlayingVideo = video;
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    // Mettre à jour les informations
    document.getElementById('videoModalTitle').textContent = `${video.title} ${video.episode ? ' - Épisode ' + video.episode : ''}`;
    document.getElementById('videoModalViews').textContent = `${video.views} vues`;
    document.getElementById('videoModalDate').textContent = video.date;
    document.getElementById('videoModalDescription').textContent = video.description;
    document.getElementById('videoModalChannel').textContent = video.channel;
    document.getElementById('likeCount').textContent = formatNumber(video.likes || 0);
    document.getElementById('dislikeCount').textContent = formatNumber(video.dislikes || 0);
    document.getElementById('videoModalEpisode').textContent = video.episode ? `Épisode ${video.episode}` : '';
    
    // Afficher le bouton supprimer seulement si c'est notre vidéo
    const deleteBtn = document.querySelector('.delete-btn');
    if (currentUser && video.userId === currentUser.id) {
        deleteBtn.style.display = 'inline-flex';
    } else {
        deleteBtn.style.display = 'none';
    }
    
    // Charger la vidéo
    if (video.videoUrl) {
        player.src = video.videoUrl;
    } else {
        // Si c'est une vidéo uploadée par l'utilisateur
        const storedVideo = myVideos.find(v => v.id === video.id);
        if (storedVideo && storedVideo.videoData) {
            player.src = storedVideo.videoData;
        } else {
            player.src = "";
            player.innerHTML = '<p>La vidéo n\'est plus disponible.</p>';
        }
    }
    
    // Charger les commentaires
    loadComments(video.comments || []);
    
    // Charger les suggestions
    loadSuggestions(video.id);
    
    // Ajouter à l'historique
    addToHistory(video);
    
    // Afficher le modal
    modal.style.display = 'flex';
    
    // Lecture automatique
    setTimeout(() => {
        player.play().catch(e => console.log("Lecture nécessite une interaction utilisateur"));
    }, 1000);
}

// Fermer modal vidéo
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    player.pause();
    player.src = "";
    modal.style.display = 'none';
    currentPlayingVideo = null;
}

// Ajouter à l'historique
function addToHistory(video) {
    if (!currentUser) return;
    
    const existingIndex = watchHistory.findIndex(item => item.id === video.id);
    
    if (existingIndex !== -1) {
        watchHistory.splice(existingIndex, 1);
    }
    
    const historyItem = {
        ...video,
        watchedAt: new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    watchHistory.unshift(historyItem);
    
    if (watchHistory.length > 50) {
        watchHistory.pop();
    }
    
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    loadWatchHistory();
}

// Charger l'historique
function loadWatchHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (watchHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">Aucune vidéo visionnée récemment.</p>';
        return;
    }
    
    watchHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = () => openVideoModal(item);
        
        div.innerHTML = `
            <div class="history-video">
                <img src="${item.thumbnail}" alt="${item.title}">
                <div class="history-info">
                    <h4>${item.title} ${item.episode ? '- Épisode ' + item.episode : ''}</h4>
                    <p>${item.channel} • Visionné le ${item.watchedAt}</p>
                </div>
            </div>
        `;
        
        historyList.appendChild(div);
    });
}

// Upload de vidéo
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['video/mp4', 'video/mkv', 'video/avi', 'video/mov', 'video/webm'];
    if (!validTypes.includes(file.type)) {
        showNotification("Format non supporté. Utilisez MP4, MKV, AVI ou MOV.");
        return;
    }
    
    if (file.size > 2 * 1024 * 1024 * 1024) {
        showNotification("Fichier trop volumineux (max 2GB)");
        return;
    }
    
    selectedFile = file;
    
    // Lire le fichier comme URL de données
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedFile.dataUrl = e.target.result;
        
        const fileInfoDiv = document.getElementById('fileInfo');
        fileInfoDiv.innerHTML = `
            <p><strong>Fichier sélectionné:</strong> ${file.name}</p>
            <p><strong>Taille:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Type:</strong> ${file.type}</p>
            <p><strong>Durée estimée:</strong> Chargement...</p>
        `;
        
        document.querySelector('.next-step-btn').disabled = false;
        document.getElementById('summaryFile').textContent = file.name;
    };
    reader.readAsDataURL(file);
}

function nextUploadStep() {
    if (uploadStep >= 3) return;
    
    if (uploadStep === 1 && !selectedFile) {
        showNotification("Veuillez sélectionner un fichier vidéo");
        return;
    }
    
    if (uploadStep === 2) {
        const title = document.getElementById('videoTitle').value.trim();
        const episode = document.getElementById('videoEpisode').value;
        
        if (!title) {
            showNotification("Veuillez entrer un titre pour l'anime");
            return;
        }
        
        if (!episode || episode < 1) {
            showNotification("Veuillez entrer un numéro d'épisode valide");
            return;
        }
    }
    
    uploadStep++;
    updateUploadSteps();
    
    if (uploadStep === 3) {
        startCopyrightVerification();
    }
}

function prevUploadStep() {
    if (uploadStep <= 1) return;
    uploadStep--;
    updateUploadSteps();
}

function updateUploadSteps() {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${uploadStep}`).classList.add('active');
    
    document.querySelectorAll('.upload-step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`uploadStep${uploadStep}`).classList.add('active');
}

// Vérification des droits d'auteur améliorée
function startCopyrightVerification() {
    const progressBar = document.getElementById('verificationProgress');
    const progressText = document.getElementById('progressText');
    const statusText = document.getElementById('verificationStatus');
    const issuesDiv = document.getElementById('copyrightIssues');
    const issuesList = document.getElementById('issuesList');
    const submitBtn = document.querySelector('.upload-submit-btn');
    
    // Mettre à jour le résumé
    const title = document.getElementById('videoTitle').value;
    const episode = document.getElementById('videoEpisode').value;
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    const visibilityText = visibility === 'public' ? 'Public' : 'Privé';
    
    document.getElementById('summaryTitle').textContent = title;
    document.getElementById('summaryEpisode').textContent = `Épisode ${episode}`;
    document.getElementById('summaryVisibility').textContent = visibilityText;
    
    // Réinitialiser
    issuesDiv.style.display = 'none';
    issuesList.innerHTML = '';
    submitBtn.disabled = true;
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    statusText.textContent = "Analyse du contenu...";
    statusText.style.color = '';
    
    // Simulation de vérification améliorée
    let progress = 0;
    let detectedIssues = [];
    
    const interval = setInterval(() => {
        progress += 2;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        // Simuler la détection de problèmes
        if (progress === 20) {
            statusText.textContent = "Vérification des métadonnées...";
            
            // Vérifier si c'est un anime populaire
            const title = document.getElementById('videoTitle').value.toLowerCase();
            const popularAnime = ['naruto', 'one piece', 'attack on titan', 'dragon ball', 'bleach', 'death note'];
            
            if (popularAnime.some(anime => title.includes(anime))) {
                detectedIssues.push("Contenu protégé par droits d'auteur détecté");
                statusText.textContent = "⚠️ Contenu protégé détecté...";
                statusText.style.color = '#ff4757';
            }
        }
        
        if (progress === 50) {
            statusText.textContent = "Analyse audio...";
            
            // Simuler la détection d'audio protégé
            if (Math.random() > 0.7) {
                detectedIssues.push("Musique sous copyright détectée");
            }
        }
        
        if (progress === 80) {
            statusText.textContent = "Recherche de correspondances...";
            
            // Vérifier l'épisode
            const episode = parseInt(document.getElementById('videoEpisode').value);
            if (episode > 100) {
                detectedIssues.push("Épisode récent - risque de violation");
            }
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            progressText.textContent = "100%";
            
            if (detectedIssues.length > 0) {
                // Afficher les problèmes
                issuesDiv.style.display = 'block';
                detectedIssues.forEach(issue => {
                    const li = document.createElement('li');
                    li.textContent = issue;
                    issuesList.appendChild(li);
                });
                
                statusText.innerHTML = '<span style="color: #ff4757;">❌ Problèmes de droits d\'auteur détectés</span>';
                submitBtn.disabled = true;
            } else {
                statusText.innerHTML = '<span style="color: #2ecc71;">✓ Aucun problème détecté - Vous pouvez publier</span>';
                submitBtn.disabled = false;
            }
        }
    }, 50);
}

// Publier la vidéo
function submitVideo() {
    if (!currentUser) {
        showNotification("Vous devez être connecté pour publier");
        return;
    }
    
    const title = document.getElementById('videoTitle').value;
    const episode = parseInt(document.getElementById('videoEpisode').value);
    const description = document.getElementById('videoDescription').value;
    const tags = document.getElementById('videoTags').value;
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    
    // Créer une miniature aléatoire
    const randomThumb = `https://picsum.photos/320/180?random=${Date.now()}`;
    
    // Nouvelle vidéo
    const newVideo = {
        id: Date.now(),
        title: title,
        episode: episode,
        description: description,
        channel: currentUser.name,
        views: "0",
        date: "À l'instant",
        duration: "24:00", // Estimation
        thumbnail: randomThumb,
        videoUrl: null,
        videoData: selectedFile.dataUrl,
        userId: currentUser.id,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        likes: 0,
        dislikes: 0,
        comments: [],
        visibility: visibility
    };
    
    // Ajouter aux vidéos
    videos.unshift(newVideo);
    myVideos.unshift(newVideo);
    
    // Sauvegarder
    saveToLocalStorage();
    
    // Mettre à jour l'interface
    loadVideos();
    loadMyVideos();
    
    // Fermer et notifier
    closeUploadModal();
    showNotification("✅ Anime publié avec succès!");
    
    // Afficher la section mes vidéos
    showSection('my-videos');
}

// Charger mes vidéos
function loadMyVideos() {
    const myUploadedVideos = document.getElementById('myUploadedVideos');
    if (!myUploadedVideos) return;
    
    myUploadedVideos.innerHTML = '';
    
    if (!currentUser) {
        myUploadedVideos.innerHTML = '<p class="empty-state">Connectez-vous pour voir vos vidéos.</p>';
        return;
    }
    
    const userVideos = myVideos.filter(v => v.userId === currentUser.id);
    
    if (userVideos.length === 0) {
        myUploadedVideos.innerHTML = '<p class="empty-state">Vous n\'avez pas encore publié d\'anime.</p>';
        return;
    }
    
    userVideos.forEach(video => {
        const videoElement = createVideoCard(video);
        myUploadedVideos.appendChild(videoElement);
    });
}

// Authentification
function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    switchAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
}

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification("Veuillez remplir tous les champs");
        return;
    }
    
    // Validation email simple
    if (!email.includes('@') || !email.includes('.')) {
        showNotification("Veuillez entrer un email valide");
        return;
    }
    
    // Rechercher l'utilisateur
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showNotification("Email ou mot de passe incorrect");
        return;
    }
    
    // Connexion réussie
    currentUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    updateAuthUI();
    closeAuthModal();
    showNotification(`👋 Bienvenue ${currentUser.name}!`);
    
    // Recharger les données utilisateur
    loadMyVideos();
    loadWatchHistory();
}

function signup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification("Veuillez remplir tous les champs");
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification("Les mots de passe ne correspondent pas");
        return;
    }
    
    if (password.length < 8) {
        showNotification("Le mot de passe doit faire au moins 8 caractères");
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showNotification("Veuillez entrer un email valide");
        return;
    }
    
    // Vérifier si l'email existe déjà
    if (users.some(u => u.email === email)) {
        showNotification("Cet email est déjà utilisé");
        return;
    }
    
    // Nouvel utilisateur
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password
    };
    
    users.push(newUser);
    currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    
    // Sauvegarder
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('users', JSON.stringify(users));
    
    updateAuthUI();
    closeAuthModal();
    showNotification(`🎉 Bienvenue sur Animeref, ${currentUser.name}!`);
    
    // Recharger
    loadMyVideos();
}

function loginWithGoogle() {
    showNotification("⚠️ Connexion Google temporairement désactivée - Utilisez l'inscription normale");
    
    // Pour une vraie implémentation, utiliser Firebase Auth ou OAuth
    // window.location.href = '/auth/google';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showNotification("Déconnexion réussie");
    
    // Recharger
    loadMyVideos();
    loadWatchHistory();
}

function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    const savedUsers = localStorage.getItem('users');
    
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    updateAuthUI();
}

function updateAuthUI() {
    const signInBtn = document.getElementById('signInBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userNameSpan = document.getElementById('userName');
    
    if (currentUser) {
        signInBtn.style.display = 'none';
        userProfileBtn.style.display = 'flex';
        userNameSpan.textContent = currentUser.name;
        
        // Menu profil
        userProfileBtn.onclick = function(e) {
            e.stopPropagation();
            
            const menu = document.createElement('div');
            menu.className = 'profile-menu';
            menu.style.cssText = `
                position: absolute;
                top: 60px;
                right: 20px;
                background-color: #1a1a1a;
                border: 1px solid #303030;
                border-radius: 8px;
                padding: 10px 0;
                z-index: 1000;
                min-width: 200px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            
            menu.innerHTML = `
                <div class="profile-menu-item" style="padding: 10px 20px; color: #fff; cursor: pointer;" onclick="showSection('my-videos')">
                    <i class="fas fa-video"></i> Mes vidéos
                </div>
                <div class="profile-menu-item" style="padding: 10px 20px; color: #ff4757; cursor: pointer; border-top: 1px solid #303030;" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </div>
            `;
            
            // Supprimer menu existant
            const existingMenu = document.querySelector('.profile-menu');
            if (existingMenu) existingMenu.remove();
            
            document.body.appendChild(menu);
            
            // Fermer en cliquant ailleurs
            setTimeout(() => {
                const closeMenu = function(e) {
                    if (!menu.contains(e.target) && e.target !== userProfileBtn) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 0);
        };
    } else {
        signInBtn.style.display = 'flex';
        userProfileBtn.style.display = 'none';
    }
}

// Gestion des commentaires
function loadComments(comments) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="empty-state">Aucun commentaire pour le moment.</p>';
        return;
    }
    
    comments.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment-item';
        
        div.innerHTML = `
            <div class="comment-author">${comment.author}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-date">${comment.date}</div>
        `;
        
        commentsList.appendChild(div);
    });
}

function addComment() {
    if (!currentUser) {
        showNotification("Connectez-vous pour commenter");
        openAuthModal();
        return;
    }
    
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    
    if (!text) {
        showNotification("Le commentaire ne peut pas être vide");
        return;
    }
    
    if (!currentPlayingVideo) return;
    
    const comment = {
        id: Date.now(),
        author: currentUser.name,
        text: text,
        date: new Date().toLocaleDateString('fr-FR')
    };
    
    // Ajouter au commentaires de la vidéo
    const videoIndex = videos.findIndex(v => v.id === currentPlayingVideo.id);
    if (videoIndex !== -1) {
        if (!videos[videoIndex].comments) {
            videos[videoIndex].comments = [];
        }
        videos[videoIndex].comments.push(comment);
    }
    
    // Mettre à jour l'affichage
    loadComments(videos[videoIndex].comments);
    input.value = '';
    
    // Sauvegarder
    saveToLocalStorage();
    showNotification("Commentaire ajouté!");
}

// Suggestions de vidéos
function loadSuggestions(currentVideoId) {
    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList) return;
    
    suggestionsList.innerHTML = '';
    
    // Suggestions basées sur les vidéos publiques, excluant la vidéo actuelle
    const suggestions = videos
        .filter(v => v.id !== currentVideoId && v.visibility === "public")
        .slice(0, 5);
    
    suggestions.forEach(video => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.onclick = () => openVideoModal(video);
        
        const episodeText = video.episode ? `Ép. ${video.episode}` : '';
        
        div.innerHTML = `
            <div class="suggestion-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
            </div>
            <div class="suggestion-info">
                <div class="suggestion-title">${video.title} ${episodeText}</div>
                <div class="suggestion-channel">${video.channel}</div>
            </div>
        `;
        
        suggestionsList.appendChild(div);
    });
}

// Recherche
function searchVideos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        loadVideos();
        return;
    }
    
    const filteredVideos = videos.filter(v => 
        v.visibility === "public" && (
            v.title.toLowerCase().includes(searchTerm) ||
            v.description.toLowerCase().includes(searchTerm) ||
            (v.tags && v.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        )
    );
    
    // Mettre à jour toutes les sections
    const sections = ['homeVideos', 'trendingVideos', 'animeListVideos'];
    
    sections.forEach(sectionId => {
        const grid = document.getElementById(sectionId);
        if (!grid) return;
        
        grid.innerHTML = '';
        
        filteredVideos.forEach(video => {
            const videoElement = createVideoCard(video);
            grid.appendChild(videoElement);
        });
        
        if (filteredVideos.length === 0) {
            grid.innerHTML = `<p class="empty-state">Aucun résultat pour "${searchTerm}"</p>`;
        }
    });
}

// Dons et paiement
function openDonateModal() {
    document.getElementById('donateModal').style.display = 'flex';
}

function closeDonateModal() {
    document.getElementById('donateModal').style.display = 'none';
}

function selectDonationAmount(amount) {
    document.getElementById('customAmount').value = amount;
    
    // Animation de sélection
    document.querySelectorAll('.donation-amount').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function processPayment() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;
    const country = document.getElementById('country').value;
    const address1 = document.getElementById('address1').value;
    const city = document.getElementById('city').value;
    const postalCode = document.getElementById('postalCode').value;
    const amount = document.getElementById('customAmount').value;
    
    // Validation
    if (!cardNumber || cardNumber.length < 16) {
        showNotification("Numéro de carte invalide");
        return;
    }
    
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showNotification("Date d'expiration invalide (format MM/AA)");
        return;
    }
    
    if (!cvv || cvv.length < 3) {
        showNotification("CVV invalide");
        return;
    }
    
    if (!cardName) {
        showNotification("Nom sur la carte requis");
        return;
    }
    
    if (!country) {
        showNotification("Pays requis");
        return;
    }
    
    if (!address1 || !city || !postalCode) {
        showNotification("Adresse complète requise");
        return;
    }
    
    if (!amount || amount < 1) {
        showNotification("Montant invalide");
        return;
    }
    
    // Simulation de paiement
    showNotification(`💳 Paiement de ${amount}€ en cours...`);
    
    setTimeout(() => {
        closeDonateModal();
        showNotification(`✅ Don de ${amount}€ effectué avec succès! Merci pour votre soutien.`);
        
        // Réinitialiser le formulaire
        document.getElementById('cardNumber').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('cardName').value = '';
        document.getElementById('country').value = '';
        document.getElementById('address1').value = '';
        document.getElementById('address2').value = '';
        document.getElementById('city').value = '';
        document.getElementById('postalCode').value = '';
        document.getElementById('customAmount').value = '';
        
        document.querySelectorAll('.donation-amount').forEach(btn => {
            btn.classList.remove('selected');
        });
    }, 2000);
}

// Supprimer une vidéo
function deleteVideo() {
    if (!currentPlayingVideo || !currentUser) return;
    
    if (currentPlayingVideo.userId !== currentUser.id) {
        showNotification("Vous ne pouvez pas supprimer cette vidéo");
        return;
    }
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette vidéo ?")) {
        return;
    }
    
    // Supprimer des listes
    videos = videos.filter(v => v.id !== currentPlayingVideo.id);
    myVideos = myVideos.filter(v => v.id !== currentPlayingVideo.id);
    
    // Sauvegarder
    saveToLocalStorage();
    
    // Mettre à jour l'interface
    loadVideos();
    loadMyVideos();
    
    // Fermer le modal
    closeVideoModal();
    
    showNotification("✅ Vidéo supprimée avec succès");
}

// Utilitaires
function showNotification(message) {
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notificationMessage');
    
    messageSpan.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function saveToLocalStorage() {
    localStorage.setItem('animeref_videos', JSON.stringify(videos));
    localStorage.setItem('animeref_users', JSON.stringify(users));
    localStorage.setItem('animeref_watchHistory', JSON.stringify(watchHistory));
    localStorage.setItem('animeref_myVideos', JSON.stringify(myVideos));
}

function loadFromLocalStorage() {
    const savedVideos = localStorage.getItem('animeref_videos');
    const savedUsers = localStorage.getItem('animeref_users');
    const savedHistory = localStorage.getItem('animeref_watchHistory');
    const savedMyVideos = localStorage.getItem('animeref_myVideos');
    
    if (savedVideos) videos = JSON.parse(savedVideos);
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedHistory) watchHistory = JSON.parse(savedHistory);
    if (savedMyVideos) myVideos = JSON.parse(savedMyVideos);
}

// Fonctions supplémentaires
function likeVideo() {
    if (!currentUser) {
        showNotification("Connectez-vous pour aimer cette vidéo");
        return;
    }
    
    if (!currentPlayingVideo) return;
    
    const videoIndex = videos.findIndex(v => v.id === currentPlayingVideo.id);
    if (videoIndex !== -1) {
        videos[videoIndex].likes = (videos[videoIndex].likes || 0) + 1;
        document.getElementById('likeCount').textContent = formatNumber(videos[videoIndex].likes);
        saveToLocalStorage();
    }
}

function dislikeVideo() {
    if (!currentUser) {
        showNotification("Connectez-vous pour réagir");
        return;
    }
    
    if (!currentPlayingVideo) return;
    
    const videoIndex = videos.findIndex(v => v.id === currentPlayingVideo.id);
    if (videoIndex !== -1) {
        videos[videoIndex].dislikes = (videos[videoIndex].dislikes || 0) + 1;
        document.getElementById('dislikeCount').textContent = formatNumber(videos[videoIndex].dislikes);
        saveToLocalStorage();
    }
}

function shareVideo() {
    if (!currentPlayingVideo) return;
    
    const url = `${window.location.origin}?video=${currentPlayingVideo.id}`;
    navigator.clipboard.writeText(url).then(() => {
        showNotification("✅ Lien copié dans le presse-papier!");
    });
}

// Afficher une section
function showSection(sectionId) {
    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Afficher la section correspondante
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Recharger les données si nécessaire
    if (sectionId === 'my-videos') {
        loadMyVideos();
    } else if (sectionId === 'history') {
        loadWatchHistory();
    }
}
