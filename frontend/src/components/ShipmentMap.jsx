/**
 * Map: Start (S), End (E) circles; current (blue pin); route polyline.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 4;

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function circleLetterIcon(letter) {
  return L.divIcon({
    className: 'map-circle-letter',
    html: `<span class="map-circle-letter-inner">${letter}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const startIcon = circleLetterIcon('S');
const endIcon = circleLetterIcon('E');

function validCoord(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b);
}

export function ShipmentMap({ shipments = [], height = '400px', showOnlyWithCoords = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);

  const list = showOnlyWithCoords
    ? shipments.filter((s) => validCoord(s.latitude, s.longitude) || validCoord(s.pickupLat, s.pickupLng) || validCoord(s.destinationLat, s.destinationLng))
    : shipments;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    // CartoDB Voyager: clear country & city labels, no API key
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !list.length) return;

    const map = mapRef.current;
    layersRef.current.forEach((layer) => {
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    });
    layersRef.current = [];
    const allBounds = [];

    list.forEach((shipment) => {
      const pickup = validCoord(shipment.pickupLat, shipment.pickupLng)
        ? [Number(shipment.pickupLat), Number(shipment.pickupLng)]
        : null;
      const current = validCoord(shipment.latitude, shipment.longitude)
        ? [Number(shipment.latitude), Number(shipment.longitude)]
        : null;
      const destination = validCoord(shipment.destinationLat, shipment.destinationLng)
        ? [Number(shipment.destinationLat), Number(shipment.destinationLng)]
        : null;

      // Route: pickup → current → destination (so route “travels” as shipment moves)
      const routePoints = [pickup, current, destination].filter(Boolean);
      const uniquePoints = [];
      let last = null;
      routePoints.forEach((p) => {
        if (!last || last[0] !== p[0] || last[1] !== p[1]) {
          uniquePoints.push(p);
          last = p;
        }
      });

      if (uniquePoints.length > 1) {
        const polyline = L.polyline(uniquePoints, {
          color: '#1B433E',
          weight: 4,
          opacity: 0.9,
          dashArray: '10, 10',
        }).addTo(map);
        polyline.bindPopup(
          `<strong>${escapeHtml(shipment.shipmentNumber)}</strong> – Route`
        );
        layersRef.current.push(polyline);
        uniquePoints.forEach((p) => allBounds.push(p));
      }

      // Start marker (S)
      if (pickup) {
        const m = L.marker(pickup, { icon: startIcon }).addTo(map);
        m.bindPopup(
          `<div style="padding:6px;min-width:160px;font-family:sans-serif;">
            <strong>Start</strong><br/>
            ${escapeHtml(shipment.pickupLocationName || shipment.shipmentNumber)}
          </div>`
        );
        layersRef.current.push(m);
        allBounds.push(pickup);
      }

      // End marker (E)
      if (destination) {
        const m = L.marker(destination, { icon: endIcon }).addTo(map);
        m.bindPopup(
          `<div style="padding:6px;min-width:160px;font-family:sans-serif;">
            <strong>End</strong><br/>
            ${escapeHtml(shipment.destinationName || shipment.shipmentNumber)}
          </div>`
        );
        layersRef.current.push(m);
        allBounds.push(destination);
      }

      // Current location marker (blue) – only if different from pickup and destination
      if (current) {
        const isSameAsPickup = pickup && pickup[0] === current[0] && pickup[1] === current[1];
        const isSameAsDest = destination && destination[0] === current[0] && destination[1] === current[1];
        if (!isSameAsPickup && !isSameAsDest) {
          const m = L.marker(current, { icon: defaultIcon }).addTo(map);
          m.bindPopup(
            `<div style="padding:8px;min-width:200px;font-family:sans-serif;">
              <strong>${escapeHtml(shipment.shipmentNumber)}</strong> – Current<br/>
              <span style="color:#555;">${escapeHtml(shipment.currentLocationName || '—')}</span><br/>
              <span style="color:#555;">Assigned: ${escapeHtml(shipment.assignedTo || '—')}</span><br/>
              <span style="color:#555;">Status: ${escapeHtml(shipment.currentStatus || '—')}</span>
            </div>`
          );
          layersRef.current.push(m);
          allBounds.push(current);
        }
      }
    });

    if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [list]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height, borderRadius: 8, background: 'var(--theme-dark-card)' }}
        aria-label="Shipments map with pickup, route and destination"
      />
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          background: 'var(--theme-dark-card)',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 11,
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 12px',
          alignItems: 'center',
          color: 'var(--text-on-dark)',
          border: '1px solid var(--theme-dark-border)',
        }}
      >
        <span className="map-legend-dot map-legend-s">S</span>
        Start &nbsp;
        <span className="map-legend-dot map-legend-e">E</span>
        End &nbsp;
        <span style={{ display: 'inline-block', width: 16, height: 3, background: '#DFFF00', marginRight: 6, verticalAlign: 'middle', borderRadius: 2 }} />
        Route
      </div>

      {/* Route summary: Starting → Current → End (below map) */}
      {list.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '14px 16px',
            background: 'var(--theme-dark-card)',
            border: '1px solid var(--theme-dark-border)',
            borderRadius: 8,
            fontSize: 14,
            color: 'var(--text-on-dark)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 12, color: 'var(--text-muted-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Route
          </div>
          {list.map((s, idx) => (
            <div
              key={s.shipmentNumber}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px 4px',
                marginBottom: idx < list.length - 1 ? 12 : 0,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="map-legend-dot map-legend-s" style={{ flexShrink: 0 }}>S</span>
                <strong style={{ fontSize: 12, color: 'var(--text-muted-dark)' }}>Starting</strong>
                <span style={{ marginLeft: 4 }}>{s.pickupLocationName || '—'}</span>
              </span>
              <span style={{ color: 'var(--theme-dark-border)', margin: '0 8px', fontSize: 18 }}>→</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                <strong style={{ fontSize: 12, color: 'var(--text-muted-dark)' }}>Current</strong>
                <span style={{ marginLeft: 4 }}>{s.currentLocationName || '—'}</span>
              </span>
              <span style={{ color: 'var(--theme-dark-border)', margin: '0 8px', fontSize: 18 }}>→</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="map-legend-dot map-legend-e" style={{ flexShrink: 0 }}>E</span>
                <strong style={{ fontSize: 12, color: 'var(--text-muted-dark)' }}>End</strong>
                <span style={{ marginLeft: 4 }}>{s.destinationName || '—'}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
