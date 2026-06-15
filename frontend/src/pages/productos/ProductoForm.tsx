import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getProductoById,
  createProducto,
  updateProducto,
  getCategorias,
  getIngredientes,
  getUnidadesMedida,
  uploadImage,
} from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import type { Producto, ProductoIngrediente, CostoCalculado, CostoDesgloseItem } from "../../types/producto";
import type { Categoria } from "../../types/categoria";
import type { Ingrediente } from "../../types/ingrediente";
import type { UnidadMedida } from "../../types/unidad";

interface FormData {
  nombre: string;
  descripcion: string;
  precio_base: string;
  disponible: boolean;
  imagenes_url: string;
  stock_cantidad: string;
  costo_base: string;
  categoria_id: string;
  es_principal: boolean;
  porcentaje_ganancia: string;
}

interface IngredienteSeleccionado {
  ingrediente_id: number;
  cantidad: string;
  unidad_medida_id: number;
  es_removible: boolean;
}

function ProductoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();
  const isStock = user?.rol === "STOCK";
  const readOnly = isStock && isEdit;

  const categoriaValidatorRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    descripcion: "",
    precio_base: "",
    disponible: true,
    imagenes_url: "",
    stock_cantidad: "",
    costo_base: "",
    categoria_id: "",
    es_principal: false,
    porcentaje_ganancia: "",
  });

  const [llevaIngredientes, setLlevaIngredientes] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<Ingrediente[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState<IngredienteSeleccionado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [costoCalculado, setCostoCalculado] = useState<CostoCalculado | null>(null);
  const [calculandoCosto, setCalculandoCosto] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ingredienteSearchQuery, setIngredienteSearchQuery] = useState("");
  const [ingredienteSearchResults, setIngredienteSearchResults] = useState<Ingrediente[]>([]);
  const [hasSearchedIngredientes, setHasSearchedIngredientes] = useState(false);
  const [categoriaSearchQuery, setCategoriaSearchQuery] = useState("");
  const [categoriaSearchResults, setCategoriaSearchResults] = useState<Categoria[]>([]);
  const [hasSearchedCategorias, setHasSearchedCategorias] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        const alert = document.querySelector('.alert-error')
        if (alert) {
          alert.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [error]);

  const fetchData = async () => {
    try {
      const [catRes, ingRes, uniRes] = await Promise.all([
        getCategorias({ limit: 100 }),
        getIngredientes({ limit: 100 }),
        getUnidadesMedida({ limit: 100 }),
      ]);

      const categoriasData: Categoria[] = catRes.data.data || [];

      setCategorias(categoriasData);
      setIngredientesDisponibles(ingRes.data.data || []);
      setUnidades(uniRes.data || []);

      if (isEdit) {
        const prodRes = await getProductoById(Number(id));
        const prod: Producto = prodRes.data;

        setFormData({
          nombre: prod.nombre || "",
          descripcion: prod.descripcion || "",
          precio_base: String(prod.precio_base ?? ""),
          disponible: prod.disponible ?? true,
          imagenes_url: Array.isArray(prod.imagenes_url) ? prod.imagenes_url[0] || "" : (prod.imagenes_url || ""),
          stock_cantidad: String(prod.stock_cantidad ?? ""),
          costo_base: "",
          categoria_id: String(prod.categoria_id ?? ""),
          es_principal: prod.es_principal || false,
          porcentaje_ganancia: String(prod.porcentaje_ganancia ?? ""),
        });

        if (prod.producto_ingredientes && prod.producto_ingredientes.length > 0) {
          setIngredientesSeleccionados(
            prod.producto_ingredientes.map((ing) => ({
              ingrediente_id: ing.ingrediente_id,
              cantidad: String(ing.cantidad),
              unidad_medida_id: ing.unidad_medida_id,
              es_removible: ing.es_removible || false,
            })),
          );
        } else {
          setLlevaIngredientes(false);
        }
      }
    } catch (err: unknown) {
      console.error("Error:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : false;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");
    try {
      const res = await uploadImage(file);
      setFormData((prev) => ({ ...prev, imagenes_url: res.data.url }));
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg || "Error al subir imagen").join("; "));
      } else {
        setError(String(detail || "Error al subir imagen"));
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoriaChange = (val: string | number) => {
    setFormData(prev => ({
      ...prev,
      categoria_id: String(val),
    }));

    if (categoriaValidatorRef.current) {
      categoriaValidatorRef.current.setCustomValidity("");
    }
  };

  const agregarIngrediente = (ingredienteId: number) => {
    const ingrediente = ingredientesDisponibles.find(
      (i) => i.id === ingredienteId,
    );

    if (!ingrediente) return;

    if (
      ingredientesSeleccionados.some((i) => i.ingrediente_id === ingredienteId)
    ) {
      return;
    }

    setIngredientesSeleccionados([
      ...ingredientesSeleccionados,
      {
        ingrediente_id: ingredienteId,
        cantidad: "1",
        unidad_medida_id: ingrediente.unidad_medida_id ?? 0,
        es_removible: false,
      },
    ]);
  };

  const quitarIngrediente = (index: number) => {
    setIngredientesSeleccionados(
      ingredientesSeleccionados.filter((_, i) => i !== index),
    );
  };

  const handleIngredienteCantidad = (index: number, cantidad: string) => {
    const nuevos = [...ingredientesSeleccionados];
    nuevos[index].cantidad = cantidad;
    setIngredientesSeleccionados(nuevos);
  };

  const handleIngredienteRemovible = (index: number, checked: boolean) => {
    const nuevos = [...ingredientesSeleccionados];
    nuevos[index].es_removible = checked;
    setIngredientesSeleccionados(nuevos);
  };

  const getIngredienteNombre = (id: number): string => {
    return (
      ingredientesDisponibles.find((i) => i.id === id)?.nombre || `ID: ${id}`
    );
  };

  const getUnidadSimbolo = (id: number): string => {
    if (!id) return "";
    return unidades.find((u) => u.id === id)?.simbolo || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnly) {
      try {
        await updateProducto(Number(id!), { stock_cantidad: parseInt(formData.stock_cantidad) || 0 });
        navigate("/productos");
      } catch (err: unknown) {
        setError(String((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Error al actualizar stock"));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!formData.categoria_id) {
      categoriaValidatorRef.current?.setCustomValidity(
        "Seleccioná una categoría",
      );
      categoriaValidatorRef.current?.reportValidity();
      return;
    }

    if (llevaIngredientes && ingredientesSeleccionados.length === 0) {
      setError("Agregá al menos un ingrediente o destildá 'Lleva ingredientes'");
      return;
    }

    if (!formData.imagenes_url) {
      setError("Cargá una imagen para el producto");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,

        precio_base:
          parseFloat(String(formData.precio_base).replace(",", ".")) || 0,

        disponible: formData.disponible,
        imagenes_url: formData.imagenes_url ? [formData.imagenes_url] : null,
        stock_cantidad: llevaIngredientes ? undefined : (parseInt(formData.stock_cantidad) || 0),
        categoria_id: parseInt(formData.categoria_id),
        es_principal: formData.es_principal,
        porcentaje_ganancia: formData.porcentaje_ganancia
          ? parseFloat(formData.porcentaje_ganancia)
          : null,

        ingredientes: llevaIngredientes
          ? ingredientesSeleccionados.map((ing) => ({
              ingrediente_id: ing.ingrediente_id,

              cantidad: parseFloat(String(ing.cantidad).replace(",", ".")) || 0,

              unidad_medida_id: ing.unidad_medida_id,
              es_removible: ing.es_removible,
            }))
          : [],
      };

      if (isEdit) {
        await updateProducto(Number(id!), payload);
      } else {
        await createProducto(payload);
      }

      navigate("/productos");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join("; "));
      } else if (typeof detail === "object" && detail !== null) {
        setError(JSON.stringify(detail));
      } else {
        setError(String(detail || "Error al guardar"));
      }
    } finally {
      setLoading(false);
    }
  };

  const ingredientesFiltrados = ingredientesDisponibles.filter(
    (ing) =>
      !ingredientesSeleccionados.some((s) => s.ingrediente_id === ing.id),
  );

  const handleCategoriaSearch = () => {
    setHasSearchedCategorias(true);
    const query = categoriaSearchQuery.trim().toLowerCase();
    if (!query) {
      setCategoriaSearchResults([]);
      return;
    }
    const results = categorias.filter((cat) =>
      cat.nombre.toLowerCase().includes(query),
    );
    setCategoriaSearchResults(results);
  };

  const handleIngredienteSearch = () => {
    setHasSearchedIngredientes(true);
    const query = ingredienteSearchQuery.trim().toLowerCase();
    if (!query) {
      setIngredienteSearchResults([]);
      return;
    }
    const disponibles = ingredientesDisponibles.filter(
      (ing) =>
        ing.nombre.toLowerCase().includes(query) &&
        !ingredientesSeleccionados.some((s) => s.ingrediente_id === ing.id),
    );
    setIngredienteSearchResults(disponibles);
  };

  const handleCalcularCosto = () => {
    setCalculandoCosto(true);
    setError("");
    setCostoCalculado(null);

    try {
      const desglose: CostoDesgloseItem[] = [];
      let total = 0;

      const factores: Record<string, Record<string, number>> = {
        masa: { g: 1, kg: 1000 },
        volumen: { mL: 1, L: 1000 },
        unidad: { u: 1, doc: 12 },
      };

      for (const sel of ingredientesSeleccionados) {
        const ing = ingredientesDisponibles.find((i) => i.id === sel.ingrediente_id);
        if (!ing || !ing.costo) continue;

        const umIng = unidades.find((u) => u.id === ing.unidad_medida_id);
        const umRec = unidades.find((u) => u.id === sel.unidad_medida_id);
        if (!umIng || !umRec) continue;

        let cant = parseFloat(String(sel.cantidad).replace(",", ".")) || 0;
        if (umIng.tipo === umRec.tipo && umRec.simbolo !== umIng.simbolo) {
          const tf = factores[umIng.tipo];
          if (tf) {
            const fOri = tf[umRec.simbolo] || 1;
            const fDes = tf[umIng.simbolo] || 1;
            cant = (cant * fOri) / fDes;
          }
        }

        const costoItem = Math.round(cant * ing.costo * 100) / 100;
        total += costoItem;
        desglose.push({
          ingrediente_id: ing.id,
          ingrediente_nombre: ing.nombre,
          cantidad_receta: parseFloat(String(sel.cantidad).replace(",", ".")),
          unidad_receta: umRec.simbolo,
          costo_unitario: ing.costo,
          unidad_base: umIng.simbolo,
          costo_total: costoItem,
        });
      }

      total = Math.round(total * 100) / 100;
      const pct = formData.porcentaje_ganancia
        ? parseFloat(formData.porcentaje_ganancia)
        : null;
      const precioSug =
        pct && pct > 0
          ? Math.round(total * (1 + pct / 100) * 100) / 100
          : null;

      setCostoCalculado({
        producto_id: id ? parseInt(id) : 0,
        costo_ingredientes: total,
        porcentaje_ganancia: pct,
        precio_sugerido: precioSug,
        desglose,
      });
    } catch (err: unknown) {
      setError("Error al calcular costo");
    } finally {
      setCalculandoCosto(false);
    }
  };

  const handleCalcularCostoManual = () => {
    setCalculandoCosto(true);
    setError("");
    setCostoCalculado(null);

    try {
      const costoBase = parseFloat(String(formData.costo_base).replace(",", ".")) || 0;
      const pct = formData.porcentaje_ganancia
        ? parseFloat(formData.porcentaje_ganancia)
        : null;
      const precioSug =
        pct && pct > 0 && costoBase > 0
          ? Math.round(costoBase * (1 + pct / 100) * 100) / 100
          : null;

      setCostoCalculado({
        producto_id: id ? parseInt(id) : 0,
        costo_ingredientes: costoBase,
        porcentaje_ganancia: pct,
        precio_sugerido: precioSug,
        desglose: [],
      });
    } catch (err: unknown) {
      setError("Error al calcular costo");
    } finally {
      setCalculandoCosto(false);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1>{isEdit ? "Editar" : "Nuevo"} Producto</h1>

        <Link to="/productos" className="btn btn-secondary">
          Volver
        </Link>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        {readOnly && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#1e40af", fontSize: "0.9em" }}>
            Rol STOCK: solo podés modificar el stock del producto.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
          {!readOnly && (
            <>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-input"
              value={formData.nombre}
              onChange={handleChange}
              required
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              name="descripcion"
              className="form-textarea"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              disabled={readOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="disponible"
                checked={formData.disponible}
                onChange={handleChange}
                disabled={readOnly}
              />{" "}
              Disponible
            </label>
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">
              Categoría <span style={{ color: "red" }}>*</span>
            </label>
            <input
              ref={categoriaValidatorRef}
              type="text"
              value={formData.categoria_id || ""}
              onChange={() => {}}
              required
              onInvalid={(e) => {
                e.currentTarget.setCustomValidity("Seleccioná una categoría");
              }}
              onInput={(e) => {
                e.currentTarget.setCustomValidity("");
              }}
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                opacity: 0,
                pointerEvents: "none",
              }}
            />

            {formData.categoria_id ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "6px",
                }}
              >
                <span>
                  <strong>Categoría seleccionada:</strong>{" "}
                  {categorias.find((c) => c.id === parseInt(formData.categoria_id))?.nombre || `ID ${formData.categoria_id}`}
                </span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    handleCategoriaChange("");
                    setCategoriaSearchQuery("");
                    setCategoriaSearchResults([]);
                  }}
                >
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Escribí la categoría..."
                    value={categoriaSearchQuery}
                    onChange={(e) => {
                      setCategoriaSearchQuery(e.target.value);
                      setHasSearchedCategorias(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCategoriaSearch();
                      }
                    }}
                    style={{ flex: 1 }}
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCategoriaSearch}
                    disabled={readOnly}
                  >
                    Buscar
                  </button>
                </div>

                {categoriaSearchResults.length > 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {categoriaSearchResults.map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderBottom: "1px solid #f0f0f0",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                        onClick={() => {
                          handleCategoriaChange(cat.id);
                          setCategoriaSearchQuery("");
                          setCategoriaSearchResults([]);
                        }}
                      >
                        <span>{cat.nombre}</span>
                        <span
                          style={{
                            fontSize: "0.8em",
                            color: "#888",
                          }}
                        >
                          Seleccionar
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {hasSearchedCategorias && categoriaSearchResults.length === 0 && (
                  <p style={{ color: "#999", fontSize: "0.85em", marginTop: "4px" }}>
                    No se encontraron categorías con ese nombre.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Imagen del producto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage || readOnly}
              className="form-input"
              style={{ padding: "8px" }}
            />
            {uploadingImage && (
              <small style={{ color: "#888" }}>Subiendo imagen...</small>
            )}
            {formData.imagenes_url && (
              <div style={{ marginTop: "8px" }}>
                <img
                  src={formData.imagenes_url}
                  alt="Preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: "8px" }}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imagenes_url: "" }))
                  }
                  disabled={readOnly}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={llevaIngredientes}
                onChange={(e) => {
                  setLlevaIngredientes(e.target.checked);
                  if (!e.target.checked) {
                    setIngredientesSeleccionados([]);
                    setCostoCalculado(null);
                    setFormData((prev) => ({ ...prev, costo_base: "" }));
                  }
                }}
                disabled={readOnly}
              />{" "}
              Lleva ingredientes
            </label>
          </div>

          {!llevaIngredientes && (
            <>
              <div className="form-group">
                <label className="form-label">Stock (unidades)</label>
                <input
                  type="number"
                  name="stock_cantidad"
                  className="form-input"
                  value={formData.stock_cantidad}
                  onChange={handleChange}
                  step="1"
                  min="0"
                  placeholder="Ej: 50"
                />
                <small style={{ color: "#888" }}>
                  Cantidad de unidades fisicas disponibles para la venta
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Costo del producto ($)</label>
                <input
                  type="text"
                  name="costo_base"
                  className="form-input"
                  value={formData.costo_base}
                  onChange={(e) => {
                    let value = e.target.value;
                    value = value.replace(/[^0-9.,]/g, "");
                    setFormData((prev) => ({ ...prev, costo_base: value }));
                  }}
                  placeholder="0,00"
                  disabled={readOnly}
                />
                <small style={{ color: "#888" }}>
                  Costo de adquisicion del producto (sin IVA)
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">% Ganancia</label>
                <input
                  type="number"
                  name="porcentaje_ganancia"
                  className="form-input"
                  value={formData.porcentaje_ganancia}
                  onChange={handleChange}
                  step="1"
                  min="0"
                  placeholder="Ej: 30 (30% de ganancia sobre el costo)"
                  disabled={readOnly}
                />
              </div>

              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCalcularCostoManual}
                  disabled={readOnly || calculandoCosto}
                >
                  {calculandoCosto ? "Calculando..." : "Calcular costo"}
                </button>

                {costoCalculado && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "14px",
                      background: "#f0fdf4",
                      borderRadius: "8px",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "1em", color: "#166534" }}>
                      Precio sugerido
                    </h4>

                    <div
                      style={{
                        borderTop: "1px solid #bbf7d0",
                        marginTop: "10px",
                        paddingTop: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <span>
                        <strong>Costo:</strong> $
                        {costoCalculado.costo_ingredientes?.toFixed(2)}
                      </span>
                      {costoCalculado.precio_sugerido != null ? (
                        <span style={{ color: "#059669", fontWeight: "bold" }}>
                          Sugerido ({costoCalculado.porcentaje_ganancia}%): $
                          {costoCalculado.precio_sugerido?.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: "#b45309", fontSize: "0.9em" }}>
                          Ingresá el % de ganancia para ver el precio sugerido
                        </span>
                      )}
                    </div>

                    {costoCalculado.precio_sugerido != null ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: "10px" }}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            precio_base: String(costoCalculado.precio_sugerido),
                          }))
                        }
                      >
                        Usar precio sugerido
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: "10px", opacity: 0.5, cursor: "not-allowed" }}
                        disabled
                      >
                        Usar precio sugerido
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {llevaIngredientes && (
            <div
              style={{
                background: "#f9fafb",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                marginBottom: "16px",
              }}
            >
              <label className="form-label" style={{ marginBottom: "8px", display: "block" }}>
                Ingredientes de la receta
              </label>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Escribí el ingrediente..."
                    value={ingredienteSearchQuery}
                    onChange={(e) => {
                      setIngredienteSearchQuery(e.target.value);
                      setHasSearchedIngredientes(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleIngredienteSearch();
                      }
                    }}
                    style={{ flex: 1 }}
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleIngredienteSearch}
                    disabled={readOnly}
                  >
                    Buscar
                  </button>
                </div>

                {ingredienteSearchResults.length > 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {ingredienteSearchResults.map((ing) => (
                      <div
                        key={ing.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        <span>{ing.nombre}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            agregarIngrediente(ing.id);
                            setIngredienteSearchResults((prev) =>
                              prev.filter((i) => i.id !== ing.id),
                            );
                          }}
                        >
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {hasSearchedIngredientes &&
                  ingredienteSearchResults.length === 0 && (
                    <p style={{ color: "#999", fontSize: "0.85em", marginTop: "4px" }}>
                      {ingredientesFiltrados.length === 0
                        ? "Todos los ingredientes disponibles ya fueron agregados."
                        : "No se encontraron ingredientes con ese nombre."}
                    </p>
                  )}
              </div>

              {ingredientesSeleccionados.length > 0 && (
                <div className="table-container">
                  <table className="table" style={{ fontSize: "0.9em" }}>
                    <thead>
                      <tr>
                        <th>Ingrediente</th>
                        <th style={{ width: "120px" }}>Cantidad</th>
                        <th style={{ width: "80px" }}>Unidad</th>
                        <th style={{ width: "90px" }}>Removible</th>
                        <th style={{ width: "50px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredientesSeleccionados.map((ing, index) => (
                        <tr key={index}>
                          <td>{getIngredienteNombre(ing.ingrediente_id)}</td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              value={ing.cantidad}
                              onChange={(e) => {
                                let value = e.target.value;
                                value = value.replace(/[^0-9.,]/g, "");
                                handleIngredienteCantidad(index, value);
                              }}
                              placeholder="0,00"
                              required
                              style={{ width: "100%" }}
                            />
                          </td>
                          <td style={{ color: "#666" }}>
                            {getUnidadSimbolo(ing.unidad_medida_id)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={ing.es_removible}
                              onChange={(e) =>
                                handleIngredienteRemovible(index, e.target.checked)
                              }
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => quitarIngrediente(index)}
                              title="Quitar ingrediente"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {ingredientesSeleccionados.length === 0 && (
                <p style={{ color: "#999", fontSize: "0.9em" }}>
                  Buscá ingredientes arriba para agregarlos al producto.
                </p>
              )}
            </div>
          )}

          {llevaIngredientes && (
            <div className="form-group">
              <label className="form-label">% Ganancia</label>
              <input
                type="number"
                name="porcentaje_ganancia"
                className="form-input"
                value={formData.porcentaje_ganancia}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Ej: 30 (30% de ganancia sobre el costo)"
                disabled={readOnly}
              />
            </div>
          )}

          {llevaIngredientes && ingredientesSeleccionados.length > 0 && (
            <div className="form-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCalcularCosto}
                disabled={readOnly || calculandoCosto}
              >
                {calculandoCosto ? "Calculando..." : "Calcular costo"}
              </button>

              {costoCalculado && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "14px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "1em", color: "#166534" }}>
                    Desglose de costo
                  </h4>

                  <table style={{ width: "100%", fontSize: "0.85em" }}>
                    <tbody>
                      {costoCalculado.desglose?.map((item, i) => (
                        <tr key={i}>
                          <td style={{ padding: "4px 0" }}>{item.ingrediente_nombre}</td>
                          <td style={{ textAlign: "right", padding: "4px 4px" }}>
                            {item.cantidad_receta} {item.unidad_receta}
                          </td>
                          <td style={{ textAlign: "right", padding: "4px 4px" }}>
                            × ${item.costo_unitario}/{item.unidad_base}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "bold", padding: "4px 0" }}>
                            = ${item.costo_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div
                    style={{
                      borderTop: "1px solid #bbf7d0",
                      marginTop: "10px",
                      paddingTop: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span>
                      <strong>Costo total:</strong> $
                      {costoCalculado.costo_ingredientes?.toFixed(2)}
                    </span>
                    {costoCalculado.precio_sugerido != null ? (
                      <span style={{ color: "#059669", fontWeight: "bold" }}>
                        Sugerido ({costoCalculado.porcentaje_ganancia}%): $
                        {costoCalculado.precio_sugerido?.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: "#b45309", fontSize: "0.9em" }}>
                        Ingresá el % de ganancia para ver el precio sugerido
                      </span>
                    )}
                  </div>

                  {costoCalculado.precio_sugerido != null ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: "10px" }}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          precio_base: String(costoCalculado.precio_sugerido),
                        }))
                      }
                    >
                      Usar precio sugerido
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: "10px", opacity: 0.5, cursor: "not-allowed" }}
                      disabled
                    >
                      Usar precio sugerido
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="form-group" style={{ marginTop: "8px" }}>
            <label className="form-label" style={{ fontWeight: "bold" }}>
              Precio Base (al cliente)
            </label>
            <input
              type="text"
              name="precio_base"
              className="form-input"
              value={formData.precio_base}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/[^0-9.,]/g, "");
                setFormData((prev) => ({ ...prev, precio_base: value }));
              }}
              placeholder="0,00"
              required
              disabled={readOnly}
            />
            <small style={{ color: "#888" }}>
              Precio final que verá el cliente. Usá "Calcular costo" para obtener una sugerencia.
            </small>
          </div>
          </>)}

          {readOnly && (
            <>
            <div className="form-group">
              <label className="form-label">Producto</label>
              <input
                type="text"
                className="form-input"
                value={formData.nombre}
                disabled
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                type="number"
                name="stock_cantidad"
                className="form-input"
                value={formData.stock_cantidad}
                onChange={handleChange}
                step="1"
                min="0"
              />
              <small style={{ color: "#888" }}>
                Cantidad de unidades disponibles para la venta
              </small>
            </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : readOnly ? "Actualizar stock" : "Guardar"}
            </button>

            <Link to="/productos" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductoForm;
