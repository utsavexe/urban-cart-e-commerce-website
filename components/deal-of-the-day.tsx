"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

export function DealOfTheDay() {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 24,
    minutes: 59,
    seconds: 45,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="border-y border-border bg-muted/50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold">Deal of the Day</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Deal 1 */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src="/shampoo-conditioner-product-set.jpg"
                  alt="Shampoo & conditioner packs"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-balance">Shampoo, Conditioner & Facewash Packs</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-pretty">
                    Complete care bundle for your daily routine. Premium quality products at an unbeatable price.
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-accent">$150</span>
                    <span className="text-lg text-muted-foreground line-through">$200</span>
                  </div>
                  <Button className="mt-4 w-full gap-2">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </Button>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Already sold: 20</span>
                    <span className="text-muted-foreground">Available: 40</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-1/3 bg-accent" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Hurry Up! Offer ends in:</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.days}</div>
                      <div className="text-xs text-muted-foreground">Days</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.hours}</div>
                      <div className="text-xs text-muted-foreground">Hours</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                      <div className="text-xs text-muted-foreground">Min</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.seconds}</div>
                      <div className="text-xs text-muted-foreground">Sec</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deal 2 */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src="/rose-gold-diamond-earrings.jpg"
                  alt="Rose Gold Diamonds Earring"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-balance">Rose Gold Diamonds Earring</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-pretty">
                    Elegant rose gold earrings with premium diamonds. Perfect for special occasions or everyday luxury.
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-accent">$1,990</span>
                    <span className="text-lg text-muted-foreground line-through">$2,500</span>
                  </div>
                  <Button className="mt-4 w-full gap-2">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </Button>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Already sold: 15</span>
                    <span className="text-muted-foreground">Available: 40</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[27%] bg-accent" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Hurry Up! Offer ends in:</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.days}</div>
                      <div className="text-xs text-muted-foreground">Days</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.hours}</div>
                      <div className="text-xs text-muted-foreground">Hours</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                      <div className="text-xs text-muted-foreground">Min</div>
                    </div>
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-2xl font-bold">{timeLeft.seconds}</div>
                      <div className="text-xs text-muted-foreground">Sec</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
