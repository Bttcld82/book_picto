"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export type NavItem = { label: string; href: string; exact?: boolean };
export type BreadcrumbItem = { label: string; href?: string };

export default function Navbar({
  brand = "Book Picto", brandHref = "/", nav = [], breadcrumbs = [], right = null
}:{
  brand?: string;
  brandHref?: string;
  nav?: NavItem[];
  breadcrumbs?: BreadcrumbItem[];
  right?: React.ReactNode;          // pulsanti azione (es. Export ZIP)
}) {
  const pathname = usePathname();
  
  // Default nav items include Books link
  const defaultNav: NavItem[] = [
    { label: 'Libri', href: '/books', exact: false }
  ];
  
  const allNav = [...defaultNav, ...nav];
  
  return (
    <header role="banner" style={{
      position: "fixed", top: 0, insetInline: 0, height: "var(--nav-h)",
      backdropFilter: "saturate(180%) blur(10px)",
      background: "var(--nav-bg)", borderBottom: "1px solid var(--nav-border)", zIndex: 50
    }}>
      <div className="container" style={{
        display:"flex", alignItems:"center", height:"100%", gap: 16
      }}>
        {/* Brand */}
        <Link href={brandHref} aria-label="Home" style={{
          textDecoration:"none", color:"var(--nav-text)", fontWeight:700, fontSize:18
        }}>{brand}</Link>

        {/* Nav items */}
        <nav aria-label="Sezioni" style={{display:"flex", gap:12, marginLeft:12}}>
          {allNav.map((it) => {
            const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href} href={it.href}
                aria-current={active ? "page" : undefined}
                style={{
                  color: active ? "var(--nav-accent)" : "var(--nav-muted)",
                  textDecoration:"none", fontWeight:600, padding:"6px 8px",
                  borderRadius: 8, border: active ? "1px solid #2b3446" : "1px solid transparent",
                  background: active ? "rgba(110,168,254,.08)" : "transparent"
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div aria-label="Percorso" style={{
            marginLeft:12, display:"flex", gap:8, alignItems:"center", color:"var(--nav-muted)", fontSize:14
          }}>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i>0 && <span aria-hidden>›</span>}
                {b.href ? <Link href={b.href} style={{color:"var(--nav-accent)", textDecoration:"none"}}>{b.label}</Link>
                        : <span>{b.label}</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        <div style={{marginLeft:"auto", display:"flex", gap:8, alignItems:"center"}}>
          {right}
        </div>
      </div>
    </header>
  );
}