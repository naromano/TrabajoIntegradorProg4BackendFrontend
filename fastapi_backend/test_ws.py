import asyncio
import json
import sys
sys.path.insert(0, '.')

from app.core.security import decode_access_token
import jwt
import os

JWT_SECRET = os.getenv('JWT_SECRET')
JWT_ALGORITHM = 'HS256'

payload = {'sub': '1', 'role': 'ADMIN'}
token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
print(f'Generated test token: {token}')

decoded = decode_access_token(token)
print(f'Decoded token: {decoded}')

WS_URL = "ws://localhost:8000/pedidos/ws"
print(f'\nWebSocket URL: {WS_URL}')
print(f'Token in query param: {WS_URL}?token={token[:20]}...')