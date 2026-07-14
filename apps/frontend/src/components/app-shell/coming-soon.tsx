type ComingSoonProps = {
  items: string[];
  title: string;
};

export function ComingSoon({ items, title }: ComingSoonProps) {
  return (
    <section className="border border-dashed border-[var(--orion-border-strong)] bg-[var(--orion-panel-muted)] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--orion-text)]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--orion-muted)]">
            Este modulo ainda nao possui funcionalidades operacionais nesta fase.
          </p>
        </div>
        <span className="inline-flex w-fit border border-[var(--orion-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--orion-accent)]">
          Em breve
        </span>
      </div>
      <ul className="mt-6 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <li
            className="border border-[var(--orion-border)] bg-[var(--orion-panel)] px-4 py-3 text-sm text-[var(--orion-muted)]"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
