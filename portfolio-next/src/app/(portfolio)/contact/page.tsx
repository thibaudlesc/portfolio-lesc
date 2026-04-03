import { ContactSection } from "@/components/sections/ContactSection";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="pt-32 min-h-screen flex items-center">
      <ContactSection />
    </main>
  );
}
