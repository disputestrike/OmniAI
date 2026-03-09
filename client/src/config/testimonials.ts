/**
 * Item 7 — Testimonials for pricing page. Swap placeholders for real quotes later.
 */
export interface Testimonial {
  quote: string;
  author: string;
  title: string;
  company: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "OTOBI AI cut our content production time by 80%. We now launch campaigns in hours, not weeks.",
    author: "Jordan Smith",
    title: "Head of Marketing",
    company: "TechFlow Inc",
  },
  {
    quote: "The AI Campaign Wizard and Programmatic Ads in one platform — we finally stopped juggling five different tools.",
    author: "Maria Chen",
    title: "Growth Lead",
    company: "ScaleUp Labs",
  },
  {
    quote: "From product idea to live ads in one dashboard. Our team ships faster and our clients love the results.",
    author: "Alex Rivera",
    title: "Creative Director",
    company: "Brand Studio Co",
  },
];
