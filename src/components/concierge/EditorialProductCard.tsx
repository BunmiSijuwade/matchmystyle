import { ExternalLink, ImageOff } from "lucide-react";

export interface CatalogProduct {
  productId: string;
  variantIds: string[];
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  price: { amount: number; currency: string } | null;
  merchantName: string | null;
  productUrl: string | null;
  available: boolean | null;
}

const formatPrice = ({ amount, currency }: { amount: number; currency: string }) => {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
};

interface EditorialProductCardProps {
  product: CatalogProduct;
  index: number;
}

const EditorialProductCard = ({ product, index }: EditorialProductCardProps) => {
  const portrait = index % 5 === 0 || index % 5 === 3;

  return (
    <article
      data-product-id={product.productId}
      data-variant-ids={product.variantIds.join(",")}
      className="group min-w-0"
    >
      <div className={`overflow-hidden bg-muted ${portrait ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-5 w-5" />
            <span className="text-[10px] uppercase tracking-[1px]">Image unavailable</span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            {product.merchantName && (
              <p className="mb-1 truncate text-[10px] font-medium uppercase tracking-[1.5px] text-primary">
                {product.merchantName}
              </p>
            )}
            <h2 className="line-clamp-2 text-sm leading-5 text-foreground">{product.title}</h2>
          </div>
          {product.price && (
            <p className="shrink-0 text-sm font-medium text-foreground">{formatPrice(product.price)}</p>
          )}
        </div>

        <div className="flex min-h-[44px] items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[1px] text-muted-foreground">
            {product.available === true ? "Available" : product.available === false ? "Availability varies" : "Check availability"}
          </span>
          {product.productUrl && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[1px] text-foreground underline decoration-border underline-offset-4 transition-colors duration-300 hover:text-primary"
            >
              View piece <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default EditorialProductCard;