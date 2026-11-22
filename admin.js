
/* =====================================
   GOFARE GHANA — ADMIN DASHBOARD
===================================== */

const SUPABASE_URL = "https://geqypnseawwqlvtrqsej.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eAMCV7V2dERa-nE2uk3srQ_Y5Wp990I";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = id => document.getElementById(id);

let currentUser = null;
let stations = [];
let routes = [];

function message(id, text) {
  const element = $(id);
  if (element) element.textContent = text;
}

function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function makeRecord(container, title, details) {
  const card = document.createElement("div");
  card.className = "record";

  const heading = document.createElement("strong");
  heading.textContent = title;
  card.appendChild(heading);

  const description = document.createElement("p");
  description.textContent = details;
  card.appendChild(description);

  container.appendChild(card);
  return card;
}

/* =====================================
   ADMINISTRATOR AUTHENTICATION
===================================== */

async function checkAdministrator() {
  const { data: sessionData, error } =
    await db.auth.getSession();

  if (error) throw error;

  const user = sessionData.session?.user;

  if (!user) {
    showLogin();
    return false;
  }

  const { data, error: adminError } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) throw adminError;

  if (!data) {
    await db.auth.signOut();
    showLogin();
    message(
      "login-message",
      "This account is not registered as a GoFare administrator."
    );
    return false;
  }

  currentUser = user;
  showDashboard();

  return true;
}

function showLogin() {
  $("login-panel").classList.remove("hidden");
  $("dashboard").classList.add("hidden");
}

function showDashboard() {
  $("login-panel").classList.add("hidden");
  $("dashboard").classList.remove("hidden");

  message(
    "admin-welcome",
    "Signed in as " + currentUser.email
  );

  loadDashboard();
}

$("login-form").addEventListener("submit", async event => {
  event.preventDefault();

  message("login-message", "Signing in...");

  const email = $("admin-email").value.trim();
  const password = $("admin-password").value;

  try {
    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const authorized = await checkAdministrator();

    if (!authorized) return;

    $("login-form").reset();

  } catch (error) {
    console.error(error);
    message(
      "login-message",
      error.message || "Login failed. Please try again."
    );
  }
});

$("logout-button").addEventListener("click", async () => {
  const { error } = await db.auth.signOut();

  if (error) {
    message("dashboard-message", error.message);
    return;
  }

  currentUser = null;
  showLogin();
});

/* =====================================
   LOAD DASHBOARD
===================================== */

async function loadDashboard() {
  message("dashboard-message", "Loading records...");

  try {
    await Promise.all([
      loadStations(),
      loadRoutes(),
      loadFares(),
      loadReports()
    ]);

    message(
      "dashboard-message",
      "Dashboard information loaded successfully."
    );

  } catch (error) {
    console.error(error);
    message(
      "dashboard-message",
      "Unable to load some records. Please refresh."
    );
  }
}

/* =====================================
   STATION MANAGEMENT
===================================== */

async function loadStations() {
  const container = $("station-management");
  container.innerHTML = "";

  const form = document.createElement("form");

  form.innerHTML = `
    <h3>Add a station</h3>
    <input name="name" placeholder="Station name" required>
    <input name="city" placeholder="City" required>
    <input name="address" placeholder="Station address">
    <button type="submit">Add station</button>
  `;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(form);

    const { error } = await db.from("stations").insert({
      name: data.get("name").trim(),
      city: data.get("city").trim(),
      address: data.get("address").trim() || null,
      is_active: true
    });

    if (error) {
      alert(error.message);
      return;
    }

    form.reset();
    await loadStations();
    message("dashboard-message", "Station added successfully.");
  });

  container.appendChild(form);

  const { data, error } = await db
    .from("stations")
    .select("*")
    .order("name");

  if (error) throw error;

  stations = data || [];

  stations.forEach(station => {
    const card = makeRecord(
      container,
      station.name,
      `${station.city || ""} — ${station.is_active ? "Active" : "Inactive"}`
    );

    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = station.is_active
      ? "Deactivate"
      : "Reactivate";

    button.addEventListener("click", async () => {
      const { error } = await db
        .from("stations")
        .update({ is_active: !station.is_active })
        .eq("id", station.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadDashboard();
    });

    card.appendChild(button);
  });
}

/* =====================================
   ROUTE MANAGEMENT
===================================== */

async function loadRoutes() {
  const container = $("route-management");
  container.innerHTML = "";

  const form = document.createElement("form");

  form.innerHTML = `
    <h3>Add a route</h3>
    <input name="origin" placeholder="Starting city" required>
    <input name="destination" placeholder="Destination city" required>
    <button type="submit">Add route</button>
  `;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(form);
    const origin = data.get("origin").trim();
    const destination = data.get("destination").trim();

    if (origin.toLowerCase() === destination.toLowerCase()) {
      alert("Starting city and destination must be different.");
      return;
    }

    const { error } = await db.from("routes").insert({
      origin,
      destination,
      is_active: true
    });

    if (error) {
      alert(error.message);
      return;
    }

    form.reset();
    await loadDashboard();
    message("dashboard-message", "Route added successfully.");
  });

  container.appendChild(form);

  const { data, error } = await db
    .from("routes")
    .select("*")
    .order("origin");

  if (error) throw error;

  routes = data || [];

  routes.forEach(route => {
    const card = makeRecord(
      container,
      `${route.origin} → ${route.destination}`,
      route.is_active ? "Active route" : "Inactive route"
    );

    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = route.is_active
      ? "Deactivate"
      : "Reactivate";

    button.addEventListener("click", async () => {
      const { error } = await db
        .from("routes")
        .update({ is_active: !route.is_active })
        .eq("id", route.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadDashboard();
    });

    card.appendChild(button);
  });
}

