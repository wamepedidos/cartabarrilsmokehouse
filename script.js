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
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter(line => line.trim() !== "");

  const headers = lines[0]
    .split(",")
    .map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = line
      .split(",")
      .map(value => value.trim());

    let obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
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
      String(item.restaurant || "")
        .trim()
        .toLowerCase() ===
      "barrilsmokehouse"
  )
  .map(item => ({
    id: Number(item.id || 0),
    restaurant: item.restaurant || "",
    category: item.category || "",
    title: item.title || "",
    description: item.description?.trim() || "",
    price: Number(
      String(item.price || "0").replace(/\./g, "")
    ),
    image: item.image?.trim() || "",
    video: item.video?.trim() || "",

    spicy:
      String(item.badge_spicy || "")
        .trim()
        .toLowerCase() === "si",

    vegan:
      String(item.badge_vegan || "")
        .trim()
        .toLowerCase() === "si",

    offer:
      String(item.badge_offer || "")
        .trim()
        .toLowerCase() === "si",

    offerText:
      item.offer_text?.trim() || ""
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
    id: Number(item.id || 0),
    restaurant: item.restaurant || "",
    category: item.category || "",
    title: item.title || "",
    description: item.description || "",
    price: Number(
      String(item.price || "0").replace(/\./g, "")
    ),
    image: item.image?.trim() || "",
    video: item.video?.trim() || ""
  }));

    console.table(stories);

    renderStories();
    openSharedContent();
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
      cartElement => Number(cartElement.id) === Number(item.id)
    );

    const qty = cartItem ? cartItem.qty : 0;

    // PRIORIDAD: VIDEO -> IMAGEN -> PLACEHOLDER
const hasImage =
  item.image && item.image.trim() !== "";

const hasVideo =
  item.video && item.video.trim() !== "";

let media = "";

