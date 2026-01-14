import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Product {
  id: number
  name: string
  category: string
  price: number
  originalPrice: number
  image: string
}

export function ProductCard({ product }: { product: Product }) {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {discount > 0 && (
            <div className="absolute left-2 top-2 rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
              -{discount}%
            </div>
          )}
          <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="secondary" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="h-8 w-8">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <h3 className="mt-1 font-semibold text-sm line-clamp-2 text-balance">{product.name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold">${product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
