import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/usePageMeta';
import {
  formatChargerPrice,
  getChargerImageUrl,
} from '../lib/chargers';
import { supabase } from '../lib/supabase';
import type { Charger } from '../types/chargers';

function ChargerCard({ charger }: { charger: Charger }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getChargerImageUrl(charger.image_path);

  return (
    <article className="charger-card">
      <div className="charger-card-media">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={charger.name}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="charger-card-placeholder">Imagem indisponível</span>
        )}
      </div>
      <div className="charger-card-body">
        <h2>{charger.name}</h2>
        <p>{charger.description}</p>
        <strong className="charger-card-price">
          {formatChargerPrice(charger.price_cents)}
        </strong>
      </div>
    </article>
  );
}

export function ChargersPage() {
  usePageMeta(
    'Carregadores | LS Case by LS Celulares',
    'Carregadores disponíveis na LS Case.',
  );

  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError('Não foi possível carregar os carregadores.');
      return undefined;
    }

    let active = true;

    supabase
      .from('chargers')
      .select('id, name, description, price_cents, image_path, created_at, updated_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;

        if (queryError) {
          setError('Não foi possível carregar os carregadores.');
        } else {
          setChargers((data ?? []) as Charger[]);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="chargers-page">
      <section className="shop-page-head">
        <div className="container">
          <nav className="breadcrumb" aria-label="Você está aqui">
            <Link to="/">Início</Link>
            <span>/</span>
            <span aria-current="page">Carregadores</span>
          </nav>
          <div className="shop-page-head-row">
            <div>
              <span className="eyebrow">Acessórios</span>
              <h1>Carregadores</h1>
              <p>Energia para o seu dia, com a qualidade LS Case.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="chargers-section">
        <div className="container">
          {loading ? (
            <p className="chargers-empty" role="status">Carregando carregadores...</p>
          ) : error ? (
            <p className="chargers-empty" role="alert">{error}</p>
          ) : chargers.length === 0 ? (
            <p className="chargers-empty">Não há carregadores disponíveis no momento.</p>
          ) : (
            <div className="chargers-grid">
              {chargers.map((charger) => (
                <ChargerCard key={charger.id} charger={charger} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
