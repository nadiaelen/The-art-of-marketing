// ============================================================
//  CONFIGURATION
// ============================================================
const SHEET_ID = '1CTXoFgH1b77PzIj4qog5-T0R5C0sNLTENA4WJUxfpGs';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Form+Responses+1`;
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOEJARetDed_hlfS9W8vT5QUd5p2O6vz2xYyrWuiWVZzqFeNJt4deZGoGD2nQAmGEP9w/exec';

// ============================================================
//  COLUMN MAP — adjust numbers to match your Sheet column order
//  Count from 0: A=0, B=1, C=2, D=3, E=4, F=5 ...
//  Column A is always "Timestamp" (added automatically by Google Forms)
// ============================================================
const COL = {
  timestamp:   0,  // A — Timestamp
  email:       1,  // B — Email Address
  student:     2,  // C — Student Name (First and Last)
  unlvEmail:   3,  // D — UNLV Email Address
  major:       4,  // E — Major / Program of Study
  year:        5,  // F — Current Year of Study
  title:       6,  // G — Artwork Title
  category:    7,  // H — Submission Category
  description: 8,  // I — Artwork Description
  imageUrl:    9,  // J — Upload Artwork File
};

// ============================================================
//  STATE
// ============================================================
let allSubmissions = [];
let likesMap = {}; // { "Artwork Title": likeCount }

const galleryGrid    = document.getElementById('galleryGrid');
const searchInput    = document.getElementById('search');
const categorySelect = document.getElementById('categoryFilter');
const galleryBadge   = document.getElementById('galleryBadge');
const statCount      = document.getElementById('statCount');
const featuredList   = document.getElementById('featuredList');
const likedList      = document.getElementById('likedList');

// ============================================================
//  LOAD SHEET
// ============================================================
async function loadSheet() {
  galleryGrid.innerHTML = '<p class="loading-msg">Loading submissions…</p>';
  if (galleryBadge) galleryBadge.textContent = 'Loading…';

  try {
    const [res, likesRes] = await Promise.all([
      fetch(SHEET_CSV_URL),
      fetch(`${APPS_SCRIPT_URL}?action=getLikes`).catch(() => null)
    ]);
    if (!res.ok) throw new Error('Network error');
    const csv = await res.text();
    if (likesRes && likesRes.ok) {
      likesMap = await likesRes.json();
    }
    allSubmissions = parseCSV(csv);

    const count = allSubmissions.length;
    if (statCount)    statCount.textContent    = count;
    if (galleryBadge) galleryBadge.textContent = `${count} submission${count !== 1 ? 's' : ''}`;

    populateFeatured();
    populateLiked();
    applyFilters();
  } catch (err) {
    galleryGrid.innerHTML = `
      <div class="error-msg">
        <p>⚠️ Could not load submissions.</p>
        <p><small>Make sure your Google Sheet is shared as "Anyone with the link can view", then click ↻ Refresh.</small></p>
      </div>`;
    if (galleryBadge) galleryBadge.textContent = 'Error';
    console.error('Sheet load error:', err);
  }
}

// ============================================================
//  CSV PARSER
// ============================================================
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  return lines.slice(1)
    .map(line => splitCSVLine(line))
    .filter(row => row.length > COL.title && row[COL.title]?.trim())
    .map(row => ({
      timestamp:   row[COL.timestamp]   || '',
      title:       row[COL.title]        || 'Untitled',
      student:     row[COL.student]      || 'Anonymous',
      major:       row[COL.major]        || '',
      category:    row[COL.category]     || 'Uncategorized',
      description: row[COL.description]  || '',
      imageUrl:    row[COL.imageUrl]     || '',
    }));
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ============================================================
//  RENDER GALLERY
// ============================================================
function render(items) {
  if (items.length === 0) {
    galleryGrid.innerHTML = '<p class="empty-msg">No submissions match your search.</p>';
    return;
  }

  const liked = getLiked();
  galleryGrid.innerHTML = items.map(item => {
    const alreadyLiked = liked.includes(item.title);
    return `
    <article class="gallery-item">
      ${item.imageUrl ? `<div class="gallery-img"><img src="${escHtml(driveUrl(item.imageUrl))}" alt="${escHtml(item.title)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : ''}
      <div class="tags">
        <span class="tag">${escHtml(item.category.split('(')[0].trim())}</span>
      </div>
      <h3>${escHtml(item.title)}</h3>
      <p class="student">${escHtml(item.student)}${item.major ? ' · ' + escHtml(item.major) : ''}</p>
      <p class="desc">${escHtml(item.description)}</p>
      <div class="footer">
        ${item.timestamp ? `<span>Submitted ${formatDate(item.timestamp)}</span>` : '<span></span>'}
        <button class="like-btn ${alreadyLiked ? 'liked' : ''}"
          ${alreadyLiked ? 'disabled title="You already liked this"' : ''}
          onclick="likeWork(this, '${escHtml(item.title).replace(/'/g, "\\'")}')">
          ♡ <span class="like-count">${likesMap[item.title] || 0}</span>
        </button>
      </div>
    </article>`;
  }).join('');
}

