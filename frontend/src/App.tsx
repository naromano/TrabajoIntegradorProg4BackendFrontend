import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import UsuarioList from "./pages/usuarios/UsuarioList";
import UsuarioForm from "./pages/usuarios/UsuarioForm";
import ProductoList from "./pages/productos/ProductoList";
import ProductoForm from "./pages/productos/ProductoForm";
import CategoriaList from "./pages/categorias/CategoriaList";
import CategoriaForm from "./pages/categorias/CategoriaForm";
import IngredienteList from "./pages/ingredientes/IngredienteList";
import IngredienteForm from "./pages/ingredientes/IngredienteForm";
import PedidoList from "./pages/pedidos/PedidoList";
import PedidoDetail from "./pages/pedidos/PedidoDetail";
import PedidoCreate from "./pages/pedidos/PedidoCreate";
import Error404 from "./pages/Error404";
import StockUpdate from "./pages/stock/StockUpdate";
import type { Role } from "./types/user";

interface RequireAuthProps {
  roles?: Role[];
  children?: React.ReactNode;
}

function RequireAuth({ roles, children }: RequireAuthProps) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <span>Cargando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && user) {
    const hasRole = roles.includes(user.rol);
    if (!hasRole) {
      return <Navigate to="/" />;
    }
  }

  return children || <Outlet />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth roles={["ADMIN", "STOCK", "PEDIDOS"]} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<RequireAuth roles={["ADMIN"]}><Dashboard /></RequireAuth>} />
          <Route path="/usuarios" element={<RequireAuth roles={["ADMIN"]} />}>
            <Route index element={<UsuarioList />} />
            <Route path="nuevo" element={<UsuarioForm />} />
            <Route path=":id/editar" element={<UsuarioForm />} />
          </Route>
          <Route path="/productos" element={<ProductoList />} />
          <Route
            path="/productos/nuevo"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <ProductoForm />
              </RequireAuth>
            }
          />
          <Route
            path="/productos/:id/editar"
            element={
              <RequireAuth roles={["ADMIN", "STOCK"]}>
                <ProductoForm />
              </RequireAuth>
            }
          />
          <Route
            path="/categorias"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <CategoriaList />
              </RequireAuth>
            }
          />
          <Route
            path="/categorias/nueva"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <CategoriaForm />
              </RequireAuth>
            }
          />
          <Route
            path="/categorias/:id/editar"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <CategoriaForm />
              </RequireAuth>
            }
          />
          <Route
            path="/ingredientes"
            element={
              <RequireAuth roles={["ADMIN", "STOCK"]}>
                <IngredienteList />
              </RequireAuth>
            }
          />
          <Route
            path="/ingredientes/nuevo"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <IngredienteForm />
              </RequireAuth>
            }
          />
          <Route
            path="/ingredientes/:id/editar"
            element={
              <RequireAuth roles={["ADMIN", "STOCK"]}>
                <IngredienteForm />
              </RequireAuth>
            }
          />
          <Route path="/pedidos" element={<PedidoList />} />
          <Route
            path="/pedidos/nuevo"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <PedidoCreate />
              </RequireAuth>
            }
          />
          <Route path="/pedidos/:id" element={<PedidoDetail />} />
          <Route path="/actualizar-stock" element={<RequireAuth roles={["STOCK","ADMIN"]}><StockUpdate /></RequireAuth>} />
          <Route path="*" element={<Error404 />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
