
// ==========================================
// GOFARE GHANA — DATABASE CONNECTED VERSION
// ==========================================

const SUPABASE_URL = "https://geqypnseawwqlvtrqsej.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eAMCV7V2dERa-nE2uk3srQ_Y5Wp990I";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = id => document.getElementById(id);

let stations = [];
let routes = [];

// ==========================================
// DATABASE STATUS
// ==========================================

function showDatabaseStatus(message, color) {
  let status = $("database-status");

  if (!status) {
    status = document.createElement("p");
    status.id = "database-status";
    status.style.cssText =
      "text-align:center;padding:12px;font-weight:bold;";
    document.querySelector("main").prepend(status);
  }

  status.textContent = message;
  status.style.color = color;
}

// ==========================================
// STATION DIRECTORY
// ==========================================

function displayStations() {
  let section = $("station-directory");

  if (!section) {
    section = document.createElement("section");
    section.id = "station-directory";
    section.className = "results-section";

    const hero = document.querySelector(".hero");

    if (hero) {
      hero.after(section);
    } else {
      document.querySelector("main").prepend(section);
    }
  }

  section.innerHTML = `
    <div class="section-heading">
      <div>
        <div class="eyebrow">TRANSPORT DIRECTORY</div>
        <h2>Available stations</h2>
      </div>
    </div>
    <div id="station-list" class="results-grid"></div>
  `;

  const list = $("station-list");

  if (!stations.length) {
    list.textContent = "No active stations are currently available.";
    return;
  }

  stations.forEach(station => {
    const card = document.createElement("article");
    card.className = "fare-card";

    const name = document.createElement("div");
    name.className = "station";
    name.textContent = station.name;

    const city = document.createElement("p");
    city.className = "route-meta";
    city.textContent = station.city || "Ghana";

    card.append(name, city);

    if (station.address) {
      const address = document.createElement("p");
      address.className = "route-meta";
      address.textContent = station.address;
      card.appendChild(address);
    }

    list.appendChild(card);
  });
}

// ==========================================
// ROUTE SELECTORS
// ==========================================

function populateOrigins() {
  const originSelect = $("origin");

  if (!originSelect) return;

  const origins = [...new Set(routes.map(route => route.origin))];

  originSelect.innerHTML = "";

  origins.forEach(origin => {
    const option = document.createElement("option");
    option.value = origin;
    option.textContent = origin;
    originSelect.appendChild(option);
  });

  if (origins.includes("Accra")) {
    originSelect.value = "Accra";
  }

  updateDestinations();
}

function updateDestinations() {
  const origin = $("origin").value;
  const destinationSelect = $("destination");

  if (!destinationSelect) return;

  const destinations = routes
    .filter(route => route.origin === origin)
    .map(route => route.destination);

  destinationSelect.innerHTML = "";

  destinations.forEach(destination => {
    const option = document.createElement("option");
    option.value = destination;
    option.textContent = destination;
    destinationSelect.appendChild(option);
  });

  if (destinations.includes("Kumasi")) {
    destinationSelect.value = "Kumasi";
  }
}

// ==========================================
// DISPLAY VERIFIED FARES
// ==========================================

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString();
}

