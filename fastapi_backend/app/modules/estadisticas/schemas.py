from typing import List
from sqlmodel import SQLModel


class ResumenResponse(SQLModel):
    ventas_hoy: float
    ticket_promedio: float
    pedidos_activos: int
    mes_actual: float


class VentasPeriodoItem(SQLModel):
    periodo: str
    total_ventas: float
    cantidad_pedidos: int


class VentasPeriodoResponse(SQLModel):
    data: List[VentasPeriodoItem]
    total: int


class ProductoTopItem(SQLModel):
    producto_id: int
    nombre: str
    ingresos: float
    cantidad_vendida: int


class ProductoTopResponse(SQLModel):
    data: List[ProductoTopItem]
    total: int


class PedidosEstadoItem(SQLModel):
    estado_codigo: str
    cantidad: int


class PedidosEstadoResponse(SQLModel):
    data: List[PedidosEstadoItem]
    total: int


class IngresosFormaPagoItem(SQLModel):
    forma_pago_codigo: str
    total: float
    cantidad: int


class IngresosFormaPagoResponse(SQLModel):
    data: List[IngresosFormaPagoItem]
    total: int
