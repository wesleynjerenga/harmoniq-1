// Harmoniq Music App

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsList = document.getElementById('results-list');
const cover = document.getElementById('cover');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const progressContainer = document.querySelector('.progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const createPlaylistBtn = document.getElementById('create-playlist');
const newPlaylistNameInput = document.getElementById('new-playlist-name');
const playlistsList = document.getElementById('playlists-list');
const playlistDetail = document.getElementById('playlist-detail');
const playlistName = document.getElementById('playlist-name');
const playlistTracksCount = document.getElementById('playlist-tracks-count');
const playlistTracks = document.getElementById('playlist-tracks');
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsContent = document.getElementById('lyrics-content');

// Spotify API credentials (RapidAPI)
const SPOTIFY_API_KEY = '60bf6e7a2fmsh8ea0c8946871ed0p137bbejsn11ee46bd4091';
const SPOTIFY_TRACK_LYRICS_URL = 'https://spotify23.p.rapidapi.com/track_lyrics/';
const SPOTIFY_SEARCH_URL = 'https://spotify23.p.rapidapi.com/search/';
const SPOTIFY_HOST = 'spotify23.p.rapidapi.com';

// App State
let currentTrack = null;
let isPlaying = false;
let currentPlaylist = null;
let currentTrackIndex = 0;
let audio = new Audio();
let searchResults = [];
let playlists = JSON.parse(localStorage.getItem('harmoniq-playlists')) || [];

// Sample Data (Fallback if API is unavailable)
const sampleTracks = [
    {
        id: '1',
        name: 'Blinding Lights',
        artist: 'The Weeknd',
        image: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        preview_url: 'https://p.scdn.co/mp3-preview/5ef2ea0433761cbd5a0d33ddb4c93130d4442a67'
    },
    {
        id: '2',
        name: 'Shape of You',
        artist: 'Ed Sheeran',
        image: 'https://i.scdn.co/image/ab67616d0000b2737fec9eb3be5cef0e6a645e2a',
        preview_url: 'https://p.scdn.co/mp3-preview/07c6c33d6426d61ffd2f2c7d0549df563b577f68'
    },
    {
        id: '3',
        name: 'Dance Monkey',
        artist: 'Tones and I',
        image: 'https://i.scdn.co/image/ab67616d0000b273c6b577e4c4a6d326354a89f8',
        preview_url: 'https://p.scdn.co/mp3-preview/a33f81866ab796a7e2fcd724d91589f6b9e12f77'
    },
    {
        id: '4',
        name: 'Bad Guy',
        artist: 'Billie Eilish',
        image: 'https://i.scdn.co/image/ab67616d0000b273d55d008c55753f5acda1c5c7',
        preview_url: 'https://p.scdn.co/mp3-preview/d25a28a5d3c1e3707eb42b6f74be8dee1b0c5cca'
    },
    {
        id: '5',
        name: 'Someone You Loved',
        artist: 'Lewis Capaldi',
        image: 'https://i.scdn.co/image/ab67616d0000b27356ff57d29b4af93d80740d09',
        preview_url: 'https://p.scdn.co/mp3-preview/9af189ce3d4ab32be652e400eb6e8f798a2be7e7'
    }
];

// Initialize the app
function init() {
    // Set default image - using an external placeholder service
    cover.src = 'https://via.placeholder.com/250x250?text=Select+a+Track';
    
    // Load and display playlists
    renderPlaylists();
    
    // Event listeners
    setupEventListeners();
    
    // Set up audio events
    setupAudioEvents();
}

// Set up event listeners
function setupEventListeners() {
    // Search
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Player controls
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    progressContainer.addEventListener('click', setProgress);
    
    // Tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Playlist
    createPlaylistBtn.addEventListener('click', createPlaylist);
}

// Set up audio events
function setupAudioEvents() {
    // Time update
    audio.addEventListener('timeupdate', updateProgress);
    
    // Song ended
    audio.addEventListener('ended', playNext);
    
    // Can play
    audio.addEventListener('canplay', () => {
        durationEl.textContent = formatTime(audio.duration);
    });
}

// Handle search
function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Clear previous results
    resultsList.innerHTML = '';
    
    // Show loading state
    resultsList.innerHTML = '<div class="loading">Searching...</div>';
    
    // Set up the API request options
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': SPOTIFY_API_KEY,
            'X-RapidAPI-Host': SPOTIFY_HOST
        }
    };
    
    // Create search URL with query parameters
    // RapidAPI Spotify endpoint requires specific parameters
    const searchUrl = `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=tracks&numberOfTopResults=10`;
    
    // Make the API request
    fetch(searchUrl, options)
        .then(response => {
            // If API request fails, use sample data as fallback
            if (!response.ok) {
                throw new Error('API request failed');
            }
            return response.json();
        })
        .then(data => {
            console.log('API Response:', data); // Log the full response for debugging
            // Process API data
            if (data && data.tracks && data.tracks.items) {
                searchResults = data.tracks.items.map(item => {
                    // Log individual item structure for debugging
                    console.log('Track item:', item);
                    
                    // Extract track object based on API response structure
                    const track = item.data || item;
                    
                    // Try to find image URL - RapidAPI structure can vary
                    let imageUrl = 'https://via.placeholder.com/80x80?text=No+Image';
                    
                    // Check various possible paths to the image
                    if (track.albumOfTrack?.coverArt?.sources?.length > 0) {
                        imageUrl = track.albumOfTrack.coverArt.sources[0].url;
                    } else if (track.album?.images?.length > 0) {
                        imageUrl = track.album.images[0].url;
                    } else if (track.albumOfTrack?.album?.coverArt?.sources?.length > 0) {
                        imageUrl = track.albumOfTrack.album.coverArt.sources[0].url;
                    } else if (item.album?.images?.length > 0) {
                        imageUrl = item.album.images[0].url;
                    }
                    
                    // Create a standardized track object
                    return {
                        id: track.id || '',
                        name: track.name || 'Unknown Track',
                        artist: track.artists?.items?.[0]?.profile?.name || 
                                track.artists?.[0]?.name || 
                                'Unknown Artist',
                        image: imageUrl,
                        preview_url: track.previews?.audioPreview?.url || 
                                    track.preview_url || 
                                    ''
                    };
                });
            } else {
                // Fallback to empty array if no results
                searchResults = [];
                console.error('Unexpected API response structure:', data);
            }
            renderSearchResults();
        })
        .catch(error => {
            console.error('Error searching tracks:', error);
            // Fallback to sample data if API fails
            searchResults = sampleTracks.filter(track => 
                track.name.toLowerCase().includes(query.toLowerCase()) ||
                track.artist.toLowerCase().includes(query.toLowerCase())
            );
            renderSearchResults();
        });
}

