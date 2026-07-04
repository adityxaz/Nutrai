"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {

  const pathname = usePathname();
  if (
    pathname === "/signup" ||
    pathname === "/login"
  ) {
    return null;
  }

  const navItems = [
    {
      href: "/",
      label: " 🏠 Home",
      svg: (cls: string) => (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href: "/workout",
      label: " 🏋️‍♂️ Workout",
      svg: (cls: string) => (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5M3.75 5.25h16.5m-16.5 13.5h16.5" />
        </svg>
      ),
    },
    {
      href: "/diet",
      label: "🍒 Diet",
      svg: (cls: string) => (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-9-9h18M5.25 5.25l13.5 13.5M18.75 5.25L5.25 13.5" />
        </svg>
      ),
    },
    {
      href: "/stats",
      label: "📊 Analytics",
      svg: (cls: string) => (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      href: "/timer",
      label: "⌚ timer",
      svg: (cls: string) => (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* ---------- DESKTOP / TABLET SIDEBAR (unchanged, hidden below md) ---------- */}
      <aside className="hidden md:flex w-24 h-screen sticky top-0 bg-[#09090b] border-r border-zinc-900 flex-col items-center justify-between py-6 select-none z-40">

        {/* Top Logo / Brand Mark */}
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/10">
            <span className="text-white text-base font-black tracking-tighter">N</span>
          </div>
        </div>

        {/* Center Dynamic Navigation Options */}
        <nav className="flex flex-col gap-3 w-full px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="w-full group">
                <div className={`
                  w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ease-out relative
                  ${isActive
                    ? "bg-zinc-900 text-purple-400 font-semibold shadow-inner"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40"
                  }
                `}>
                  {/* Active side indicator capsule */}
                  {isActive && (
                    <div className="absolute left-0 top-1/3 bottom-1/3 w-[3px] bg-purple-500 rounded-r-full" />
                  )}

                  <div className="transition-transform duration-200 ease-out group-hover:scale-105">
                    {item.svg(`w-[20px] h-[20px] ${isActive ? "text-purple-400" : "text-zinc-400 group-hover:text-zinc-200"}`)}
                  </div>

                  <span className={`text-[10px] tracking-tight font-medium ${isActive ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Small iOS Utility Profile Placeholder Footer */}
        <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-700 transition">
          <span className="text-[10px] font-bold text-zinc-400 font-mono">U</span>
        </div>

      </aside>

      {/* ---------- MOBILE BOTTOM TAB BAR (shown only below md) ---------- */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur border-t border-zinc-900 select-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-between px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className={`
                  relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-200 ease-out
                  ${isActive ? "text-purple-400" : "text-zinc-500 active:text-zinc-200"}
                `}>
                  {/* Active top indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 bg-purple-500 rounded-b-full" />
                  )}

                  {item.svg(`w-[20px] h-[20px] ${isActive ? "text-purple-400" : "text-zinc-500"}`)}

                  <span className={`text-[9px] leading-none tracking-tight font-medium ${isActive ? "text-zinc-200" : "text-zinc-500"}`}>
                    {item.label.trim()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}