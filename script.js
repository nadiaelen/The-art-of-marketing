const submissions = [
  {title:'Eclipsed Brand',student:'Mia Johnson',major:'Marketing',category:'Digital Art',likes:42,status:'Shortlisted',description:'A surreal visual narrative about brand identity, memory, and the emotional pull of immersive experiences.'},
  {title:'After the Spotlight',student:'Daniel Kim',major:'Integrated Marketing Communications',category:'Photography / Collage',likes:31,status:'Under Review',description:'A photo-collage exploring attention, transformation, and how audiences interpret a moment as an experience.'},
  {title:'When Time Makes Meaning',student:'Ariana Lopez',major:'Marketing',category:'Literary Expression',likes:18,status:'Submitted',description:'A short reflective piece connecting emotion, place, and the way experience shapes memory.'},
  {title:'Form in Motion',student:'Noah Patel',major:'Business',category:'Traditional Visual Art',likes:57,status:'Shortlisted',description:'An abstract mixed-media composition inspired by movement, rhythm, and the visual language of campaigns.'},
  {title:'The Quiet Campaign',student:'Sofia Reyes',major:'Marketing',category:'Digital Art',likes:24,status:'Submitted',description:'A minimalist digital piece on persuasion, silence, and the visual weight of intention.'},
  {title:'City in Red',student:'Ethan Brooks',major:'Marketing',category:'Photography / Collage',likes:29,status:'Under Review',description:'A layered composition using contrast, movement, and urban rhythm to frame brand storytelling.'},
  {title:'Desert Light',student:'Lena Ortiz',major:'Marketing',category:'Traditional Visual Art',likes:35,status:'Submitted',description:'A warm composition inspired by Nevada light, memory, and the texture of place.'},
  {title:'Afterglow',student:'Jules Carter',major:'Digital Art',category:'Digital Art',likes:39,status:'Shortlisted',description:'An ombré-inspired digital work using color and silhouette to suggest anticipation and emotion.'}
];

const featured = [
  {title:'Eclipsed Brand', category:'Digital Art'},
  {title:'Form in Motion', category:'Traditional Visual Art'},
  {title:'Afterglow', category:'Digital Art'}
];

const mostLiked = [
  {title:'Form in Motion', likes:57},
  {title:'Eclipsed Brand', likes:42},
  {title:'Afterglow', likes:39}
];

const gallery = document.getElementById('galleryGrid');
const search = document.getElementById('search');
const filter = document.getElementById('categoryFilter');
const featuredList = document.getElementById('featuredList');
const likedList = document.getElementById('likedList');

function renderGallery(items){
  gallery.innerHTML = items.map(item => `
    <article class="gallery-item">
      <div class="head">
        <div>
          <div class="tags">
            <span class="tag">${item.category}</span>
            <span class="tag alt">${item.status}</span>
          </div>
          <h3>${item.title}</h3>
          <p>${item.student} • ${item.major}</p>
        </div>
        <div class="badge">${item.likes} likes</div>
      </div>
      <p>${item.description}</p>
      <div class="footer"><span>Preview · Notes</span><strong>Open ↗</strong></div>
    </article>
  `).join('');
}

function renderList(target, items, kind){
  target.innerHTML = items.map(item => `
    <div class="mini-work">
      <strong>${item.title}</strong>
      <span>${kind === 'featured' ? item.category : `${item.likes} public likes`}</span>
    </div>
  `).join('');
}

function applyFilters(){
  const q = search.value.toLowerCase().trim();
  const cat = filter.value;
  const results = submissions.filter(item => {
    const text = `${item.title} ${item.student} ${item.major} ${item.category} ${item.description}`.toLowerCase();
    return (!q || text.includes(q)) && (cat === 'All' || item.category === cat);
  });
  renderGallery(results);
}

search.addEventListener('input', applyFilters);
filter.addEventListener('change', applyFilters);

renderGallery(submissions);
renderList(featuredList, featured, 'featured');
renderList(likedList, mostLiked, 'liked');
