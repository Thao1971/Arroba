// arroba.com — Recuperar contraseña

function Recuperar() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);
  const submit = () => { if (valid) setSent(true); };

  return (
    <AuthShell>
      {!sent ? (
        <React.Fragment>
          <a href="Login.html" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24 }}>
            <AIcon name="arrowLeft" size={16} color="var(--text-muted)"/> Volver a iniciar sesión
          </a>
          <h1 style={{ fontSize: 27, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 8 }}>Recupera tu contraseña</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 28 }}>Introduce tu email y te enviaremos un enlace para restablecerla.</p>

          <div style={{ marginBottom: 22 }}>
            <AuthField icon="mail" label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@empresa.com" autoFocus onEnter={submit}/>
          </div>

          <AuthPrimary onClick={submit} disabled={!valid}>Enviar enlace de recuperación <AIcon name="arrowRight" size={17} color={valid ? '#fff' : 'var(--text-subtle)'}/></AuthPrimary>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 26 }}>
            ¿Recordaste tu contraseña? <a href="Login.html" style={{ fontWeight: 600, color: '#E8001D', textDecoration: 'none' }}>Iniciar sesión</a>
          </p>
        </React.Fragment>
      ) : (
        <div style={{ textAlign: 'center', animation: 'authIn .4s ease both' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <AIcon name="check" size={30} color="#1A8A4A" sw={2.4}/>
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 10 }}>Revisa tu correo</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
            Hemos enviado un enlace de recuperación a <strong style={{ color: 'var(--text)' }}>{email}</strong>. Revisa también la carpeta de spam.
          </p>
          <a href="Login.html" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 15, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
            <AIcon name="arrowLeft" size={17} color="var(--text)"/> Volver a iniciar sesión
          </a>
          <button onClick={() => setSent(false)} style={{ marginTop: 16, background: 'none', border: 'none', fontSize: 13.5, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            ¿No lo has recibido? <span style={{ color: '#E8001D', fontWeight: 600 }}>Reenviar</span>
          </button>
        </div>
      )}
    </AuthShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Recuperar/>);
