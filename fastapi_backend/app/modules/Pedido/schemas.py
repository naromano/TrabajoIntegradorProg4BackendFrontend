from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime


class ItemPedidoRequest(SQLModel):
    """Un ítem dentro del request de creación de pedido."""
    producto_id: int = Field(gt=0)
    cantidad: int = Field(ge=1)
    personalizacion: Optional[List[int]] = None  


class DetallePedidoPublic(SQLModel):
    pedido_id: int
    producto_id: int
    cantidad: int
    nombre_snapshot: str
    precio_snapshot: float
    subtotal_snap: float
    personalizacion: Optional[List[int]]
    created_at: datetime


class HistorialEstadoPublic(SQLModel):
    id: int
    pedido_id: int
    estado_desde_codigo: Optional[str]
    estado_hacia_codigo: str
    usuario_id: Optional[int]
    motivo: Optional[str]
    created_at: datetime



class PedidoCreate(SQLModel):
    usuario_id: int = Field(gt=0)
    direccion_id: Optional[int] = Field(default=None, gt=0)
    forma_pago_codigo: str
    notas: Optional[str] = None
    items: List[ItemPedidoRequest] = Field(min_length=1)


class PedidoAvanzarEstado(SQLModel):
    estado_hacia_codigo: str
    motivo: Optional[str] = None
    usuario_id: Optional[int] = None  


class PedidoPublic(SQLModel):
    id: int
    usuario_id: int
    direccion_id: Optional[int]
    estado_codigo: str
    forma_pago_codigo: str
    subtotal: float
    descuento: float
    costo_envio: float
    total: float
    notas: Optional[str]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    detalles: List[DetallePedidoPublic] = []
    historial: List[HistorialEstadoPublic] = []
    usuario_nombre: Optional[str] = None
    direccion_texto: Optional[str] = None


class PedidoPublicSimple(SQLModel):
    """Para listados sin detalles ni historial."""
    id: int
    usuario_id: int
    usuario_nombre: Optional[str] = None
    direccion_id: Optional[int]
    estado_codigo: str
    forma_pago_codigo: str
    subtotal: float
    descuento: float
    costo_envio: float
    total: float
    notas: Optional[str]
    created_at: datetime
    updated_at: datetime


class PedidoList(SQLModel):
    data: List[PedidoPublicSimple]
    total: int


class CancelarPedidoRequest(SQLModel):
    """Request para cancelar un pedido."""
    motivo: str


class PedidoItemEstado(SQLModel):
    """Item simplificado para la vista de estado de pedido del frontend-store."""
    producto_id: int
    nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float


class PedidoEstadoPedido(SQLModel):
    """Schema para la vista de estado de pedido en frontend-store."""
    id: int
    fecha: str
    total: float
    estado: str
    usuario_id: int
    items: List[PedidoItemEstado] = []
    motivo_cancelacion: Optional[str] = None


class PedidoEstadoList(SQLModel):
    """Respuesta paginada para estado de pedidos."""
    data: List[PedidoEstadoPedido]
    total: int


class ValidarStockRequest(SQLModel):
    """Request para validar stock sin crear pedido."""
    items: List[ItemPedidoRequest] = Field(min_length=1)


class ValidarStockResponse(SQLModel):
    """Respuesta de validación de stock."""
    ok: bool
    detail: Optional[str] = None