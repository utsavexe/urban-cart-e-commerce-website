import { ProductCard } from "@/components/product-card"

const products = {
  "New Arrivals": [
    {
      id: 1,
      name: "Relaxed Short Full Sleeve T-Shirt",
      category: "Clothes",
      price: 45,
      originalPrice: 55,
      image: "/casual-tshirt-on-white.jpg",
    },
    {
      id: 2,
      name: "Girls Pink Embro Design Top",
      category: "Clothes",
      price: 35,
      originalPrice: 45,
      image: "/pink-embroidered-top.jpg",
    },
    {
      id: 3,
      name: "Black Floral Wrap Midi Skirt",
      category: "Clothes",
      price: 42,
      originalPrice: 58,
      image: "/black-floral-skirt.jpg",
    },
    {
      id: 4,
      name: "Pure Garment Dyed Cotton Shirt",
      category: "Mens Fashion",
      price: 48,
      originalPrice: 68,
      image: "/cotton-dress-shirt.jpg",
    },
  ],
  Trending: [
    {
      id: 5,
      name: "Running & Trekking Shoes - White",
      category: "Sports",
      price: 49,
      originalPrice: 65,
      image: "/images/shoes.png",
    },
    {
      id: 6,
      name: "Trekking & Running Shoes - Black",
      category: "Sports",
      price: 52,
      originalPrice: 70,
      image: "/black-athletic-shoes.jpg",
    },
    {
      id: 7,
      name: "Womens Party Wear Shoes",
      category: "Party Wear",
      price: 68,
      originalPrice: 94,
      image: "/elegant-heels.jpg",
    },
    {
      id: 8,
      name: "Sports Claw Women's Shoes",
      category: "Sports",
      price: 54,
      originalPrice: 72,
      image: "/womens-sports-shoes.jpg",
    },
  ],
  "Top Rated": [
    {
      id: 9,
      name: "Pocket Watch Leather Pouch",
      category: "Watches",
      price: 34,
      originalPrice: 50,
      image: "/leather-watch-case.jpg",
    },
    {
      id: 10,
      name: "Silver Deer Heart Necklace",
      category: "Jewellery",
      price: 62,
      originalPrice: 84,
      image: "/silver-heart-necklace.png",
    },
    {
      id: 11,
      name: "Mens Leather Reversible Belt",
      category: "Belt",
      price: 24,
      originalPrice: 36,
      image: "/leather-belt.png",
    },
    {
      id: 12,
      name: "Smart Watch Vital Plus",
      category: "Watches",
      price: 128,
      originalPrice: 178,
      image: "/modern-smartwatch.png",
    },
  ],
}

export function ProductGrid() {
  return (
    <section className="container mx-auto px-4 py-12">
      {Object.entries(products).map(([section, items]) => (
        <div key={section} className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{section}</h2>
            <a
              href={`/products/${section.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              View all
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
