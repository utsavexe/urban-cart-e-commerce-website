import Link from "next/link"

const showcaseCategories = [
  {
    name: "Clothes",
    subcategories: [
      { name: "Shirt", count: 300 },
      { name: "Shorts & Jeans", count: 60 },
      { name: "Jacket", count: 50 },
      { name: "Dress & Frock", count: 87 },
    ],
    image: "/clothing-rack.png",
  },
  {
    name: "Footwear",
    subcategories: [
      { name: "Sports", count: 45 },
      { name: "Formal", count: 75 },
      { name: "Casual", count: 35 },
      { name: "Safety Shoes", count: 26 },
    ],
    image: "/diverse-sneaker-collection.png",
  },
  {
    name: "Jewelry",
    subcategories: [
      { name: "Earrings", count: 46 },
      { name: "Couple Rings", count: 73 },
      { name: "Necklace", count: 61 },
    ],
    image: "/gold-jewelry.jpg",
  },
  {
    name: "Perfume",
    subcategories: [
      { name: "Clothes Perfume", count: 12 },
      { name: "Deodorant", count: 60 },
      { name: "Flower Fragrance", count: 50 },
    ],
    image: "/perfume-bottles.png",
  },
]

export function CategoryShowcase() {
  return (
    <section className="border-y border-border bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold">Shop by Category</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {showcaseCategories.map((category) => (
            <div key={category.name} className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-start gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                </div>
              </div>
              <ul className="space-y-2">
                {category.subcategories.map((sub) => (
                  <li key={sub.name}>
                    <Link
                      href={`/category/${sub.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex items-center justify-between text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <span>{sub.name}</span>
                      <span className="text-xs">({sub.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
