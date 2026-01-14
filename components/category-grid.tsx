import Link from "next/link"

const categories = [
  { name: "Dress & Frock", count: 53, image: "/elegant-dress.png" },
  { name: "Winter Wear", count: 58, image: "/winter-jacket.png" },
  { name: "Glasses & Lens", count: 68, image: "/stylish-sunglasses.png" },
  { name: "Shorts & Jeans", count: 84, image: "/denim-jeans.png" },
  { name: "T-shirts", count: 35, image: "/casual-tshirt.png" },
  { name: "Jacket", count: 16, image: "/classic-leather-jacket.png" },
  { name: "Watch", count: 27, image: "/luxury-watch.jpg" },
  { name: "Hat & Caps", count: 39, image: "/baseball-cap.png" },
]

export function CategoryGrid() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/category/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
            className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all hover:border-accent hover:shadow-lg"
          >
            <div className="aspect-square overflow-hidden rounded-md bg-muted">
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="mt-3 text-center">
              <h3 className="font-semibold text-sm">{category.name}</h3>
              <p className="text-xs text-muted-foreground">({category.count})</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