// Render search results
function renderSearchResults() {
    resultsList.innerHTML = '';
    
    if (searchResults.length === 0) {
        resultsList.innerHTML = '<div class="no-results">No tracks found</div>';
        return;
    }
    
    searchResults.forEach(track => {
        const li = document.createElement('li');
        li.className = 'track-item';
        li.innerHTML = `
            <img src="${track.image}" alt="${track.name}" class="track-img">
            <div class="track-details">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-actions">
                <button class="play-track" data-id="${track.id}">Play</button>
                <button class="add-to-playlist" data-id="${track.id}">Add to Playlist</button>
            </div>
        `;
        
        resultsList.appendChild(li);
        
        // Add event listeners
        li.querySelector('.play-track').addEventListener('click', () => {
            playTrack(track);
        });
        
        li.querySelector('.add-to-playlist').addEventListener('click', () => {
            if (playlists.length === 0) {
                alert('Create a playlist first!');
                switchTab('playlists');
                return;
            }
            
            showAddToPlaylistModal(track);
        });
    });
}

// Play a track
function playTrack(track) {
    currentTrack = track;
    
    // Update player UI
    cover.src = track.image;
    title.textContent = track.name;
    artist.textContent = track.artist;
    
    // Set audio source
    audio.src = track.preview_url;
    audio.play();
    
    // Update play button
    isPlaying = true;
    playBtn.textContent = 'Pause';
    
    // Fetch lyrics if available
    fetchLyrics(track.id);
}

