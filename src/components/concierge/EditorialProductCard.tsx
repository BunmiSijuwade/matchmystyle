import { ImageOff } from "lucide-react";

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
  index?: number;
}

const EditorialProductCard = ({ product }: EditorialProductCardProps) => {
  const body = (
    <>
      <div className="aspect-[3/4] overflow-hidden rounded-[12px] border border-border bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-5 w-5" />
            <span className="text-[10px] uppercase tracking-[1px]">image unavailable</span>
          </div>
        )}
      </div>
      <div className="pt-3">
        {product.merchantName && (
          <p className="mb-1 truncate text-[11px] font-medium uppercase tracking-[1px] text-muted-foreground">{product.merchantName}</p>
        )}
        <h2 className="line-clamp-2 text-sm leading-5 text-foreground">{product.title}</h2>
        {product.price && <p className="mt-1 text-sm font-medium text-foreground">{formatPrice(product.price)}</p>}
      </div>
    </>
  );

  return (
    <article data-product-id={product.productId} data-variant-ids={product.variantIds.join(",")} className="group min-w-0">
      {product.productUrl ? (
        <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="block min-h-[44px] rounded-[12px]">
          {body}
        </a>
      ) : body}
    </article>
  );
};

export default EditorialProductCard;
