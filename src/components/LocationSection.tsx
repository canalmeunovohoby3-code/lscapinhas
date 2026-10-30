const ADDRESS =
  'Rua Gulhot Rodrigues, 22 - Campos Elíseos, Resende - RJ, 27542-040';

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`;

export function LocationSection() {
  return (
    <section className="location-section" aria-labelledby="location-title">
      <div className="container location-head">
        <div>
          <p className="eyebrow">Localização</p>
          <h2 id="location-title">Onde estamos</h2>
          <p>{ADDRESS}</p>
        </div>
        <a
          className="btn btn-outline location-directions"
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir no Google Maps
        </a>
      </div>
      <div className="location-map">
        <iframe
          title="Mapa da LS Case"
          src={MAP_EMBED_URL}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
