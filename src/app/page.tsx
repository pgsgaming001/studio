import XeroxForm from "@/components/features/xerox/XeroxForm";

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="text-center mb-10 md:mb-16">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary">
          Xerox<span className="text-accent">2</span>U
        </h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload your documents, customize print settings, and get them delivered straight to your doorstep. Fast, easy, and reliable.
        </p>
      </header>
      <XeroxForm />
    </main>
  );
}
