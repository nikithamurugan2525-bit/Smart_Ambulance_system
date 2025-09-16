// Frontend-only simulation for LifeLine Connect prototype
// No backend — all simulated in-browser

// Simple route points in % (relative to SVG viewBox 0..100 x 0..60)
// Points will be translated to pixels relative to mapArea size
const mainRoutePoints = [
  {x:5, y:50}, {x:30, y:40}, {x:60, y:30}, {x:90, y:10}
];
const altRoutePoints = [
  {x:5, y:50}, {x:30, y:50}, {x:45, y:35}, {x:70, y:20}, {x:90, y:12}
];

let currentPath = 'main'; // 'main' or 'alt'
let animTimer = null;
let animIndex = 0;

// DOM elements
const ambulance = document.getElementById('ambulance');
const startTripBtn = document.getElementById('startTripBtn');
const resetBtn = document.getElementById('resetBtn');
const reportBlockBtn = document.getElementById('reportBlockBtn');
const ackBtn = document.getElementById('ackBtn');
const simulateNotifyBtn = document.getElementById('simulateNotifyBtn');
const citizenNotificationArea = document.getElementById('citizenNotificationArea');
const driverMessages = document.getElementById('driverMessages');
const routeLabel = document.getElementById('routeLabel');
const etaLabel = document.getElementById('etaLabel');
const mapArea = document.getElementById('mapArea');
const hospitalToggles = Array.from(document.querySelectorAll('.hospital-toggle'));

// Utilities
function pxFromPercent(pctX, pctY) {
  const rect = mapArea.getBoundingClientRect();
  const x = (pctX/100) * rect.width;
  const y = (pctY/60) * rect.height; // viewBox height is 60
  return {x, y};
}

function placeAmbulanceAt(pt) {
  ambulance.style.left = pt.x + 'px';
  ambulance.style.top = pt.y + 'px';
  ambulance.style.transform = 'translate(-50%,-50%) rotate(0deg)';
}

function showCitizenNotification(text) {
  const div = document.createElement('div');
  div.className = 'citizen-notification';
  div.innerHTML = `<strong>Alert:</strong> ${text}`;
  citizenNotificationArea.prepend(div);
  setTimeout(()=>{
    if (div.parentNode) div.remove();
  }, 8000);
}

function pushDriverMessage(text) {
  const li = document.createElement('li');
  li.textContent = text;
  driverMessages.prepend(li);
  // keep only last 6
  while (driverMessages.children.length > 6) driverMessages.removeChild(driverMessages.lastChild);
}

// Animation core (step through points smoothly)
function animateAlong(points, stepMs=600) {
  if (animTimer) { clearInterval(animTimer); animTimer=null; }
  animIndex = 0;
  placeAmbulanceAt(pxFromPercent(points[0].x, points[0].y));
  updateETA(points.length);
  animTimer = setInterval(()=>{
    animIndex++;
    if (animIndex >= points.length) {
      clearInterval(animTimer);
      animTimer = null;
      etaLabel.textContent = 'Arrived';
      pushDriverMessage('Trip completed');
      return;
    }
    const p = pxFromPercent(points[animIndex].x, points[animIndex].y);
    placeAmbulanceAt(p);
    updateETA(points.length - animIndex);
  }, stepMs);
}

function updateETA(stepsRemaining) {
  // simple simulated ETA: steps * 1.2 min
  const mins = Math.max(1, Math.round(stepsRemaining * 1.2));
  etaLabel.textContent = `${mins} min (sim)`;
}

// Controls
startTripBtn.addEventListener('click', ()=>{
  if (animTimer) return;
  pushDriverMessage('Ambulance started');
  showCitizenNotification('Ambulance is on the way — please clear the route');
  // "broadcast" simulated notification
  simulateNotifyBtn.classList.add('btn-success');
  routeLabel.textContent = currentPath === 'main' ? 'Main Route' : 'Alternate Route';
  const pts = currentPath === 'main' ? mainRoutePoints : altRoutePoints;
  setTimeout(()=> animateAlong(pts, 700), 400);
});

resetBtn.addEventListener('click', ()=>{
  if (animTimer) { clearInterval(animTimer); animTimer=null; }
  currentPath = 'main';
  routeLabel.textContent = 'Main Route';
  etaLabel.textContent = '—';
  ambulance.style.left='0px'; ambulance.style.top='0px';
  driverMessages.innerHTML='';
  citizenNotificationArea.innerHTML='';
  simulateNotifyBtn.classList.remove('btn-success');
});

simulateNotifyBtn.addEventListener('click', ()=>{
  showCitizenNotification('Ambulance approaching — please clear the road.');
  pushDriverMessage('Notification broadcast to citizens');
});

reportBlockBtn.addEventListener('click', ()=>{
  // citizen reports block: change route to alternate
  showCitizenNotification('Road blocked reported by user at Main St.');
  pushDriverMessage('Citizen reported: Road blocked at Main St.');
  if (currentPath === 'main') {
    pushDriverMessage('Switching to alternate route (sim)');
    currentPath = 'alt';
    routeLabel.textContent = 'Alternate Route';
    // If animating, interrupt and switch to alt route (continue from current position)
    if (animTimer) {
      clearInterval(animTimer);
      animTimer=null;
      // calculate a simple resume using alt route points
      animateAlong(altRoutePoints, 700);
    }
  }
});

ackBtn.addEventListener('click', ()=>{
  showCitizenNotification('User acknowledged / cleared the road.');
  pushDriverMessage('Citizen acknowledged — route remains: '+(currentPath==='main'?'Main':'Alt'));
});

// Hospital toggles behavior
hospitalToggles.forEach(t=>{
  t.addEventListener('change', (ev)=>{
    const name = ev.target.dataset.hospital;
    const status = ev.target.checked ? 'Available' : 'Busy/Unavailable';
    pushDriverMessage(`${name} set to ${status}`);
  });
});

// Initial placement - put ambulance at starting point
window.addEventListener('load', ()=>{
  const p = pxFromPercent(mainRoutePoints[0].x, mainRoutePoints[0].y);
  placeAmbulanceAt(p);
});