export function Venn() {
  return (
    <svg className="venn" viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="36" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="60" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="48" cy="60" r="22" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="36" cy="40" r="3" fill="var(--brand-archetypes-red)" />
      <circle cx="60" cy="40" r="3" fill="var(--brand-archetypes-red)" />
      <circle cx="48" cy="60" r="3" fill="var(--brand-archetypes-red)" />
    </svg>
  );
}
