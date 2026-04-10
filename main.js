document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://api.jikan.moe/v4';

    // Elements
    const heroImage = document.getElementById('hero-image');
    const heroTitle = document.getElementById('hero-title');
    const heroSynopsis = document.getElementById('hero-synopsis');
    const heroWatchBtn = document.getElementById('hero-watch-btn');
    
    const popularContent = document.getElementById('popular-content');
    const gridLoader = document.getElementById('grid-loader');
    
    const upcomingContent = document.getElementById('upcoming-content');
    const upcomingLoader = document.getElementById('upcoming-loader');

    const filterGenre = document.getElementById('filter-genre');
    const filterType = document.getElementById('filter-type');
    const filterStatus = document.getElementById('filter-status');
    const filterOrder = document.getElementById('filter-order');
    const sidebarSearchBtn = document.getElementById('sidebar-search-btn');
    
    const topAnimeList = document.getElementById('top-anime-list');
    const listLoader = document.getElementById('list-loader');
    
    const searchInput = document.getElementById('search-input');
    const searchIconBtn = document.querySelector('.search-icon-btn');
    const logo = document.querySelector('.logo');
    
    // Modal Elements
    const modal = document.getElementById('anime-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalStatus = document.getElementById('modal-status');
    const modalRating = document.getElementById('modal-rating');
    const modalScore = document.getElementById('modal-score');
    const modalEpisodes = document.getElementById('modal-episodes');
    const modalStudios = document.getElementById('modal-studios');
    const modalGenres = document.getElementById('modal-genres');
    const modalSynopsis = document.getElementById('modal-synopsis');
    const modalStreaming = document.getElementById('modal-streaming');
    const modalCharacters = document.getElementById('modal-characters');
    const modalTrailer = document.getElementById('modal-trailer');
    const modalTrailerLink = document.getElementById('modal-trailer-link');
    const modalTrailerSection = document.getElementById('modal-trailer-section');

    // Templates
    const gridCardTemplate = document.getElementById('grid-card-template');
    const listItemTemplate = document.getElementById('list-item-template');

    // State Variables
    let currentHeroList = [];
    
    init();

    async function init() {
        setupEventListeners();
        loadGenres();
        
        // Initial fetches
        const topData = await fetchGridData('https://api.jikan.moe/v4/top/anime?filter=airing&limit=12', popularContent, gridLoader);
        if (topData) {
            currentHeroList = topData;
            setRandomHero();
        }

        fetchGridData('https://api.jikan.moe/v4/seasons/upcoming?limit=12', upcomingContent, upcomingLoader);
        fetchTopList('https://api.jikan.moe/v4/top/anime?limit=10');
    }

    function setupEventListeners() {
        // Reset on logo click
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.reload();
        });

        // Hero Random Pick - Use random API directly
        heroWatchBtn.addEventListener('click', async () => {
            const originalText = heroWatchBtn.textContent;
            heroWatchBtn.textContent = 'Generating...';
            try {
                const response = await fetch(`${API_BASE}/random/anime`);
                const data = await response.json();
                if(data.data) {
                    updateHero(data.data);
                }
            } catch(e) {
                console.error(e);
            }
            heroWatchBtn.textContent = originalText;
        });

        // Sidebar Search
        sidebarSearchBtn.addEventListener('click', () => {
            const url = buildSearchUrl();
            document.querySelector('.section-title').textContent = 'Filter Results';
            fetchGridData(url, popularContent, gridLoader);
            
            // Hide upcoming and announcement during search results
            document.getElementById('upcoming-content').parentElement.style.display = 'none';
            document.querySelector('.announcement').style.display = 'none';
        });

        // Navbar Search
        searchIconBtn.addEventListener('click', () => {
            const q = searchInput.value.trim();
            if (q) {
                const url = `${API_BASE}/anime?q=${encodeURIComponent(q)}&sfw=true&limit=20`;
                document.querySelector('.section-title').textContent = `Search Results: "${q}"`;
                fetchGridData(url, popularContent, gridLoader);
                
                // Hide upcoming and announcement
                document.getElementById('upcoming-content').parentElement.style.display = 'none';
                document.querySelector('.announcement').style.display = 'none';
            }
        });

        // Press Enter on search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchIconBtn.click();
            }
        });

        // Tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // remove active class
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                if(e.target.textContent === 'Top Anime') {
                    fetchTopList('https://api.jikan.moe/v4/top/anime?limit=10');
                } else if(e.target.textContent === 'Trending') {
                    fetchTopList('https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=10');
                }
            });
        });

        // Modal Close
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            modalTrailer.src = ''; // stop trailer
            modalTrailerLink.href = '#';
        });
        window.addEventListener('click', (e) => {
            if (e.target == modal) {
                modal.style.display = 'none';
                modalTrailer.src = '';
                modalTrailerLink.href = '#';
            }
        });
    }

    async function loadGenres() {
        try {
            const response = await fetch(`${API_BASE}/genres/anime`);
            const data = await response.json();
            const genres = data.data.filter(g => g.count > 100);
            
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.mal_id;
                option.textContent = genre.name;
                filterGenre.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load genres:', error);
        }
    }

    function buildSearchUrl() {
        let url = `${API_BASE}/anime?sfw=true&limit=12`;
        
        if (filterGenre.value) url += `&genres=${filterGenre.value}`;
        if (filterType.value) url += `&type=${filterType.value}`;
        if (filterStatus.value) url += `&status=${filterStatus.value}`;
        if (filterOrder.value) url += `&order_by=${filterOrder.value}&sort=desc`;
        
        return url;
    }

    async function fetchGridData(url, container, loader) {
        container.innerHTML = '';
        loader.style.display = 'block';
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('API Rate Limit or Error');
            const data = await response.json();
            
            loader.style.display = 'none';
            renderGrid(data.data || [], container);
            
            return data.data;
        } catch (error) {
            console.error('Error fetching grid data', error);
            loader.style.display = 'none';
            container.innerHTML = `<p style="color:var(--text-muted);">Error fetching results. API rate limits reached likely.</p>`;
            return null;
        }
    }

    async function fetchTopList(url) {
        topAnimeList.innerHTML = '';
        listLoader.style.display = 'block';
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            
            listLoader.style.display = 'none';
            renderTopList(data.data || []);
        } catch (error) {
            console.error('Error fetching list data', error);
            listLoader.style.display = 'none';
            topAnimeList.innerHTML = `<p style="color:var(--text-muted);">Error fetching list. Try again later.</p>`;
        }
    }

    function renderGrid(animeArray, container) {
        if(animeArray.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted)">No anime found.</p>`;
            return;
        }

        animeArray.forEach(anime => {
            const clone = gridCardTemplate.content.cloneNode(true);
            
            clone.querySelector('.card-img').src = anime.images?.webp?.large_image_url || '';
            clone.querySelector('.card-title').textContent = anime.title_english || anime.title;
            
            // Add episode badge
            if (anime.episodes) {
                const epBadge = document.createElement('span');
                epBadge.className = 'badge ep-badge';
                epBadge.textContent = `EP ${anime.episodes}`;
                clone.querySelector('.card-badges').appendChild(epBadge);
            }

            // Add completed badge if finished
            if (anime.status === 'Finished Airing') {
                const statusBadge = document.createElement('span');
                statusBadge.className = 'badge status-completed';
                statusBadge.textContent = 'FINISHED';
                clone.querySelector('.card-badges').appendChild(statusBadge);
            }

            // Click event to open modal
            const cardElement = clone.querySelector('.anime-card');
            cardElement.addEventListener('click', () => {
                openAnimeModal(anime.mal_id);
            });

            container.appendChild(clone);
        });
    }

    function renderTopList(animeArray) {
        animeArray.forEach((anime, index) => {
            const clone = listItemTemplate.content.cloneNode(true);
            
            clone.querySelector('.rank').textContent = index + 1;
            clone.querySelector('.list-img').src = anime.images?.webp?.small_image_url || '';
            clone.querySelector('.list-title').textContent = anime.title_english || anime.title;
            
            // Genres handling
            const genresArr = anime.genres ? anime.genres.map(g => g.name).join(', ') : '';
            clone.querySelector('.list-genres span').textContent = genresArr || 'Unknown';
            
            clone.querySelector('.score').textContent = anime.score || 'N/0';

            // Convert raw score to stars (rough approximation)
            const scoreNum = parseFloat(anime.score) || 0;
            const starText = '★'.repeat(Math.round(scoreNum / 2)) + '☆'.repeat(5 - Math.round(scoreNum / 2));
            clone.querySelector('.stars').textContent = starText;

            // Click event
            const listItemElem = clone.querySelector('.list-item');
            listItemElem.addEventListener('click', () => {
                openAnimeModal(anime.mal_id);
            });

            topAnimeList.appendChild(clone);
        });
    }

    function setRandomHero() {
        if (!currentHeroList || currentHeroList.length === 0) return;
        const anime = currentHeroList[Math.floor(Math.random() * currentHeroList.length)];
        updateHero(anime);
    }

    function updateHero(anime) {
        // Use a high-res image or standard cover
        const imgUrl = anime.trailer?.images?.maximum_image_url || anime.images?.webp?.large_image_url;
        heroImage.src = imgUrl || '';
        
        // Fade in effect
        heroImage.classList.remove('loaded');
        heroImage.onload = () => heroImage.classList.add('loaded');
        
        heroTitle.textContent = anime.title_english || anime.title;
        heroSynopsis.textContent = anime.synopsis ? anime.synopsis.replace(/\[Written by MAL Rewrite\]/g, '').trim() : 'No synopsis available.';
    }

    async function openAnimeModal(mal_id) {
        modal.style.display = 'block';
        modalTitle.textContent = 'Loading...';
        modalSynopsis.textContent = '';
        modalCharacters.innerHTML = '';
        modalTrailer.src = '';
        modalImg.src = '';
        
        try {
            // Fetch detailed anime info
            const resInfo = await fetch(`${API_BASE}/anime/${mal_id}/full`);
            const infoData = await resInfo.json();
            const anime = infoData.data;

            if(!anime) return;

            modalTitle.textContent = anime.title_english || anime.title;
            modalImg.src = anime.images?.webp?.large_image_url || '';
            modalStatus.textContent = anime.status || 'Unknown';
            modalRating.textContent = anime.rating || 'N/A';
            modalScore.textContent = `Score: ${anime.score || 'N/A'}`;
            modalEpisodes.textContent = anime.episodes || 'Unknown';
            modalStudios.textContent = anime.studios ? anime.studios.map(s => s.name).join(', ') : 'Unknown';
            modalGenres.textContent = anime.genres ? anime.genres.map(g => g.name).join(', ') : 'Unknown';
            modalSynopsis.textContent = anime.synopsis ? anime.synopsis.replace(/\[Written by MAL Rewrite\]/g, '').trim() : 'No synopsis available.';
            
            // Where to Watch
            modalStreaming.innerHTML = '';
            if (anime.streaming && anime.streaming.length > 0) {
                anime.streaming.forEach(stream => {
                    const a = document.createElement('a');
                    a.href = stream.url;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.className = 'streaming-link';
                    a.textContent = stream.name;
                    modalStreaming.appendChild(a);
                });
            } else {
                modalStreaming.innerHTML = '<p style="color:var(--text-muted); font-size: 0.95rem;">No streaming details available.</p>';
            }

            if (anime.trailer && anime.trailer.youtube_id) {
                modalTrailer.src = `https://www.youtube.com/embed/${anime.trailer.youtube_id}`;
                modalTrailerSection.style.display = 'block';
                modalTrailerLink.href = `https://www.youtube.com/watch?v=${anime.trailer.youtube_id}`;
            } else {
                modalTrailerSection.style.display = 'none';
            }

            // Fetch Characters
            // To avoid rapid rate limits, add a slight delay or just fetch parallel
            const resChars = await fetch(`${API_BASE}/anime/${mal_id}/characters`);
            const charsData = await resChars.json();
            const chars = charsData.data || [];

            // Display top 10 characters
            modalCharacters.innerHTML = '';
            const topChars = chars.slice(0, 15);
            if(topChars.length === 0) {
                modalCharacters.innerHTML = '<p style="color:var(--text-muted);">No characters found.</p>';
            } else {
                topChars.forEach(c => {
                    const charDiv = document.createElement('div');
                    charDiv.className = 'character-card';
                    const imgUrl = c.character.images?.webp?.image_url || '';
                    const role = c.role || '';
                    charDiv.innerHTML = `
                        <img src="${imgUrl}" alt="${c.character.name}" loading="lazy">
                        <div class="char-name">${c.character.name}</div>
                        <p>${role}</p>
                    `;
                    modalCharacters.appendChild(charDiv);
                });
            }

        } catch(error) {
            console.error('Failed to load modal details', error);
            modalTitle.textContent = 'Error loading details.';
        }
    }
});
