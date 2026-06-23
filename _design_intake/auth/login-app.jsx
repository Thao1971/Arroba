// arroba.com — Login

function Login() {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const valid = /\S+@\S+\.\S+/.test(email) && pass.length >= 1;
  const submit = () => { if (valid) window.location.href = 'Mis Oportunidades.html'; };

  return (
    <AuthShell>
      <h1 style={{ fontSize: 27, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 8 }}>Bienvenido de nuevo</h1>
      <p style={{ fontSize: 14.5, color: 'var(--text-muted)', marginBottom: 28 }}>Accede a tu espacio de inteligencia y operaciones.</p>

      {/* Google (mock) */}
      <button style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', borderRadius: 12, border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        <AIcon name="google" size={18} color="var(--text)"/> Continuar con Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>o con tu email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AuthField icon="mail" label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@empresa.com" autoFocus onEnter={submit}/>
        <AuthField icon="lock" label="Contraseña" type="password" value={pass} onChange={setPass} placeholder="Tu contraseña" onEnter={submit}/>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 22px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, color: 'var(--text-muted)' }}>
          <button onClick={() => setRemember(!remember)} style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${remember ? '#E8001D' : 'var(--border-strong)'}`, background: remember ? '#E8001D' : 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            {remember && <AIcon name="check" size={12} color="#fff" sw={3}/>}
          </button>
          Recordarme
        </label>
        <a href="Recuperar.html" style={{ fontSize: 13.5, fontWeight: 600, color: '#E8001D', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
      </div>

      <AuthPrimary onClick={submit} disabled={!valid}>Iniciar sesión <AIcon name="arrowRight" size={17} color={valid ? '#fff' : 'var(--text-subtle)'}/></AuthPrimary>

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 26 }}>
        ¿Aún no tienes cuenta? <a href="Registro.html" style={{ fontWeight: 600, color: '#E8001D', textDecoration: 'none' }}>Crear cuenta</a>
      </p>
    </AuthShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Login/>);
