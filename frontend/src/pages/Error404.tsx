import { Link } from "react-router-dom";

function Error404() {
  return (
    <div className="empty" style={{ paddingTop: "80px" }}>
      <div style={{ fontSize: "5rem", marginBottom: "16px" }}>🍕</div>
      <h1
        style={{
          fontSize: "5rem",
          fontWeight: 800,
          color: "#ea580c",
          lineHeight: 1,
          marginBottom: "8px",
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "#1c1917",
          marginBottom: "8px",
        }}
        className="dark:text-white"
      >
        Página no encontrada
      </h2>
      <p className="empty-hint">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link
        to="/"
        className="btn btn-primary"
        style={{ marginTop: "32px", display: "inline-flex" }}
      >
        Volver al Inicio
      </Link>
    </div>
  );
}

export default Error404;
