"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { ChevronUpIcon } from "@/assets/icons";

/* ------------------------------------------------------
   TYPES FOR NAV DATA
------------------------------------------------------ */
interface NavSubItem {
  title: string;
  url: string;
  moduleNumber?: number;
}

interface NavItem {
  title: string;
  icon: any;
  url?: string;
  moduleNumber?: number;
  items?: NavSubItem[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/* ------------------------------------------------------
   FILTER NAV DATA BY USER MODULE PERMISSIONS
------------------------------------------------------ */
function filterByModules(navData: NavSection[], userModules: number[]): NavSection[] {
  return navData
    .map((section) => {
      const filteredItems = section.items
        .map((item: NavItem | null): NavItem | null => {
          if (!item) return null;

          if (item.moduleNumber && !userModules.includes(item.moduleNumber)) {
            return null;
          }

          const allowedSubitems = (item.items || []).filter(
            (sub) => !sub.moduleNumber || userModules.includes(sub.moduleNumber)
          );

          return { ...item, items: allowedSubitems };
        })
        .filter(Boolean) as NavItem[];

      return { ...section, items: filteredItems };
    })
    .filter((s) => s.items.length > 0);
}

/* ------------------------------------------------------
   SIDEBAR COMPONENT
------------------------------------------------------ */
export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobile, setIsOpen, toggleSidebar } = useSidebarContext();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userModules, setUserModules] = useState<number[]>([]);

  /* ------------------------------------------------------
     LOAD MODULE ACCESS FROM SESSION
  ------------------------------------------------------ */
  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem("session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setUserModules(session.modules || []);
      }
    } catch {
      console.error("Invalid session in localStorage");
    }
  }, []);

  const filteredData = filterByModules(NAV_DATA as NavSection[], userModules);

  /* ------------------------------------------------------
     EXPAND CORRECT MENU BASED ON PATH
  ------------------------------------------------------ */
  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  };

  useEffect(() => {
    filteredData.some((section) =>
      section.items.some((item) =>
        item.items?.some((sub) => {
          if (sub.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }
            return true;
          }
        })
      )
    );
  }, [pathname, filteredData]);

  /* ------------------------------------------------------
     RENDER
  ------------------------------------------------------ */
  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark transition-all duration-200 ease-linear",

          // Positioning
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",

          // Width Logic
          isMobile ? (isOpen ? "w-full" : "w-0") : "w-[290px]"
        )}
        aria-label="Main navigation"
        aria-hidden={isMobile ? !isOpen : false}
        inert={isMobile && !isOpen} // 🔥 FIXED
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          {/* HEADER (LOGO + CLOSE BTN) */}
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2"
              >
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* NAV MENU */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {filteredData.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {/* HAS SUBMENU */}
                        {item.items && item.items.length > 0 ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some((i) => i.url === pathname)}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon className="size-6 shrink-0" />
                              <span>{item.title}</span>
                              <ChevronUpIcon
                                className={cn(
                                  "ml-auto rotate-180 transition-transform",
                                  expandedItems.includes(item.title) && "rotate-0"
                                )}
                              />
                            </MenuItem>

                            {expandedItems.includes(item.title) && (
                              <ul className="ml-9 space-y-1.5 pb-[15px] pt-2">
                                {item.items.map((sub) => (
                                  <li key={sub.title}>
                                    <MenuItem
                                      as="link"
                                      href={sub.url}
                                      isActive={pathname === sub.url}
                                    >
                                      <span>{sub.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          /* NO SUBMENU */
                          <MenuItem
                            as="link"
                            href={item.url ?? "/"}
                            isActive={pathname === item.url}
                            className="flex items-center gap-3 py-3"
                          >
                            <item.icon className="size-6 shrink-0" />
                            <span>{item.title}</span>
                          </MenuItem>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
