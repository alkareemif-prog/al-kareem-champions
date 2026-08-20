import { Link } from "@tanstack/react-router";
import { Facebook, Youtube, Mail, Phone, ExternalLink } from "lucide-react";
import {
  FOUNDATION_EMAIL,
  FOUNDATION_HELPLINE,
  FOUNDATION_NAME,
  LOGO_URL,
  MAIN_SITE_URL,
} from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-gradient-emerald text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt={`${FOUNDATION_NAME} logo`} className="h-14 w-14 object-contain" />
            <span className="font-display text-lg font-semibold">{FOUNDATION_NAME}</span>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/75">
            মেধা ও মননের লড়াইয়ে সবার জন্য একটি সম্মানজনক প্ল্যাটফর্ম।
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-display text-gold-light text-base">Contact</h3>
          <p className="flex items-center gap-2">
            <Mail className="size-4" /> {FOUNDATION_EMAIL}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4" /> {FOUNDATION_HELPLINE} (Helpline)
          </p>
          <div className="flex gap-3 pt-2">
            <a href={MAIN_SITE_URL} aria-label="Facebook" className="hover:text-gold-light">
              <Facebook className="size-5" />
            </a>
            <a href={MAIN_SITE_URL} aria-label="YouTube" className="hover:text-gold-light">
              <Youtube className="size-5" />
            </a>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-display text-gold-light text-base">Quick Links</h3>
          <Link to="/rules" className="block hover:text-gold-light">
            Rules &amp; Regulations
          </Link>
          <Link to="/faq" className="block hover:text-gold-light">
            FAQ
          </Link>
          <Link to="/privacy" className="block hover:text-gold-light">
            Privacy Policy
          </Link>
          <Link to="/verify" className="block hover:text-gold-light">
            Certificate Verification
          </Link>
          <a
            href={MAIN_SITE_URL}
            className="text-gold-light inline-flex items-center gap-1 pt-2 font-medium"
          >
            Visit Our Main Foundation Website <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-4 text-center text-xs text-primary-foreground/70">
        © {new Date().getFullYear()} {FOUNDATION_NAME}. All rights reserved.
      </div>
    </footer>
  );
}