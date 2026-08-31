export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <form
        action="/api/admin/login"
        method="post"
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 20px 50px -25px #00000033',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 26, margin: '0 0 4px', color: 'var(--ink)' }}>
            Panel de edición
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>Nieve Artesanal</p>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          required
          autoFocus
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            fontSize: 15,
            fontFamily: 'inherit',
          }}
        />
        {error && <p style={{ margin: 0, color: '#c0392b', fontSize: 13 }}>Contraseña incorrecta.</p>}
        <button
          type="submit"
          style={{
            padding: 12,
            border: 'none',
            borderRadius: 999,
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
