import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const PORT = process.env.PORT || 3000;

// Coordinates
const TERMINALS = {
  SNUG_COVE: {
    name: 'Snug Cove (Bowen Island)',
    shortName: 'Snug Cove',
    lon: -123.3314,
    lat: 49.3795,
    dockRadiusKm: 0.25
  },
  HORSESHOE_BAY: {
    name: 'Horseshoe Bay (West Vancouver)',
    shortName: 'Horseshoe Bay',
    lon: -123.2725,
    lat: 49.3755,
    dockRadiusKm: 0.35
  }
};

// Haversine distance in km
function getDistanceKm(lon1, lat1, lon2, lat2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
function mercatorToLatLon(x, y) {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
  return [lon, lat];
}

// Cache store
let cache = {
  liveData: null,
  liveDataTime: 0,
  trackingData: null,
  trackingDataTime: 0,
  speedData: null,
  speedDataTime: 0
};

const CACHE_TTL_MS = 4000; // 4 seconds

// Upstream fetch helper
function fetchUpstream(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://bowenferry.ca${endpoint}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (BowenFerryTracker/1.0)',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://bowenferry.ca/'
      },
      timeout: 5000
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`Upstream returned HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          // Some endpoints return a JSON-encoded string
          let parsed = JSON.parse(data);
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

// Simulated active sailing route for realistic fallback when offline
function generateSimulatedData() {
  const now = Date.now();
  // 20-minute cycle: 0-16 min sailing, 16-20 min docked
  const cycleTimeMs = 20 * 60 * 1000;
  const cycleProgress = (now % cycleTimeMs) / cycleTimeMs;
  
  // Alternate direction each 20-minute cycle
  const isHeadingEast = Math.floor(now / cycleTimeMs) % 2 === 0; // True = Bowen -> HSB, False = HSB -> Bowen
  
  const start = isHeadingEast ? TERMINALS.SNUG_COVE : TERMINALS.HORSESHOE_BAY;
  const end = isHeadingEast ? TERMINALS.HORSESHOE_BAY : TERMINALS.SNUG_COVE;
  
  let lon, lat, sog, heading, state, currentDock, destination;
  
  if (cycleProgress < 0.8) { // First 16 minutes = underway
    const t = cycleProgress / 0.8;
    // Ease curve
    const smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    lon = start.lon + (end.lon - start.lon) * smoothT;
    lat = start.lat + (end.lat - start.lat) * smoothT;
    sog = 11.5 + Math.sin(t * Math.PI) * 1.5;
    heading = isHeadingEast ? 102 : 285;
    state = 'underway';
    currentDock = null;
    destination = end.shortName;
  } else { // Docked at destination
    lon = end.lon;
    lat = end.lat;
    sog = 0.0;
    heading = isHeadingEast ? 102 : 285;
    state = 'docked';
    currentDock = end.shortName;
    destination = null;
  }

  return {
    type: 'FeatureCollection',
    isSimulation: true,
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'QUEEN OF CAPILANO',
          SOG: sog.toFixed(1),
          heading: heading.toString(),
          LatestUpdate: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit', second: '2-digit' }),
          Fresh: 'True',
          pointtype: 'Vessel'
        },
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        }
      }
    ],
    atberth: {
      date: new Date().toLocaleDateString('en-US', { timeZone: 'America/Vancouver', weekday: 'short', month: 'short', day: 'numeric' }),
      times: [[
        state === 'docked' ? ['Arrived', currentDock, new Date(now - (cycleProgress - 0.8) * cycleTimeMs).toLocaleTimeString('en-US', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit', second: '2-digit' })]
                           : ['Departed', start.shortName, new Date(now - cycleProgress * cycleTimeMs).toLocaleTimeString('en-US', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit', second: '2-digit' })]
      ]]
    },
    deckSpace: {
      lastUpdated: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit' }),
      Fresh: 'True',
      times: [[['Next Sailing', '85%', '0']]]
    },
    schbowen: {
      date: new Date().toLocaleDateString('en-US', { timeZone: 'America/Vancouver', weekday: 'short', month: 'short', day: 'numeric' }),
      times: [[['6:15 AM', '0'], ['7:30 AM', '0'], ['8:45 AM', '0'], ['10:00 AM', '0'], ['11:15 AM', '0'], ['12:35 PM', '0'], ['1:55 PM', '0'], ['3:15 PM', '0'], ['4:40 PM', '0'], ['6:00 PM', '0'], ['7:15 PM', '0'], ['8:25 PM', '0'], ['9:30 PM', '0'], ['10:30 PM', '0']]]
    },
    schHSB: {
      times: [[['5:45 AM', '0', '0', ''], ['6:50 AM', '0', '0', ''], ['8:05 AM', '0', '0', ''], ['9:20 AM', '0', '0', ''], ['10:35 AM', '0', '0', ''], ['11:55 AM', '0', '0', ''], ['1:10 PM', '0', '0', ''], ['2:35 PM', '0', '0', ''], ['3:55 PM', '0', '0', ''], ['5:20 PM', '0', '0', ''], ['6:35 PM', '0', '0', ''], ['7:50 PM', '0', '0', ''], ['8:55 PM', '0', '0', ''], ['10:00 PM', '0', '0', '85%']]]
    }
  };
}

/**
 * Parse 12-hour or 24-hour time string into seconds from midnight
 */
function parseTimeStringToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = match[3] ? parseInt(match[3], 10) : 0;
  const meridiem = match[4] ? match[4].toUpperCase() : null;

  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;

  return h * 3600 + m * 60 + s;
}

/**
 * Get current time of day in America/Vancouver timezone in seconds from midnight
 */
function getVancouverCurrentSeconds() {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Vancouver',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    let h = 0, m = 0, s = 0;
    for (const part of parts) {
      if (part.type === 'hour') h = parseInt(part.value, 10);
      if (part.type === 'minute') m = parseInt(part.value, 10);
      if (part.type === 'second') s = parseInt(part.value, 10);
    }
    if (h === 24) h = 0;
    return h * 3600 + m * 60 + s;
  } catch {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  }
}

/**
 * Detect service warnings: delayed sailings or cancellations
 */
function detectServiceWarning(raw, enriched) {
  const bowenTimes = raw.schbowen?.times?.[0] || enriched.schedules?.bowen?.times?.[0] || [];
  const hsbTimes = raw.schHSB?.times?.[0] || enriched.schedules?.hsb?.times?.[0] || [];
  const berthLogs = enriched.berthLog || [];

  const mainFeature = raw.features?.[0] || {};
  const exceptions = [
    ...(mainFeature.todayException?.times?.[0] || raw.todayException?.times?.[0] || []),
    ...(mainFeature.todayFullDayException?.times?.[0] || raw.todayFullDayException?.times?.[0] || []),
    ...(mainFeature.otherException?.times?.[0] || raw.otherException?.times?.[0] || [])
  ];

  // 1. Check for cancellations in exceptions
  for (const exp of exceptions) {
    const text = Array.isArray(exp) ? exp.join(' ') : String(exp || '');
    if (/cancel|suspens|no sailing/i.test(text)) {
      const isHSB = /hsb|horseshoe/i.test(text);
      return {
        hasWarning: true,
        type: 'cancellation',
        terminal: isHSB ? 'hsb' : 'bowen',
        terminalName: isHSB ? 'Horseshoe Bay' : 'Snug Cove',
        message: text.length > 45 ? `${text.slice(0, 42)}...` : text,
        details: text
      };
    }
  }

  // Check schedules for any item marked cancelled
  const checkScheduleForCancel = (times, termKey, termName) => {
    for (const item of times) {
      if (!Array.isArray(item)) continue;
      const rowText = item.join(' ');
      if (/cancel/i.test(rowText)) {
        return {
          hasWarning: true,
          type: 'cancellation',
          terminal: termKey,
          terminalName: termName,
          scheduledTime: item[0],
          message: `${item[0]} ${termName} sailing cancelled`,
          details: `The ${item[0]} scheduled departure from ${termName} has been cancelled.`
        };
      }
    }
    return null;
  };

  const bowenCancel = checkScheduleForCancel(bowenTimes, 'bowen', 'Snug Cove');
  if (bowenCancel) return bowenCancel;
  const hsbCancel = checkScheduleForCancel(hsbTimes, 'hsb', 'Horseshoe Bay');
  if (hsbCancel) return hsbCancel;

  // 2. Check for delayed departures
  const nowSec = getVancouverCurrentSeconds();
  const nowMin = Math.floor(nowSec / 60);

  const checkTerminalDelay = (times, termKey, termName) => {
    for (const item of times) {
      if (!Array.isArray(item) || !item[0]) continue;
      const timeStr = item[0].trim();
      const schedSec = parseTimeStringToSeconds(timeStr);
      if (schedSec === null) continue;
      const schedMin = Math.floor(schedSec / 60);
      let diffMin = nowMin - schedMin;
      if (diffMin < -720) diffMin += 1440;

      // Only check sailings whose scheduled departure was 3 to 75 minutes ago
      if (diffMin >= 3 && diffMin <= 75) {
        const locKeywords = termKey === 'bowen' ? ['bowen', 'snug'] : ['hsb', 'horseshoe'];
        const alreadyDeparted = berthLogs.some(log => {
          if (!Array.isArray(log) || log[0] !== 'Departed') return false;
          const loc = (log[1] || '').toLowerCase();
          if (!locKeywords.some(k => loc.includes(k))) return false;
          const depSec = parseTimeStringToSeconds(log[2]);
          if (depSec === null) return false;
          const depMin = Math.floor(depSec / 60);
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

  const bowenDelay = checkTerminalDelay(bowenTimes, 'bowen', 'Snug Cove');
  if (bowenDelay) return bowenDelay;

  const hsbDelay = checkTerminalDelay(hsbTimes, 'hsb', 'Horseshoe Bay');
  if (hsbDelay) return hsbDelay;

  return null;
}

// Compute enriched telemetry
function enrichFerryData(raw) {
  const mainFeature = raw.features?.[0] || {};
  const pointFeature = raw.features?.find(f => f.geometry?.type === 'Point') || mainFeature;

  let coords = pointFeature.geometry?.coordinates;
  if (!coords && mainFeature.geometry?.type === 'Polygon') {
    coords = mainFeature.geometry.coordinates[0][0];
  }
  if (!coords) return null;

  // If coordinates are in Web Mercator (large numbers e.g. -13723000), convert to WGS84
  let lon = coords[0];
  let lat = coords[1];
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) {
    [lon, lat] = mercatorToLatLon(lon, lat);
  }

  // Telemetry properties are on mainFeature
  const props = mainFeature.properties || pointFeature.properties || {};
  const sog = parseFloat(props.SOG) || 0.0;
  const heading = parseFloat(props.heading) || 0.0;
  const latestUpdate = props.LatestUpdate || '';
  const isFresh = props.Fresh === 'True';

  const distToBowen = getDistanceKm(lon, lat, TERMINALS.SNUG_COVE.lon, TERMINALS.SNUG_COVE.lat);
  const distToHSB = getDistanceKm(lon, lat, TERMINALS.HORSESHOE_BAY.lon, TERMINALS.HORSESHOE_BAY.lat);

  // Determine state: docked vs underway
  let state = 'underway';
  let currentDock = null;
  let destination = null;
  let etaMinutes = null;
  let elapsedDockedMinutes = null;

  // Metadata is on mainFeature (or root)
  const atberth = mainFeature.atberth || raw.atberth || {};
  const deckSpace = mainFeature.deckSpace || raw.deckSpace || null;
  const schbowen = mainFeature.schbowen || raw.schbowen || null;
  const schHSB = mainFeature.schHSB || raw.schHSB || null;

  const berthLogs = atberth.times?.[0] || [];
  const latestLog = berthLogs[0] || null; // [Action, Location, TimeString]

  const isNearBowen = distToBowen <= TERMINALS.SNUG_COVE.dockRadiusKm;
  const isNearHSB = distToHSB <= TERMINALS.HORSESHOE_BAY.dockRadiusKm;

  if ((isNearBowen || isNearHSB) && sog < 1.8) {
    state = 'docked';
    currentDock = isNearBowen ? TERMINALS.SNUG_COVE.shortName : TERMINALS.HORSESHOE_BAY.shortName;
  } else if (latestLog && latestLog[0] === 'Arrived' && sog < 2.0) {
    state = 'docked';
    currentDock = latestLog[1].includes('HSB') ? TERMINALS.HORSESHOE_BAY.shortName : TERMINALS.SNUG_COVE.shortName;
  }

  if (state === 'docked') {
    // Find arrival log matching current dock, or fallback to latest arrival
    let arrivalLog = null;
    for (const log of berthLogs) {
      if (Array.isArray(log) && log[0] === 'Arrived') {
        const loc = (log[1] || '').toLowerCase();
        if (currentDock === TERMINALS.SNUG_COVE.shortName && (loc.includes('bowen') || loc.includes('snug'))) {
          arrivalLog = log;
          break;
        }
        if (currentDock === TERMINALS.HORSESHOE_BAY.shortName && (loc.includes('hsb') || loc.includes('horseshoe'))) {
          arrivalLog = log;
          break;
        }
      }
    }
    if (!arrivalLog && latestLog && latestLog[0] === 'Arrived') {
      arrivalLog = latestLog;
    }

    if (arrivalLog && arrivalLog[2]) {
      try {
        const arrivalSec = parseTimeStringToSeconds(arrivalLog[2]);
        if (arrivalSec !== null) {
          const nowSec = getVancouverCurrentSeconds();
          let diffSec = nowSec - arrivalSec;
          // Handle midnight crossover (e.g. arrived 11:55 PM, now 12:05 AM)
          if (diffSec < -43200) {
            diffSec += 86400;
          } else if (diffSec < 0 && diffSec >= -180) {
            // Upstream arrival log slightly ahead of server clock (up to 3 min skew)
            diffSec = 0;
          } else if (diffSec > 86400) {
            diffSec = diffSec % 86400;
          }
          elapsedDockedMinutes = Math.max(0, Math.round(diffSec / 60));
        }
      } catch {
        elapsedDockedMinutes = null;
      }
    }
  } else {
    // Underway - determine destination
    // Queen Charlotte Channel runs approximately ENE/WSW:
    // Heading ~30° to 150° is toward Horseshoe Bay
    // Heading ~210° to 330° is toward Bowen Island
    if (heading >= 30 && heading <= 155) {
      destination = TERMINALS.HORSESHOE_BAY.shortName;
    } else if (heading >= 210 && heading <= 330) {
      destination = TERMINALS.SNUG_COVE.shortName;
    } else {
      // Fallback based on latest departure log or distance
      if (latestLog && latestLog[0] === 'Departed') {
        destination = latestLog[1].includes('HSB') ? TERMINALS.SNUG_COVE.shortName : TERMINALS.HORSESHOE_BAY.shortName;
      } else {
        destination = distToHSB > distToBowen ? TERMINALS.HORSESHOE_BAY.shortName : TERMINALS.SNUG_COVE.shortName;
      }
    }

    // Calculate ETA
    const destDistKm = destination === TERMINALS.HORSESHOE_BAY.shortName ? distToHSB : distToBowen;
    const speedKmh = Math.max(sog * 1.852, 4.0); // minimum 4 km/h to prevent division by near zero
    const travelTimeHours = destDistKm / speedKmh;
    // Add 1.5 min deceleration/berthing allowance when nearing dock
    const estimatedMinutes = Math.round((travelTimeHours * 60) + (destDistKm < 1.0 ? 1 : 2));
    etaMinutes = Math.max(1, Math.min(estimatedMinutes, 25));
  }

  const result = {
    telemetry: {
      name: props.name || 'QUEEN OF CAPILANO',
      coordinates: [lon, lat],
      sog: sog,
      heading: heading,
      lastUpdated: latestUpdate,
      isFresh: isFresh
    },
    navigation: {
      state: state, // 'docked' | 'underway'
      currentDock: currentDock,
      destination: destination,
      etaMinutes: etaMinutes,
      elapsedDockedMinutes: elapsedDockedMinutes,
      distanceToBowenKm: parseFloat(distToBowen.toFixed(2)),
      distanceToHSBKm: parseFloat(distToHSB.toFixed(2))
    },
    berthLog: berthLogs.slice(0, 10),
    deckSpace: deckSpace,
    schedules: {
      bowen: schbowen,
      hsb: schHSB
    },
    exceptions: {
      today: mainFeature.todayException || raw.todayException || null,
      todayFullDay: mainFeature.todayFullDayException || raw.todayFullDayException || null,
      other: mainFeature.otherException || raw.otherException || null
    },
    isSimulation: !!raw.isSimulation
  };

  result.warning = detectServiceWarning(raw, result);

  return result;
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Set CORS and security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/ferry/live') {
    const now = Date.now();
    if (cache.liveData && (now - cache.liveDataTime < CACHE_TTL_MS)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cache.liveData));
      return;
    }

    try {
      const raw = await fetchUpstream('/Production/AISPositionsData3');
      const enriched = enrichFerryData(raw);
      cache.liveData = enriched;
      cache.liveDataTime = now;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(enriched));
    } catch (err) {
      console.warn('Using simulation/cached fallback due to upstream error:', err.message);
      const simulated = enrichFerryData(generateSimulatedData());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(simulated));
    }
    return;
  }

  if (pathname === '/api/ferry/track') {
    const now = Date.now();
    if (cache.trackingData && (now - cache.trackingDataTime < CACHE_TTL_MS)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cache.trackingData));
      return;
    }

    try {
      const trackData = await fetchUpstream('/Production/AISPositionTracking');
      cache.trackingData = trackData;
      cache.trackingDataTime = now;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(trackData));
    } catch (err) {
      // Return empty FeatureCollection fallback
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ type: 'FeatureCollection', features: [] }));
    }
    return;
  }

  if (pathname === '/api/terminals') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(TERMINALS));
    return;
  }

  if (pathname === '/api/ferry/camera' || pathname === '/api/ferry/camera/bowen') {
    const camUrl = 'https://ferrycamera.bowencommunitycentre.com/snapshot.jpg';
    const reqProxy = https.get(camUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (BowenFerryTracker/1.0)',
        'Referer': 'https://bowenislandmunicipality.ca/'
      },
      timeout: 8000
    }, (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 200, {
        'Content-Type': upstreamRes.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      upstreamRes.pipe(res);
    });

    reqProxy.on('error', () => {
      res.writeHead(302, {
        'Location': `https://i0.wp.com/ferrycamera.bowencommunitycentre.com/snapshot.jpg?w=1290&ssl=1&t=${Date.now()}`
      });
      res.end();
    });

    reqProxy.on('timeout', () => {
      reqProxy.destroy();
      res.writeHead(302, {
        'Location': `https://i0.wp.com/ferrycamera.bowencommunitycentre.com/snapshot.jpg?w=1290&ssl=1&t=${Date.now()}`
      });
      res.end();
    });
    return;
  }

  if (pathname === '/api/ferry/camera/hsb') {
    const camUrl = 'https://ccimg.bcferries.com/cc/support/terminals/cam1_HSB.jpg';
    const reqProxy = https.get(camUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (BowenFerryTracker/1.0)',
        'Referer': 'https://www.bcferries.com/'
      },
      timeout: 8000
    }, (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 200, {
        'Content-Type': upstreamRes.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      upstreamRes.pipe(res);
    });

    reqProxy.on('error', () => {
      res.writeHead(302, {
        'Location': `https://ccimg.bcferries.com/cc/support/terminals/cam1_HSB.jpg?t=${Date.now()}`
      });
      res.end();
    });

    reqProxy.on('timeout', () => {
      reqProxy.destroy();
      res.writeHead(302, {
        'Location': `https://ccimg.bcferries.com/cc/support/terminals/cam1_HSB.jpg?t=${Date.now()}`
      });
      res.end();
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Security check to prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`⚓ Queen of Capilano Ferry Tracker running at http://localhost:${PORT}`);
});
