let menuItems = [];
let stories = [];
let cart = [];
let currentCategory = "todos";

const CURRENT_RESTAURANT = "BarrilSmokeHouse";

const MENU_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1tYGmXvNoD2JZ2BUq7dl4pZmeuvt9rshwXNegzSq64w8/export?format=csv&gid=0";

const STORIES_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1tYGmXvNoD2JZ2BUq7dl4pZmeuvt9rshwXNegzSq64w8/export?format=csv&gid=265212133";



function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0]
    .split(",")
    .map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index]
        ? values[index].trim()
        : "";
    });

    return obj;
  });
}

async function loadMenuFromSheet() {
  try {
    const response = await fetch(MENU_SHEET_URL);
    const csvText = await response.text();

    console.log("CSV RAW:", csvText);

    const data = parseCSV(csvText);

    console.log("PARSED DATA:", data);

    menuItems = data
      .filter(
        item =>
          item.restaurant?.trim() ===
          "BarrilSmokeHouse"
      )
      .map(item => ({
        id: Number(item.id),
        category: item.category,
        title: item.title,
        price: Number(item.price),
        image: item.image,
        video: item.video
      }));

    console.log("MENU ITEMS:", menuItems);

    renderMenu();
  } catch (error) {
    console.error("ERROR MENU:", error);
  }
}

async function loadStoriesFromSheet() {
  try {
    const response = await fetch(STORIES_SHEET_URL);
    const csvText = await response.text();

    const data = parseCSV(csvText);

    console.table(data);

    stories = data
      .filter(
        item =>
          item.restaurant?.trim() ===
          "BarrilSmokeHouse"
      )
      .map(item => ({
        id: Number(item.id),
        restaurant: item.restaurant,
        category: item.category,
        title: item.title,
        price: Number(item.price),
        image: item.image?.trim(),
        video: item.video?.trim()
      }));

    console.table(stories);

    renderStories();
  } catch (error) {
    console.error("ERROR STORIES:", error);
  }
}

function renderMenu() {
  const container = document.getElementById("menuContainer");
  container.innerHTML = "";

  const filtered =
    currentCategory === "todos"
      ? menuItems
      : menuItems.filter(
          item => item.category === currentCategory
        );

  filtered.forEach(item => {
    const cartItem = cart.find(
      cartElement => cartElement.id === item.id
    );

    const qty = cartItem ? cartItem.qty : 0;

    // PRIORIDAD: VIDEO -> IMAGEN -> PLACEHOLDER
    const media = item.video
      ? `
        <div class="relative">
          <video
            class="w-full h-64 object-cover"
            controls
            preload="metadata"
            playsinline
          >
            <source src="${item.video}" type="video/mp4">
          </video>

          <div class="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-md">
            ▶ Video
          </div>
        </div>
      `
      : item.image
      ? `
        <div class="relative">
          <img
            src="${item.image}"
            class="w-full h-64 object-cover"
            alt="${item.title}"
          >
        </div>
      `
      : `
        <div class="w-full h-64 bg-stone-200 flex items-center justify-center text-stone-500 font-semibold">
          Sin imagen disponible
        </div>
      `;

    container.innerHTML += `
      <div class="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-stone-200">

        <div class="relative">
          ${media}

          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg">
            <p class="font-black text-pink-500">
              COP $${Number(item.price).toLocaleString("es-CO")}
            </p>
          </div>
        </div>

        <div class="p-6">
          <h3 class="text-2xl font-black">
            ${item.title}
          </h3>

          <p class="text-stone-500 mt-2">
            ${item.description || "Delicioso plato preparado al momento"}
          </p>

          <div class="mt-6 flex justify-between items-center">
            <button
              onclick="updateQuantity(${item.id}, 'remove')"
              class="w-12 h-12 rounded-2xl bg-stone-100 text-xl font-black shadow-sm hover:bg-stone-200 transition-all"
            >
              −
            </button>

            <span class="text-2xl font-black">
              ${qty}
            </span>

            <button
              onclick="updateQuantity(${item.id}, 'add')"
              class="w-12 h-12 rounded-2xl bg-pink-500 text-white text-xl font-black shadow-lg hover:bg-pink-600 transition-all"
            >
              +
            </button>
          </div>
        </div>
      </div>
    `;
  });
}


