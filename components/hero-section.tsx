import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main hero */}
        <div className="relative overflow-hidden rounded-xl bg-secondary lg:col-span-2">
          <div className="flex flex-col justify-center gap-4 p-8 md:p-12 lg:min-h-[400px]">
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Trending Item</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
                Urban Style Collection
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Starting at <span className="text-2xl font-bold text-accent">$20</span>.00
              </p>
              <Button size="lg" className="mt-6 gap-2">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <img
            src="/modern-fashion-clothing-on-rack.jpg"
            alt="Fashion collection"
            className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-20 lg:block"
          />
        </div>

        {/* Side promos */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl bg-muted p-6 flex-1">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Accessories</p>
            <h3 className="mt-2 text-2xl font-bold text-balance">Modern Sunglasses</h3>
            <p className="mt-2 text-muted-foreground">
              Starting at <span className="font-bold text-foreground">$15</span>.00
            </p>
            <Button variant="link" className="mt-3 gap-1 p-0">
              Shop now <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-accent p-6 flex-1 text-accent-foreground">
            <p className="text-sm font-medium uppercase tracking-wider opacity-90">Sale Offer</p>
            <h3 className="mt-2 text-2xl font-bold text-balance">Summer Sale</h3>
            <p className="mt-2 opacity-90">
              Starting at <span className="font-bold">$29</span>.99
            </p>
            <Button variant="secondary" className="mt-3 gap-1">
              Shop now <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
