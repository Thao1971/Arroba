// arroba.com — Landing app (public, unregistered)
function LandingApp() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @keyframes lping { 75%,100%{ transform: scale(2.4); opacity: 0; } }
        * { box-sizing: border-box; transition: background-color .15s, border-color .12s, color .1s; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
        input::placeholder { color: var(--text-subtle); }
      `}</style>

      <LandingNav/>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px 40px' }}>
        <LandingHero/>
        <ThesisFlow/>
        <DataScale/>
        <MoatSection/>
        <OpportunityEngine/>
        <CopilotSection/>
        <AgentReady/>
        <LandingCTA/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LandingApp/>);