function renderStories() {
  const container =
    document.getElementById("storiesContainer");

  if (!container) return;

  container.innerHTML = "";

  stories.forEach((story, index) => {
    const hasVideo =
      story.video && story.video.trim() !== "";

    const preview = hasVideo
      ? `
        <video
          class="w-full h-full object-cover"
          muted
          playsinline
        >
          <source src="${story.video}" type="video/mp4">
        </video>
      `
      : `
        <img
          src="${story.image}"
          class="w-full h-full object-cover"
          alt="${story.title}"
        >
      `;

    container.innerHTML += `
      <div
        class="min-w-[90px] text-center cursor-pointer"
        onclick="openStory(${index})"
      >
        <div class="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-pink-500 to-orange-400 shadow-lg">
          <div class="w-full h-full rounded-full overflow-hidden bg-white relative">
            ${preview}
          </div>
        </div>

        <p class="text-xs font-semibold mt-2 truncate">
          ${story.title || "Promo"}
        </p>
      </div>
    `;
  });
}

function updateQuantity(id, action) {
  const item = menuItems.find(p => p.id === id);
  let existing = cart.find(p => p.id === id);

  if (action === "add") {
    if (existing) existing.qty++;
    else cart.push({ ...item, qty: 1 });
  }

  if (action === "remove" && existing) {
    existing.qty--;
    if (existing.qty <= 0) {
      cart = cart.filter(p => p.id !== id);
    }
  }

  updateSummary();
  renderMenu();
}

function updateSummary() {
  const summary = document.getElementById("summaryList");
  let total = 0;
  summary.innerHTML = "";

  cart.forEach(item => {
    const subtotal = item.qty * item.price;
    total += subtotal;

    summary.innerHTML += `
      <div class="flex justify-between py-2">
        <span>${item.qty} x ${item.title}</span>
        <span>COP $${subtotal.toLocaleString("es-CO")}</span>
      </div>
    `;
  });

  document.getElementById("totalPrice").textContent =
    `COP $${total.toLocaleString("es-CO")}`;
}

function filterCategory(category) {
  currentCategory = category;
  renderMenu();
}

function toggleForm() {
  const type = document.getElementById("deliveryType").value;

  document.getElementById("localForm").classList.add("hidden");
  document.getElementById("homeForm").classList.add("hidden");

  if (type === "local") {
    document.getElementById("localForm").classList.remove("hidden");
  }

  if (type === "domicilio") {
    document.getElementById("homeForm").classList.remove("hidden");
  }
}

function goToWhatsApp() {
  let total = 0;
  let message = "🍽️ *Nuevo pedido*%0A%0A";

  cart.forEach(item => {
    const subtotal = item.qty * item.price;
    total += subtotal;

    message += `• ${item.qty} x ${item.title} = COP $${subtotal}%0A`;
  });

  message += `%0A💰 Total: COP $${total}`;

  window.open(`https://wa.me/573045818262?text=${message}`, "_blank");
}

let currentStoryIndex = 0;
let storyInterval = null;

