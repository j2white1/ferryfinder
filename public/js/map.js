/**
 * MapLibre GL JS setup and isometric camera controls for Queen of Capilano tracker
 */
const MapManager = {
  map: null,
  vesselMarker: null,
  vesselPopup: null,
  vesselDom: null,
  terminalMarkers: [],
  is3D: true,
  followFerry: true,
  currentCoords: [-123.3030, 49.3800], // Channel midpoint
  currentHeading: 68,
  lastTransitHeading: 68,
  isUnderway: false,
  lastTrackGeoJson: null,

  currentTheme: 'marine', // 'marine' | 'satellite' | 'street'

  // Default camera configurations
  CAM_CONFIG: {
    isometric: {
      pitch: 55,
      bearing: 68,
      zoom: window.innerWidth < 640 ? 12.6 : 13.2
    },
    topDown: {
      pitch: 0,
      bearing: 0,
      zoom: window.innerWidth < 640 ? 12.4 : 13.0
    }
  },

  /**
   * Initialize MapLibre map instance
   */
  init() {
    // 100% free, zero-key basemaps (no watermarks)
    const mapStyle = {
      version: 8,
      sources: {
        'osm-source': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        'satellite-source': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-source',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: 'visible'
          }
        },
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite-source',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: 'none'
          }
        }
      ]
    };

    document.body.classList.add('theme-dark-marine');

    const initialCam = this.CAM_CONFIG.isometric;

    this.map = new maplibregl.Map({
      container: 'map',
      style: mapStyle,
      center: this.currentCoords,
      zoom: initialCam.zoom,
      pitch: initialCam.pitch,
      bearing: initialCam.bearing,
      antialias: true
    });

    // Add navigation controls (zoom, compass)
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-left');

    this.map.on('load', () => {
      this.setupBreadcrumbSource();
      this.setupTerminalMarkers();
    });

    // Disable auto-follow when user manually drags or pans the map
    this.map.on('dragstart', () => {
      if (this.followFerry) {
        this.setFollowFerry(false);
      }
    });

    return this.map;
  },

  /**
   * Add GeoJSON source and layers for realistic hydrodynamic water wake
   */
  setupBreadcrumbSource() {
    this.map.addSource('ferry-wake', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // 1. Diverging Kelvin Wake Waves (Peeling lateral breaking wave crests)
    this.map.addLayer({
      id: 'ferry-wake-flanks',
      type: 'line',
      source: 'ferry-wake',
      filter: ['==', ['get', 'wake_type'], 'flank'],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#e0f2fe',
        'line-width': ['get', 'width'],
        'line-blur': 1.2,
        'line-opacity': ['get', 'opacity'],
        'line-dasharray': [3, 2]
      }
    });

    // 2. Outer Aerated Foam Wash (Wide, soft feathered bloom diffusing into the sea)
    this.map.addLayer({
      id: 'ferry-wake-wash',
      type: 'line',
      source: 'ferry-wake',
      filter: ['==', ['get', 'wake_type'], 'wash'],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#bae6fd',
        'line-width': ['get', 'width'],
        'line-blur': 6.5,
        'line-opacity': ['get', 'opacity']
      }
    });

    // 3. Mid Propeller Churn (Milky churning turbulent wash)
    this.map.addLayer({
      id: 'ferry-wake-churn',
      type: 'line',
      source: 'ferry-wake',
      filter: ['==', ['get', 'wake_type'], 'churn'],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#f0f9ff',
        'line-width': ['get', 'width'],
        'line-blur': 2.5,
        'line-opacity': ['get', 'opacity']
      }
    });

    // 4. Centerline Cavitation Core (Intense boiling seafoam along prop line)
    this.map.addLayer({
      id: 'ferry-wake-core',
      type: 'line',
      source: 'ferry-wake',
      filter: ['==', ['get', 'wake_type'], 'core'],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['get', 'width'],
        'line-blur': 0.8,
        'line-opacity': ['get', 'opacity']
      }
    });
  },

  /**
   * Add markers for Snug Cove and Horseshoe Bay terminals
   */
  setupTerminalMarkers() {
    const terminals = [
      { name: 'Snug Cove (Bowen)', coords: [-123.3330, 49.3835], label: 'Bowen Island' },
      { name: 'Horseshoe Bay', coords: [-123.2725, 49.3755], label: 'West Vancouver' }
    ];

    terminals.forEach(term => {
      const el = document.createElement('div');
      el.className = 'dock-marker';
      el.innerHTML = `
        <div class="dock-badge">${term.name}</div>
        <div class="dock-icon"></div>
      `;
      el.addEventListener('click', () => {
        this.map.flyTo({
          center: term.coords,
          zoom: 14,
          speed: 1.2
        });
      });

      new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(term.coords)
        .addTo(this.map);
    });
  },

  /**
   * Update vessel marker and floating popup card with live telemetry
   */
  updateVessel(data) {
    if (!data || !data.telemetry || !data.telemetry.coordinates) return;

    const coords = data.telemetry.coordinates;
    const heading = data.telemetry.heading || 0;
    const isUnderway = data.navigation.state === 'underway';
    this.currentCoords = coords;

    // Create marker if it does not yet exist
    if (!this.vesselMarker) {
      this.vesselDom = Vessel.createMarkerElement();

      // Create floating popup (always open above marker)
      this.vesselPopup = new maplibregl.Popup({
        offset: [0, -32],
        closeButton: false,
        closeOnClick: false,
        className: 'ferry-popup-custom',
        maxWidth: '320px'
      });

      this.vesselMarker = new maplibregl.Marker({
        element: this.vesselDom.container,
        anchor: 'center',
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
        .setLngLat(coords)
        .setRotation(heading)
        .setPopup(this.vesselPopup)
        .addTo(this.map);

      // Open popup by default
      this.vesselMarker.togglePopup();

      // Clicking vessel re-centers camera and activates follow mode
      this.vesselDom.container.addEventListener('click', () => {
        this.setFollowFerry(true);
        this.recenterOnFerry();
      });
    } else {
      // Smoothly update position and map-aligned geographic heading
      this.vesselMarker.setLngLat(coords);
      this.vesselMarker.setRotation(heading);
    }

    // Wake animation state
    if (isUnderway) {
      this.vesselDom.container.classList.add('underway');
    } else {
      this.vesselDom.container.classList.remove('underway');
    }

    // Update floating box content
    const popupHtml = Vessel.createFloatingBoxHtml(data);
    this.vesselPopup.setHTML(popupHtml);
    this.isUnderway = isUnderway;
    this.currentCoords = coords;
    if (heading > 0) {
      this.currentHeading = heading;
      if (isUnderway) {
        this.lastTransitHeading = heading;
      }
    }

    // Refresh wake attached to current vessel position and heading
    if (this.lastTrackGeoJson) {
      this.renderWake();
    }

    // If follow mode is active, position camera directly behind the ferry looking ahead
    if (this.followFerry) {
      const targetBearing = this.is3D ? (isUnderway ? heading : (this.lastTransitHeading || heading || 68)) : 0;
      this.map.easeTo({
        center: coords,
        bearing: targetBearing,
        duration: 1200,
        easing: t => t
      });
    }
  },

  /**
   * Update hydrodynamic water wake trail on the map
   */
  updateBreadcrumbs(trackGeoJson) {
    if (trackGeoJson) {
      this.lastTrackGeoJson = trackGeoJson;
    }
    this.renderWake();
  },

  /**
   * Render or refresh water wake geometry on the map
   */
  renderWake() {
    const src = this.map.getSource('ferry-wake');
    if (!src) return;
    const wakeGeoJson = this.processWakeGeoJson(this.lastTrackGeoJson);
    src.setData(wakeGeoJson);
  },

  /**
   * Transform raw track segments into a 4-tier hydrodynamic wake:
   * 1. Outer aerated foam wash (wide, soft feathered bloom)
   * 2. Mid propeller churn (milky turbulent wash)
   * 3. Centerline cavitation core (pure white foam)
   * 4. Diverging Kelvin wake wave crests (lateral peeling waves)
   */
  processWakeGeoJson(trackGeoJson) {
    if (!this.isUnderway) {
      return { type: 'FeatureCollection', features: [] };
    }

    const rawFeatures = (trackGeoJson && Array.isArray(trackGeoJson.features)) ? trackGeoJson.features : [];
    let segments = [];
    for (const f of rawFeatures) {
      if (f.geometry && f.geometry.type === 'LineString' && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length >= 2) {
        const coords = f.geometry.coordinates;
        for (let i = 0; i < coords.length - 1; i++) {
          segments.push([coords[i], coords[i + 1]]);
        }
      }
    }

    // Compute vessel stern coordinate so wake attaches cleanly to the hull
    let sternCoords = null;
    if (this.currentCoords && typeof this.currentHeading === 'number') {
      const headingRad = (this.currentHeading * Math.PI) / 180;
      const sternOffsetM = 30; // 30 meters behind vessel center
      const latRad = (this.currentCoords[1] * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const dLat = -(sternOffsetM / 111320) * Math.cos(headingRad);
      const dLon = -(sternOffsetM / (111320 * cosLat)) * Math.sin(headingRad);
      sternCoords = [this.currentCoords[0] + dLon, this.currentCoords[1] + dLat];
    }

    // Ensure segments run from oldest (tail) to newest (stern)
    if (segments.length > 0 && sternCoords) {
      const firstPt = segments[0][0];
      const lastPt = segments[segments.length - 1][1];
      const distFirstToStern = Math.hypot(firstPt[0] - sternCoords[0], firstPt[1] - sternCoords[1]);
      const distLastToStern = Math.hypot(lastPt[0] - sternCoords[0], lastPt[1] - sternCoords[1]);

      if (distFirstToStern < distLastToStern) {
        segments.reverse();
        segments = segments.map(seg => [seg[1], seg[0]]);
      }

      const newestPt = segments[segments.length - 1][1];
      const distToSternM = Math.hypot(
        (newestPt[0] - sternCoords[0]) * 111320 * Math.cos((sternCoords[1] * Math.PI) / 180),
        (newestPt[1] - sternCoords[1]) * 111320
      );

      // If gap is between 2m and 600m, connect directly to stern
      if (distToSternM > 2 && distToSternM < 600) {
        segments.push([newestPt, sternCoords]);
      }
    } else if (segments.length === 0 && sternCoords && this.isUnderway) {
      // If historical track not yet cached, generate a graceful initial wake trail behind stern
      const oppHeadingRad = ((this.currentHeading + 180) % 360) * Math.PI / 180;
      const latRad = (sternCoords[1] * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const makeOffsetPt = (distM) => [
        sternCoords[0] + (distM / (111320 * cosLat)) * Math.sin(oppHeadingRad),
        sternCoords[1] + (distM / 111320) * Math.cos(oppHeadingRad)
      ];
      segments = [
        [makeOffsetPt(140), makeOffsetPt(80)],
        [makeOffsetPt(80), makeOffsetPt(30)],
        [makeOffsetPt(30), sternCoords]
      ];
    }

    if (segments.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    const features = [];
    const N = segments.length;
    const refLat = sternCoords ? sternCoords[1] : 49.38;
    const cosLat = Math.cos((refLat * Math.PI) / 180);

    for (let i = 0; i < N; i++) {
      const t = (i + 1) / N; // 0 < t <= 1 (1 = stern, 0 = oldest tail)
      const [pA, pB] = segments[i];

      // 1. Outer Aerated Foam Wash (wide, feathered bloom)
      features.push({
        type: 'Feature',
        properties: {
          wake_type: 'wash',
          width: 12 + (1 - t) * 16, // 12px at stern expanding to 28px at tail
          opacity: 0.04 + t * 0.50
        },
        geometry: { type: 'LineString', coordinates: [pA, pB] }
      });

      // 2. Mid Propeller Churn (milky turbulent wash)
      features.push({
        type: 'Feature',
        properties: {
          wake_type: 'churn',
          width: 6 + (1 - t) * 7, // 6px at stern expanding to 13px at tail
          opacity: 0.08 + t * 0.65
        },
        geometry: { type: 'LineString', coordinates: [pA, pB] }
      });

      // 3. Centerline Foam Core (pure white cavitation)
      features.push({
        type: 'Feature',
        properties: {
          wake_type: 'core',
          width: 1.4 + t * 2.2, // 3.6px at stern to 1.4px at tail
          opacity: 0.06 + t * 0.90
        },
        geometry: { type: 'LineString', coordinates: [pA, pB] }
      });

      // 4. Diverging Kelvin Wake Waves (peeling lateral wave crests)
      const dxM = (pB[0] - pA[0]) * 111320 * cosLat;
      const dyM = (pB[1] - pA[1]) * 111320;
      const lenM = Math.hypot(dxM, dyM);

      if (lenM > 0.5) {
        const nxM = -dyM / lenM;
        const nyM = dxM / lenM;

        // Lateral spread from centerline: 11m at stern to ~38m at tail
        const spreadM_A = 11 + (1 - (i / N)) * 27;
        const spreadM_B = 11 + (1 - t) * 27;

        const dLonA = (nxM * spreadM_A) / (111320 * cosLat);
        const dLatA = (nyM * spreadM_A) / 111320;
        const dLonB = (nxM * spreadM_B) / (111320 * cosLat);
        const dLatB = (nyM * spreadM_B) / 111320;

        const leftCoords = [
          [pA[0] + dLonA, pA[1] + dLatA],
          [pB[0] + dLonB, pB[1] + dLatB]
        ];
        const rightCoords = [
          [pA[0] - dLonA, pA[1] - dLatA],
          [pB[0] - dLonB, pB[1] - dLatB]
        ];

        const flankOpacity = 0.03 + t * 0.48;

        features.push({
          type: 'Feature',
          properties: {
            wake_type: 'flank',
            width: 1.6,
            opacity: flankOpacity
          },
          geometry: { type: 'LineString', coordinates: leftCoords }
        });

        features.push({
          type: 'Feature',
          properties: {
            wake_type: 'flank',
            width: 1.6,
            opacity: flankOpacity
          },
          geometry: { type: 'LineString', coordinates: rightCoords }
        });
      }
    }

    return { type: 'FeatureCollection', features };
  },

  /**
   * Toggle between 3D Isometric view and 2D Top-Down view
   */
  toggle3D() {
    this.is3D = !this.is3D;
    const targetPitch = this.is3D ? this.CAM_CONFIG.isometric.pitch : this.CAM_CONFIG.topDown.pitch;
    const targetBearing = this.is3D ? (this.lastTransitHeading || this.currentHeading || this.CAM_CONFIG.isometric.bearing) : 0;
    const targetZoom = this.is3D ? this.CAM_CONFIG.isometric.zoom : this.CAM_CONFIG.topDown.zoom;

    this.map.flyTo({
      pitch: targetPitch,
      bearing: targetBearing,
      zoom: targetZoom,
      center: this.currentCoords,
      duration: 1200
    });

    const btn = document.getElementById('btn3DToggle');
    if (btn) {
      btn.classList.toggle('active', this.is3D);
      btn.querySelector('.btn-label').textContent = this.is3D ? '3D' : '2D';
    }
  },

  /**
   * Toggle or set follow mode
   */
  setFollowFerry(enabled) {
    this.followFerry = enabled;
    const btn = document.getElementById('btnFollow');
    if (btn) {
      btn.classList.toggle('active', enabled);
    }
  },

  /**
   * Re-center camera on the ferry (oriented directly behind it in 3D)
   */
  recenterOnFerry() {
    const targetBearing = this.is3D ? (this.lastTransitHeading || this.currentHeading || 68) : 0;
    this.map.flyTo({
      center: this.currentCoords,
      bearing: targetBearing,
      zoom: this.is3D ? this.CAM_CONFIG.isometric.zoom : this.CAM_CONFIG.topDown.zoom,
      speed: 1.2
    });
  },

  /**
   * Cycle map style between Marine (Dark OSM), Satellite (Esri), and Street (Natural OSM)
   */
  cycleMapTheme() {
    const themes = ['marine', 'satellite', 'street'];
    const nextIdx = (themes.indexOf(this.currentTheme) + 1) % themes.length;
    this.currentTheme = themes[nextIdx];

    document.body.classList.remove('theme-dark-marine', 'theme-satellite', 'theme-street');

    const label = document.getElementById('layerLabel');

    if (this.currentTheme === 'marine') {
      document.body.classList.add('theme-dark-marine');
      this.map.setLayoutProperty('osm-layer', 'visibility', 'visible');
      this.map.setLayoutProperty('satellite-layer', 'visibility', 'none');
      if (label) label.textContent = 'Marine';
    } else if (this.currentTheme === 'satellite') {
      document.body.classList.add('theme-satellite');
      this.map.setLayoutProperty('osm-layer', 'visibility', 'none');
      this.map.setLayoutProperty('satellite-layer', 'visibility', 'visible');
      if (label) label.textContent = 'Satellite';
    } else {
      document.body.classList.add('theme-street');
      this.map.setLayoutProperty('osm-layer', 'visibility', 'visible');
      this.map.setLayoutProperty('satellite-layer', 'visibility', 'none');
      if (label) label.textContent = 'Street';
    }
  }
};
