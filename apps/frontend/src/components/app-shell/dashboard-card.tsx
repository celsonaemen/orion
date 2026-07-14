import type { ReactNode } from "react";

type DashboardCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
};

export function DashboardCard({ description, label, value }: DashboardCardProps) {
  return (
    <section className="border border-[var(--orion-border)] bg-[var(--orion-panel)] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--orion-muted)]">
        {label}
      </p>
      <div className="mt-3 text-2xl font-semibold text-[var(--orion-text)]">{value}</div>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-[var(--orion-muted)]">{description}</p>
      ) : null}
    </section>
  );
}