function openStory(storyOrIndex = 0) {
  currentStoryIndex =
    typeof storyOrIndex === "number"
      ? storyOrIndex
      : stories.findIndex(
          s => Number(s.id) === Number(storyOrIndex.id)
        );

  if (currentStoryIndex < 0) currentStoryIndex = 0;

  const story = stories[currentStoryIndex];

  const existingModal =
    document.getElementById("storyModal");

  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "storyModal";

  modal.className =
    "fixed inset-0 bg-black/95 z-50 flex items-center justify-center";

  const duration = 10000;

  const hasVideo =
    story.video &&
    story.video.trim() !== "";

  modal.innerHTML = `
    <div class="relative w-[360px] h-[640px] rounded-3xl overflow-hidden shadow-2xl bg-black">

      <!-- BARRA -->
      <div class="absolute top-0 left-0 w-full h-1 bg-white/20 z-40">
        <div
          id="storyProgress"
          class="h-full bg-white"
          style="width:0%"
        ></div>
      </div>

      <!-- MEDIA -->
      ${
        hasVideo
          ? `
            <video
              class="w-full h-full object-cover"
              autoplay
              playsinline
            >
              <source src="${story.video}" type="video/mp4">
            </video>
          `
          : `
            <img
              src="${story.image}"
              class="w-full h-full object-cover"
            >
          `
      }

      <!-- CERRAR -->
      <button
        onclick="closeStoryModal(); event.stopPropagation();"
        class="absolute top-4 right-4 z-50 bg-black/40 backdrop-blur-md text-white w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center shadow-lg"
      >
        ✕
      </button>

      <!-- INFO -->
      <div class="absolute bottom-0 left-0 w-full z-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white p-6">
        <p class="text-sm uppercase tracking-wider text-white/70">
          ${story.category || ""}
        </p>

        <h2 class="text-3xl font-black mt-1">
          ${story.title || ""}
        </h2>

${
  !isNaN(Number(story.price)) &&
  Number(story.price) > 0
    ? `
      <p class="text-2xl font-bold text-pink-400 mt-2">
        COP $${Number(story.price).toLocaleString("es-CO")}
      </p>
    `
    : ""
}

      ${
  story.category &&
  story.price &&
  Number(story.price) > 0
    ? `
      <button
        onclick="addStoryToCart(${story.id}); event.stopPropagation();"
        class="relative z-50 mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-2xl font-bold shadow-lg"
      >
        Agregar al pedido
      </button>
    `
    : `
      <div class="mt-4 text-sm text-white/70">
        Información importante
      </div>
    `
}
      </div>

      <!-- ZONAS CLICK -->
      <div
        class="absolute inset-y-0 left-0 w-1/2 z-30"
        onclick="previousStory()"
      ></div>

      <div
        class="absolute inset-y-0 right-0 w-1/2 z-30"
        onclick="nextStory()"
      ></div>
    </div>
  `;

  document.body.appendChild(modal);

  const progress =
    modal.querySelector("#storyProgress");

  let start = Date.now();

  clearInterval(storyInterval);

  storyInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    const percentage = Math.min(
      (elapsed / duration) * 100,
      100
    );

    progress.style.width =
      percentage + "%";

    if (elapsed >= duration) {
      clearInterval(storyInterval);
      nextStory();
    }
  }, 50);
}

function closeStoryModal() {
  clearInterval(storyInterval);
  document.getElementById("storyModal")?.remove();
}

function nextStory() {
  currentStoryIndex++;

  if (currentStoryIndex >= stories.length) {
    document.getElementById("storyModal")?.remove();
    return;
  }

  openStory(currentStoryIndex);
}

function nextStory() {
  currentStoryIndex++;

  if (currentStoryIndex >= stories.length) {
    document.getElementById("storyModal")?.remove();
    return;
  }

  openStory(currentStoryIndex);
}

function previousStory() {
  currentStoryIndex--;

  if (currentStoryIndex < 0) {
    currentStoryIndex = 0;
  }

  openStory(currentStoryIndex);
}


function addStoryToCart(id) {
  const item = menuItems.find(
    plate => Number(plate.id) === Number(id)
  );

  console.log("ITEM ENCONTRADO:", item);

  if (!item) {
    alert("No se encontró el plato para agregar.");
    return;
  }

  let existing = cart.find(
    plate => Number(plate.id) === Number(id)
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      ...item,
      qty: 1
    });
  }

  updateSummary();
  renderMenu();
  closeStoryModal();

  console.log("CARRITO:", cart);
}

renderMenu();



loadMenuFromSheet();
loadStoriesFromSheet();