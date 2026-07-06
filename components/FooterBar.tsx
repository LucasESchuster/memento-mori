export function FooterBar() {
  return (
    <footer className="mx-auto flex max-w-[1240px] items-baseline justify-between border-t border-[color:var(--rule)] px-6 py-14 md:px-12">
      <div className="font-serif text-lg italic text-[color:var(--ink-mute)] md:text-xl">
        tempus fugit, <em className="text-[color:var(--terracotta)]">memento mori</em>.
      </div>
      <div className="flex gap-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-mute)] md:gap-8">
        <a
          href="https://github.com/LucasESchuster/memento-mori"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[color:var(--ink)]"
        >
          GitHub ↗
        </a>
        <a
          href="https://www.linkedin.com/in/lucas-eduardo-schuster-945535231/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[color:var(--ink)]"
        >
          LinkedIn ↗
        </a>
        <a
          href="/privacidade"
          className="transition-colors hover:text-[color:var(--ink)]"
        >
          Privacidade
        </a>
        <span>© Lucas E. Schuster · MMXXVI</span>
      </div>
    </footer>
  );
}
