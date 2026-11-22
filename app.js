
// GoFare Ghana — Supabase connection
const SUPABASE_URL = "https://geqypnseawwqlvtrqsej.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eAMCV7V2dERa-nE2uk3srQ_Y5Wp990I";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
(async function testDatabaseConnection() {
  const status = document.createElement("p");
  status.id = "database-status";
  status.textContent = "Checking database connection...";
  status.style.cssText = "text-align:center;padding:12px;font-weight:bold;";
  document.querySelector("main").prepend(status);

  try {
    const { error } = await supabaseClient
      .from("stations")
      .select("id")
      .limit(1);

    if (error) throw error;

    status.textContent = "Database connected successfully!";
    status.style.color = "green";
  } catch (error) {
    status.textContent = "Database connection failed. Please check your settings.";
    status.style.color = "red";
    console.error("GoFare database error:", error);
  }
})();

const demoFares = [
  {from:"Accra",to:"Kumasi",station:"Neoplan Station",fare:120,status:"DEMO — NOT VERIFIED",kind:"pending"},
  {from:"Accra",to:"Kumasi",station:"Circle",fare:130,status:"DEMO — NOT VERIFIED",kind:"pending"},
  {from:"Accra",to:"Kumasi",station:"Kaneshie",fare:125,status:"DEMO — NOT VERIFIED",kind:"pending"},
  {from:"Accra",to:"Ho",station:"Tema Station",fare:70,status:"DEMO — NOT VERIFIED",kind:"pending"},
  {from:"Accra",to:"Nsawam",station:"Circle",fare:15,status:"DEMO — NOT VERIFIED",kind:"pending"},
  {from:"Kumasi",to:"Accra",station:"Kejetia area",fare:120,status:"DEMO — NOT VERIFIED",kind:"pending"}
];
const $ = id => document.getElementById(id);
function render(from,to){
  const matches=demoFares.filter(x=>x.from.toLowerCase()===from.toLowerCase()&&x.to.toLowerCase()===to.toLowerCase());
  $("results-title").textContent=`${from} → ${to}`;
  $("results").innerHTML=matches.length?matches.map(x=>`
    <article class="fare-card">
      <div class="fare-card-top"><div><div class="station">${x.station}</div><div class="route-meta">${x.from} departure station</div></div><div class="fare">GH₵${x.fare.toFixed(2)}</div></div>
      <span class="status ${x.kind}">${x.status}</span>
    </article>`).join(""):`<article class="fare-card"><b>No demo fare available for this route yet.</b><p class="route-meta">We have not added a sample for this journey. A future live version will show fares after they are collected and checked.</p></article>`;
}
$("search-form").addEventListener("submit",e=>{e.preventDefault();const a=$("origin").value,b=$("destination").value;if(a===b){$("results-title").textContent="Choose two different places";$("results").innerHTML='<article class="fare-card">Your starting point and destination must be different.</article>';return;}render(a,b);$("results-section").scrollIntoView({behavior:"smooth"});});
$("report-form").addEventListener("submit",e=>{e.preventDefault();const report={from:$("report-origin").value.trim(),to:$("report-destination").value.trim(),station:$("report-station").value.trim(),fare:Number($("report-fare").value),date:$("report-date").value,submittedAt:new Date().toISOString(),status:"local demo only"};const reports=JSON.parse(localStorage.getItem("gofare_demo_reports")||"[]");reports.push(report);localStorage.setItem("gofare_demo_reports",JSON.stringify(reports));$("report-message").textContent="Demo report saved on this device only. It has not been sent for verification.";e.target.reset();});
render("Accra","Kumasi");
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));}
