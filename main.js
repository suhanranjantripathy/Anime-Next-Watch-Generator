document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://api.jikan.moe/v4';

    // Elements
    const heroImage = document.getElementById('hero-image');
    const heroTitle = document.getElementById('hero-title');
    const heroSynopsis = document.getElementById('hero-synopsis');
    const heroWatchBtn = document.getElementById('hero-watch-btn');
    
    const popularContent = document.getElementById('popular-content');
    const gridLoader = document.getElementById('grid-loader');
    
    const filterGenre = document.getElementById('filter-genre');
    const filterType = document.getElementById('filter-type');
    const filterStatus = document.getElementById('filter-status');
    const filterOrder = document.getElementById('filter-order');
    const sidebarSearchBtn = document.getElementById('sidebar-search-btn');
    
    const topAnimeList = document.getElementById('top-anime-list');
    const listLoader = document.getElementById('list-loader');
    
    const searchInput = document.getElementById('search-input');
    const searchIconBtn = document.querySelector('.search-icon-btn');
    
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
        const topData = await fetchGridData('https://api.jikan.moe/v4/top/anime?filter=airing&limit=12');
        if (topData) {
            currentHeroList = topData;
            setRandomHero();
        }

        fetchTopList('https://api.jikan.moe/v4/top/anime?limit=10');
    }

    function setupEventListeners() {
        // Hero Random Pick
        heroWatchBtn.addEventListener('click', () => {
            setRandomHero();
        });

        // Sidebar Search
        sidebarSearchBtn.addEventListener('click', () => {
            const url = buildSearchUrl();
            fetchGridData(url);
        });

        // Navbar Search
        searchIconBtn.addEventListener('click', () => {
            const q = searchInput.value.trim();
            if (q) {
                const url = `${API_BASE}/anime?q=${encodeURIComponent(q)}&sfw=true`;
                fetchGridData(url);
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

    async function fetchGridData(url) {
        popularContent.innerHTML = '';
        gridLoader.style.display = 'block';
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('API Rate Limit or Error');
            const data = await response.json();
            
            gridLoader.style.display = 'none';
            renderGrid(data.data || []);
            
            // Only update hero list if we get results
            if (data.data && data.data.length > 0) {
                currentHeroList = data.data;
            }
            return data.data;
        } catch (error) {
            console.error('Error fetching grid data', error);
            gridLoader.style.display = 'none';
            popularContent.innerHTML = `<p style="color:var(--text-muted);">Error fetching results.</p>`;
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
            topAnimeList.innerHTML = `<p style="color:var(--text-muted);">Error fetching list.</p>`;
        }
    }

    function renderGrid(animeArray) {
        if(animeArray.length === 0) {
            popularContent.innerHTML = `<p style="color:var(--text-muted)">No anime found.</p>`;
            return;
        }

        animeArray.forEach(anime => {
            const clone = gridCardTemplate.content.cloneNode(true);
            
            clone.querySelector('.card-img').src = anime.images?.webp?.large_image_url || '';
            clone.querySelector('.card-title').textContent = anime.title_english || anime.title;
            
            // Badges
            const typeBadge = clone.querySelector('.type-badge');
            typeBadge.textContent = anime.type || 'TV';
            
            // Add completed badge if finished
            if (anime.status === 'Finished Airing') {
                const statusBadge = document.createElement('span');
                statusBadge.className = 'badge status-completed';
                statusBadge.textContent = 'COMPLETED';
                clone.querySelector('.card-badges').appendChild(statusBadge);
            }

            popularContent.appendChild(clone);
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

            topAnimeList.appendChild(clone);
        });
    }

    function setRandomHero() {
        if (!currentHeroList || currentHeroList.length === 0) return;
        
        const anime = currentHeroList[Math.floor(Math.random() * currentHeroList.length)];
        
        // Use a high-res image or standard cover
        const imgUrl = anime.trailer?.images?.maximum_image_url || anime.images?.webp?.large_image_url;
        
        heroImage.src = imgUrl || '';
        
        // Fade in effect
        heroImage.classList.remove('loaded');
        heroImage.onload = () => heroImage.classList.add('loaded');
        
        heroTitle.textContent = anime.title_english || anime.title;
        heroSynopsis.textContent = anime.synopsis ? anime.synopsis.replace(/\[Written by MAL Rewrite\]/g, '').trim() : 'No synopsis available.';
    }
});
