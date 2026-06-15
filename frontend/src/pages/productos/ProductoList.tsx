import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getProductos,
  deleteProducto,
  reactivateProducto,
  getIngredientes,
  getUnidadesMedida,
} from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import type { Producto, ProductoIngrediente, CostoCalculado } from "../../types/producto";
import type { Ingrediente } from "../../types/ingrediente";
import type { UnidadMedida } from "../../types/unidad";

interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (value: unknown, item: T) => React.ReactNode;
}

const PAGE_SIZE = 12;

const UNIT_CONVERSION: Record<string, Record<string, number>> = {
  masa: { g: 1, kg: 1000 },
  volumen: { mL: 1, L: 1000 },
  unidad: { u: 1, doc: 12 },
};

function ProductoList() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.rol === "ADMIN" || user?.roles?.includes("ADMIN");
  const isStock = user?.rol === "STOCK";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [ingredienteMap, setIngredienteMap] = useState<Record<number, Ingrediente>>({});
  const [unidadMap, setUnidadMap] = useState<Record<number, UnidadMedida>>({});
  const [loading, setLoading] = useState(true);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroDisponible, setFiltroDisponible] = useState("");
  const [filtroPrecioMin, setFiltroPrecioMin] = useState("");
  const [filtroPrecioMax, setFiltroPrecioMax] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [productoToReactivate, setProductoToReactivate] = useState<Producto | null>(null);
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false);
  const [expandedProducto, setExpandedProducto] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchProductos = async (pageNum = 1) => {
    try {
      setLoading(true);
      const offset = (pageNum - 1) * PAGE_SIZE;
      const [prodRes, ingRes, uniRes] = await Promise.all([
        getProductos({ offset, limit: PAGE_SIZE, nombre: filtroNombre || undefined, incluir_desactivados: mostrarDesactivados }),
        getIngredientes({ limit: 100 }),
        getUnidadesMedida({ limit: 100 }),
      ]);

      setProductos(prodRes.data.data || []);
      setTotal(prodRes.data.total || 0);
      setTotalPages(Math.ceil((prodRes.data.total || 0) / PAGE_SIZE));

      const ingMap: Record<number, Ingrediente> = {};
      (ingRes.data.data || []).forEach((i: Ingrediente) => {
        ingMap[i.id] = i;
      });
      setIngredienteMap(ingMap);

      const uniMap: Record<number, UnidadMedida> = {};
      (uniRes.data || []).forEach((u: UnidadMedida) => {
        uniMap[u.id] = u;
      });
      setUnidadMap(uniMap);
    } catch (err: unknown) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos(page);
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProductos(1);
  }, [filtroNombre]);

  useEffect(() => {
    fetchProductos(page);
  }, [mostrarDesactivados]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProductos(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const limpiarNumero = (value: string): string => {
    return value.replace(/[^0-9.,]/g, "");
  };

  const normalizarPrecio = (value: unknown): number => {
    if (value === null || value === undefined || value === "") return 0;

    return Number(String(value).replace(",", ".")) || 0;
  };

  const convertirUnidad = (
    cantidad: number,
    tipo: string,
    simboloOrigen: string,
    simboloDestino: string
  ): number => {
    if (simboloOrigen === simboloDestino) return cantidad;
    const fOrigen = UNIT_CONVERSION[tipo]?.[simboloOrigen];
    const fDestino = UNIT_CONVERSION[tipo]?.[simboloDestino];
    if (!fOrigen || !fDestino) return cantidad;
    return (cantidad * fOrigen) / fDestino;
  };

  const calcularStockMaximo = (producto: Producto): number | null => {
    if (
      !producto.producto_ingredientes ||
      producto.producto_ingredientes.length === 0
    ) {
      return producto.stock_cantidad != null ? Number(producto.stock_cantidad) : null;
    }

    let minUnidades = Infinity;

    for (const pi of producto.producto_ingredientes) {
      const ing = ingredienteMap[pi.ingrediente_id];
      if (!ing || ing.stock_cantidad == null) continue;

      const umReceta = unidadMap[pi.unidad_medida_id];
      const umIngrediente = unidadMap[ing.unidad_medida_id!];
      if (!umReceta || !umIngrediente) continue;

      const stockDisponible = Number(ing.stock_cantidad);
      let cantidadNecesaria = Number(pi.cantidad);

      if (umReceta.tipo === umIngrediente.tipo) {
        cantidadNecesaria = convertirUnidad(
          cantidadNecesaria,
          umReceta.tipo,
          umReceta.simbolo,
          umIngrediente.simbolo
        );
      }

      if (cantidadNecesaria <= 0) continue;

      const producibles = stockDisponible / cantidadNecesaria;
      if (producibles < minUnidades) minUnidades = producibles;
    }

    return minUnidades === Infinity ? null : Math.floor(minUnidades);
  };

  const filteredProductos = productos.filter((p) => {
    const matchDisponible =
      filtroDisponible === ""
        ? true
        : filtroDisponible === "true"
          ? p.disponible
          : !p.disponible;

    const precio = normalizarPrecio(p.precio_base);
    const precioMin = normalizarPrecio(filtroPrecioMin);
    const precioMax = normalizarPrecio(filtroPrecioMax);

    const matchPrecioMin = filtroPrecioMin === "" ? true : precio >= precioMin;
    const matchPrecioMax = filtroPrecioMax === "" ? true : precio <= precioMax;

    const matchSinIngredientes = isStock
      ? !p.producto_ingredientes || p.producto_ingredientes.length === 0
      : true;

    return matchDisponible && matchPrecioMin && matchPrecioMax && matchSinIngredientes;
  });

  const renderIngredientes = (producto: Producto) => {
    if (
      !producto.producto_ingredientes ||
      producto.producto_ingredientes.length === 0
    ) {
      return <span style={{ color: "#999" }}>Sin ingredientes</span>;
    }

    const preview = producto.producto_ingredientes
      .slice(0, 2)
      .map((ing) => {
        const nombre =
          ingredienteMap[ing.ingrediente_id]?.nombre ||
          `ID: ${ing.ingrediente_id}`;
        const uni = unidadMap[ing.unidad_medida_id];
        const uniStr = uni ? `${uni.simbolo}` : "";
        return `${nombre} (${ing.cantidad} ${uniStr})`;
      })
      .join(", ");

    const restantes = producto.producto_ingredientes.length - 2;
    const sufijo = restantes > 0 ? ` y ${restantes} más` : "";

    return (
      <span
        style={{ fontSize: "0.9em", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          setExpandedProducto(
            expandedProducto === producto.id ? null : producto.id,
          );
        }}
        title="Click para ver todos"
      >
        {preview}
        {sufijo}
      </span>
    );
  };

  const columns: ColumnDef<Producto>[] = isStock ? [
    { key: "nombre", label: "Nombre" },
    {
      key: "stock_max",
      label: "Stock",
      render: (_, item) => {
        const stock = calcularStockMaximo(item);
        if (stock === null) return <span style={{ color: "#999", fontSize: "0.85em" }}>-</span>;
        if (stock === 0) return <span className="badge badge-error">0</span>;
        if (stock <= 5) return <span className="badge badge-warning">{stock} u</span>;
        return <span className="badge badge-success">{stock} u</span>;
      },
    },
    {
      key: "disponible",
      label: "Disponible",
      render: (val) => (
        <span className={`badge ${val ? "badge-success" : "badge-warning"}`}>
          {val ? "Si" : "No"}
        </span>
      ),
    },
    {
      key: "ingredientes",
      label: "Ingredientes",
      render: (_, item) => renderIngredientes(item),
    },
  ] : [
    { key: "nombre", label: "Nombre" },
    {
      key: "precio_base",
      label: "Precio",
      render: (val) => `$${val}`,
    },
    {
      key: "stock_max",
      label: "Stock",
      render: (_, item) => {
        const stock = calcularStockMaximo(item);
        if (stock === null) {
          return (
            <span style={{ color: "#999", fontSize: "0.85em" }}>-</span>
          );
        }
        if (stock === 0) {
          return (
            <span className="badge badge-error">0</span>
          );
        }
        if (stock <= 5) {
          return (
            <span className="badge badge-warning">{stock} u</span>
          );
        }
        return (
          <span className="badge badge-success">{stock} u</span>
        );
      },
    },
    {
      key: "disponible",
      label: "Disponible",
      render: (val) => (
        <span className={`badge ${val ? "badge-success" : "badge-warning"}`}>
          {val ? "Si" : "No"}
        </span>
      ),
    },
    {
      key: "ingredientes",
      label: "Ingredientes",
      render: (_, item) => renderIngredientes(item),
    },
    ...(isAdmin ? [{
      key: "deleted_at",
      label: "",
      render: (val: unknown, item: Producto) => {
        if (!val) return null;
        return (
          <button
            className="btn btn-sm btn-primary"
            style={{ padding: "2px 10px", fontSize: "0.8em" }}
            onClick={(e) => {
              e.stopPropagation();
              handleReactivate(item);
            }}
          >
            Reactivar
          </button>
        );
      },
    }] : []),
  ];

  const handleEdit = (producto: Producto) => {
    if (isStock && producto.producto_ingredientes && producto.producto_ingredientes.length > 0) return
    navigate(`/productos/${producto.id}/editar`);
  };

  const handleDelete = (producto: Producto) => {
    setProductoToDelete(producto);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProducto(productoToDelete!.id);
      setShowDeleteModal(false);
      setProductoToDelete(null);
      toast.success("Producto desactivado correctamente");
      fetchProductos();
    } catch {
      toast.error("Error al desactivar el producto");
    }
  };

  const handleReactivate = (producto: Producto) => {
    setProductoToReactivate(producto);
    setShowReactivateModal(true);
  };

  const confirmReactivate = async () => {
    try {
      await reactivateProducto(productoToReactivate!.id);
      setShowReactivateModal(false);
      setProductoToReactivate(null);
      toast.success("Producto reactivado correctamente");
      fetchProductos();
    } catch {
      toast.error("Error al reactivar el producto");
    }
  };

  return (
    <div>
      <div className="card-header">
        <div className="flex items-center gap-3">
          <h1 className="card-title">Productos</h1>
          {!loading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              {filteredProductos.length} de {total}
            </span>
          )}
        </div>

        {isAdmin && (
          <Link to="/productos/nuevo" className="btn btn-primary" style={{ marginTop: '10px' }}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Producto
          </Link>
        )}
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group" style={{ flex: 1, minWidth: "200px" }}>
            <label className="filtro-label">Buscar por nombre</label>

            <div style={{ position: "relative" }}>
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ position: "absolute" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                type="text"
                className="filtro-input"
                placeholder="Nombre del producto..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                style={{
                  paddingLeft: "36px",
                  paddingRight: filtroNombre ? "36px" : "12px",
                }}
              />

              {filtroNombre && (
                <button
                  onClick={() => setFiltroNombre("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 transition-colors"
                  style={{ position: "absolute" }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="filtro-group" style={{ minWidth: "140px" }}>
            <label className="filtro-label">Precio mín.</label>

            <input
              type="text"
              className="filtro-input"
              placeholder="0,00"
              value={filtroPrecioMin}
              onChange={(e) =>
                setFiltroPrecioMin(limpiarNumero(e.target.value))
              }
            />
          </div>

          <div className="filtro-group" style={{ minWidth: "140px" }}>
            <label className="filtro-label">Precio máx.</label>

            <input
              type="text"
              className="filtro-input"
              placeholder="0,00"
              value={filtroPrecioMax}
              onChange={(e) =>
                setFiltroPrecioMax(limpiarNumero(e.target.value))
              }
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Disponible</label>

            <select
              className="filtro-input"
              value={filtroDisponible}
              onChange={(e) => setFiltroDisponible(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          {isAdmin && (
            <div className="filtro-group" style={{ display: "flex", alignItems: "flex-end" }}>
              <label className="filtro-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={mostrarDesactivados}
                  onChange={(e) => {
                    setMostrarDesactivados(e.target.checked);
                    setFiltroDisponible("");
                  }}
                />
                Mostrar desactivados
              </label>
            </div>
          )}
        </div>

        <DataTable
          data={filteredProductos}
          columns={columns}
          onEdit={handleEdit}
          onDelete={isAdmin ? handleDelete : undefined}
          loading={loading}
          emptyMessage="No hay productos"
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      {expandedProducto && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            backgroundColor: "#f8f9ff",
            border: "1px solid #cce",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h3 style={{ margin: 0 }}>
              Ingredientes de:{" "}
              <strong>
                {productos.find((p) => p.id === expandedProducto)?.nombre}
              </strong>
            </h3>

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setExpandedProducto(null)}
              style={{ padding: "2px 10px" }}
            >
              Cerrar ✕
            </button>
          </div>

          {(() => {
            const prod = productos.find((p) => p.id === expandedProducto);

            if (
              !prod ||
              !prod.producto_ingredientes ||
              prod.producto_ingredientes.length === 0
            ) {
              return (
                <p style={{ color: "#999" }}>
                  Este producto no tiene ingredientes cargados.
                </p>
              );
            }

            return (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "8px" }}>Ingrediente</th>
                    <th style={{ padding: "8px" }}>Cantidad</th>
                    <th style={{ padding: "8px" }}>Unidad</th>
                    <th style={{ padding: "8px" }}>Removible</th>
                  </tr>
                </thead>

                <tbody>
                  {prod.producto_ingredientes.map((ing, idx) => {
                    const nombre =
                      ingredienteMap[ing.ingrediente_id]?.nombre ||
                      `ID: ${ing.ingrediente_id}`;

                    const uni = unidadMap[ing.unidad_medida_id];

                    const uniStr = uni
                      ? `${uni.simbolo} (${uni.nombre})`
                      : `ID: ${ing.unidad_medida_id}`;

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px" }}>{nombre}</td>
                        <td style={{ padding: "8px" }}>{ing.cantidad}</td>
                        <td style={{ padding: "8px" }}>{uniStr}</td>
                        <td style={{ padding: "8px" }}>
                          {ing.es_removible ? "Sí" : "No"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Desactivar Producto"
      >
        <p>
          ¿Estás seguro de desactivar el producto{" "}
          <strong>{productoToDelete?.nombre}</strong>?
        </p>

        <p style={{ fontSize: "0.9em", color: "#666" }}>
          El producto quedará como no disponible, pero no se eliminará
          físicamente.
        </p>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancelar
          </button>

          <button className="btn btn-danger" onClick={confirmDelete}>
            Desactivar
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        title="Reactivar Producto"
      >
        <p>
          ¿Estás seguro de reactivar el producto{" "}
          <strong>{productoToReactivate?.nombre}</strong>?
        </p>

        <p style={{ fontSize: "0.9em", color: "#666" }}>
          El producto volverá a estar disponible en el catálogo.
        </p>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setShowReactivateModal(false)}
          >
            Cancelar
          </button>

          <button className="btn btn-primary" onClick={confirmReactivate}>
            Reactivar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ProductoList;
