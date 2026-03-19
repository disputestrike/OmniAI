/** Reusable placeholder for spec pages not yet fully built. */
export default function PlaceholderPage({
  title,
  description = "This section is part of the OTOBI AI platform. Full UI coming soon.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="page-title">{title}</h1>
      <p className="text-zinc-500">{description}</p>
    </div>
  );
}
