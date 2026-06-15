import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/user";

interface SidebarItem {
  path: string
  label: string
  icon: string
  roles: Role[]
}

interface Breadcrumb {
  label: string
  path: string
}

const roleBadgeColors: Record<Role, string> = {
  ADMIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  STOCK: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  PEDIDOS:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

const sidebarItems: SidebarItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: "grid",
    roles: ["ADMIN"],
  },
  { path: "/usuarios", label: "Usuarios", icon: "users", roles: ["ADMIN"] },
  {
    path: "/productos",
    label: "Productos",
    icon: "box",
    roles: ["ADMIN"],
  },
  {
    path: "/categorias",
    label: "Categorías",
    icon: "folder",
    roles: ["ADMIN"],
  },
  {
    path: "/ingredientes",
    label: "Ingredientes",
    icon: "leaf",
    roles: ["ADMIN"],
  },
  {
    path: "/actualizar-stock",
    label: "Actualizar Stock",
    icon: "box",
    roles: ["STOCK","ADMIN"],
  },
  {
    path: "/pedidos",
    label: "Pedidos",
    icon: "clipboard",
    roles: ["ADMIN", "PEDIDOS"],
  },
];

const icons: Record<string, JSX.Element> = {
  grid: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  users: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  box: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  folder: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),
  leaf: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  ),
  clipboard: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  ),
  sun: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  moon: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  ),
  logout: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  menu: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
  chevronLeft: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  ),
};

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem("sidebarOpen") !== "false";
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role: Role = (user?.rol || "ADMIN") as Role;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleItems = sidebarItems.filter((item) => item.roles.includes(role));

  const breadcrumbs: Breadcrumb[] = (() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return [{ label: "Dashboard", path: "/" }];

    const crumbs: Breadcrumb[] = [{ label: "Dashboard", path: "/" }];
    let current = "";
    for (const part of parts) {
      if (
        part.match(/^\d+$/) ||
        part === "nuevo" ||
        part === "nueva" ||
        part === "editar" ||
        part === "estado"
      ) {
        crumbs[crumbs.length - 1].path += `/${part}`;
        continue;
      }
      current += `/${part}`;
      const menuItem = sidebarItems.find((s) => s.path === current);
      crumbs.push({
        label: menuItem?.label || part.charAt(0).toUpperCase() + part.slice(1),
        path: current,
      });
    }
    return crumbs;
  })();

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col
          bg-[#1a1514] text-white
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:w-[70px] lg:translate-x-0"}
          overflow-hidden
        `}
      >
        <div
          className={`flex items-center h-16 px-4 border-b border-white/10 ${!sidebarOpen && "lg:justify-center lg:px-2"}`}
        >
          <span className="text-xl flex-shrink-0">🍕</span>
          <span
            className={`ml-3 font-bold text-lg whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}
          >
            Food Store
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`ml-4 p-2 rounded-lg transition-colors text-white/70 hover:bg-white/10 hover:text-white lg:block mr-1`}
          >
            {icons.menu}
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                  ${!sidebarOpen && "lg:justify-center lg:px-2"}
                `}
              >
                <span className="flex-shrink-0">{icons[item.icon]}</span>
                <span
                  className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={`border-t border-white/10 p-3 space-y-2 ${!sidebarOpen && "lg:p-2"}`}
        >

          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
              transition-all duration-200
              text-red-400/80 hover:bg-red-500/15 hover:text-red-300
              ${!sidebarOpen && "lg:justify-center lg:px-2"}
            `}
          >
            <span className="flex-shrink-0">{icons.logout}</span>
            <span
              className={`text-sm whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-16 px-12 lg:px-16 bg-white dark:bg-[#1c1917] border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <nav
              className="hidden sm:flex items-center gap-1.5 text-sm"
              aria-label="Breadcrumb"
            >
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <svg
                      className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-stone-800 dark:text-stone-100" style={{marginLeft: '20px'}}>
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.path}
                      className="text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      style={{marginLeft: '20px'}}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 mr-5" style={{ marginRight: '20px' }}>
            <span className="text-sm text-stone-500 dark:text-stone-400 hidden md:block">
              {user?.email}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[role] || "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300"}`}
            >
              {role}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:py-10 lg:px-12 ml-4 bg-stone-50 dark:bg-[#171210]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
