import { Generator } from "@/components/generator/generator";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="flex justify-end gap-1 p-4">
        <LocaleToggle />
        <ThemeToggle />
      </div>
      <Generator />
      <Footer />
    </main>
  );
}