async function render(from, to) {
  const title = $("results-title");
  const results = $("results");

  title.textContent = `${from} → ${to}`;
  results.innerHTML = "";

  const route = routes.find(item =>
    item.origin === from &&
    item.destination === to
  );

  if (!route) {
    results.textContent =
      "This route is not currently listed in GoFare Ghana.";
    return;
  }

  const loading = document.createElement("p");
  loading.textContent = "Checking verified fares...";
  results.appendChild(loading);

  try {
    const { data: fares, error } = await supabaseClient
      .from("fares")
      .select(
        "station_id, amount, currency, vehicle_type, last_verified_at, source"
      )
      .eq("route_id", route.id)
      .eq("is_active", true)
      .eq("verification_status", "verified");

    if (error) throw error;

    results.innerHTML = "";

    if (!fares || fares.length === 0) {
      const message = document.createElement("article");
      message.className = "fare-card";

      const heading = document.createElement("b");
      heading.textContent = "No verified fares available yet.";

      const description = document.createElement("p");
      description.className = "route-meta";
      description.textContent =
        "GoFare Ghana has not published a verified fare for this journey. Please check again later.";

      message.append(heading, description);
      results.appendChild(message);
      return;
    }

    const stationIds = [...new Set(
      fares.map(fare => fare.station_id).filter(Boolean)
    )];

    let stationMap = {};

    if (stationIds.length) {
      const { data: stationData, error: stationError } =
        await supabaseClient
          .from("stations")
          .select("id, name")
          .in("id", stationIds);

      if (stationError) throw stationError;

      (stationData || []).forEach(station => {
        stationMap[station.id] = station.name;
      });
    }

    fares.forEach(fare => {
      const card = document.createElement("article");
      card.className = "fare-card";

      const top = document.createElement("div");
      top.className = "fare-card-top";

      const left = document.createElement("div");

      const station = document.createElement("div");
      station.className = "station";
      station.textContent =
        stationMap[fare.station_id] || "Station not specified";

      const vehicle = document.createElement("div");
      vehicle.className = "route-meta";
      vehicle.textContent = fare.vehicle_type || "Vehicle type not specified";

      left.append(station, vehicle);

      const amount = document.createElement("div");
      amount.className = "fare";
      amount.textContent =
        `${fare.currency || "GHS"} ${Number(fare.amount).toFixed(2)}`;

      top.append(left, amount);

      const status = document.createElement("span");
      status.className = "status verified";
      status.textContent = "VERIFIED";

      const date = document.createElement("p");
      date.className = "route-meta";
      date.textContent =
        `Last verified: ${formatDate(fare.last_verified_at)}`;

      card.append(top, status, date);

      if (fare.source) {
        const source = document.createElement("p");
        source.className = "route-meta";
        source.textContent = `Source: ${fare.source}`;
        card.appendChild(source);
      }

      results.appendChild(card);
    });

  } catch (error) {
    console.error("Fare loading error:", error);
    results.innerHTML = "";

    const message = document.createElement("p");
    message.textContent =
      "Unable to retrieve fares right now. Please try again later.";

    results.appendChild(message);
  }
}

// ==========================================
// LOAD DATABASE INFORMATION
// ==========================================

async function loadGoFareData() {
  try {
    showDatabaseStatus(
      "Loading GoFare Ghana information...",
      "#087a45"
    );

    const [stationResult, routeResult] = await Promise.all([
      supabaseClient
        .from("stations")
        .select("id, name, city, address")
        .eq("is_active", true)
        .order("name"),

      supabaseClient
        .from("routes")
        .select("id, origin, destination")
        .eq("is_active", true)
        .order("destination")
    ]);

    if (stationResult.error) throw stationResult.error;
    if (routeResult.error) throw routeResult.error;

    stations = stationResult.data || [];
    routes = routeResult.data || [];

    populateOrigins();
    displayStations();

    showDatabaseStatus(
      `Connected successfully! ${stations.length} stations and ${routes.length} routes loaded.`,
      "green"
    );

    if (routes.length > 0) {
      await render($("origin").value, $("destination").value);
    }

  } catch (error) {
    console.error("GoFare database error:", error);

    showDatabaseStatus(
      "Unable to load GoFare information. Please refresh the page.",
      "red"
    );
  }
}

// ==========================================
// SEARCH FORM
// ==========================================

$("origin").addEventListener("change", updateDestinations);

$("search-form").addEventListener("submit", async event => {
  event.preventDefault();

  const from = $("origin").value;
  const to = $("destination").value;

  if (!from || !to || from === to) {
    $("results-title").textContent = "Choose a valid journey";
    $("results").textContent =
      "Please choose two different places.";
    return;
  }

  await render(from, to);

  $("results-section").scrollIntoView({
    behavior: "smooth"
  });
});

// ==========================================
// LOCAL DEMONSTRATION REPORT FORM
// ==========================================

$("report-form").addEventListener("submit", event => {
  event.preventDefault();

  const report = {
    from: $("report-origin").value.trim(),
    to: $("report-destination").value.trim(),
    station: $("report-station").value.trim(),
    fare: Number($("report-fare").value),
    date: $("report-date").value,
    submittedAt: new Date().toISOString(),
    status: "local demo only"
  };

  try {
    const reports = JSON.parse(
      localStorage.getItem("gofare_demo_reports") || "[]"
    );

    reports.push(report);

    localStorage.setItem(
      "gofare_demo_reports",
      JSON.stringify(reports)
    );

    $("report-message").textContent =
      "Demo report saved on this device only. It has not been sent for verification.";

    event.target.reset();

  } catch (error) {
    $("report-message").textContent =
      "Unable to save this demonstration report on this device.";
  }
});

// ==========================================
// SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(error => console.error("Service worker error:", error));
  });
}

// ==========================================
// START GOFARE GHANA
// ==========================================

loadGoFareData();
