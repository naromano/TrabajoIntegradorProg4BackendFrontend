from datetime import datetime, timezone
from sqlmodel import Session, select

from app.modules.categoria.models import Categoria
from app.modules.ingrediente.models import Ingrediente
from app.modules.producto.models import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.unidadMedida.models import UnidadMedida
from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.usuario.service import hash_password
from app.modules.DireccionEntrega.models import DireccionEntrega
from app.modules.Pedido.models import Pedido
from app.modules.DetallePedido.models import DetallePedido
from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido

def _now():
    return datetime.now(timezone.utc)


def seed_all_data(session: Session):
    _seed_categorias(session)
    _seed_ingredientes(session)
    _seed_productos(session)
    _seed_usuarios_prueba(session)
    _seed_pedidos(session)


def _seed_categorias(session: Session):
    categorias = [
        ("Pizzas Clásicas", "Las recetas tradicionales que nunca fallan"),
        ("Pizzas Especiales", "Combinaciones únicas para paladares exigentes"),
        ("Pizzas Premium", "Ingredientes seleccionados de primera calidad"),
        ("Bebidas", "Refrescos, aguas y cervezas artesanales"),
        ("Postres", "El toque dulce perfecto para cerrar tu comida"),
        ("Entradas", "Acompañamientos ideales para empezar"),
    ]

    for nombre, descripcion in categorias:
        exists = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
        if not exists:
            session.add(Categoria(nombre=nombre, descripcion=descripcion))

    session.commit()


def _seed_ingredientes(session: Session):
    um_pieza = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "pieza")).first()
    um_gramo = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "gramo")).first()
    um_ml = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "mililitro")).first()
    um_litro = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "litro")).first()
    um_kg = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "kilogramo")).first()

    ingredientes = [
        ("Masa fresca", "Masa artesanal preparada diariamente", 100.0, 200.0, um_pieza.id, False),
        ("Salsa de tomate", "Salsa casera con tomates frescos y albahaca", 50.0, 80.0, um_pieza.id, False),
        ("Queso mozzarella", "Mozzarella fresca de búfala italiana", 80.0, 12.0, um_gramo.id, False),
        ("Pepperoni", "Rodajas de pepperoni ahumado premium", 40.0, 15.0, um_gramo.id, False),
        ("Jamón cocido", "Jamón cocido natural en fetas finas", 35.0, 10.0, um_gramo.id, False),
        ("Champiñones", "Champiñones frescos fileteados", 30.0, 8.0, um_gramo.id, False),
        ("Cebolla", "Cebolla morada en aros finos", 25.0, 3.0, um_gramo.id, False),
        ("Pimiento verde", "Pimiento verde fresco en tiras", 25.0, 4.0, um_gramo.id, False),
        ("Aceitunas negras", "Aceitunas negras descarozadas", 20.0, 6.0, um_gramo.id, False),
        ("Albahaca fresca", "Hojas de albahaca fresca orgánica", 15.0, 8.0, um_gramo.id, False),
        ("Queso parmesano", "Parmesano reggiano rallado", 30.0, 20.0, um_gramo.id, False),
        ("Tomate cherry", "Tomates cherry maduros en mitades", 25.0, 5.0, um_gramo.id, False),
        ("Rúcula", "Rúcula fresca orgánica", 15.0, 7.0, um_gramo.id, False),
        ("Prosciutto", "Prosciutto di Parma en fetas finas", 25.0, 25.0, um_gramo.id, False),
        ("Anchoas", "Filetes de anchoas en aceite de oliva", 15.0, 15.0, um_gramo.id, False),
        ("Carne molida", "Carne de res molida sazonada", 50.0, 10.0, um_gramo.id, False),
        ("Tocino", "Tocino ahumado en tiras crocantes", 30.0, 12.0, um_gramo.id, False),
        ("Piña", "Piña natural en cubos pequeños", 25.0, 5.0, um_gramo.id, False),
        ("Queso cheddar", "Queso cheddar maduro rallado", 30.0, 14.0, um_gramo.id, False),
        ("Orégano", "Orégano seco importado de Grecia", 5.0, 4.0, um_gramo.id, False),
        ("Ajo", "Ajo fresco picado finamente", 10.0, 3.0, um_gramo.id, False),
        ("Salsa BBQ", "Salsa barbacoa ahumada artesanal", 20.0, 2.0, um_ml.id, False),
        ("Queso gorgonzola", "Queso gorgonzola DOP italiano", 25.0, 18.0, um_gramo.id, True),
        ("Queso fontina", "Queso fontina suave del Valle de Aosta", 25.0, 15.0, um_gramo.id, False),
        ("Huevo", "Huevo fresco de campo", 15.0, 100.0, um_pieza.id, False),
        ("Pollo", "Pechuga de pollo grillada en tiras", 40.0, 9.0, um_gramo.id, False),
        ("Palmitos", "Palmitos frescos en rodajas", 20.0, 10.0, um_gramo.id, False),
        ("Morrón asado", "Morrón rojo asado pelado en tiras", 20.0, 6.0, um_gramo.id, False),
        ("Mascarpone", "Queso mascarpone cremoso italiano", 20.0, 16.0, um_gramo.id, False),
        ("Café espresso", "Café espresso italiano intenso", 50.0, 30.0, um_ml.id, False),
        ("Cacao en polvo", "Cacao amargo en polvo sin azúcar", 50.0, 10.0, um_gramo.id, False),
        ("Vainilla", "Esencia de vainilla natural de Madagascar", 30.0, 15.0, um_ml.id, False),
        ("Helado de crema", "Helado artesanal de crema americana", 30.0, 8.0, um_gramo.id, False),
        ("Chocolate", "Chocolate semi-amargo 70% cacao", 30.0, 12.0, um_gramo.id, False),
        ("Nueces", "Nueces pecanas tostadas", 20.0, 20.0, um_gramo.id, False),
        ("Pan de ajo", "Pan ciabatta con manteca de ajo y perejil", 40.0, 50.0, um_pieza.id, False),
        ("Limón", "Limones frescos orgánicos", 60.0, 30.0, um_pieza.id, False),
        ("Azúcar", "Azúcar orgánica de caña", 100.0, 3.0, um_gramo.id, False),
        ("Menta", "Hojas de menta fresca", 30.0, 5.0, um_gramo.id, False),
        ("Miel", "Miel pura de abeja orgánica", 30.0, 12.0, um_ml.id, False),
    ]

    for nombre, desc, stock, costo, um_id, alergeno in ingredientes:
        exists = session.exec(select(Ingrediente).where(Ingrediente.nombre == nombre)).first()
        if not exists:
            session.add(Ingrediente(
                nombre=nombre,
                descripcion=desc,
                stock_cantidad=stock,
                costo=costo,
                unidad_medida_id=um_id,
                es_alergeno=alergeno,
            ))

    session.commit()


