"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, removeToken } from "@/lib/api";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
  }, [pathname]);

  function logout() {
    removeToken();
    setLoggedIn(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-stone-900">
          Salon<span className="text-rose-600">Flow</span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link href="/#services" className="hidden text-stone-600 hover:text-rose-600 sm:block">
            Services
          </Link>

          {loggedIn ? (
            <>
              <Link
                href="/appointments"
                className="text-stone-600 hover:text-rose-600"
              >
                My bookings
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-stone-300 px-4 py-2 hover:border-rose-500 hover:text-rose-600"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-stone-900 px-5 py-2.5 text-white transition hover:bg-rose-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}