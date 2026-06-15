import asyncio
import json
import sys
sys.path.insert(0, '.')

import jwt
import os
import time

async def test_ws():
    from app.core.security import JWT_SECRET, JWT_ALGORITHM

    payload = {'sub': '8', 'email': 'cliente@test.com', 'role': 'CLIENTE'}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print(f'Token: {token}')

    import websockets

    ws_url = f'ws://localhost:8000/pedidos/ws?token={token}'
    print(f'Connecting to: {ws_url[:80]}...')

    try:
        ws = await asyncio.wait_for(websockets.connect(ws_url), timeout=5)
        print('Connected!')

        msg = await asyncio.wait_for(ws.recv(), timeout=5)
        print(f'Received: {msg}')

        await ws.send(json.dumps({'action': 'subscribe-order', 'order_id': 19}))
        print('Sent subscribe')

        msg = await asyncio.wait_for(ws.recv(), timeout=5)
        print(f'Received: {msg}')

        await ws.close()
        print('Done!')

    except asyncio.TimeoutError:
        print('TIMEOUT - No response from server')
    except Exception as e:
        print(f'Error: {type(e).__name__}: {e}')

asyncio.run(test_ws())
