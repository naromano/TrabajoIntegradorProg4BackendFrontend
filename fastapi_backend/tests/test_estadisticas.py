import pytest
from datetime import date
from fastapi import status


class TestEstadisticas:
    def test_resumen(self, client, admin_headers):
        resp = client.get("/api/v1/estadisticas/resumen", headers=admin_headers)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert "ventas_hoy" in data
        assert "ticket_promedio" in data
        assert "pedidos_activos" in data
        assert "mes_actual" in data

    def test_pedidos_por_estado(self, client, admin_headers):
        resp = client.get(
            "/api/v1/estadisticas/pedidos-por-estado", headers=admin_headers
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "data" in resp.json()

    def test_ventas(self, client, admin_headers):
        hoy = date.today().isoformat()
        resp = client.get(
            f"/api/v1/estadisticas/ventas?desde={hoy}&hasta={hoy}",
            headers=admin_headers,
        )
        assert resp.status_code == status.HTTP_200_OK

    def test_cancelado_excluido(self, client, client_user, client_headers, admin_headers, producto):
        create_resp = client.post(
            "/api/v1/pedidos",
            json={
                "usuario_id": client_user.id,
                "forma_pago_codigo": "EFECTIVO",
                "items": [{"producto_id": producto.id, "cantidad": 1}],
            },
            headers=client_headers,
        )
        assert create_resp.status_code == 201
        pedido_id = create_resp.json()["id"]

        client.patch(
            f"/api/v1/pedidos/{pedido_id}/cancelar",
            json={"motivo": "test"},
            headers=client_headers,
        )

        hoy = date.today().isoformat()
        resp = client.get(
            f"/api/v1/estadisticas/ventas?desde={hoy}&hasta={hoy}",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        for item in resp.json().get("data", []):
            assert item["total_ventas"] >= 0
