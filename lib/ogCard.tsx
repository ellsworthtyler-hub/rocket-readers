// Shared 1200x630 Open Graph card layout (rendered by next/og ImageResponse).
export const OG_SIZE = { width: 1200, height: 630 };

export function OgCard({
  eyebrow,
  title,
  subtitle,
  stats = [],
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string }[];
}) {
  const shortTitle = title.length > 90 ? `${title.slice(0, 87)}…` : title;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #064e3b 100%)',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 30, color: '#6ee7b7', fontWeight: 700 }}>
        {`Rocket Readers · ${eyebrow}`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: shortTitle.length > 50 ? 60 : 76, fontWeight: 800, lineHeight: 1.1 }}>
          {shortTitle}
        </div>
        {subtitle ? (
          <div style={{ display: 'flex', fontSize: 34, color: '#cbd5e1', marginTop: 20 }}>{subtitle}</div>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 28px',
              borderRadius: 24,
              background: 'rgba(15, 23, 42, 0.7)',
              border: '2px solid #334155',
            }}
          >
            <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8' }}>{s.label}</div>
            <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, color: '#fbbf24' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