// Fetch lyrics from Spotify API
function fetchLyrics(trackId) {
    // Hide lyrics container while loading
    lyricsContainer.classList.add('hidden');
    lyricsContent.textContent = 'Loading lyrics...';
    
    // Set up request options
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': SPOTIFY_API_KEY,
            'X-RapidAPI-Host': SPOTIFY_HOST
        }
    };
    
    // Construct URL for lyrics API
    const lyricsUrl = `${SPOTIFY_TRACK_LYRICS_URL}?id=${trackId}`;
    
    // Make the API request
    fetch(lyricsUrl, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch lyrics');
            }
            return response.json();
        })
        .then(data => {
            // Process lyrics data
            if (data && data.lyrics && data.lyrics.lines) {
                // Extract lyrics text from lines
                const lyricsText = data.lyrics.lines
                    .map(line => line.words)
                    .join('\n');
                
                // Display lyrics
                if (lyricsText.trim()) {
                    lyricsContent.textContent = lyricsText;
                    lyricsContainer.classList.remove('hidden');
                } else {
                    lyricsContent.textContent = 'No lyrics available';
                    lyricsContainer.classList.remove('hidden');
                }
            } else {
                // No lyrics found
                lyricsContent.textContent = 'No lyrics available';
                lyricsContainer.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error fetching lyrics:', error);
            lyricsContent.textContent = 'Could not load lyrics';
            lyricsContainer.classList.remove('hidden');
        });
}

// Toggle play/pause
function togglePlay() {
    if (!currentTrack) return;
    
    if (isPlaying) {
        audio.pause();
        playBtn.textContent = 'Play';
    } else {
        audio.play();
        playBtn.textContent = 'Pause';
    }
    
    isPlaying = !isPlaying;
}

// Play previous track
function playPrevious() {
    if (!currentTrack) return;
    
    if (currentPlaylist) {
        // Play previous track in playlist
        currentTrackIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : currentPlaylist.tracks.length - 1;
        const trackId = currentPlaylist.tracks[currentTrackIndex];
        const track = findTrackById(trackId);
        if (track) playTrack(track);
    } else if (searchResults.length > 0) {
        // Play previous track in search results
        const currentIndex = searchResults.findIndex(t => t.id === currentTrack.id);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : searchResults.length - 1;
        playTrack(searchResults[prevIndex]);
    }
}

// Play next track
function playNext() {
    if (!currentTrack) return;
    
    if (currentPlaylist) {
        // Play next track in playlist
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.tracks.length;
        const trackId = currentPlaylist.tracks[currentTrackIndex];
        const track = findTrackById(trackId);
        if (track) playTrack(track);
    } else if (searchResults.length > 0) {
        // Play next track in search results
        const currentIndex = searchResults.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % searchResults.length;
        playTrack(searchResults[nextIndex]);
    }
}

// Update progress bar
function updateProgress() {
    const { currentTime, duration } = audio;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    currentTimeEl.textContent = formatTime(currentTime);
}

// Set progress
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    
    audio.currentTime = (clickX / width) * duration;
}

// Format time to MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    
    // Update tab panes
    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === tabName);
    });
}

// Create a new playlist
function createPlaylist() {
    const name = newPlaylistNameInput.value.trim();
    
    if (!name) {
        alert('Please enter a playlist name');
        return;
    }
    
    const newPlaylist = {
        id: Date.now().toString(),
        name,
        tracks: []
    };
    
    playlists.push(newPlaylist);
    savePlaylists();
    
    // Reset input
    newPlaylistNameInput.value = '';
    
    // Render playlists
    renderPlaylists();
    
    // Show the new playlist
    showPlaylistDetail(newPlaylist);
}

