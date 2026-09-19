/**
 * Telemetry and navigation calculation helpers for Queen of Capilano
 */
const Telemetry = {
  /**
   * Format ETA string for floating info box
   */
  formatEta(etaMinutes) {
    if (!etaMinutes || etaMinutes <= 0) return 'Arriving soon';
    if (etaMinutes === 1) return '~1 min';
    return `~${etaMinutes} mins`;
  },

  /**
   * Format docked elapsed time
   */
  formatElapsedDocked(minutes) {
    if (minutes === null || minutes === undefined) return 'Just docked';
    if (minutes <= 0) return '< 1 min';
    if (minutes === 1) return '1 min';
    if (minutes < 60) return `${minutes} mins`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  },

  /**
   * Find the next scheduled departure given an array of time entries
   * e.g. [["6:15 AM", "0"], ["7:30 AM", "0"], ...]
   */
  findNextSailing(timeEntries) {
    if (!timeEntries || !timeEntries.length) return 'Check schedule';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const item of timeEntries) {
      const timeStr = item[0];
      const parts = timeStr.trim().split(' ');
      if (parts.length < 2) continue;
      
      const [hm, meridiem] = parts;
      let [h, m] = hm.split(':').map(Number);
      if (meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
      if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
      
      const sailingMinutes = h * 60 + (m || 0);
      if (sailingMinutes > currentMinutes) {
        return timeStr;
      }
    }
    // If all sailings today have passed
    return timeEntries[0][0] + ' (Tomorrow)';
  },

  /**
   * Haversine distance between two coordinates in km
   */
  getDistanceKm(lon1, lat1, lon2, lat2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
};