/* =====================================
   FARE MANAGEMENT
===================================== */

async function loadFares() {
  const container = $("fare-management");
  container.innerHTML = "";

  const form = document.createElement("form");

  form.innerHTML = `
    <h3>Add a fare</h3>
    <label>Station</label>
    <select name="station_id" required></select>

    <label>Route</label>
    <select name="route_id" required></select>

    <input name="vehicle_type" placeholder="Vehicle type" required>

    <input name="amount" type="number"
      min="0.01" step="0.01"
      placeholder="Fare in GH₵" required>

    <input name="source"
      placeholder="Source of fare information" required>

    <label>Verification status</label>
    <select name="verification_status">
      <option value="pending">Pending verification</option>
      <option value="verified">Verified</option>
    </select>

    <button type="submit">Save fare</button>
  `;

  const stationSelect = form.querySelector(
    '[name="station_id"]'
  );

  stations
    .filter(station => station.is_active)
    .forEach(station => {
      addOption(stationSelect, station.id, station.name);
    });

  const routeSelect = form.querySelector(
    '[name="route_id"]'
  );

  routes
    .filter(route => route.is_active)
    .forEach(route => {
      addOption(
        routeSelect,
        route.id,
        `${route.origin} → ${route.destination}`
      );
    });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const verification = data.get("verification_status");

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid fare amount.");
      return;
    }

    if (verification === "verified") {
      const confirmed = confirm(
        "Have you independently checked this fare with a reliable source? Only verified fares are displayed to passengers."
      );

      if (!confirmed) return;
    }

    const { error } = await db.from("fares").insert({
      station_id: data.get("station_id"),
      route_id: data.get("route_id"),
      vehicle_type: data.get("vehicle_type").trim(),
      amount,
      currency: "GHS",
      source: data.get("source").trim(),
      verification_status: verification,
      last_verified_at: verification === "verified"
        ? new Date().toISOString()
        : null,
      is_active: true
    });

    if (error) {
      alert(error.message);
      return;
    }

    form.reset();
    await loadDashboard();

    message("dashboard-message", "Fare record saved.");
  });

  container.appendChild(form);

  const { data, error } = await db
    .from("fares")
    .select("id, amount, currency, vehicle_type, verification_status, station_id, route_id")
    .order("created_at", { ascending: false });

  if (error) throw error;

  (data || []).forEach(fare => {
    const station = stations.find(
      item => item.id === fare.station_id
    );

    const route = routes.find(
      item => item.id === fare.route_id
    );

    makeRecord(
      container,
      `${fare.currency} ${Number(fare.amount).toFixed(2)}`,
      `${station?.name || "Station"} | ${route?.origin || ""} → ${route?.destination || ""} | ${fare.vehicle_type} | ${fare.verification_status}`
    );
  });
}

/* =====================================
   PASSENGER REPORT MANAGEMENT
===================================== */

async function loadReports() {
  const container = $("report-management");
  container.innerHTML = "";

  const { data, error } = await db
    .from("fare_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    container.textContent = "No passenger reports yet.";
    return;
  }

  data.forEach(report => {
    const card = makeRecord(
      container,
      `${report.status.toUpperCase()} — GH₵ ${Number(report.reported_amount).toFixed(2)}`,
      `Vehicle: ${report.vehicle_type || "Not specified"} | Submitted: ${new Date(report.created_at).toLocaleDateString()}`
    );

    const notes = document.createElement("p");
    notes.textContent = report.notes || "No additional notes.";
    card.appendChild(notes);

    const statusSelect = document.createElement("select");

    ["pending", "approved", "rejected"].forEach(status => {
      addOption(statusSelect, status, status);
    });

    statusSelect.value = report.status;
    card.appendChild(statusSelect);

    const button = document.createElement("button");
    button.textContent = "Update report";

    button.addEventListener("click", async () => {
      const { error } = await db
        .from("fare_reports")
        .update({ status: statusSelect.value })
        .eq("id", report.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadReports();
      message("dashboard-message", "Report status updated.");
    });

    card.appendChild(button);
  });
}

/* =====================================
   START
===================================== */

async function startAdmin() {
  try {
    await checkAdministrator();
  } catch (error) {
    console.error(error);
    showLogin();

    message(
      "login-message",
      "Unable to verify administrator access. Check your connection and database permissions."
    );
  }
}

db.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    currentUser = null;
    showLogin();
  }
});

startAdmin();
