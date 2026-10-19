import { site } from '../data/site';

export function BrandLogo({
  eager = false,
  light = false,
}: {
  eager?: boolean;
  light?: boolean;
}) {
  return (
    <img
      className="brand-logo"
      src={light ? '/logo-light.png' : '/logo-full.png'}
      alt={site.fullName}
      width={light ? 1280 : 360}
      height={light ? 1138 : 390}
      loading={eager ? 'eager' : 'lazy'}
    />
  );
}
