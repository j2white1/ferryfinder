/**
 * Accurate isometric representation of BC Ferries "Queen of Capilano"
 * Modeled after real vessel specifications: Intermediate-class double-ended car ferry
 * with flared bulwarks, open vehicle deck, passenger observation lounge, and raised wheelhouse.
 */
const Vessel = {
  /**
   * Generates the detailed SVG element for Queen of Capilano
   * Oriented pointing North (0° / Up) along the Y axis
   */
  createVesselSvg() {
    return `
      <svg class="vessel-svg" viewBox="0 0 80 190" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Hull 3D Shading -->
          <linearGradient id="hullSideGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="18%" stop-color="#f8fafc"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="82%" stop-color="#f8fafc"/>
            <stop offset="100%" stop-color="#64748b"/>
          </linearGradient>

          <!-- BC Ferries Ocean Blue Livery -->
          <linearGradient id="bcFerriesBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="50%" stop-color="#0369a1"/>
            <stop offset="100%" stop-color="#075985"/>
          </linearGradient>

          <!-- Car Deck Asphalt Surface -->
          <linearGradient id="deckAsphalt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>

          <!-- Passenger Lounge Roof Shading -->
          <linearGradient id="superstructureGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#cbd5e1"/>
            <stop offset="20%" stop-color="#f8fafc"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="80%" stop-color="#f8fafc"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>

          <!-- Window Glass Tint -->
          <linearGradient id="windowGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>

          <!-- Water Drop Shadow -->
          <filter id="vesselHullShadow" x="-30%" y="-20%" width="160%" height="150%">
            <feDropShadow dx="0" dy="10" stdDeviation="7" flood-color="#020617" flood-opacity="0.65"/>
          </filter>
        </defs>

        <!-- Dynamic Stern Wake (renders behind the vessel) -->
        <g class="stern-wake-group" opacity="0.9">
          <!-- Propeller wash & cavitation bloom -->
          <ellipse cx="40" cy="184" rx="16" ry="8" fill="rgba(255,255,255,0.7)" />
          <ellipse cx="40" cy="182" rx="10" ry="5" fill="#ffffff" />
          <!-- Lateral breaking foam wings -->
          <path d="M 26 180 C 14 195, 0 215, -10 228 C 10 215, 24 198, 34 186 Z" fill="rgba(224,242,254,0.5)" />
          <path d="M 54 180 C 66 195, 80 215, 90 228 C 70 215, 56 198, 46 186 Z" fill="rgba(224,242,254,0.5)" />
          <path d="M 30 182 Q 18 202 4 218 Q 18 206 32 190 Z" fill="rgba(255,255,255,0.75)" />
          <path d="M 50 182 Q 62 202 76 218 Q 62 206 48 190 Z" fill="rgba(255,255,255,0.75)" />
        </g>

        <!-- Main Vessel Group with 3D Shadow -->
        <g filter="url(#vesselHullShadow)">
          
          <!-- 1. Outer Hull Base / Rubbing Strake (Dark Belt) -->
          <path d="M 25 10 
                   C 32 6, 48 6, 55 10 
                   C 66 22, 70 55, 70 95 
                   C 70 135, 66 168, 55 180 
                   C 48 184, 32 184, 25 180 
                   C 14 168, 10 135, 10 95 
                   C 10 55, 14 22, 25 10 Z" 
                fill="#0f172a" 
                stroke="#020617" 
                stroke-width="1.8" />

          <!-- 2. Main White Hull Topsides -->
          <path d="M 26 12 
                   C 33 8, 47 8, 54 12 
                   C 64 24, 68 55, 68 95 
                   C 68 135, 64 166, 54 178 
                   C 47 182, 33 182, 26 178 
                   C 16 166, 12 135, 12 95 
                   C 12 55, 16 24, 26 12 Z" 
                fill="url(#hullSideGradient)" />

          <!-- 3. BC Ferries Blue Hull Accent Bands (Port & Starboard) -->
          <path d="M 12 40 Q 11 95 12 150 L 14.5 150 Q 13.5 95 14.5 40 Z" fill="url(#bcFerriesBlue)" />
          <path d="M 68 40 Q 69 95 68 150 L 65.5 150 Q 66.5 95 65.5 40 Z" fill="url(#bcFerriesBlue)" />

          <!-- 4. Open Vehicle Deck Surface (Car Deck Floor) -->
          <path d="M 27 16 
                   C 34 13, 46 13, 53 16 
                   C 61 28, 64 55, 64 95 
                   C 64 135, 61 162, 53 174 
                   C 46 177, 34 177, 27 174 
                   C 19 162, 16 135, 16 95 
                   C 16 55, 19 28, 27 16 Z" 
                fill="url(#deckAsphalt)" />

          <!-- Vehicle Lane Guideline Stripes (Yellow Dotted Lines) -->
          <line x1="40" y1="18" x2="40" y2="172" stroke="#facc15" stroke-dasharray="3 3" stroke-width="1" opacity="0.85"/>
          <line x1="30" y1="26" x2="30" y2="164" stroke="#ffffff" stroke-dasharray="2 4" stroke-width="0.7" opacity="0.4"/>
          <line x1="50" y1="26" x2="50" y2="164" stroke="#ffffff" stroke-dasharray="2 4" stroke-width="0.7" opacity="0.4"/>

          <!-- Yellow & Black Hazard Loading Edge (Bow Ramp) -->
          <path d="M 28 17 Q 40 13 52 17 L 51 20 Q 40 16 29 20 Z" fill="#facc15" />
          <!-- Hazard Loading Edge (Stern Ramp) -->
          <path d="M 28 173 Q 40 177 52 173 L 51 170 Q 40 174 29 170 Z" fill="#facc15" />

          <!-- Parked Vehicles on Open Deck (Isometric Silhouette Car Details) -->
          <!-- Forward Car 1 (White SUV) -->
          <rect x="36" y="26" width="8" height="14" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="0.6"/>
          <rect x="37.5" y="28" width="5" height="4" rx="1" fill="#1e293b" opacity="0.8"/>
          <!-- Forward Car 2 (Red Sedan) -->
          <rect x="46" y="32" width="7" height="12" rx="1.5" fill="#ef4444" stroke="#991b1b" stroke-width="0.5"/>
          <!-- Aft Car 3 (Blue Pickup) -->
          <rect x="27" y="148" width="7" height="13" rx="1.5" fill="#0284c7" stroke="#0369a1" stroke-width="0.5"/>
          <!-- Aft Car 4 (Silver Sedan) -->
          <rect x="36" y="152" width="8" height="13" rx="1.5" fill="#94a3b8" stroke="#475569" stroke-width="0.5"/>

          <!-- 5. Passenger Cabin Superstructure (Observation Deck Level) -->
          <rect x="18" y="48" width="44" height="94" rx="6" fill="url(#superstructureGradient)" stroke="#94a3b8" stroke-width="1"/>
          
          <!-- Outer Promenade Walkway Deck Edge -->
          <rect x="19.5" y="49.5" width="41" height="91" rx="5" fill="none" stroke="#e2e8f0" stroke-width="1"/>

          <!-- Tinted Passenger Observation Windows (Port Ribbon) -->
          <rect x="20.5" y="54" width="3.5" height="82" rx="1" fill="url(#windowGlass)" stroke="#0369a1" stroke-width="0.5"/>
          <!-- Tinted Passenger Observation Windows (Starboard Ribbon) -->
          <rect x="56" y="54" width="3.5" height="82" rx="1" fill="url(#windowGlass)" stroke="#0369a1" stroke-width="0.5"/>

          <!-- End Observation Lounges (Forward & Aft Windows) -->
          <rect x="26" y="51" width="28" height="3" rx="1" fill="url(#windowGlass)"/>
          <rect x="26" y="136" width="28" height="3" rx="1" fill="url(#windowGlass)"/>

          <!-- BC Ferries Wave Logo Detail on Side -->
          <path d="M 22 93 Q 23 90 24 93 Q 25 96 26 93" stroke="#0284c7" stroke-width="1" fill="none"/>
          <path d="M 54 93 Q 55 90 56 93 Q 57 96 58 93" stroke="#0284c7" stroke-width="1" fill="none"/>

          <!-- 6. Wheelhouse & Command Bridge (Tiered Upper Deck) -->
          <rect x="25" y="68" width="30" height="54" rx="4" fill="url(#superstructureGradient)" stroke="#64748b" stroke-width="0.8"/>

          <!-- Forward Navigation Bridge Windows (Angled Hexagonal View) -->
          <polygon points="27,76 31,70 49,70 53,76 49,77 31,77" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.7"/>

          <!-- Aft Navigation Bridge Windows (Angled Hexagonal View) -->
          <polygon points="27,114 31,120 49,120 53,114 49,113 31,113" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.7"/>

          <!-- 7. Roof Deck Equipment (Mast, Radar, Funnels) -->
          <!-- Twin BC Ferries Blue Exhaust Funnels -->
          <rect x="35" y="90" width="10" height="10" rx="3" fill="url(#bcFerriesBlue)" stroke="#0f172a" stroke-width="0.8"/>
          <circle cx="38" cy="95" r="1.6" fill="#0f172a"/>
          <circle cx="42" cy="95" r="1.6" fill="#0f172a"/>

          <!-- Communication Mast / Radar Scanner -->
          <line x1="40" y1="88" x2="40" y2="78" stroke="#475569" stroke-width="1.8"/>
          <circle cx="40" cy="80" r="3" fill="#ffffff" stroke="#0284c7" stroke-width="1"/>
          <!-- Radar Scanner Bar -->
          <line x1="35" y1="80" x2="45" y2="80" stroke="#0f172a" stroke-width="1.4" stroke-linecap="round"/>

          <!-- Forward Searchlights -->
          <circle cx="33" cy="71" r="1.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>
          <circle cx="47" cy="71" r="1.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>

          <!-- Navigation Lights -->
          <!-- Port Light (Red) -->
          <circle cx="11.5" cy="95" r="1.6" fill="#ef4444"/>
          <!-- Starboard Light (Green) -->
          <circle cx="68.5" cy="95" r="1.6" fill="#22c55e"/>
        </g>
      </svg>
    `;
  },

  /**
   * Create DOM Element for the MapLibre Marker
   */
  createMarkerElement() {
    const container = document.createElement('div');
    container.className = 'ferry-marker-container';

    // Animated hydrodynamic wake ripple
    const wake = document.createElement('div');
    wake.className = 'vessel-wake';
    container.appendChild(wake);

    // Vessel wrapper for SVG graphic
    const wrapper = document.createElement('div');
    wrapper.className = 'ferry-vessel-wrapper';
    wrapper.id = 'ferryVesselGraphic';
    wrapper.innerHTML = this.createVesselSvg();
    container.appendChild(wrapper);

    return { container, wrapper, wake };
  },

  /**
   * Update vessel heading rotation smoothly
   * When rotationAlignment: 'map' is handled on the MapLibre Marker directly,
   * this ensures fallback or sub-element synchronization.
   */
  updateRotation(wrapper, heading) {
    if (!wrapper) return;
    // The SVG is drawn pointing North (0° = Up).
    // Heading 0 is North, 90 is East, 180 is South, 270 is West.
    wrapper.style.transform = `rotate(${heading}deg)`;
  },

  /**
   * Create the HTML markup for the floating information box
   */
  createFloatingBoxHtml(data) {
    const nav = data.navigation || {};
    const tel = data.telemetry || {};

    const isDocked = nav.state === 'docked';
    const stateClass = isDocked ? 'docked' : 'underway';
    const stateLabel = isDocked ? 'Docked' : 'Underway';

    let title = '';
    let metricVal = '';
    let metricLabel = '';

    if (isDocked) {
      title = `At ${nav.currentDock || 'Terminal'}`;
      metricVal = Telemetry.formatElapsedDocked(nav.elapsedDockedMinutes);
      metricLabel = 'elapsed at berth';
    } else {
      title = `Heading to ${nav.destination || 'Next Port'}`;
      metricVal = Telemetry.formatEta(nav.etaMinutes);
      metricLabel = 'estimated arrival';
    }

    return `
      <div class="ferry-floating-box">
        <div class="floating-box-header">
          <span class="state-tag ${stateClass}">${stateLabel}</span>
          <span class="telemetry-speed">${tel.sog ? tel.sog.toFixed(1) : '0.0'} kts</span>
        </div>
        <div class="floating-box-destination">${title}</div>
        <div class="floating-box-metric">
          <span>${metricVal}</span>
          <span class="metric-label">${metricLabel}</span>
        </div>
        <div class="floating-box-footer">
          <span>Course: ${Math.round(tel.heading || 0)}°</span>
          <span>Updated ${tel.lastUpdated || 'Just now'}</span>
        </div>
      </div>
    `;
  }
};
