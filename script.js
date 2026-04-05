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
  title: item["Title of your work"] || "Untitled",
  student: item["Student name"] || "Anonymous",
  major: item["Major / program"] || "",
  category: item["Category"] || "Other",
  description: item["Description"] || "",
  image: item["Upload"] || ""
}));

render(submissions);
```

} catch (err) {
gallery.innerHTML = "<p>Failed to load submissions.</p>";
console.error(err);
}
}

function render(items) {
gallery.innerHTML = items.map(item => `    <article class="gallery-item">
      ${item.image ?`<img src="${item.image}" style="width:100%; border-radius:12px; margin-bottom:10px;">`: ""}       <h3>${item.title}</h3>       <p>${item.student} • ${item.major}</p>       <p>${item.description}</p>       <span class="tag">${item.category}</span>     </article>
 `).join('');
}

function applyFilters() {
const q = search.value.toLowerCase();
const cat = filter.value;

const results = submissions.filter(item => {
return (
(!q || item.title.toLowerCase().includes(q)) &&
(cat === "All" || item.category === cat)
);
});

render(results);
}

search.addEventListener('input', applyFilters);
filter.addEventListener('change', applyFilters);

loadSubmissions();
