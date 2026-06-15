from fastapi import status


class TestCreatePedido:
    def test_create_pedido_success(self, client, client_user, client_headers, producto):
        payload = {
            "usuario_id": client_user.id,
            "forma_pago_codigo": "EFECTIVO",
            "items": [{"producto_id": producto.id, "cantidad": 2}],
        }
        response = client.post("/api/v1/pedidos", json=payload, headers=client_headers)

        assert response.status_code == status.HTTP_201_CREATED, response.text
        data = response.json()
        assert data["estado_codigo"] == "PENDIENTE"
        assert data["usuario_id"] == client_user.id
        assert data["total"] > 0
        assert len(data["detalles"]) == 1
        assert len(data["historial"]) >= 1


class TestAvanzarEstado:
    def test_avanzar_estado_valido(self, client, client_user, client_headers, admin_headers, producto):
        create_resp = client.post(
            "/api/v1/pedidos",
            json={
                "usuario_id": client_user.id,
                "forma_pago_codigo": "EFECTIVO",
                "items": [{"producto_id": producto.id, "cantidad": 1}],
            },
            headers=client_headers,
        )
        assert create_resp.status_code == 201, create_resp.text
        pedido_id = create_resp.json()["id"]

        advance_resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"estado_hacia_codigo": "CONFIRMADO"},
            headers=admin_headers,
        )
        assert advance_resp.status_code == status.HTTP_200_OK, advance_resp.text
        assert advance_resp.json()["estado_codigo"] == "CONFIRMADO"

    def test_avanzar_estado_invalido(self, client, client_user, client_headers, admin_headers, producto):
        create_resp = client.post(
            "/api/v1/pedidos",
            json={
                "usuario_id": client_user.id,
                "forma_pago_codigo": "EFECTIVO",
                "items": [{"producto_id": producto.id, "cantidad": 1}],
            },
            headers=client_headers,
        )
        assert create_resp.status_code == 201, create_resp.text
        pedido_id = create_resp.json()["id"]

        for target in ("CONFIRMADO", "EN_PREP", "ENTREGADO"):
            resp = client.patch(
                f"/api/v1/pedidos/{pedido_id}/estado",
                json={"estado_hacia_codigo": target},
                headers=admin_headers,
            )
            assert resp.status_code == 200, f"Transicion a {target} fallo: {resp.text}"

        invalid_resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"estado_hacia_codigo": "EN_PREP"},
            headers=admin_headers,
        )
        assert invalid_resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCancelarPedido:
    def test_cancelar_pedido(self, client, client_user, client_headers, producto):
        create_resp = client.post(
            "/api/v1/pedidos",
            json={
                "usuario_id": client_user.id,
                "forma_pago_codigo": "EFECTIVO",
                "items": [{"producto_id": producto.id, "cantidad": 1}],
            },
            headers=client_headers,
        )
        assert create_resp.status_code == 201, create_resp.text
        pedido_id = create_resp.json()["id"]

        cancel_resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/cancelar",
            json={"motivo": "Ya no lo necesito"},
            headers=client_headers,
        )
        assert cancel_resp.status_code == status.HTTP_200_OK, cancel_resp.text
        assert cancel_resp.json()["estado_codigo"] == "CANCELADO"


class TestHistorialPedido:
    def test_historial_pedido(self, client, client_user, client_headers, admin_headers, producto):
        create_resp = client.post(
            "/api/v1/pedidos",
            json={
                "usuario_id": client_user.id,
                "forma_pago_codigo": "EFECTIVO",
                "items": [{"producto_id": producto.id, "cantidad": 1}],
            },
            headers=client_headers,
        )
        assert create_resp.status_code == 201, create_resp.text
        pedido_id = create_resp.json()["id"]

        client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"estado_hacia_codigo": "CONFIRMADO"},
            headers=admin_headers,
        )

        get_resp = client.get(
            f"/api/v1/pedidos/{pedido_id}/historial", headers=client_headers
        )
        assert get_resp.status_code == status.HTTP_200_OK, get_resp.text
        data = get_resp.json()
        assert len(data) >= 2
