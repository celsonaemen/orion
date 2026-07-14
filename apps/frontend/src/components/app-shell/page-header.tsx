import { Breadcrumb } from "./breadcrumb";

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ description, title }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <Breadcrumb current={title} />
      <h1 className="mt-4 text-3xl font-semibold tracking-normal text-[var(--orion-text)]">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--orion-muted)]">{description}</p>
    </header>
  );
}
