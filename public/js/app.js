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
  const btnBowenCam = document.getElementById('btnBowenCam');
  const btnHsbCam = document.getElementById('btnHsbCam');
  const cameraModal = document.getElementById('cameraModal');
  const camModalTitle = document.getElementById('camModalTitle');
  const camFooterNote = document.getElementById('camFooterNote');
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

  // Terminal Modal Elements & State
  const terminalModal = document.getElementById('terminalModal');
  const terminalModalTitle = document.getElementById('terminalModalTitle');
  const terminalModalSub = document.getElementById('terminalModalSub');
  const terminalModalBody = document.getElementById('terminalModalBody');
  const btnTerminalModalClose = document.getElementById('btnTerminalModalClose');
  const btnFilterRemaining = document.getElementById('btnFilterRemaining');
  const btnFilterAll = document.getElementById('btnFilterAll');

  // Service Warning Pop-up Pill Elements & State
  const warningPill = document.getElementById('warningPill');
  const warningPillIcon = document.getElementById('warningPillIcon');
  const warningPillText = document.getElementById('warningPillText');
  let activeWarning = null;
  let simulatedWarning = null;

  let currentModalTerminal = null; // 'hsb' | 'bowen'
  let currentModalFilter = 'remaining'; // 'remaining' | 'all'
  let cachedLiveData = null;

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(' ');
    if (parts.length < 2) return null;
    const [hm, meridiem] = parts;
    let [h, m] = hm.split(':').map(Number);
    if (meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
    if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + (m || 0);
  }

  function formatMinutesDiff(diffMinutes) {
    if (diffMinutes < 0) return 'Departed';
    if (diffMinutes === 0) return 'Boarding / Departing';
    if (diffMinutes < 60) return `in ${diffMinutes}m`;
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`;
  }

  function renderTerminalModal(terminal) {
    if (!terminalModal || !cachedLiveData) return;
    const isHSB = terminal === 'hsb';
    const title = isHSB ? 'Horseshoe Bay Departures' : 'Snug Cove (Bowen) Departures';
    const times = isHSB
      ? (cachedLiveData.schedules?.hsb?.times?.[0] || [])
      : (cachedLiveData.schedules?.bowen?.times?.[0] || []);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Map raw schedule entries
    const sailings = times.map(item => {
      const timeStr = item[0].trim();
      const sailingMinutes = parseTimeToMinutes(timeStr);
      const diffMinutes = sailingMinutes !== null ? (sailingMinutes - currentMinutes) : null;
      const isUpcoming = diffMinutes !== null && diffMinutes >= 0;

      // Check deck space for HSB
      let deck = item[3] ? item[3].trim() : null;
      if (isHSB && !deck) {
        const deckTimes = cachedLiveData.deckSpace?.times?.[0] || [];
        const match = deckTimes.find(d => d[0] === timeStr);
        if (match && match[1]) {
          deck = match[1];
        }
      }

      return {
        time: timeStr,
        minutes: sailingMinutes,
        diffMinutes,
        isUpcoming,
        isDangerousCargo: item[1] === '1',
        isRepositioning: item[2] === '1',
        deckSpace: deck
      };
    });

    const upcomingSailings = sailings.filter(s => s.isUpcoming);
    // In remaining view, omit the first upcoming sailing because it is already featured in the Next Departure card above
    const displayedSailings = currentModalFilter === 'remaining'
      ? upcomingSailings.slice(1)
      : sailings;

    // Update Header
    terminalModalTitle.textContent = title;
    if (upcomingSailings.length > 0) {
      terminalModalSub.textContent = `${upcomingSailings.length} sailing${upcomingSailings.length === 1 ? '' : 's'} remaining today`;
    } else {
      terminalModalSub.textContent = 'All departures finished for today';
    }

    // Update filter tabs active state
    if (btnFilterRemaining) btnFilterRemaining.classList.toggle('active', currentModalFilter === 'remaining');
    if (btnFilterAll) btnFilterAll.classList.toggle('active', currentModalFilter === 'all');

    // Build content
    let html = '';

    // Service Warning Alert Banner in Modal
    if (activeWarning && (activeWarning.terminal === terminal || !activeWarning.terminal)) {
      const isCancel = activeWarning.type === 'cancellation';
      html += `
        <div class="terminal-warning-banner ${isCancel ? 'cancellation' : ''}">
          <span class="terminal-warning-icon">${isCancel ? '🚫' : '⚠️'}</span>
          <div class="terminal-warning-text">
            <strong>${isCancel ? 'Service Alert — Sailing Cancelled' : 'Service Alert — Departure Delayed'}</strong>
            <span>${activeWarning.details || activeWarning.message}</span>
          </div>
        </div>
      `;
    }

    // Next Sailing Feature Card
    if (upcomingSailings.length > 0) {
      const next = upcomingSailings[0];
      const countdown = formatMinutesDiff(next.diffMinutes);
      const deckHtml = next.deckSpace ? `<span class="deck-badge-pill">${next.deckSpace} space left</span>` : '';
      const specialTags = [];
      if (next.isDangerousCargo) specialTags.push('<span class="sailing-tag tag-warning">⚠️ Dangerous Goods — No Passengers Allowed</span>');
      if (next.isRepositioning) specialTags.push('<span class="sailing-tag tag-repo">🔄 Repositioning</span>');

      html += `
        <div class="next-sailing-banner">
          <div>
            <span class="next-sailing-label">Next Departure</span>
            <div class="next-sailing-time">${next.time}</div>
            ${specialTags.length ? `<div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">${specialTags.join('')}</div>` : ''}
          </div>
          <div class="next-sailing-meta">
            <span class="countdown-badge">${countdown}</span>
            ${deckHtml}
          </div>
        </div>
      `;
    }

    // List of sailings
    if (displayedSailings.length === 0) {
      const firstTomorrow = times[0] ? times[0][0] : 'Early Morning';
      if (currentModalFilter === 'remaining' && upcomingSailings.length > 0) {
        html += `
          <div class="no-sailings-notice" style="padding: 16px 12px; margin-top: 6px;">
            <p><strong>Final scheduled departure for today.</strong></p>
            <p style="margin-top: 6px; font-size: 12px; color: var(--text-dim);">Tomorrow's first sailing departs at <strong>${firstTomorrow}</strong>.</p>
            <button class="modal-tab-btn" id="btnNoticeViewAll" style="margin-top: 12px;">View Full Daily Timetable</button>
          </div>
        `;
      } else {
        html += `
          <div class="no-sailings-notice">
            <span class="no-sailings-icon">🌙</span>
            <p><strong>All sailings have finished for today.</strong></p>
            <p style="margin-top: 6px; font-size: 12px; color: var(--text-dim);">The next scheduled sailing departs tomorrow at <strong>${firstTomorrow}</strong>.</p>
            <button class="modal-tab-btn" id="btnNoticeViewAll" style="margin-top: 12px;">View Full Daily Timetable</button>
          </div>
        `;
      }
    } else {
      const sectionLabel = currentModalFilter === 'remaining' ? 'Later Departures' : 'Full Timetable';
      html += `
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-dim); margin: 4px 0 -2px 2px;">${sectionLabel}</div>
        <div class="sailing-list-wrap">
      `;
      displayedSailings.forEach((sailing) => {
        const isNext = upcomingSailings.length > 0 && sailing === upcomingSailings[0];
        const isPast = sailing.diffMinutes !== null && sailing.diffMinutes < 0;
        const diffText = isPast ? 'Departed' : formatMinutesDiff(sailing.diffMinutes);

        const tags = [];
        if (sailing.isDangerousCargo) tags.push('<span class="sailing-tag tag-warning" title="Dangerous Goods sailing — No passengers allowed">⚠️ Dangerous Goods — No Passengers Allowed</span>');
        if (sailing.isRepositioning) tags.push('<span class="sailing-tag tag-repo" title="Repositioning sailing">🔄 Repositioning</span>');

        const deckBadge = sailing.deckSpace ? `<span class="deck-badge-pill">${sailing.deckSpace}</span>` : '';

        html += `
          <div class="sailing-item ${isPast ? 'past' : ''} ${isNext ? 'next-highlight' : ''}">
            <div class="sailing-time-wrap">
              <span class="sailing-time">${sailing.time}</span>
              ${tags.length ? `<div class="sailing-tags">${tags.join('')}</div>` : ''}
            </div>
            <div class="sailing-deck-col">
              ${deckBadge}
              <span class="sailing-diff">${diffText}</span>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    terminalModalBody.innerHTML = html;

    // Hook up button in empty state notice
    const btnNoticeViewAll = document.getElementById('btnNoticeViewAll');
    if (btnNoticeViewAll) {
      btnNoticeViewAll.addEventListener('click', () => {
        currentModalFilter = 'all';
        renderTerminalModal(terminal);
      });
    }
  }

  function openTerminalModal(terminal) {
    if (!terminalModal) return;
    closeCameraModal();
    if (warningPill) warningPill.classList.add('hidden');
    currentModalTerminal = terminal;
    terminalModal.classList.remove('hidden');

    if (bowenTerminalPill) bowenTerminalPill.classList.toggle('active', terminal === 'bowen');
    if (hsbTerminalPill) hsbTerminalPill.classList.toggle('active', terminal === 'hsb');

    renderTerminalModal(terminal);
  }

  function closeTerminalModal() {
    if (!terminalModal) return;
    terminalModal.classList.add('hidden');
    currentModalTerminal = null;

    if (bowenTerminalPill) bowenTerminalPill.classList.remove('active');
    if (hsbTerminalPill) hsbTerminalPill.classList.remove('active');

    updateWarningPill(cachedLiveData);
  }

  function toggleTerminalModal(terminal) {
    if (currentModalTerminal === terminal && !terminalModal.classList.contains('hidden')) {
      closeTerminalModal();
    } else {
      openTerminalModal(terminal);
    }
  }

  if (bowenTerminalPill) {
    bowenTerminalPill.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTerminalModal('bowen');
    });
  }

  if (hsbTerminalPill) {
    hsbTerminalPill.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTerminalModal('hsb');
    });
  }

  if (btnTerminalModalClose) {
    btnTerminalModalClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTerminalModal();
    });
  }

  if (btnFilterRemaining) {
    btnFilterRemaining.addEventListener('click', (e) => {
      e.stopPropagation();
      currentModalFilter = 'remaining';
      if (currentModalTerminal) renderTerminalModal(currentModalTerminal);
    });
  }

  if (btnFilterAll) {
    btnFilterAll.addEventListener('click', (e) => {
      e.stopPropagation();
      currentModalFilter = 'all';
      if (currentModalTerminal) renderTerminalModal(currentModalTerminal);
    });
  }

  // Close modal when clicking outside
  document.addEventListener('click', (e) => {
    if (terminalModal && !terminalModal.classList.contains('hidden')) {
      if (!terminalModal.contains(e.target) &&
          (!bowenTerminalPill || !bowenTerminalPill.contains(e.target)) &&
          (!hsbTerminalPill || !hsbTerminalPill.contains(e.target))) {
        closeTerminalModal();
      }
    }
    if (cameraModal && !cameraModal.classList.contains('hidden')) {
      if (!cameraModal.contains(e.target) &&
          (!btnBowenCam || !btnBowenCam.contains(e.target)) &&
          (!btnHsbCam || !btnHsbCam.contains(e.target))) {
        closeCameraModal();
      }
    }
  });

  // Service Warning Pop-up Pill Logic
  function updateWarningPill(data) {
    if (!warningPill) return;

    // 1. Check for simulated warning override or server warning
    let warning = simulatedWarning || data?.warning || null;

    // 2. Client-side fallback check (e.g. if time has advanced between polling intervals)
    if (!warning && data) {
      const bowenTimes = data.schedules?.bowen?.times?.[0] || [];
      const hsbTimes = data.schedules?.hsb?.times?.[0] || [];
      const berthLogs = data.berthLog || [];
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      const checkDelay = (times, termKey, termName) => {
        for (const item of times) {
          if (!Array.isArray(item) || !item[0]) continue;
          const timeStr = item[0].trim();
          const schedMin = parseTimeToMinutes(timeStr);
          if (schedMin === null) continue;
          let diffMin = nowMin - schedMin;
          if (diffMin < -720) diffMin += 1440;

          if (diffMin >= 3 && diffMin <= 75) {
            const locKeywords = termKey === 'bowen' ? ['bowen', 'snug'] : ['hsb', 'horseshoe'];
            const alreadyDeparted = berthLogs.some(log => {
              if (!Array.isArray(log) || log[0] !== 'Departed') return false;
              const loc = (log[1] || '').toLowerCase();
              if (!locKeywords.some(k => loc.includes(k))) return false;
              const depMin = parseTimeToMinutes(log[2]);
              if (depMin === null) return false;
              let depDiff = depMin - schedMin;
              if (depDiff < -720) depDiff += 1440;
              return depDiff >= -10 && depDiff <= (diffMin + 2);
            });

            if (!alreadyDeparted) {
              return {
                hasWarning: true,
                type: 'delay',
                terminal: termKey,
                terminalName: termName,
                scheduledTime: timeStr,
                delayMinutes: diffMin,
                message: `${timeStr} ${termName} delayed (+${diffMin}m)`,
                details: `The ${timeStr} departure from ${termName} has not departed yet (+${diffMin} mins).`
              };
            }
          }
        }
        return null;
      };

      warning = checkDelay(bowenTimes, 'bowen', 'Snug Cove') || checkDelay(hsbTimes, 'hsb', 'Horseshoe Bay');
    }

    activeWarning = warning;

    // Do not show floating pill if a modal window is currently open
    const isModalOpen = (terminalModal && !terminalModal.classList.contains('hidden')) ||
                        (cameraModal && !cameraModal.classList.contains('hidden'));

    if (warning && !isModalOpen) {
      const isCancel = warning.type === 'cancellation';
      if (warningPillIcon) warningPillIcon.textContent = isCancel ? '🚫' : '⚠️';
      if (warningPillText) warningPillText.textContent = warning.message;
      warningPill.classList.toggle('cancellation', isCancel);
      warningPill.classList.remove('hidden');
    } else {
      warningPill.classList.add('hidden');
    }
  }

  if (warningPill) {
    const handleWarningClick = (e) => {
      e.stopPropagation();
      if (activeWarning && activeWarning.terminal) {
        openTerminalModal(activeWarning.terminal);
      } else {
        openTerminalModal('bowen');
      }
    };
    warningPill.addEventListener('click', handleWarningClick);
    warningPill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleWarningClick(e);
      }
    });
  }

  // Developer simulation helper for testing warning pill
  window.simulateWarning = (type = 'delay', time = '5:20 PM', terminal = 'hsb', delayMinutes = 6) => {
    if (!type) {
      simulatedWarning = null;
      console.log('Simulated warning cleared.');
    } else if (type === 'cancellation') {
      const termName = terminal === 'hsb' ? 'Horseshoe Bay' : 'Snug Cove';
      simulatedWarning = {
        hasWarning: true,
        type: 'cancellation',
        terminal,
        terminalName,
        scheduledTime: time,
        message: `${time} ${termName} sailing cancelled`,
        details: `The ${time} scheduled departure from ${termName} has been cancelled.`
      };
      console.log('Simulated cancellation activated:', simulatedWarning);
    } else {
      const termName = terminal === 'hsb' ? 'Horseshoe Bay' : 'Snug Cove';
      simulatedWarning = {
        hasWarning: true,
        type: 'delay',
        terminal,
        terminalName,
        scheduledTime: time,
        delayMinutes,
        message: `${time} ${termName} delayed (+${delayMinutes}m)`,
        details: `The ${time} departure from ${termName} has not departed yet (+${delayMinutes} mins).`
      };
      console.log('Simulated delay activated:', simulatedWarning);
    }
    updateWarningPill(cachedLiveData);
  };

  // Camera Modal Handling
  const CAM_CONFIG = {
    bowen: {
      title: 'Snug Cove Ferry Cam',
      footer: 'Near-real-time view of Snug Cove lineup courtesy of Bowen Island Municipality',
      proxyUrl: '/api/ferry/camera/bowen',
      fallbackUrl: 'https://i0.wp.com/ferrycamera.bowencommunitycentre.com/snapshot.jpg?w=1290&ssl=1'
    },
    hsb: {
      title: 'Horseshoe Bay Terminal Cam',
      footer: 'Near-real-time view courtesy of BC Ferries',
      proxyUrl: '/api/ferry/camera/hsb',
      fallbackUrl: 'https://ccimg.bcferries.com/cc/support/terminals/cam1_HSB.jpg'
    }
  };

  let currentCamTerminal = null;
  let camRefreshInterval = null;

  function updateCamButtonStates() {
    if (btnBowenCam) {
      btnBowenCam.classList.toggle('active', currentCamTerminal === 'bowen');
    }
    if (btnHsbCam) {
      btnHsbCam.classList.toggle('active', currentCamTerminal === 'hsb');
    }
  }

  function loadFerryCamera() {
    if (!ferryCamImg || !currentCamTerminal) return;
    const config = CAM_CONFIG[currentCamTerminal] || CAM_CONFIG.bowen;

    if (camModalTitle) camModalTitle.textContent = config.title;
    if (camFooterNote) camFooterNote.textContent = config.footer;
    if (camLoadingOverlay) {
      camLoadingOverlay.textContent = 'Loading live view...';
      camLoadingOverlay.classList.add('active');
    }

    const timestamp = Date.now();
    const proxyUrl = `${config.proxyUrl}?t=${timestamp}`;
    const fallbackUrl = `${config.fallbackUrl}${config.fallbackUrl.includes('?') ? '&' : '?'}t=${timestamp}`;

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

  function positionCameraModal(terminal) {
    if (!cameraModal) return;
    const btn = terminal === 'hsb' ? btnHsbCam : btnBowenCam;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 640;

    cameraModal.classList.remove('cam-pos-bowen', 'cam-pos-hsb');
    cameraModal.classList.add(terminal === 'hsb' ? 'cam-pos-hsb' : 'cam-pos-bowen');

    if (isMobile) {
      cameraModal.style.left = '8px';
      cameraModal.style.right = '8px';
      cameraModal.style.width = 'auto';
      const bottomSpace = Math.max(68, window.innerHeight - rect.top + 8);
      cameraModal.style.bottom = `${bottomSpace}px`;
      cameraModal.style.top = 'auto';
    } else {
      const modalWidth = 420;
      cameraModal.style.width = `${modalWidth}px`;
      const bottomSpace = Math.max(70, window.innerHeight - rect.top + 10);
      cameraModal.style.bottom = `${bottomSpace}px`;
      cameraModal.style.top = 'auto';

      if (terminal === 'bowen') {
        let left = rect.left;
        if (left + modalWidth > window.innerWidth - 16) {
          left = window.innerWidth - modalWidth - 16;
        }
        if (left < 16) left = 16;
        cameraModal.style.left = `${left}px`;
        cameraModal.style.right = 'auto';
      } else {
        let right = window.innerWidth - rect.right;
        if (right + modalWidth > window.innerWidth - 16) {
          right = window.innerWidth - modalWidth - 16;
        }
        if (right < 16) right = 16;
        cameraModal.style.right = `${right}px`;
        cameraModal.style.left = 'auto';
      }
    }
  }

  function openCameraModal(terminal) {
    if (!cameraModal) return;
    closeTerminalModal();
    if (warningPill) warningPill.classList.add('hidden');
    currentCamTerminal = terminal || 'bowen';
    positionCameraModal(currentCamTerminal);
    cameraModal.classList.remove('hidden');
    updateCamButtonStates();
    loadFerryCamera();
    if (camRefreshInterval) clearInterval(camRefreshInterval);
    camRefreshInterval = setInterval(loadFerryCamera, 30000);
  }

  function closeCameraModal() {
    if (!cameraModal) return;
    cameraModal.classList.add('hidden');
    currentCamTerminal = null;
    updateCamButtonStates();
    if (camRefreshInterval) {
      clearInterval(camRefreshInterval);
      camRefreshInterval = null;
    }
    updateWarningPill(cachedLiveData);
  }

  function toggleCameraModal(terminal) {
    if (!cameraModal) return;
    if (!cameraModal.classList.contains('hidden') && currentCamTerminal === terminal) {
      closeCameraModal();
    } else {
      openCameraModal(terminal);
    }
  }

  if (btnBowenCam) {
    btnBowenCam.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCameraModal('bowen');
    });
  }

  if (btnHsbCam) {
    btnHsbCam.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCameraModal('hsb');
    });
  }

  if (btnCamClose) {
    btnCamClose.addEventListener('click', closeCameraModal);
  }

  if (btnCamRefresh) {
    btnCamRefresh.addEventListener('click', () => loadFerryCamera());
  }

  window.addEventListener('resize', () => {
    if (cameraModal && !cameraModal.classList.contains('hidden') && currentCamTerminal) {
      positionCameraModal(currentCamTerminal);
    }
  });

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

      // Cache for modal usage & refresh if open
      cachedLiveData = data;
      if (currentModalTerminal && terminalModal && !terminalModal.classList.contains('hidden')) {
        renderTerminalModal(currentModalTerminal);
      }

      // Update Service Warning Pop-up Pill
      updateWarningPill(data);

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
      hsbDeckSpace.textContent = `${cleanPct} space${sailingTime ? ' (' + sailingTime + ')' : ''}`;
    } else {
      hsbDeckSpace.textContent = 'Deck: Check schedule';
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
          <span>${item[0]} ${isDangerousCargo ? '⚠️ (Dangerous Goods — No Passengers Allowed)' : ''}</span>
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
          <span>${item[0]} ${isDangerousCargo ? '⚠️ (Dangerous Goods — No Passengers Allowed)' : ''} ${isRepositioning ? '🔄' : ''}</span>
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
