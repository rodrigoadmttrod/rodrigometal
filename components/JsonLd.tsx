import { SITE } from "@/lib/site";

type ListingJsonLdProps = {
  title: string;
  description: string | null;
  price: string | null;
  priceOnRequest: boolean;
  status: string;
  city: string | null;
  state: string | null;
  slug: string;
  imageUrl: string | null;
  sellerName: string;
  sellerPhone: string;
  createdAt: Date;
  categoryName: string | null;
};

/** JSON-LD Product para SEO — vendidos usam "SoldOut" mas continuam indexados. */
export function ListingJsonLd(props: ListingJsonLdProps) {
  const url = `${SITE.url}/anuncio/${props.slug}`;
  const sold = props.status === "sold";
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: props.title,
    description: props.description ?? undefined,
    image: props.imageUrl ? [props.imageUrl] : undefined,
    sku: props.slug,
    category: props.categoryName ?? undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: props.priceOnRequest ? "0" : (props.price ?? "0"),
      availability: sold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: props.sellerName,
        telephone: props.sellerPhone,
      },
      areaServed: [props.city, props.state].filter(Boolean).join(", ") || undefined,
    },
    datePublished: props.createdAt.toISOString(),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

type BreadcrumbJsonLdProps = {
  items: { name: string; url: string }[];
};

/** JSON-LD BreadcrumbList para SEO. */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
