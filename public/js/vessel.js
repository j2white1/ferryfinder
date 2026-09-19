/**
 * Photorealistic 3D Isometric representation of BC Ferries "Queen of Capilano"
 * Modeled directly after vessel photograph:
 * - Rounded weathered steel bow apron with "Queen of Capilano" lettering
 * - Recessed open vehicle deck with asphalt roadway, yellow centerlines, hazard ramps, and parked black SUV + cones
 * - Flared forward passenger brow with blue cheatline and raked panoramic observation windows
 * - Multi-tier passenger decks with side window ribbons and official BCFerries wave livery
 * - Promenade deck with white safety stanchions and blue liferaft canisters
 * - High elevated command bridge (wheelhouse) with faceted green/cyan tinted anti-glare windows and bridge wings
 * - Iconic cobalt-blue BC Ferries funnel with white wave emblem and twin exhaust stacks
 * - Communication mast with dual radar scanner T-bars, searchlights, and navigation lights
 * - Multi-level 3D ambient occlusion, directional lighting, and drop shadows
 */
const Vessel = {
  /**
   * Generates the detailed 3D SVG element for Queen of Capilano
   * Oriented pointing North (0° / Up) along the Y axis
   */
  createVesselSvg() {
    return `
      <svg class="vessel-svg" viewBox="0 0 100 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Multi-Layer 3D Hull Water Shadow -->
          <filter id="vessel3DShadow" x="-35%" y="-20%" width="170%" height="150%">
            <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#020617" flood-opacity="0.65"/>
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#020617" flood-opacity="0.4"/>
          </filter>

          <!-- Cabin Tier Overhang Drop Shadow -->
          <filter id="cabinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="4" stdDeviation="3" flood-color="#020617" flood-opacity="0.5"/>
          </filter>

          <!-- Bridge Deck Drop Shadow -->
          <filter id="bridgeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="1" dy="3" stdDeviation="2.5" flood-color="#020617" flood-opacity="0.45"/>
          </filter>

          <!-- Directional 3D Hull Shading (Sunlit Port, Ambient Starboard) -->
          <linearGradient id="hull3DGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#cbd5e1"/>
            <stop offset="12%" stop-color="#f1f5f9"/>
            <stop offset="35%" stop-color="#ffffff"/>
            <stop offset="75%" stop-color="#f8fafc"/>
            <stop offset="92%" stop-color="#e2e8f0"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>

          <!-- Superstructure Composite White Gradient -->
          <linearGradient id="superstructureGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="15%" stop-color="#f1f5f9"/>
            <stop offset="45%" stop-color="#ffffff"/>
            <stop offset="85%" stop-color="#f8fafc"/>
            <stop offset="100%" stop-color="#64748b"/>
          </linearGradient>

          <!-- Weathered Steel Bumper Apron (from photo) -->
          <linearGradient id="apronSteel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#78350f"/>
            <stop offset="25%" stop-color="#b45309"/>
            <stop offset="50%" stop-color="#9a3412"/>
            <stop offset="75%" stop-color="#78350f"/>
            <stop offset="100%" stop-color="#451a03"/>
          </linearGradient>

          <!-- BC Ferries Cobalt Blue Livery -->
          <linearGradient id="bcBlueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="50%" stop-color="#0369a1"/>
            <stop offset="100%" stop-color="#075985"/>
          </linearGradient>

          <!-- Car Deck Asphalt Surface -->
          <linearGradient id="deckAsphalt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="15%" stop-color="#1e293b"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="85%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>

          <!-- Car Deck Overhang Tunnel Cavern Shadow -->
          <linearGradient id="tunnelShadowFwd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.9"/>
            <stop offset="50%" stop-color="#090d16" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
          </linearGradient>

          <linearGradient id="tunnelShadowAft" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.9"/>
            <stop offset="50%" stop-color="#090d16" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
          </linearGradient>

          <!-- Marine Window Glass Shading -->
          <linearGradient id="windowGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="40%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#082f49"/>
          </linearGradient>

          <!-- Wheelhouse Bridge Panoramic Glass (Anti-Glare Cyan) -->
          <linearGradient id="bridgeGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#a5f3fc"/>
            <stop offset="35%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#0e7490"/>
          </linearGradient>

          <!-- Black SUV Body Paint Gradient -->
          <linearGradient id="blackSuvGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="30%" stop-color="#0f172a"/>
            <stop offset="70%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>

          <!-- Navigation Light Halos -->
          <radialGradient id="portHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="1"/>
            <stop offset="50%" stop-color="#ef4444" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
          </radialGradient>

          <radialGradient id="starboardHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#22c55e" stop-opacity="1"/>
            <stop offset="50%" stop-color="#22c55e" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- ==========================================================
             1. Stern Propeller Wake & Cavitation Churn (behind hull)
             ========================================================== -->
        <g class="stern-wake-group" opacity="0.95">
          <!-- Propeller churn core -->
          <ellipse cx="50" cy="232" rx="20" ry="9" fill="rgba(255,255,255,0.75)" />
          <ellipse cx="50" cy="230" rx="13" ry="6" fill="#ffffff" />
          <ellipse cx="50" cy="228" rx="8" ry="3.5" fill="#f0f9ff" />
          <!-- Lateral breaking foam wings fanning from hull -->
          <path d="M 32 226 C 18 244, 2 268, -12 284 C 12 268, 30 248, 42 234 Z" fill="rgba(224,242,254,0.55)" />
          <path d="M 68 226 C 82 244, 98 268, 112 284 C 88 268, 70 248, 58 234 Z" fill="rgba(224,242,254,0.55)" />
          <path d="M 38 230 Q 22 254 6 272 Q 24 258 40 238 Z" fill="rgba(255,255,255,0.8)" />
          <path d="M 62 230 Q 78 254 94 272 Q 76 258 60 238 Z" fill="rgba(255,255,255,0.8)" />
        </g>

        <!-- ==========================================================
             2. Main Hull & Exterior 3D Geometry
             ========================================================== -->
        <g filter="url(#vessel3DShadow)">
          
          <!-- Hull Rubbing Strake / Fender Ring (Heavy Black Bumper Belt) -->
          <path d="M 32 18 
                   C 42 12, 58 12, 68 18 
                   C 82 32, 88 75, 88 120 
                   C 88 165, 82 208, 68 222 
                   C 58 228, 42 228, 32 222 
                   C 18 208, 12 165, 12 120 
                   C 12 75, 18 32, 32 18 Z" 
                fill="#0f172a" 
                stroke="#020617" 
                stroke-width="2.2" />

          <!-- Weathered Steel Loading Aprons (Bow & Stern) -->
          <!-- Bow Apron Bumper (Seen prominently in photo) -->
          <path d="M 32 18 C 42 12.5, 58 12.5, 68 18 L 65 24 C 56 19.5, 44 19.5, 35 24 Z" 
                fill="url(#apronSteel)" 
                stroke="#451a03" 
                stroke-width="0.8"/>
          <!-- Stern Apron Bumper -->
          <path d="M 32 222 C 42 227.5, 58 227.5, 68 222 L 65 216 C 56 220.5, 44 220.5, 35 216 Z" 
                fill="url(#apronSteel)" 
                stroke="#451a03" 
                stroke-width="0.8"/>

          <!-- Main White Hull Topsides (High Flared Bulwarks) -->
          <path d="M 33 20 
                   C 43 14.5, 57 14.5, 67 20 
                   C 80 34, 86 75, 86 120 
                   C 86 165, 80 206, 67 220 
                   C 57 225.5, 43 225.5, 33 220 
                   C 20 206, 14 165, 14 120 
                   C 14 75, 20 34, 33 20 Z" 
                fill="url(#hull3DGrad)" 
                stroke="#94a3b8" 
                stroke-width="1"/>

          <!-- Bulwark Bevel Highlight Line -->
          <path d="M 34 22 C 43 17, 57 17, 66 22 C 78 36, 84 75, 84 120 C 84 165, 78 204, 66 218" 
                stroke="#ffffff" 
                stroke-width="0.8" 
                opacity="0.8" 
                fill="none"/>

          <!-- "Queen of Capilano" Cursive Bow Lettering (Navy Blue on White Bulwark) -->
          <text x="32" y="27" font-size="3.2" font-family="'Segoe Script', 'Brush Script MT', cursive, sans-serif" font-weight="bold" fill="#0369a1" transform="rotate(-18 32 27)">Queen of Capilano</text>
          <text x="68" y="27" font-size="3.2" font-family="'Segoe Script', 'Brush Script MT', cursive, sans-serif" font-weight="bold" fill="#0369a1" text-anchor="end" transform="rotate(18 68 27)">Queen of Capilano</text>

          <!-- ==========================================================
               3. Recessed Open Car Deck (Vehicle Deck Floor)
               ========================================================== -->
          <path d="M 34 25 
                   C 43 20, 57 20, 66 25 
                   C 77 38, 81 75, 81 120 
                   C 81 165, 77 202, 66 215 
                   C 57 220, 43 220, 34 215 
                   C 23 202, 19 165, 19 120 
                   C 19 75, 23 38, 34 25 Z" 
                fill="url(#deckAsphalt)" 
                stroke="#0f172a" 
                stroke-width="1"/>

          <!-- Vehicle Deck Roadway Centerlines (Yellow Dotted Stripes) -->
          <line x1="50" y1="26" x2="50" y2="214" stroke="#eab308" stroke-dasharray="4 4" stroke-width="1.3" opacity="0.9"/>
          <!-- Outer Lane Boundary Guide Lines -->
          <line x1="36" y1="36" x2="36" y2="204" stroke="#ffffff" stroke-dasharray="3 5" stroke-width="0.8" opacity="0.35"/>
          <line x1="64" y1="36" x2="64" y2="204" stroke="#ffffff" stroke-dasharray="3 5" stroke-width="0.8" opacity="0.35"/>

          <!-- Loading Ramp Hazard Striping (Yellow/Black Chevrons) -->
          <!-- Bow Ramp -->
          <path d="M 35 25 Q 50 20 65 25 L 64 28 Q 50 23 36 28 Z" fill="#facc15" />
          <line x1="42" y1="23" x2="40" y2="27" stroke="#0f172a" stroke-width="1.2"/>
          <line x1="48" y1="22" x2="46" y2="26" stroke="#0f172a" stroke-width="1.2"/>
          <line x1="54" y1="22" x2="52" y2="26" stroke="#0f172a" stroke-width="1.2"/>
          <line x1="60" y1="23" x2="58" y2="27" stroke="#0f172a" stroke-width="1.2"/>

          <!-- Stern Ramp -->
          <path d="M 35 215 Q 50 220 65 215 L 64 212 Q 50 217 36 212 Z" fill="#facc15" />
          <line x1="42" y1="217" x2="40" y2="213" stroke="#0f172a" stroke-width="1.2"/>
          <line x1="48" y1="218" x2="46" y2="214" stroke="#0f172a" stroke-width="1.2"/>
          <line x1="54" y1="218" x2="52" y2="214" stroke="#0f172a" stroke-width="1.2"/>
          <line x1="60" y1="217" x2="58" y2="213" stroke="#0f172a" stroke-width="1.2"/>

          <!-- ==========================================================
               4. Parked Vehicles on Open Deck (From Photo)
               ========================================================== -->
          <!-- Forward Black SUV (Featured directly in the user's photo!) -->
          <g class="parked-suv-forward">
            <!-- Shadow under vehicle -->
            <rect x="36" y="36" width="11" height="20" rx="3" fill="#020617" opacity="0.65"/>
            <!-- SUV Body -->
            <rect x="35" y="34" width="11" height="19" rx="2.5" fill="url(#blackSuvGrad)" stroke="#475569" stroke-width="0.6"/>
            <!-- Windshield & Reflection -->
            <path d="M 36.5 37 L 44.5 37 L 43.5 40 L 37.5 40 Z" fill="#38bdf8" opacity="0.85"/>
            <!-- Sunroof / Roof Ribs -->
            <rect x="37.5" y="42" width="6" height="5" rx="1" fill="#020617" stroke="#334155" stroke-width="0.5"/>
            <!-- Rear Window -->
            <rect x="36.5" y="49" width="8" height="2" rx="0.5" fill="#1e293b"/>
            <!-- Headlights -->
            <circle cx="36.5" cy="35" r="0.8" fill="#fef08a"/>
            <circle cx="44.5" cy="35" r="0.8" fill="#fef08a"/>
            <!-- Side Mirrors -->
            <rect x="34" y="38" width="1.2" height="2" rx="0.5" fill="#1e293b"/>
            <rect x="45.8" y="38" width="1.2" height="2" rx="0.5" fill="#1e293b"/>
            
            <!-- Orange Traffic Safety Cones (Beside SUV, as in photo) -->
            <circle cx="48.5" cy="40" r="1.5" fill="#ea580c"/>
            <circle cx="48.5" cy="40" r="0.7" fill="#ffffff"/>
            <circle cx="48.5" cy="46" r="1.5" fill="#ea580c"/>
            <circle cx="48.5" cy="46" r="0.7" fill="#ffffff"/>
          </g>

          <!-- Forward Starboard Car (White Hatchback) -->
          <g class="parked-car-fwd-starboard">
            <rect x="54" y="38" width="10" height="17" rx="2" fill="#020617" opacity="0.5"/>
            <rect x="53.5" y="36" width="10" height="17" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.6"/>
            <path d="M 55 39 L 62 39 L 61 42 L 56 42 Z" fill="#0284c7" opacity="0.75"/>
            <rect x="55.5" y="44" width="6" height="4" rx="1" fill="#e2e8f0"/>
          </g>

          <!-- Aft Vehicles (Stern car deck) -->
          <!-- Aft Port Car (Red Pickup Truck) -->
          <g class="parked-truck-aft">
            <rect x="35" y="188" width="10" height="19" rx="2" fill="#020617" opacity="0.5"/>
            <rect x="34.5" y="186" width="10" height="19" rx="2" fill="#dc2626" stroke="#991b1b" stroke-width="0.6"/>
            <!-- Cab glass -->
            <path d="M 36 195 L 43 195 L 42 198 L 37 198 Z" fill="#0284c7" opacity="0.75"/>
            <!-- Open Truck Bed -->
            <rect x="36" y="188" width="7" height="6" rx="0.5" fill="#7f1d1d"/>
          </g>

          <!-- Aft Starboard Car (Silver SUV) -->
          <g class="parked-suv-aft">
            <rect x="54.5" y="190" width="10.5" height="18" rx="2" fill="#020617" opacity="0.5"/>
            <rect x="54" y="188" width="10.5" height="18" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="0.6"/>
            <path d="M 55.5 198 L 63 198 L 62 195 L 56.5 195 Z" fill="#0284c7" opacity="0.75"/>
            <rect x="56" y="191" width="6.5" height="3" rx="0.5" fill="#64748b"/>
          </g>

          <!-- Deep Tunnel Cavern Shadows (Under Superstructure Overhang) -->
          <rect x="22" y="56" width="56" height="18" fill="url(#tunnelShadowFwd)" opacity="0.85"/>
          <rect x="22" y="166" width="56" height="18" fill="url(#tunnelShadowAft)" opacity="0.85"/>

          <!-- Vehicle Clearance Overhead Sign / Center Pillar (Seen in photo) -->
          <rect x="48" y="54" width="4" height="6" fill="#f8fafc" stroke="#0284c7" stroke-width="0.6"/>
          <rect x="49" y="55" width="2" height="4" fill="#0284c7"/>

          <!-- ==========================================================
               5. Main Passenger Superstructure (Lower Lounge Level)
               ========================================================== -->
          <g filter="url(#cabinShadow)">
            <!-- Main Passenger Superstructure Block -->
            <rect x="21" y="58" width="58" height="124" rx="7" fill="url(#superstructureGrad)" stroke="#94a3b8" stroke-width="1.2"/>

            <!-- Flared Forward Passenger Brow (Aerodynamic Raked Observation Lounge) -->
            <polygon points="25,72 32,58 68,58 75,72 69,74 31,74" 
                     fill="url(#superstructureGrad)" 
                     stroke="#94a3b8" 
                     stroke-width="0.8"/>

            <!-- BC Ferries Royal Blue Cheatline (Forward Brow & Sides) -->
            <path d="M 25 72 L 32 58 L 68 58 L 75 72" stroke="url(#bcBlueGrad)" stroke-width="2.5" fill="none"/>
            <line x1="22" y1="72" x2="22" y2="168" stroke="url(#bcBlueGrad)" stroke-width="2.5"/>
            <line x1="78" y1="72" x2="78" y2="168" stroke="url(#bcBlueGrad)" stroke-width="2.5"/>

            <!-- Panoramic Forward Observation Windows (10 Raked Windows as in photo) -->
            <g class="fwd-observation-windows">
              <rect x="34" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="37.5" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="41" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="44.5" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="48" y="60" width="4" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="53" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="56.5" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="60" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="63.5" y="60" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
            </g>

            <!-- Flared Aft Passenger Brow -->
            <polygon points="25,168 32,182 68,182 75,168 69,166 31,166" 
                     fill="url(#superstructureGrad)" 
                     stroke="#94a3b8" 
                     stroke-width="0.8"/>
            <path d="M 25 168 L 32 182 L 68 182 L 75 168" stroke="url(#bcBlueGrad)" stroke-width="2.5" fill="none"/>

            <!-- Aft Observation Windows -->
            <g class="aft-observation-windows">
              <rect x="34" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="37.5" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="41" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="44.5" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="48" y="175" width="4" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="53" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="56.5" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="60" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
              <rect x="63.5" y="175" width="2.5" height="5" rx="0.6" fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4"/>
            </g>

            <!-- Port & Starboard Passenger Windows (Upper Ribbon Rows) -->
            <!-- Port Ribbon -->
            <g fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4">
              <rect x="23" y="76" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="82" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="88" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="94" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="100" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="106" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="112" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="124" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="130" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="136" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="142" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="148" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="154" width="2.5" height="4.5" rx="0.5"/>
              <rect x="23" y="160" width="2.5" height="4.5" rx="0.5"/>
            </g>

            <!-- Starboard Ribbon (Visible in photo!) -->
            <g fill="url(#windowGlass)" stroke="#0f172a" stroke-width="0.4">
              <rect x="74.5" y="76" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="82" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="88" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="94" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="100" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="106" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="112" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="124" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="130" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="136" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="142" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="148" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="154" width="2.5" height="4.5" rx="0.5"/>
              <rect x="74.5" y="160" width="2.5" height="4.5" rx="0.5"/>
            </g>

            <!-- Official BCFerries Logo on Hull Flanks (Featured in photo) -->
            <!-- Port Logo -->
            <g transform="translate(18, 115) rotate(-90)">
              <!-- Double Wave Mark -->
              <path d="M 0 0 C 1 -1, 2 -1, 3 0 C 4 1, 5 1, 6 0" stroke="#0284c7" stroke-width="0.9" fill="none"/>
              <path d="M 0 1.6 C 1 0.6, 2 0.6, 3 1.6 C 4 2.6, 5 2.6, 6 1.6" stroke="#0284c7" stroke-width="0.9" fill="none"/>
              <!-- Text -->
              <text x="8" y="1.8" font-size="3.2" font-family="'Inter', 'Arial', sans-serif" font-weight="800" fill="#0284c7" letter-spacing="-0.2">BCFerries</text>
            </g>

            <!-- Starboard Logo (Exact placement seen in photo!) -->
            <g transform="translate(82, 125) rotate(90)">
              <!-- Double Wave Mark -->
              <path d="M 0 0 C 1 -1, 2 -1, 3 0 C 4 1, 5 1, 6 0" stroke="#0284c7" stroke-width="0.9" fill="none"/>
              <path d="M 0 1.6 C 1 0.6, 2 0.6, 3 1.6 C 4 2.6, 5 2.6, 6 1.6" stroke="#0284c7" stroke-width="0.9" fill="none"/>
              <!-- Text -->
              <text x="8" y="1.8" font-size="3.2" font-family="'Inter', 'Arial', sans-serif" font-weight="800" fill="#0284c7" letter-spacing="-0.2">BCFerries</text>
            </g>
          </g>

          <!-- ==========================================================
               6. Upper Promenade Deck & Safety Equipment
               ========================================================== -->
          <g filter="url(#bridgeShadow)">
            <!-- Promenade Deck Surface -->
            <rect x="27" y="72" width="46" height="96" rx="5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8"/>
            
            <!-- Perimeter Promenade Safety Railings (White Stanchions from photo) -->
            <rect x="27.5" y="72.5" width="45" height="95" rx="4.5" fill="none" stroke="#ffffff" stroke-width="0.9"/>
            <rect x="28.5" y="73.5" width="43" height="93" rx="4" fill="none" stroke="#94a3b8" stroke-width="0.4" stroke-dasharray="2 2"/>

            <!-- Blue Cylindrical Liferaft Canisters (3 Port, 3 Starboard as in photo) -->
            <!-- Port Canisters -->
            <g fill="url(#bcBlueGrad)" stroke="#075985" stroke-width="0.4">
              <rect x="28.5" y="80" width="2.2" height="5.5" rx="1.1"/>
              <rect x="28.5" y="87" width="2.2" height="5.5" rx="1.1"/>
              <rect x="28.5" y="94" width="2.2" height="5.5" rx="1.1"/>
              <rect x="28.5" y="140" width="2.2" height="5.5" rx="1.1"/>
              <rect x="28.5" y="147" width="2.2" height="5.5" rx="1.1"/>
              <rect x="28.5" y="154" width="2.2" height="5.5" rx="1.1"/>
            </g>

            <!-- Starboard Canisters -->
            <g fill="url(#bcBlueGrad)" stroke="#075985" stroke-width="0.4">
              <rect x="69.3" y="80" width="2.2" height="5.5" rx="1.1"/>
              <rect x="69.3" y="87" width="2.2" height="5.5" rx="1.1"/>
              <rect x="69.3" y="94" width="2.2" height="5.5" rx="1.1"/>
              <rect x="69.3" y="140" width="2.2" height="5.5" rx="1.1"/>
              <rect x="69.3" y="147" width="2.2" height="5.5" rx="1.1"/>
              <rect x="69.3" y="154" width="2.2" height="5.5" rx="1.1"/>
            </g>

            <!-- Outdoor Seating Benches / Passenger Silhouettes -->
            <rect x="33" y="76" width="7" height="2" rx="0.5" fill="#64748b"/>
            <rect x="60" y="76" width="7" height="2" rx="0.5" fill="#64748b"/>
            <rect x="33" y="162" width="7" height="2" rx="0.5" fill="#64748b"/>
            <rect x="60" y="162" width="7" height="2" rx="0.5" fill="#64748b"/>
          </g>

          <!-- ==========================================================
               7. Elevated Wheelhouse & Command Bridge (3D Raised Structure)
               ========================================================== -->
          <g filter="url(#bridgeShadow)">
            <!-- Bridge Pedestal Deck -->
            <rect x="33" y="86" width="34" height="68" rx="4" fill="url(#superstructureGrad)" stroke="#94a3b8" stroke-width="0.8"/>

            <!-- Port & Starboard Bridge Wings (Overhanging walkways for docking) -->
            <rect x="29" y="96" width="6" height="12" rx="1.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.6"/>
            <rect x="65" y="96" width="6" height="12" rx="1.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.6"/>
            <!-- Bridge Wing Railings -->
            <rect x="29.5" y="96.5" width="5" height="11" rx="1" fill="none" stroke="#64748b" stroke-width="0.4"/>
            <rect x="65.5" y="96.5" width="5" height="11" rx="1" fill="none" stroke="#64748b" stroke-width="0.4"/>

            <!-- Faceted Forward Command Bridge Cabin (From Photo: forward-raked anti-glare windows) -->
            <polygon points="34,106 38,94 62,94 66,106 63,108 37,108" 
                     fill="#ffffff" 
                     stroke="#64748b" 
                     stroke-width="0.8"/>

            <!-- Forward Bridge Windows (Panoramic Anti-Glare Cyan Tint) -->
            <polygon points="36,105 39,95 61,95 64,105" fill="url(#bridgeGlass)" stroke="#0f172a" stroke-width="0.5"/>
            <!-- Window Mullions (Window pane dividers) -->
            <line x1="42.5" y1="95" x2="41" y2="105" stroke="#0f172a" stroke-width="0.6"/>
            <line x1="46.5" y1="95" x2="45.5" y2="105" stroke="#0f172a" stroke-width="0.6"/>
            <line x1="50" y1="95" x2="50" y2="105" stroke="#0f172a" stroke-width="0.6"/>
            <line x1="53.5" y1="95" x2="54.5" y2="105" stroke="#0f172a" stroke-width="0.6"/>
            <line x1="57.5" y1="95" x2="59" y2="105" stroke="#0f172a" stroke-width="0.6"/>
            <!-- Glass Specular Reflection Streak -->
            <line x1="43" y1="97" x2="57" y2="103" stroke="#ffffff" stroke-width="0.6" opacity="0.6"/>

            <!-- Aft Wheelhouse Windows (Secondary Bridge Station) -->
            <polygon points="36,134 39,144 61,144 64,134" fill="url(#bridgeGlass)" stroke="#0f172a" stroke-width="0.5"/>
            <line x1="45" y1="134" x2="46" y2="144" stroke="#0f172a" stroke-width="0.6"/>
            <line x1="50" y1="134" x2="50" y2="144" stroke="#0f172a" stroke-width="0.6"/>
            <line x1="55" y1="134" x2="54" y2="144" stroke="#0f172a" stroke-width="0.6"/>

            <!-- Wheelhouse Sun Visor / Brow Overhang -->
            <line x1="38" y1="93.5" x2="62" y2="93.5" stroke="#e2e8f0" stroke-width="1.2" stroke-linecap="round"/>
          </g>

          <!-- ==========================================================
               8. Signature Cobalt-Blue BC Ferries Funnel & Emblem
               ========================================================== -->
          <g class="vessel-funnel">
            <!-- Funnel Base Casing -->
            <rect x="42" y="115" width="16" height="19" rx="5" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>

            <!-- The Iconic Blue Funnel (Centerpiece from photo!) -->
            <rect x="43" y="116" width="14" height="17" rx="4.5" fill="url(#bcBlueGrad)" stroke="#0369a1" stroke-width="0.9"/>
            
            <!-- White BC Ferries Stylized Triple Wave Emblem on Funnel -->
            <g stroke="#ffffff" stroke-width="1.1" fill="none" stroke-linecap="round">
              <path d="M 45.5 122 C 47 120.5, 48.5 120.5, 50 122 C 51.5 123.5, 53 123.5, 54.5 122"/>
              <path d="M 45.5 124.5 C 47 123, 48.5 123, 50 124.5 C 51.5 126, 53 126, 54.5 124.5"/>
              <path d="M 45.5 127 C 47 125.5, 48.5 125.5, 50 127 C 51.5 128.5, 53 128.5, 54.5 127"/>
            </g>

            <!-- Twin Black Exhaust Pipes / Flues -->
            <circle cx="47.5" cy="130" r="1.8" fill="#0f172a" stroke="#475569" stroke-width="0.6"/>
            <circle cx="52.5" cy="130" r="1.8" fill="#0f172a" stroke="#475569" stroke-width="0.6"/>
            <circle cx="47.5" cy="130" r="1" fill="#020617"/>
            <circle cx="52.5" cy="130" r="1" fill="#020617"/>
          </g>

          <!-- ==========================================================
               9. Communication Mast, Radar Scanners & Navigation Lights
               ========================================================== -->
          <g class="vessel-masts-radars">
            <!-- White Communication Mast -->
            <line x1="50" y1="114" x2="50" y2="88" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="50" y1="114" x2="50" y2="88" stroke="#475569" stroke-width="0.6"/>

            <!-- Forward High-Intensity Searchlights (From photo: twin lights over bridge) -->
            <circle cx="46.5" cy="91" r="1.6" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>
            <circle cx="53.5" cy="91" r="1.6" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>
            <circle cx="46.5" cy="91" r="0.8" fill="#ffffff"/>
            <circle cx="53.5" cy="91" r="0.8" fill="#ffffff"/>

            <!-- Dual Black Rotating Marine Radar Scanners (T-bars from photo) -->
            <!-- Upper Furuno Radar Scanner -->
            <line x1="42" y1="88" x2="58" y2="88" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="50" cy="88" r="1.4" fill="#64748b"/>
            <!-- Lower Secondary Radar Scanner -->
            <line x1="44" y1="96" x2="56" y2="96" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="50" cy="96" r="1.2" fill="#64748b"/>

            <!-- Navigation Lights (Colregs Compliant with Glow Halos) -->
            <!-- Port Light (Ruby Red) -->
            <circle cx="14" cy="120" r="3.5" fill="url(#portHalo)"/>
            <circle cx="14" cy="120" r="1.6" fill="#ef4444" stroke="#ffffff" stroke-width="0.4"/>

            <!-- Starboard Light (Emerald Green) -->
            <circle cx="86" cy="120" r="3.5" fill="url(#starboardHalo)"/>
            <circle cx="86" cy="120" r="1.6" fill="#22c55e" stroke="#ffffff" stroke-width="0.4"/>

            <!-- Stern White Running Light -->
            <circle cx="50" cy="223" r="1.4" fill="#ffffff" stroke="#94a3b8" stroke-width="0.4"/>
          </g>

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
