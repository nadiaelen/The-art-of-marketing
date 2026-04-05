const SHEET_URL = "https://opensheet.elk.sh/1CTXoFgH1b77PzIj4qog5-T0R5C0sNLTENA4WJUxfpGs/Sheet1";

const gallery = document.getElementById('galleryGrid');
const search = document.getElementById('search');
const filter = document.getElementById('categoryFilter');

let submissions = [];

async function loadSubmissions() {
try {
const res = await fetch(SHEET_URL);
const data = await res.json();

```
submissions = data.map(item => ({
  title: item["Artwork Title"],
  student: item["Student Name (First and Last)"],
  major: item["Major / Program of Study"],
  category: item["Submission Category"],
  description: item["Artwork Description (Provide details on medium, dimensions, theme, and inspiration - max 200 words)"],
  image: item["Upload Artwork File"],
  status: "Submitted",
  likes: 0
}));

render(submissions);
```

} catch (err) {
gallery.innerHTML = "<p>Could not load submissions.</p>";
console.error(err);
}
}

function render(items) {
if (!items.length) {
gallery.innerHTML = "<p>No submissions yet.</p>";
return;
}

gallery.innerHTML = items.map(item => ` <article class="gallery-item"> <div class="head"> <div> <div class="tags"> <span class="tag">${item.category || "General"}</span> <span class="tag alt">${item.status}</span> </div> <h3>${item.title || "Untitled"}</h3> <p>${item.student || "Anonymous"} • ${item.major || ""}</p> </div> <div class="badge">${item.likes} likes</div> </div>

```
  ${item.image ? `<img src="${item.image}" style="width:100%; border-radius:12px; margin:10px 0;">` : ""}

  <p>${item.description || ""}</p>

  <div class="footer">
    <span>Live submission</span>
    <strong>View</strong>
  </div>
</article>
```

`).join('');
}

function applyFilters() {
const q = search.value.toLowerCase();
const cat = filter.value;

const results = submissions.filter(item => {
const text = `${item.title} ${item.student} ${item.major} ${item.category} ${item.description}`.toLowerCase();
return (!q || text.includes(q)) && (cat === 'All' || item.category === cat);
});

render(results);
}

search.addEventListener('input', applyFilters);
filter.addEventListener('change', applyFilters);

loadSubmissions();