if (hasImage && hasVideo) {
  media = `
    <div class="relative h-64 overflow-hidden">
      <div id="media-wrapper-${item.id}">
        <img
          src="${item.image}"
          class="w-full h-full object-cover"
          alt="${item.title}"
        >
      </div>

      <button
        id="media-btn-${item.id}"
        onclick="event.stopPropagation(); toggleMedia(${item.id}, '${item.image}', '${item.video}')"
        class="absolute bottom-4 left-4 btn-secondary px-4 py-2 rounded-full font-bold"
      >
        ▶ Ver video
      </button>
    </div>
  `;
} else if (hasImage) {
  media = `
    <div class="relative h-64 overflow-hidden">
      <img
        src="${item.image}"
        class="w-full h-full object-cover"
        alt="${item.title}"
      >
    </div>
  `;
} else if (hasVideo) {
  media = `
    <div class="relative h-64 overflow-hidden">
      <div id="media-wrapper-${item.id}">
        <video
          class="w-full h-full object-cover"
          muted
          playsinline
          loop
        >
          <source src="${item.video}" type="video/mp4">
        </video>
      </div>

      <button
        id="media-btn-${item.id}"
        onclick="event.stopPropagation(); toggleMedia(${item.id}, '', '${item.video}')"
        class="absolute bottom-4 left-4 btn-secondary px-4 py-2 rounded-full font-bold"
      >
        ▶ Ver video
      </button>
    </div>
  `;
} else {
  media = `
    <div class="w-full h-64 bg-stone-200 flex items-center justify-center text-stone-500 font-semibold">
      Sin imagen disponible
    </div>
  `;
}

    container.innerHTML += `
      <div
        id="plate-${item.id}"
        onclick="pauseAllVideos(); openPlateModal(${item.id})"
        class="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-stone-200 cursor-pointer"
      >
        <div class="relative">
          ${media}

          <!-- BADGES -->
          <div class="absolute top-4 right-4 flex flex-col gap-2 z-20 items-end">
  ${
    item.spicy
      ? `
        <span class="animate-pulse bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          🌶 Picante
        </span>
      `
      : ""
  }

  ${
    item.vegan
      ? `
        <span class="animate-pulse bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          🥬 Vegano
        </span>
      `
      : ""
  }

  ${
    item.offer
      ? `
        <span class="animate-pulse bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          🏷 ${item.offerText || "Oferta"}
        </span>
      `
      : ""
  }
</div>

          <!-- PRECIO -->
          
        </div>

        <div class="p-6">
          <h3 class="text-2xl font-black">
            ${item.title}
          </h3>

          <p class="text-stone-600 mt-2 text-sm leading-6 line-clamp-2">
  ${item.description || "Delicioso plato preparado al momento"}
</p>

          <p class="text-3xl font-black price-text mt-6">
            COP $${Number(item.price).toLocaleString("es-CO")}
          </p>

          <div class="mt-6 flex justify-between items-center">
            <button
              onclick="event.stopPropagation(); updateQuantity(${item.id}, 'remove')"
              class="w-12 h-12 rounded-2xl btn-secondary text-xl font-black"
            >
              −
            </button> 

            <span class="text-2xl font-black">
              ${qty}
            </span>

            <button
              onclick="event.stopPropagation(); updateQuantity(${item.id}, 'add')"
              class="w-12 h-12 rounded-2xl btn-primary text-xl font-black"
            >
              +
            </button>
          </div>

          <button
            onclick="event.stopPropagation(); sharePlate(${item.id})"
            class="w-full mt-3 btn-accent py-4 rounded-2xl font-bold"
          >
            📤 Compartir
          </button>
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
        onclick="pauseAllVideos(); openStory(${index})"
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
  const summary =
    document.getElementById("orderSummary");

  const totalElement =
    document.getElementById("totalPrice");

  if (!summary || !totalElement) return;

  summary.innerHTML = "";

  let total = 0;

  cart.forEach(cartItem => {
    const plate = menuItems.find(
      item => Number(item.id) === Number(cartItem.id)
    );

    if (!plate) return;

    const subtotal =
      Number(plate.price) * Number(cartItem.qty);

    total += subtotal;

    summary.innerHTML += `
      <div class="flex items-center justify-between gap-3 py-3 border-b border-stone-200">

        <div class="flex-1">
          <p class="font-bold">
            ${plate.title}
          </p>

          <p class="price-text text-sm">
            COP $${subtotal.toLocaleString("es-CO")}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick="changeCartQty(${plate.id}, -1)"
            class="w-8 h-8 btn-secondary rounded-xl font-bold"
          >
            −
          </button>

          <span class="font-bold min-w-[20px] text-center">
            ${cartItem.qty}
          </span>

          <button
            onclick="changeCartQty(${plate.id}, 1)"
            class="w-8 h-8 btn-primary rounded-xl font-bold"
          >
            +
          </button>

          <button
            onclick="removeFromCart(${plate.id})"
            class="w-8 h-8 btn-accent rounded-xl font-bold"
          >
            ✕
          </button>
        </div>
      </div>
    `;
  });

  totalElement.innerHTML =
    `COP $${total.toLocaleString("es-CO")}`;
}

function filterCategory(category, button) {
  currentCategory = category;

  document
    .querySelectorAll(".category-btn")
    .forEach(btn =>
      btn.classList.remove("active-category")
    );

  button.classList.add("active-category");

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
  let message = `*Nuevo Pedido - Barril Smoke House*\n\n`;

  let total = 0;

  cart.forEach(cartItem => {
    const plate = menuItems.find(
      item => Number(item.id) === Number(cartItem.id)
    );

    if (!plate) return;

    const subtotal =
      Number(plate.price) * Number(cartItem.qty);

    total += subtotal;

    message += `- ${plate.title} x${cartItem.qty} - COP $${subtotal.toLocaleString("es-CO")}\n`;
  });

  message += `\n*Total:* COP $${total.toLocaleString("es-CO")}\n`;

  const deliveryType =
    document.getElementById("deliveryType").value;

  if (deliveryType === "local") {
    const name =
      document.getElementById("customerName").value.trim();

    const table =
      document.getElementById("tableNumber").value.trim();

    message += `\n*Tipo:* Consumir en el local`;
    message += `\n*Nombre:* ${name}`;

    if (table) {
      message += `\n*Mesa:* ${table}`;
    }
  }

  if (deliveryType === "domicilio") {
    const name =
      document.getElementById("customerNameHome").value.trim();

    const phone =
      document.getElementById("phoneNumber").value.trim();

    const address =
      document.getElementById("address").value.trim();

    message += `\n*Tipo:* Domicilio`;
    message += `\n*Nombre:* ${name}`;
    message += `\n*Teléfono:* ${phone}`;
    message += `\n*Dirección:* ${address}`;
  }

  const phoneNumber = "573045818262";

  const encodedMessage =
    encodeURIComponent(message);

  window.open(
    `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
    "_blank"
  );
}

