// Cache so each section loads only once
var __tabLoaded = {};

async function loadStaticSection(id) {
  var container = document.getElementById(id);
  if (!container) return;

  var src = container.getAttribute("data-src");
  if (!src) return;

  try {
    var resp = await fetch(src, { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);

    container.innerHTML = await resp.text();

    // Render embeds if any (safe no-op otherwise)
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load(container);
    }
    if (window.iframely) {
      window.iframely.load();
    }
  } catch (e) {
    console.error("Failed to load", id, e);
    container.innerHTML =
      '<p class="section-text">Failed to load content.</p>';
  }
}

// Load the section HTML into the tab container (if data-src is present)
async function __loadTabIfNeeded(tabId) {
  if (__tabLoaded[tabId]) return;

  var container = document.getElementById(tabId);
  if (!container) return;

  var src = container.getAttribute("data-src");
  if (!src) {
    __tabLoaded[tabId] = true; // nothing to load
    return;
  }

  try {
    var resp = await fetch(src, { cache: "no-store" });
    if (!resp.ok) throw new Error("Failed to load " + src + " (HTTP " + resp.status + ")");

    var html = await resp.text();
    container.innerHTML = html;
    __tabLoaded[tabId] = true;

    // Re-render embeds after content injection
    if (window.iframely && typeof window.iframely.load === "function") {
      window.iframely.load();
    }
    if (window.twttr && window.twttr.widgets && typeof window.twttr.widgets.load === "function") {
      window.twttr.widgets.load(container);
    }
  } catch (e) {
    console.error(e);
    container.innerHTML =
      '<div class="divider"></div>' +
      '<p class="section-text"><strong>Section failed to load.</strong><br>' +
      'Make sure you are serving the site over http(s) (not file://) and that <code>' +
      src +
      "</code> exists.</p>";
  }
}

// Expose openCity globally so inline onclick="openCity(...)" works
window.openCity = async function (evt, tabId) {
  var i, tabcontent, tablinks;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Load the tab HTML if needed
  await __loadTabIfNeeded(tabId);

  var tab = document.getElementById(tabId);
  if (tab) tab.style.display = "block";

  if (evt && evt.currentTarget) {
    evt.currentTarget.className += " active";
  }

  // Keep your blog embed behavior
  if (tabId === "blog" && window.iframely && typeof window.iframely.load === "function") {
    window.iframely.load();
  }

  // Twitter embeds often need a nudge after showing tab
  if (window.twttr && window.twttr.widgets && typeof window.twttr.widgets.load === "function") {
    window.twttr.widgets.load(tab);
  }
};

// Click default tab after DOM is ready (script is defer)
(async function () {
  // Load profile immediately
  await loadStaticSection("profile");

  // Open default tab
  var defaultBtn = document.getElementById("defaultOpen");
  if (defaultBtn) defaultBtn.click();
})();
