import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container-genesis">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-headline text-balance mb-6">
            Ready to Modernize{" "}
            <span className="text-primary">Halal Supply Chain</span>{" "}
            Operations?
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10 text-balance">
            Join forward-thinking halal businesses that trust HalalChain for
            end-to-end traceability and compliance management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto min-w-[200px]" asChild>
              <Link href="/register">
                Explore Demo
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
              asChild
            >
              <Link href="/login">
                <PlayCircle className="mr-2 size-4" />
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}