def _seed_productos(session: Session):
    masa = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Masa fresca")).first()
    salsa_tomate = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Salsa de tomate")).first()
    mozzarella = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Queso mozzarella")).first()
    pepperoni = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Pepperoni")).first()
    jamon = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Jamón cocido")).first()
    champi = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Champiñones")).first()
    cebolla = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Cebolla")).first()
    pimiento = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Pimiento verde")).first()
    aceitunas = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Aceitunas negras")).first()
    albahaca = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Albahaca fresca")).first()
    parmesano = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Queso parmesano")).first()
    tomate_cherry = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Tomate cherry")).first()
    rucula = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Rúcula")).first()
    prosciutto = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Prosciutto")).first()
    anchoas = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Anchoas")).first()
    carne = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Carne molida")).first()
    tocino = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Tocino")).first()
    pina = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Piña")).first()
    cheddar = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Queso cheddar")).first()
    oregano = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Orégano")).first()
    ajo = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Ajo")).first()
    salsa_bbq = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Salsa BBQ")).first()
    gorgonzola = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Queso gorgonzola")).first()
    fontina = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Queso fontina")).first()
    huevo = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Huevo")).first()
    pollo = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Pollo")).first()
    palmitos = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Palmitos")).first()
    morron = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Morrón asado")).first()
    mascarpone = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Mascarpone")).first()
    cafe = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Café espresso")).first()
    cacao = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Cacao en polvo")).first()
    vainilla = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Vainilla")).first()
    helado = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Helado de crema")).first()
    chocolate = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Chocolate")).first()
    nueces = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Nueces")).first()
    pan_ajo = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Pan de ajo")).first()
    limon = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Limón")).first()
    azucar = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Azúcar")).first()
    menta = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Menta")).first()
    miel = session.exec(select(Ingrediente).where(Ingrediente.nombre == "Miel")).first()

    um_pieza = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "pieza")).first()
    um_gramo = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "gramo")).first()
    um_ml = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "mililitro")).first()
    um_litro = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == "litro")).first()

    cat_clasicas = session.exec(select(Categoria).where(Categoria.nombre == "Pizzas Clásicas")).first()
    cat_especiales = session.exec(select(Categoria).where(Categoria.nombre == "Pizzas Especiales")).first()
    cat_premium = session.exec(select(Categoria).where(Categoria.nombre == "Pizzas Premium")).first()
    cat_bebidas = session.exec(select(Categoria).where(Categoria.nombre == "Bebidas")).first()
    cat_postres = session.exec(select(Categoria).where(Categoria.nombre == "Postres")).first()
    cat_entradas = session.exec(select(Categoria).where(Categoria.nombre == "Entradas")).first()

    productos_data = [
        {
            "nombre": "Pizza Margherita",
            "descripcion": "La clásica italiana con salsa de tomate, mozzarella fresca, albahaca y un toque de aceite de oliva extra virgen. Simple, auténtica y deliciosa.",
            "precio_base": 1100.00,
            "categorias": [(cat_clasicas.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 120, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (albahaca.id, 10, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Pepperoni",
            "descripcion": "Cargada de pepperoni ahumado sobre una cama generosa de queso mozzarella derretido. La favorita de todos los tiempos.",
            "precio_base": 1300.00,
            "categorias": [(cat_clasicas.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 120, um_gramo.id, False),
                (mozzarella.id, 220, um_gramo.id, False),
                (pepperoni.id, 100, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Napolitana",
            "descripcion": "Masa delgada y crujiente con salsa de tomate fresca, mozzarella derretida y rodajas de tomate natural. Un homenaje a Nápoles.",
            "precio_base": 1500.00,
            "categorias": [(cat_clasicas.id, True), (cat_premium.id, False)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 150, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (tomate_cherry.id, 80, um_gramo.id, False),
                (albahaca.id, 15, um_gramo.id, False),
                (ajo.id, 5, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Hawaiana",
            "descripcion": "La polémica pero irresistible combinación de jamón cocido y piña natural sobre queso mozzarella fundido. Dulce y salada a la vez.",
            "precio_base": 1400.00,
            "categorias": [(cat_especiales.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 100, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (jamon.id, 80, um_gramo.id, False),
                (pina.id, 60, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Cuatro Quesos",
            "descripcion": "Mozzarella, gorgonzola, parmesano y fontina se funden en una sinfonía de sabores. Para los verdaderos amantes del queso.",
            "precio_base": 1600.00,
            "categorias": [(cat_especiales.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (mozzarella.id, 150, um_gramo.id, False),
                (gorgonzola.id, 60, um_gramo.id, False),
                (parmesano.id, 50, um_gramo.id, False),
                (fontina.id, 60, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Supreme",
            "descripcion": "La pizza completa: pepperoni, carne molida, champiñones, cebolla y pimiento verde. Una explosión de sabores en cada bocado.",
            "precio_base": 1550.00,
            "categorias": [(cat_especiales.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 120, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (pepperoni.id, 60, um_gramo.id, False),
                (carne.id, 60, um_gramo.id, False),
                (champi.id, 50, um_gramo.id, False),
                (cebolla.id, 40, um_gramo.id, False),
                (pimiento.id, 40, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza BBQ Chicken",
            "descripcion": "Base de salsa barbacoa con pollo grillado, cebolla morada y queso cheddar. Una versión audaz y deliciosa.",
            "precio_base": 1450.00,
            "categorias": [(cat_especiales.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_bbq.id, 80, um_ml.id, False),
                (cheddar.id, 150, um_gramo.id, False),
                (mozzarella.id, 100, um_gramo.id, False),
                (pollo.id, 100, um_gramo.id, False),
                (cebolla.id, 40, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Prosciutto",
            "descripcion": "Prosciutto di Parma, rúcula fresca y parmesano sobre mozzarella. La combinación italiana más elegante.",
            "precio_base": 1700.00,
            "categorias": [(cat_premium.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 100, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (prosciutto.id, 70, um_gramo.id, False),
                (rucula.id, 20, um_gramo.id, False),
                (parmesano.id, 30, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Vegetariana",
            "descripcion": "Cargada de vegetales frescos: champiñones, pimiento, cebolla, aceitunas y tomate cherry. Sana y deliciosa.",
            "precio_base": 1350.00,
            "categorias": [(cat_especiales.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 120, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (champi.id, 50, um_gramo.id, False),
                (pimiento.id, 40, um_gramo.id, False),
                (cebolla.id, 30, um_gramo.id, False),
                (aceitunas.id, 30, um_gramo.id, False),
                (tomate_cherry.id, 50, um_gramo.id, False),
                (oregano.id, 3, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Carnívora",
            "descripcion": "Para los amantes de la carne: pepperoni, jamón, tocino y carne molida sobre mozzarella. Pura proteína.",
            "precio_base": 1650.00,
            "categorias": [(cat_especiales.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 100, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (pepperoni.id, 60, um_gramo.id, False),
                (jamon.id, 50, um_gramo.id, False),
                (tocino.id, 50, um_gramo.id, False),
                (carne.id, 50, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza de Anchoas",
            "descripcion": "Una pizza de sabor intenso con anchoas, aceitunas negras, ajo y orégano. Para paladares aventureros.",
            "precio_base": 1400.00,
            "categorias": [(cat_especiales.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (salsa_tomate.id, 100, um_gramo.id, False),
                (mozzarella.id, 200, um_gramo.id, False),
                (anchoas.id, 40, um_gramo.id, False),
                (aceitunas.id, 30, um_gramo.id, False),
                (ajo.id, 5, um_gramo.id, False),
                (oregano.id, 3, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Pizza Caprese",
            "descripcion": "Inspirada en la ensalada italiana: tomate cherry, mozzarella de búfala, albahaca fresca y reducción de aceto. Fresca y liviana.",
            "precio_base": 1500.00,
            "categorias": [(cat_premium.id, True)],
            "ingredientes": [
                (masa.id, 1, um_pieza.id, False),
                (mozzarella.id, 220, um_gramo.id, False),
                (tomate_cherry.id, 100, um_gramo.id, False),
                (albahaca.id, 20, um_gramo.id, False),
                (parmesano.id, 20, um_gramo.id, False),
            ],
        },
        {
            "nombre": "Coca-Cola 500ml",
            "descripcion": "Refrescante bebida cola sabor original, ideal para acompañar tu pizza.",
            "precio_base": 400.00,
            "stock_cantidad": 100,
            "categorias": [(cat_bebidas.id, True)],
            "ingredientes": [],
        },
        {
            "nombre": "Agua Mineral 500ml",
            "descripcion": "Agua mineral natural sin gas, pura y refrescante.",
            "precio_base": 300.00,
            "stock_cantidad": 100,
            "categorias": [(cat_bebidas.id, True)],
            "ingredientes": [],
        },
        {
            "nombre": "Cerveza Artesanal IPA",
            "descripcion": "Cerveza artesanal estilo IPA con notas cítricas y lupuladas. Amargor balanceado.",
            "precio_base": 600.00,
            "stock_cantidad": 50,
            "categorias": [(cat_bebidas.id, True)],
            "ingredientes": [],
        },
        {
            "nombre": "Limonada Natural",
            "descripcion": "Limonada casera con jugo de limón natural, azúcar orgánica y hojas de menta fresca.",
            "precio_base": 450.00,
            "stock_cantidad": 60,
            "categorias": [(cat_bebidas.id, True)],
            "ingredientes": [],
        },
        {
            "nombre": "Tiramisú",
            "descripcion": "El clásico postre italiano: capas de mascarpone, café espresso y cacao en polvo. Irresistible.",
            "precio_base": 800.00,
            "stock_cantidad": 30,
            "categorias": [(cat_postres.id, True)],
            "ingredientes": [],
        },
        {
            "nombre": "Brownie con Helado",
            "descripcion": "Brownie de chocolate caliente con helado de crema, salsa de chocolate y nueces tostadas.",
            "precio_base": 750.00,
            "stock_cantidad": 25,
            "categorias": [(cat_postres.id, True)],
            "ingredientes": [],
        },
        {
            "nombre": "Pan de Ajo",
            "descripcion": "Pan ciabatta tostado con manteca de ajo, perejil y un toque de parmesano. Crujiente y aromático.",
            "precio_base": 500.00,
            "stock_cantidad": 40,
            "categorias": [(cat_entradas.id, True)],
            "ingredientes": [],
        },
        {
            "nombre": "Bastones de Mozzarella",
            "descripcion": "Bastones de queso mozzarella rebozados y fritos, servidos con salsa de tomate fresca. 6 unidades.",
            "precio_base": 650.00,
            "stock_cantidad": 40,
            "categorias": [(cat_entradas.id, True)],
            "ingredientes": [],
        },
    ]

    for pd in productos_data:
        exists = session.exec(select(Producto).where(Producto.nombre == pd["nombre"])).first()
        if exists:
            continue

        producto = Producto(
            nombre=pd["nombre"],
            descripcion=pd["descripcion"],
            precio_base=pd["precio_base"],
            stock_cantidad=pd.get("stock_cantidad", 0),
        )
        session.add(producto)
        session.flush()

        for cat_id, es_principal in pd["categorias"]:
            session.add(ProductoCategoria(
                producto_id=producto.id,
                categoria_id=cat_id,
                es_principal=es_principal,
            ))

        for ing_id, cant, um_id, removible in pd["ingredientes"]:
            session.add(ProductoIngrediente(
                producto_id=producto.id,
                ingrediente_id=ing_id,
                cantidad=cant,
                unidad_medida_id=um_id,
                es_removible=removible,
            ))

    session.commit()


def _seed_usuarios_prueba(session: Session):
    usuarios = [
        ("Cliente", "Prueba", "cliente@test.com", "password123", ["CLIENTE"]),
        ("Stock", "Prueba", "stock@test.com", "password123", ["STOCK"]),
        ("Pedidos", "Prueba", "pedidos@test.com", "password123", ["PEDIDOS"]),
    ]

    for nombre, apellido, email, password, roles in usuarios:
        exists = session.exec(select(Usuario).where(Usuario.email == email)).first()
        if exists:
            continue

        usuario = Usuario(
            nombre=nombre,
            apellido=apellido,
            email=email,
            password_hash=hash_password(password),
            celular="2615550000",
        )
        session.add(usuario)
        session.flush()

        for rol_codigo in roles:
            session.add(UsuarioRol(
                usuario_id=usuario.id,
                rol_codigo=rol_codigo,
            ))

    session.commit()


def _seed_pedidos(session: Session):
    cliente = session.exec(select(Usuario).where(Usuario.email == "cliente@test.com")).first()
    if not cliente:
        return

    dir_exists = session.exec(select(DireccionEntrega).where(DireccionEntrega.usuario_id == cliente.id)).first()
    if not dir_exists:
        direcciones = [
            ("Casa", "Calle San Martín 1234", "Mendoza", "Mendoza", "5500"),
            ("Trabajo", "Av. Las Heras 567", "Mendoza", "Mendoza", "5500"),
        ]
        for alias, linea1, ciudad, provincia, cp in direcciones:
            session.add(DireccionEntrega(
                usuario_id=cliente.id,
                alias=alias,
                linea1=linea1,
                ciudad=ciudad,
                provincia=provincia,
                codigo_postal=cp,
                es_principal=(alias == "Casa"),
            ))
        session.commit()

    direccion_casa = session.exec(
        select(DireccionEntrega).where(
            DireccionEntrega.usuario_id == cliente.id,
            DireccionEntrega.alias == "Casa",
        )
    ).first()

    productos = session.exec(select(Producto)).all()
    if not productos:
        session.commit()
        return

    pedidos_exist = session.exec(select(Pedido).where(Pedido.usuario_id == cliente.id)).first()
    if pedidos_exist:
        session.commit()
        return

    def create_pedido(estado, forma_pago, items, notas=""):
        subtotal = sum(p.precio_base * cant for p, cant in items)
        costo_envio = 50.00 if estado != "ENTREGADO" else 50.00
        descuento = 0.00
        total = subtotal + costo_envio - descuento

        pedido = Pedido(
            usuario_id=cliente.id,
            direccion_id=direccion_casa.id,
            estado_codigo=estado,
            forma_pago_codigo=forma_pago,
            subtotal=subtotal,
            descuento=descuento,
            costo_envio=costo_envio,
            total=total,
            notas=notas,
        )
        session.add(pedido)
        session.flush()

        for prod, cant in items:
            session.add(DetallePedido(
                pedido_id=pedido.id,
                producto_id=prod.id,
                cantidad=cant,
                nombre_snapshot=prod.nombre,
                precio_snapshot=prod.precio_base,
                subtotal_snap=prod.precio_base * cant,
            ))

        estado_orden = {"PENDIENTE": 1, "CONFIRMADO": 2, "EN_PREP": 3, "ENTREGADO": 4}
        pasos = ["PENDIENTE", "CONFIRMADO", "EN_PREP", "ENTREGADO"]
        orden_final = estado_orden.get(estado, 1)

        for i, codigo in enumerate(pasos):
            if i + 1 > orden_final:
                break
            desde = None if i == 0 else pasos[i - 1]
            session.add(HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde_codigo=desde,
                estado_hacia_codigo=codigo,
                usuario_id=cliente.id,
            ))

    create_pedido("ENTREGADO", "EFECTIVO", [
        (productos[0], 2),
        (productos[12], 2),
    ], "Sin cebolla por favor")

    create_pedido("ENTREGADO", "MERCADOPAGO", [
        (productos[3], 1),
        (productos[19], 1),
        (productos[13], 1),
    ], "Dejar en la puerta")

    create_pedido("PENDIENTE", "TRANSFERENCIA", [
        (productos[4], 1),
        (productos[16], 1),
    ])

    create_pedido("EN_PREP", "MERCADOPAGO", [
        (productos[1], 1),
        (productos[5], 1),
        (productos[12], 1),
        (productos[14], 1),
    ], "Masa fina si es posible")

    session.commit()
