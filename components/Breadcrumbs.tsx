import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mt-3 flex flex-wrap items-center gap-1 text-xs text-ink-muted">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-ink font-medium" : ""}>{item.label}</span>
            )}
            {!isLast && <span className="text-ink-muted/60">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

type JsonLdBreadcrumb = { name: string; url: string };

export function BreadcrumbJsonLd({ items }: { items: JsonLdBreadcrumb[] }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
