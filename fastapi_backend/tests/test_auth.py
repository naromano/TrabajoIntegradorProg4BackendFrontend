from fastapi import status


class TestRegister:
    def test_register_success(self, client):
        payload = {
            "nombre": "Nuevo",
            "apellido": "Usuario",
            "email": "nuevo@test.com",
            "password": "secreto123",
        }
        response = client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "nuevo@test.com"
        assert data["nombre"] == "Nuevo"
        assert data["apellido"] == "Usuario"
        assert "password" not in data
        assert "password_hash" not in data

    def test_register_duplicate_email(self, client):
        payload = {
            "nombre": "Duplicado",
            "apellido": "Email",
            "email": "dup@test.com",
            "password": "secreto123",
        }
        r1 = client.post("/api/v1/auth/register", json=payload)
        assert r1.status_code == status.HTTP_201_CREATED

        r2 = client.post("/api/v1/auth/register", json=payload)
        assert r2.status_code in (
            status.HTTP_409_CONFLICT,
            status.HTTP_400_BAD_REQUEST,
        ), f"Esperado 409 o 400, recibido {r2.status_code}: {r2.text}"


class TestLogin:
    def test_login_success(self, client, admin_user):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "Admin@test.com", "password": "admin123"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data.get("token_type") == "bearer"

    def test_login_invalid_credentials(self, client, admin_user):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "Admin@test.com", "password": "wrong-password"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAuthMe:
    def test_auth_me(self, client, admin_headers):
        response = client.get("/api/v1/auth/me", headers=admin_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "Admin@test.com"
        assert "ADMIN" in data["roles"]

    def test_auth_me_no_token(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
