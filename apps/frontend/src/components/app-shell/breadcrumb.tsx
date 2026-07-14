import Link from "next/link";

type BreadcrumbProps = {
  current: string;
};

export function Breadcrumb({ current }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--orion-muted)]">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            className="outline-none transition hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
            href="/dashboard"
          >
            Orion
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-medium text-[var(--orion-text)]">
          {current}
        </li>
      </ol>
    </nav>
  );
}
