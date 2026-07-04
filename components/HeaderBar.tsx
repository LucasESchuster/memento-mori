export function HeaderBar() {
  return (
    <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-7 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)] md:px-12">
      <div className="flex items-center gap-3">
        <span className="mm-breathe inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--terracotta)]" />
        <span>Tempus Fugit</span>
      </div>
      <nav className="hidden items-center gap-8 md:flex">
        <a href="#configurar" className="transition-colors hover:text-[color:var(--ink)]">
          Configurar
        </a>
        <a href="#vida" className="transition-colors hover:text-[color:var(--ink)]">
          Sua vida
        </a>
        <a href="#reflexao" className="transition-colors hover:text-[color:var(--ink)]">
          Reflexão
        </a>
        <a href="#carta" className="transition-colors hover:text-[color:var(--ink)]">
          Carta
        </a>
        <span className="h-3 w-px bg-[color:var(--cream-strong)]" />
        <a
          href="https://lucaseduardoschuster.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[color:var(--ink-fade)] transition-colors hover:text-[color:var(--ink)]"
        >
          por Lucas E. Schuster
        </a>
      </nav>
    </header>
  );
}
