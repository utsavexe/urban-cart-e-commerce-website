import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"

export function Newsletter() {
  return (
    <section className="bg-primary py-16 text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Mail className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-3xl font-bold text-balance">Subscribe to Our Newsletter</h2>
          <p className="mt-3 text-primary-foreground/80 text-pretty">
            Get the latest updates on new products and upcoming sales
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-primary-foreground text-foreground"
            />
            <Button type="submit" variant="secondary" size="lg">
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