let currentStoryIndex = 0;
let storyInterval = null;

function openStory(storyOrIndex = 0) {

  pauseAllVideos();
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

const isInfo =
  story.category &&
  story.category.trim().toLowerCase() === "información";

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
  !isInfo
    ? `
      <p class="text-3xl font-black price-text mt-6">
        COP $${Number(story.price).toLocaleString("es-CO")}
      </p>
    `
    : ""
}

${
  !isInfo
    ? `
      <button
        onclick="addStoryToCart(${story.id}); event.stopPropagation();"
        class="relative z-50 mt-4 w-full btn-primary text-white py-3 rounded-2xl font-bold shadow-lg"
      >
        Agregar al pedido
      </button>
    `
    : ""
}

<button
  onclick="shareStory(${story.id}); event.stopPropagation();"
  class="relative z-50 mt-3 w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-2xl font-bold backdrop-blur-md"
>
  📤 Compartir
</button>
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


function shareItem(title, url) {
  if (navigator.share) {
    navigator.share({
      title,
      text: title,
      url
    });
  } else {
    navigator.clipboard.writeText(url);
    alert("Enlace copiado");
  }
}

function shareStory(id) {
  const url =
    `${window.location.origin}${window.location.pathname}?story=${id}`;

  if (navigator.share) {
    navigator.share({
      title: "Mira esta novedad",
      text: "Te comparto esta novedad",
      url
    });
  } else {
    navigator.clipboard.writeText(url);
    alert("Enlace copiado");
  }
}


function sharePlate(id) {
  const url =
    `${window.location.origin}${window.location.pathname}?plate=${id}`;

  if (navigator.share) {
    navigator.share({
      title: "Mira este plato",
      text: "Te comparto este plato",
      url
    });
  } else {
    navigator.clipboard.writeText(url);
    alert("Enlace copiado");
  }
}

window.addEventListener("load", () => {
  const params =
    new URLSearchParams(window.location.search);

  const storyId = params.get("story");
  const plateId = params.get("plate");

  if (storyId) {
    const index = stories.findIndex(
      s => Number(s.id) === Number(storyId)
    );

    if (index >= 0) {
      setTimeout(() => openStory(index), 500);
    }
  }

  if (plateId) {
    const plate = document.getElementById(
      `plate-${plateId}`
    );

    if (plate) {
      plate.scrollIntoView({
        behavior: "smooth"
      });
    }
  }
});


