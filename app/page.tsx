import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { CategoryGrid } from "@/components/category-grid"
import { CategoryShowcase } from "@/components/category-showcase"
import { ProductGrid } from "@/components/product-grid"
import { DealOfTheDay } from "@/components/deal-of-the-day"
import { Footer } from "@/components/footer"
import { Newsletter } from "@/components/newsletter"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <CategoryGrid />
        <CategoryShowcase />
        <ProductGrid />
        <DealOfTheDay />
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}