// Render playlists
function renderPlaylists() {
    playlistsList.innerHTML = '';
    
    if (playlists.length === 0) {
        playlistsList.innerHTML = '<div class="no-playlists">No playlists yet</div>';
        return;
    }
    
    playlists.forEach(playlist => {
        const li = document.createElement('li');
        li.className = 'playlist-card';
        li.innerHTML = `
            <h4>${playlist.name}</h4>
            <p>${playlist.tracks.length} tracks</p>
        `;
        
        li.addEventListener('click', () => {
            showPlaylistDetail(playlist);
        });
        
        playlistsList.appendChild(li);
    });
}

// Show playlist detail
function showPlaylistDetail(playlist) {
    currentPlaylist = playlist;
    
    playlistName.textContent = playlist.name;
    playlistTracksCount.textContent = `${playlist.tracks.length} tracks`;
    
    // Show the detail section
    playlistDetail.classList.remove('hidden');
    
    // Render tracks
    renderPlaylistTracks(playlist);
}

// Render playlist tracks
function renderPlaylistTracks(playlist) {
    playlistTracks.innerHTML = '';
    
    if (playlist.tracks.length === 0) {
        playlistTracks.innerHTML = '<div class="no-tracks">No tracks in this playlist</div>';
        return;
    }
    
    playlist.tracks.forEach((trackId, index) => {
        const track = findTrackById(trackId);
        
        if (!track) return;
        
        const li = document.createElement('li');
        li.className = 'track-item';
        li.innerHTML = `
            <img src="${track.image}" alt="${track.name}" class="track-img">
            <div class="track-details">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-actions">
                <button class="play-track" data-id="${track.id}">Play</button>
                <button class="remove-track" data-index="${index}">Remove</button>
            </div>
        `;
        
        playlistTracks.appendChild(li);
        
        // Add event listeners
        li.querySelector('.play-track').addEventListener('click', () => {
            currentTrackIndex = index;
            playTrack(track);
        });
        
        li.querySelector('.remove-track').addEventListener('click', () => {
            removeTrackFromPlaylist(playlist, index);
        });
    });
}

// Find track by ID
function findTrackById(id) {
    return sampleTracks.find(track => track.id === id);
}

// Show add to playlist modal
function showAddToPlaylistModal(track) {
    // In a real app, you'd show a modal with a list of playlists
    // For this demo, we'll use a simple prompt
    const playlistNames = playlists.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const choice = prompt(`Select a playlist number to add "${track.name}":\n${playlistNames}`);
    
    if (!choice) return;
    
    const index = parseInt(choice) - 1;
    
    if (isNaN(index) || index < 0 || index >= playlists.length) {
        alert('Invalid selection');
        return;
    }
    
    addTrackToPlaylist(playlists[index], track.id);
}

// Add track to playlist
function addTrackToPlaylist(playlist, trackId) {
    // Check if track already exists in playlist
    if (playlist.tracks.includes(trackId)) {
        alert('This track is already in the playlist');
        return;
    }
    
    playlist.tracks.push(trackId);
    savePlaylists();
    
    // Update UI if current playlist is being viewed
    if (currentPlaylist && currentPlaylist.id === playlist.id) {
        showPlaylistDetail(playlist);
    }
    
    alert('Track added to playlist');
}

// Remove track from playlist
function removeTrackFromPlaylist(playlist, index) {
    playlist.tracks.splice(index, 1);
    savePlaylists();
    
    // Update UI
    showPlaylistDetail(playlist);
}

// Save playlists to localStorage
function savePlaylists() {
    localStorage.setItem('harmoniq-playlists', JSON.stringify(playlists));
}

// Initialize the app
init();