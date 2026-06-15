import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPedidos, getProductos, getUsuarios, getEstadisticasResumen, getEstadisticasPedidosPorEstado, getEstadisticasProductosTop } from "../api/endpoints";
import { StatSkeleton } from "../components/Skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import type { ResumenEstadisticas, EstadoCantidad, ProductoTop } from "../types/estadisticas";

const statIcons: Record<string, React.ReactNode> = {
  pedidos: (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  productos: (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  usuarios: (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
};

interface ShortcutCard {
  to: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  roles: string[];
}

const shortcutCards: ShortcutCard[] = [
  {
    to: "/pedidos",
    label: "Pedidos",
    desc: "Ver y gestionar pedidos",
    icon: "📦",
    color: "from-amber-500 to-orange-600",
    roles: ["ADMIN", "PEDIDOS"],
  },
  {
    to: "/productos",
    label: "Productos",
    desc: "Administrar menú",
    icon: "🍕",
    color: "from-red-500 to-rose-600",
    roles: ["ADMIN", "STOCK"],
  },
  {
    to: "/usuarios",
    label: "Usuarios",
    desc: "Gestionar accesos",
    icon: "👥",
    color: "from-violet-500 to-purple-600",
    roles: ["ADMIN"],
  },
  {
    to: "/categorias",
    label: "Categorías",
    desc: "Organizar productos",
    icon: "📂",
    color: "from-emerald-500 to-teal-600",
    roles: ["ADMIN"],
  },
  {
    to: "/ingredientes",
    label: "Ingredientes",
    desc: "Controlar stock",
    icon: "🥬",
    color: "from-lime-500 to-green-600",
    roles: ["ADMIN"],
  },
];

interface Stats {
  pedidos: number;
  productos: number;
  usuarios: number;
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ pedidos: 0, productos: 0, usuarios: 0 });
  const [kpi, setKpi] = useState<ResumenEstadisticas | null>(null);
  const [estadosData, setEstadosData] = useState<EstadoCantidad[]>([]);
  const [topProductos, setTopProductos] = useState<ProductoTop[]>([]);
  const [loading, setLoading] = useState(true);

  const ESTADO_COLORS: Record<string, string> = {
    PENDIENTE: "#f59e0b",
    CONFIRMADO: "#3b82f6",
    EN_PREP: "#8b5cf6",
    ENTREGADO: "#10b981",
    CANCELADO: "#ef4444",
  };

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [pedidosRes, productosRes, usuariosRes, resumenRes, estadosRes, topRes] = await Promise.all([
          getPedidos({ limit: 1 }),
          getProductos({ limit: 1 }),
          getUsuarios({ limit: 1 }),
          getEstadisticasResumen(),
          getEstadisticasPedidosPorEstado(),
          getEstadisticasProductosTop({ limit: 5 }),
        ]);
        if (!cancelled) {
          setStats({
            pedidos: pedidosRes.data.total || 0,
            productos: productosRes.data.total || 0,
            usuarios: usuariosRes.data.total || 0,
          });
          setKpi(resumenRes.data);
          setEstadosData(estadosRes.data.data || []);
          setTopProductos(topRes.data.data || []);
        }
      } catch {
        if (!cancelled) {
          setStats({ pedidos: 0, productos: 0, usuarios: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
    <div>
        <div className="mb-8">
          <div className="h-8 w-36 bg-stone-200 dark:bg-stone-700/50 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-stone-100 dark:bg-stone-700/30 rounded animate-pulse" />
        </div>
        <div className="dashboard-stats max-w-3xl mx-auto">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
    );
  }

  const role = user?.rol || "";
  const visibleShortcuts = shortcutCards.filter((s) => s.roles.includes(role));

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">
          Bienvenido, {user?.nombre || "Admin"}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Resumen general del sistema
        </p>
      </div>

      {kpi && (
        <div className="dashboard-stats max-w-4xl mx-auto mb-10">
          <div className="stat-card">
            <div className="stat-title">Ventas hoy</div>
            <div className="stat-value">${kpi.ventas_hoy.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Ticket promedio</div>
            <div className="stat-value">${kpi.ticket_promedio.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Pedidos activos</div>
            <div className="stat-value">{kpi.pedidos_activos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Mes actual</div>
            <div className="stat-value">${kpi.mes_actual.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 mb-10">
        {estadosData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">Pedidos por estado</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={estadosData}
                  dataKey="cantidad"
                  nameKey="estado_codigo"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={50}
                  // @ts-ignore
                  label={({ estado_codigo, cantidad }: EstadoCantidad) => `${estado_codigo} (${cantidad})`}
                >
                  {estadosData.map((entry) => (
                    <Cell
                      key={entry.estado_codigo}
                      fill={ESTADO_COLORS[entry.estado_codigo] || "#a8a29e"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {topProductos.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">Top productos</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProductos} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombre" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="ingresos" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="dashboard-stats max-w-3xl mx-auto mb-10">
        {[
          { key: "pedidos", label: "Pedidos totales", value: stats.pedidos, href: "/pedidos" },
          { key: "productos", label: "Productos activos", value: stats.productos, href: "/productos" },
          { key: "usuarios", label: "Usuarios registrados", value: stats.usuarios, href: "/usuarios" },
        ].map((stat) => (
          <Link key={stat.key} to={stat.href} className="stat-card group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors">
                {statIcons[stat.key]}
              </span>
              <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M7 7h10v10" />
              </svg>
            </div>
            <div className="stat-title">{stat.label}</div>
            <div className="stat-value group-hover:scale-105 transition-transform origin-left">
              {stat.value.toLocaleString()}
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="section-title">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {visibleShortcuts.map((sc) => (
            <Link key={sc.to} to={sc.to} className="card group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer relative overflow-hidden" style={{ padding: "24px" }}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${sc.color} opacity-10 dark:opacity-15 rounded-bl-full group-hover:opacity-20 dark:group-hover:opacity-25 transition-opacity`} />
              <div className="text-3xl mb-3">{sc.icon}</div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{sc.label}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">{sc.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