// ============================================================
//  FEATURED & MOST LIKED PANELS
//  Shows the first 3 entries in Featured, last 3 in Most Liked
//  (swap logic here once you have a "likes" or "featured" column)
// ============================================================
function populateFeatured() {
  if (!featuredList) return;
  const items = allSubmissions.slice(0, 3);
  featuredList.innerHTML = items.length
    ? items.map(item => `<div class="mini-item"><strong>${escHtml(item.title)}</strong><span>${escHtml(item.student)}</span></div>`).join('')
    : '<p class="note">No featured works yet.</p>';
}

function populateLiked() {
  if (!likedList) return;
  // Sort all submissions by like count descending, take top 5
  const sorted = [...allSubmissions]
    .map(item => ({ ...item, likes: likesMap[item.title] || 0 }))
    .filter(item => item.likes > 0)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  likedList.innerHTML = sorted.length
    ? sorted.map(item => `
        <div class="mini-item">
          <strong>${escHtml(item.title)}</strong>
          <span>${escHtml(item.student)} · ${item.likes} like${item.likes !== 1 ? 's' : ''}</span>
        </div>`).join('')
    : '<p class="note">No likes yet — be the first to vote!</p>';
}

// ============================================================
//  FILTER + SEARCH
// ============================================================
function applyFilters() {
  const q   = searchInput.value.toLowerCase().trim();
  const cat = categorySelect.value;

  const results = allSubmissions.filter(item => {
    const text = `${item.title} ${item.student} ${item.major} ${item.category} ${item.description}`.toLowerCase();
    return (!q || text.includes(q)) && (cat === 'All' || item.category === cat);
  });

  render(results);
}

searchInput.addEventListener('input', applyFilters);
categorySelect.addEventListener('change', applyFilters);

// ============================================================
//  HELPERS
// ============================================================
// Converts Google Drive share links to direct displayable image URLs
function driveUrl(url) {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`;
  return url;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(ts) {
  try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ts; }
}

// ============================================================
//  LIKES
// ============================================================
function getLiked() {
  try { return JSON.parse(localStorage.getItem('likedWorks') || '[]'); }
  catch { return []; }
}

function saveLiked(liked) {
  try { localStorage.setItem('likedWorks', JSON.stringify(liked)); }
  catch {}
}

async function likeWork(btn, title) {
  const liked = getLiked();
  if (liked.includes(title)) return; // already liked

  btn.disabled = true;
  btn.style.opacity = '0.6';
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=like&title=${encodeURIComponent(title)}`);
    const data = await res.json();
    if (data.success) {
      likesMap[title] = data.likes;
      btn.querySelector('.like-count').textContent = data.likes;
      btn.classList.add('liked');
      btn.title = 'You already liked this';
      liked.push(title);
      saveLiked(liked);
    }
  } catch (err) {
    console.error('Like error:', err);
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

// ============================================================
//  DEADLINE COUNTDOWN
// ============================================================
function updateCountdown() {
  const counter = document.getElementById('deadlineCounter');
  const panel   = document.querySelector('.deadline-inner');
  if (!counter) return;
  const deadline = new Date('2026-04-30T23:59:00');
  const now = new Date();
  const diff = deadline - now;

  if (diff <= 0) {
    // Submissions closed — update panel and disable all submit buttons
    if (panel) {
      panel.style.background = 'linear-gradient(135deg,#555,#333)';
      panel.style.borderColor = '#666';
      panel.style.animation = 'none';
    }
    const dateEl = document.querySelector('.deadline-date');
    const subEl  = document.querySelector('.deadline-sub');
    if (dateEl) dateEl.textContent = 'Closed';
    if (subEl)  subEl.textContent  = 'Submissions are no longer accepted';
    counter.innerHTML = '';

    // Disable all submit buttons
    document.querySelectorAll('a[href*="viewform"]').forEach(btn => {
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.4';
      btn.title = 'Submissions are closed';
    });
    return;
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);
  counter.innerHTML = `
    <div class="dc-unit"><span class="dc-num">${days}</span><span class="dc-label">Days</span></div>
    <div class="dc-unit"><span class="dc-num">${String(hours).padStart(2,'0')}</span><span class="dc-label">Hrs</span></div>
    <div class="dc-unit"><span class="dc-num">${String(mins).padStart(2,'0')}</span><span class="dc-label">Min</span></div>
    <div class="dc-unit"><span class="dc-num">${String(secs).padStart(2,'0')}</span><span class="dc-label">Sec</span></div>`;
}

function filterCategory(cat) {
  const select = document.getElementById('categoryFilter');
  if (select) {
    select.value = cat;
    applyFilters();
  }
  document.getElementById('gallery-feed')?.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
//  INIT
// ============================================================
loadSheet();
updateCountdown();
setInterval(updateCountdown, 1000);
