/**
 * Main application logic and data synchronization for Queen of Capilano live tracker
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Map
  MapManager.init();

  // Elements
  const liveIndicator = document.getElementById('liveIndicator');
  const headerStatus = document.getElementById('headerStatus');
  const bowenNextDeparture = document.getElementById('bowenNextDeparture');
  const hsbDeckSpace = document.getElementById('hsbDeckSpace');
  const btn3DToggle = document.getElementById('btn3DToggle');
  const btnFollow = document.getElementById('btnFollow');
  const btnScheduleToggle = document.getElementById('btnScheduleToggle');
  const btnLayerToggle = document.getElementById('btnLayerToggle');
  const scheduleDrawer = document.getElementById('scheduleDrawer');
  const btnDrawerClose = document.getElementById('btnDrawerClose');
  const drawerCloseHandle = document.getElementById('drawerCloseHandle');
  const bowenTerminalPill = document.getElementById('bowenTerminalPill');
  const hsbTerminalPill = document.getElementById('hsbTerminalPill');
  const deckSpaceContainer = document.getElementById('deckSpaceContainer');
  const scheduleBowenList = document.getElementById('scheduleBowenList');
  const scheduleHSBList = document.getElementById('scheduleHSBList');
  const berthActivityList = document.getElementById('berthActivityList');
  const btnCamToggle = document.getElementById('btnCamToggle');
  const cameraModal = document.getElementById('cameraModal');
  const btnCamClose = document.getElementById('btnCamClose');
  const btnCamRefresh = document.getElementById('btnCamRefresh');
  const ferryCamImg = document.getElementById('ferryCamImg');
  const camLoadingOverlay = document.getElementById('camLoadingOverlay');
  const camTimestamp = document.getElementById('camTimestamp');

  // UI Event Handlers
  if (btn3DToggle) {
    btn3DToggle.addEventListener('click', () => MapManager.toggle3D());
  }

  if (btnFollow) {
    btnFollow.addEventListener('click', () => {
      const newState = !MapManager.followFerry;
      MapManager.setFollowFerry(newState);
      if (newState) MapManager.recenterOnFerry();
    });
  }

  if (btnLayerToggle) {
    btnLayerToggle.addEventListener('click', () => MapManager.cycleMapTheme());
  }

  if (btnScheduleToggle) {
    btnScheduleToggle.addEventListener('click', () => {
      scheduleDrawer.classList.toggle('hidden');
    });
  }

  if (btnDrawerClose) {
    btnDrawerClose.addEventListener('click', () => {
      scheduleDrawer.classList.add('hidden');
    });
  }

  if (drawerCloseHandle) {
    drawerCloseHandle.addEventListener('click', () => {
      scheduleDrawer.classList.add('hidden');
    });
  }

  if (bowenTerminalPill) {
    bowenTerminalPill.addEventListener('click', () => {
      MapManager.map.flyTo({ center: [-123.3330, 49.3835], zoom: 14, speed: 1.2 });
      MapManager.setFollowFerry(false);
    });
  }

  if (hsbTerminalPill) {
    hsbTerminalPill.addEventListener('click', () => {
      MapManager.map.flyTo({ center: [-123.2725, 49.3755], zoom: 14, speed: 1.2 });
      MapManager.setFollowFerry(false);
    });
  }

  // Camera Modal Handling
  let camRefreshInterval = null;

  function loadFerryCamera() {
    if (!ferryCamImg) return;
    if (camLoadingOverlay) camLoadingOverlay.classList.add('active');
    const timestamp = Date.now();
    const proxyUrl = `/api/ferry/camera?t=${timestamp}`;
    const fallbackUrl = `https://i0.wp.com/ferrycamera.bowencommunitycentre.com/snapshot.jpg?w=1290&ssl=1&t=${timestamp}`;

    ferryCamImg.onload = () => {
      if (camLoadingOverlay) camLoadingOverlay.classList.remove('active');
      if (camTimestamp) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        camTimestamp.textContent = `Updated ${timeStr} • Auto-refreshes 30s`;
      }
    };

    ferryCamImg.onerror = () => {
      if (ferryCamImg.src !== fallbackUrl) {
        ferryCamImg.src = fallbackUrl;
      } else {
        if (camLoadingOverlay) {
          camLoadingOverlay.textContent = 'Camera temporarily unavailable';
          camLoadingOverlay.classList.add('active');
        }
      }
    };

    ferryCamImg.src = proxyUrl;
  }

  function openCameraModal() {
    if (!cameraModal) return;
    cameraModal.classList.remove('hidden');
    if (btnCamToggle) btnCamToggle.classList.add('active');
    loadFerryCamera();
    if (!camRefreshInterval) {
      camRefreshInterval = setInterval(loadFerryCamera, 30000);
    }
  }

  function closeCameraModal() {
    if (!cameraModal) return;
    cameraModal.classList.add('hidden');
    if (btnCamToggle) btnCamToggle.classList.remove('active');
    if (camRefreshInterval) {
      clearInterval(camRefreshInterval);
      camRefreshInterval = null;
    }
  }

  function toggleCameraModal() {
    if (!cameraModal) return;
    if (cameraModal.classList.contains('hidden')) {
      openCameraModal();
    } else {
      closeCameraModal();
    }
  }

  if (btnCamToggle) {
    btnCamToggle.addEventListener('click', toggleCameraModal);
  }

  if (btnCamClose) {
    btnCamClose.addEventListener('click', closeCameraModal);
  }

  if (btnCamRefresh) {
    btnCamRefresh.addEventListener('click', () => loadFerryCamera());
  }

  /**
   * Fetch live ferry data
   */
  async function fetchLiveData() {
    try {
      const res = await fetch('/api/ferry/live');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Update Map
      MapManager.updateVessel(data);

      // Update Header Status
      updateHeaderStatus(data);

      // Update Terminal Pills
      updateTerminalPills(data);

      // Update Drawer
      updateDrawerContent(data);

      liveIndicator.className = 'pulse-indicator';
      if (!data.telemetry.isFresh) {
        liveIndicator.classList.add('stale');
      }
    } catch (err) {
      console.error('Failed to fetch live ferry data:', err);
      liveIndicator.className = 'pulse-indicator offline';
      headerStatus.textContent = 'Connection paused • Retrying...';
    }
  }

  /**
   * Fetch vessel breadcrumb trail
   */
  async function fetchTrackData() {
    try {
      const res = await fetch('/api/ferry/track');
      if (!res.ok) return;
      const trackGeoJson = await res.json();
      MapManager.updateBreadcrumbs(trackGeoJson);
    } catch (err) {
      console.warn('Failed to fetch breadcrumb trail:', err);
    }
  }

  /**
   * Update top header text
   */
  function updateHeaderStatus(data) {
    const nav = data.navigation;
    const tel = data.telemetry;

    if (nav.state === 'docked') {
      const elapsed = Telemetry.formatElapsedDocked(nav.elapsedDockedMinutes);
      headerStatus.textContent = `Docked at ${nav.currentDock} • ${elapsed}`;
    } else {
      const eta = Telemetry.formatEta(nav.etaMinutes);
      const speed = tel.sog ? tel.sog.toFixed(1) : '0.0';
      headerStatus.textContent = `En route to ${nav.destination} • ETA ${eta} (${speed} kts)`;
    }
  }

  /**
   * Update bottom terminal pills
   */
  function updateTerminalPills(data) {
    // Bowen next departure
    const bowenTimes = data.schedules?.bowen?.times?.[0] || [];
    const nextBowen = Telemetry.findNextSailing(bowenTimes);
    bowenNextDeparture.textContent = `Next: ${nextBowen}`;

    // Horseshoe Bay deck space percentage
    const deckEntries = data.deckSpace?.times?.[0] || [];
    let pct = null;
    let sailingTime = null;

    if (deckEntries.length > 0) {
      pct = deckEntries[0][1];
      sailingTime = deckEntries[0][0];
    } else {
      // Check upcoming sailings in HSB schedule for any listed deck space
      const hsbTimes = data.schedules?.hsb?.times?.[0] || [];
      for (const s of hsbTimes) {
        if (s[3] && s[3].trim().length > 0) {
          pct = s[3].trim();
          sailingTime = s[0];
          break;
        }
      }
    }

    if (pct) {
      const cleanPct = pct.includes('%') ? pct : `${pct}%`;
      hsbDeckSpace.textContent = `${cleanPct} space left${sailingTime ? ' (' + sailingTime + ')' : ''}`;
    } else {
      hsbDeckSpace.textContent = 'Deck Space: Check schedule';
    }
  }

  /**
   * Update drawer tables and cards
   */
  function updateDrawerContent(data) {
    // Deck Space Cards
    const deckTimes = data.deckSpace?.times?.[0] || [];
    if (deckTimes.length > 0) {
      deckSpaceContainer.innerHTML = deckTimes.map(item => `
        <div class="deck-space-item">
          <span class="deck-time">${item[0]} departure</span>
          <span class="deck-pct">${item[1]}</span>
        </div>
      `).join('');
    } else {
      deckSpaceContainer.innerHTML = '<span>No recent deck space reports</span>';
    }

    // Bowen Schedule
    const bowenTimes = data.schedules?.bowen?.times?.[0] || [];
    scheduleBowenList.innerHTML = bowenTimes.map(item => {
      const isDangerousCargo = item[1] === '1';
      return `
        <div class="schedule-row">
          <span>${item[0]} ${isDangerousCargo ? '⚠️ (Dangerous Cargo)' : ''}</span>
        </div>
      `;
    }).join('');

    // Horseshoe Bay Schedule
    const hsbTimes = data.schedules?.hsb?.times?.[0] || [];
    scheduleHSBList.innerHTML = hsbTimes.map(item => {
      const isDangerousCargo = item[1] === '1';
      const isRepositioning = item[2] === '1';
      const deck = item[3] ? `(${item[3]} deck)` : '';
      return `
        <div class="schedule-row">
          <span>${item[0]} ${isDangerousCargo ? '⚠️' : ''} ${isRepositioning ? '🔄' : ''}</span>
          <span>${deck}</span>
        </div>
      `;
    }).join('');

    // Recent Berth Activity Log
    const logs = data.berthLog || [];
    if (logs.length > 0) {
      berthActivityList.innerHTML = `
        <table class="berth-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Terminal</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td><strong>${log[0]}</strong></td>
                <td>${log[1]}</td>
                <td>${log[2]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      berthActivityList.innerHTML = '<span>No berth records logged today yet.</span>';
    }
  }

  // Initial fetch
  fetchLiveData();
  fetchTrackData();

  // Polling intervals: 5 seconds for live status, 15 seconds for breadcrumb trail
  setInterval(fetchLiveData, 5000);
  setInterval(fetchTrackData, 15000);
});
