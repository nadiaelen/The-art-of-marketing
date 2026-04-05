// ============================================================
//  CONFIGURATION
// ============================================================
const SHEET_ID = '1CTXoFgH1b77PzIj4qog5-T0R5C0sNLTENA4WJUxfpGs';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

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
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error('Network error');
    const csv = await res.text();
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

  galleryGrid.innerHTML = items.map(item => `
    <article class="gallery-item">
      ${item.imageUrl ? `<div class="gallery-img"><img src="${escHtml(driveUrl(item.imageUrl))}" alt="${escHtml(item.title)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : ''}
      <div class="head">
        <div>
          <div class="tags">
            <span class="tag">${escHtml(item.category)}</span>
          </div>
          <h3>${escHtml(item.title)}</h3>
          <p>${escHtml(item.student)}${item.major ? ' • ' + escHtml(item.major) : ''}</p>
        </div>
      </div>
      <p>${escHtml(item.description)}</p>
      ${item.timestamp ? `<div class="footer"><span>Submitted ${formatDate(item.timestamp)}</span></div>` : ''}
    </article>
  `).join('');
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
  const items = allSubmissions.slice(-3).reverse();
  likedList.innerHTML = items.length
    ? items.map(item => `<div class="mini-item"><strong>${escHtml(item.title)}</strong><span>${escHtml(item.student)}</span></div>`).join('')
    : '<p class="note">No submissions yet.</p>';
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
//  INIT
// ============================================================
loadSheet();