function openSharedContent() {
  const params = new URLSearchParams(
    window.location.search
  );

  const storyId = params.get("story");
  const plateId = params.get("plate");

  // abrir historia automáticamente
  if (storyId && stories.length > 0) {
    const index = stories.findIndex(
      story =>
        Number(story.id) === Number(storyId)
    );

    if (index >= 0) {
      setTimeout(() => {
        openStory(index);
      }, 400);
    }
  }

  // ir al plato
  if (plateId && menuItems.length > 0) {
  setTimeout(() => {
    openPlateModal(plateId);
  }, 400);


    if (plateElement) {
      setTimeout(() => {
        plateElement.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 400);
    }
  }
}


function openPlateModal(id) {

  pauseAllVideos();

  const item = menuItems.find(
    plate => Number(plate.id) === Number(id)
  );

  if (!item) return;

  document.getElementById("plateModal")?.remove();

  const hasVideo =
    item.video && item.video.trim() !== "";

  const cartItem = cart.find(
    plate => Number(plate.id) === Number(id)
  );

  const qty = cartItem ? cartItem.qty : 0;

  const modal = document.createElement("div");
  modal.id = "plateModal";

  modal.className =
    "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4";

  modal.innerHTML = `
    <div class="bg-white rounded-[2rem] overflow-hidden max-w-5xl w-full grid md:grid-cols-2 shadow-2xl relative">

      <!-- MEDIA -->
      <div class="relative h-[350px] md:h-full">
        ${
          hasVideo
            ? `
              <video
                class="w-full h-full object-cover"
                controls
                playsinline
              >
                <source src="${item.video}" type="video/mp4">
              </video>
            `
            : `
              <img
                src="${item.image}"
                class="w-full h-full object-cover"
                alt="${item.title}"
              >
            `
        }
      </div>

      <!-- INFO -->
      <div class="p-8 flex flex-col justify-between">
        <div>
          <!-- BADGES -->
          <div class="flex gap-2 mb-4 flex-wrap">
            ${
              item.spicy
                ? `
                  <span class="animate-pulse bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    🌶 Picante
                  </span>
                `
                : ""
            }

            ${
              item.vegan
                ? `
                  <span class="animate-pulse bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    🥬 Vegano
                  </span>
                `
                : ""
            }

            ${
              item.offer
                ? `
                  <span class="animate-pulse bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    🏷 ${item.offerText || "Oferta"}
                  </span>
                `
                : ""
            }
          </div>

          <h2 class="text-4xl font-black">
            ${item.title}
          </h2>

          <p class="text-stone-600 mt-4 text-lg leading-8">
  ${item.description || "Delicioso plato preparado al momento"}
</p>

          <p class="text-3xl font-black price-text mt-6">
            COP $${Number(item.price).toLocaleString("es-CO")}
          </p>
        </div>

        <!-- CANTIDAD -->
        <div class="mt-8">
          <div class="flex justify-between items-center mb-4">
            <button
              onclick="event.stopPropagation(); updateQuantity(${item.id}, 'remove'); openPlateModal(${item.id})"
              class="w-12 h-12 rounded-2xl btn-secondary text-xl font-black"
            >
              −
            </button>

            <span class="text-2xl font-black">
              ${qty}
            </span>

            <button
              onclick="event.stopPropagation(); updateQuantity(${item.id}, 'add'); openPlateModal(${item.id})"
              class="w-12 h-12 rounded-2xl btn-primary text-xl font-black"
            >
              +
            </button>
          </div>

          <button
            onclick="event.stopPropagation(); updateQuantity(${item.id}, 'add'); openPlateModal(${item.id})"
            class="w-full btn-primary py-4 rounded-2xl font-bold"
          >
            Agregar al carrito
          </button>

          <button
            onclick="event.stopPropagation(); sharePlate(${item.id})"
            class="w-full mt-3 btn-accent py-4 rounded-2xl font-bold"
          >
            📤 Compartir
          </button>
        </div>

        <!-- CERRAR -->
        <button
          onclick="closePlateModal()"
          class="absolute top-4 right-4 bg-black/10 hover:bg-black/20 w-10 h-10 rounded-full font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}
function closePlateModal() {
  document.getElementById("plateModal")?.remove();
}


function pauseAllVideos() {
  const videos = document.querySelectorAll("video");

  videos.forEach(video => {
    try {
      video.pause();
    } catch (e) {}
  });
}


function pauseAllVideos() {
  document.querySelectorAll("video").forEach(video => {
    try {
      video.pause();
      video.currentTime = video.currentTime; // fuerza refresco de controles
    } catch (e) {
      console.warn("No se pudo pausar video", e);
    }
  });
}

function enableSingleVideoPlayback() {
  document.addEventListener("play", function (event) {
    const currentVideo = event.target;

    if (currentVideo.tagName !== "VIDEO") return;

    document.querySelectorAll("video").forEach(video => {
      if (video !== currentVideo && !video.paused) {
        video.pause();
      }
    });
  }, true);
}


function initMediaRotator() {
  setInterval(() => {
    document.querySelectorAll(".media-rotator")
      .forEach(card => {
        card.classList.toggle("show-image");
      });
  }, 6000);
}


function toggleMedia(id, image, video) {
  const container =
    document.getElementById(`media-${id}`);

  if (!container) return;

  if (container.tagName === "IMG") {
    container.outerHTML = `
      <video
        id="media-${id}"
        class="w-full h-full object-cover"
        controls
        playsinline
      >
        <source src="${video}" type="video/mp4">
      </video>
    `;
  } else {
    container.outerHTML = `
      <img
        id="media-${id}"
        src="${image}"
        class="w-full h-full object-cover"
      >
    `;
  }
}

function toggleMedia(id, image, video) {
  const mediaContainer =
    document.getElementById(`media-wrapper-${id}`);

  const button =
    document.getElementById(`media-btn-${id}`);

  if (!mediaContainer || !button) return;

  const showingVideo =
    mediaContainer.querySelector("video");

  if (showingVideo) {
    mediaContainer.innerHTML = `
      <img
        id="media-${id}"
        src="${image}"
        class="w-full h-full object-cover"
        alt="Imagen del plato"
      >
    `;

    button.innerHTML = "▶ Ver video";
  } else {
    mediaContainer.innerHTML = `
      <video
        id="media-${id}"
        class="w-full h-full object-cover"
        autoplay
        muted
        loop
        playsinline
      >
        <source src="${video}" type="video/mp4">
      </video>
    `;

    button.innerHTML = "🖼 Ver imagen";
  }
}

function renderCart() {
  const container =
    document.getElementById("cartContainer");

  if (!container) return;

  container.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    const plate = menuItems.find(
      p => Number(p.id) === Number(item.id)
    );

    if (!plate) return;

    const subtotal =
      Number(plate.price) * Number(item.qty);

    total += subtotal;

    container.innerHTML += `
      <div class="flex items-center justify-between gap-3 p-4 border-b border-stone-200">

        <div class="flex-1">
          <p class="font-bold">
            ${plate.title}
          </p>

          <p class="price-text text-sm">
            COP $${subtotal.toLocaleString("es-CO")}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick="changeCartQty(${plate.id}, -1)"
            class="w-8 h-8 btn-secondary rounded-xl"
          >
            −
          </button>

          <span class="font-bold">
            ${item.qty}
          </span>

          <button
            onclick="changeCartQty(${plate.id}, 1)"
            class="w-8 h-8 btn-primary rounded-xl"
          >
            +
          </button>

          <button
            onclick="removeFromCart(${plate.id})"
            class="w-8 h-8 btn-accent rounded-xl"
          >
            ✕
          </button>
        </div>
      </div>
    `;
  });

  document.getElementById("cartTotal").innerHTML =
    `COP $${total.toLocaleString("es-CO")}`;
}

function changeCartQty(id, change) {
  const item = cart.find(
    p => Number(p.id) === Number(id)
  );

  if (!item) return;

  item.qty += change;

  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }

  renderCart();
  updateSummary();
}

function removeFromCart(id) {
  cart = cart.filter(
    item => Number(item.id) !== Number(id)
  );

  renderCart();
  updateSummary();
}


function validateAndSendOrder() {
  if (!cart || cart.length === 0) {
    alert("Debes agregar al menos un producto.");
    return;
  }

  const deliveryType =
    document.getElementById("deliveryType").value;

  if (!deliveryType) {
    alert("Selecciona el tipo de pedido.");
    return;
  }

  if (deliveryType === "local") {
    const name =
      document.getElementById("customerName").value.trim();

    if (!name) {
      alert("El nombre es obligatorio.");
      return;
    }
  }

  if (deliveryType === "domicilio") {
    const name =
      document.getElementById("customerNameHome").value.trim();

    const phone =
      document.getElementById("phoneNumber").value.trim();

    const address =
      document.getElementById("address").value.trim();

    if (!name || !phone || !address) {
      alert(
        "Todos los campos del domicilio son obligatorios."
      );
      return;
    }
  }

  goToWhatsApp();
}


function openLocationOptions() {
  document.getElementById("locationModal")?.remove();

  const lat = 6.2442;
  const lng = -75.5812;

  const modal = document.createElement("div");
  modal.id = "locationModal";

  modal.className =
    "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4";

  modal.innerHTML = `
    <div class="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
      <h2 class="text-2xl font-black text-center mb-6">
        📍 ¿Cómo deseas llegar?
      </h2>

      <div class="space-y-4">
        <button
          onclick="window.open('https://waze.com/ul?ll=${lat},${lng}&navigate=yes','_blank'); closeLocationModal()"
          class="w-full btn-primary py-4 rounded-2xl font-bold"
        >
          🟢 Abrir en Waze
        </button>

        <button
          onclick="window.open('https://www.google.com/maps/search/?api=1&query=${lat},${lng}','_blank'); closeLocationModal()"
          class="w-full btn-accent py-4 rounded-2xl font-bold"
        >
          📍 Abrir en Google Maps
        </button>

        <button
          onclick="closeLocationModal()"
          class="w-full btn-soft py-4 rounded-2xl font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeLocationModal() {
  document.getElementById("locationModal")?.remove();
}


renderCart();

initMediaRotator();
renderMenu();

loadMenuFromSheet();
loadStoriesFromSheet();
enableSingleVideoPlayback();
