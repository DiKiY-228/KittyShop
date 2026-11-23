import os
import sqlite3
import hashlib
from fastapi import FastAPI, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Kittyshop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = os.getenv("DB_NAME", "data/database.db")
SECRET_SALT = os.getenv("SECRET_SALT", "kittyshop_default_salt")


def get_password_hash(password: str) -> str:
    """Хеширование пароля методом SHA-256 с солью из переменной окружения"""
    salted_password = password + SECRET_SALT
    return hashlib.sha256(salted_password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка соответствия введённого пароля его хешу"""
    return get_password_hash(plain_password) == hashed_password


def init_db():
    """Создание таблиц, начальное наполнение каталога и тестовой учетной записи"""
    db_dir = os.path.dirname(DB_NAME)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                image_url TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        """)

        cursor.execute("SELECT id FROM users WHERE username = ?", ("test_user",))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                ("test_user", get_password_hash("test1234"))
            )

        cursor.execute("SELECT COUNT(*) FROM products")
        count = cursor.fetchone()

        if count < 15:
            cursor.execute("DELETE FROM products")
            products_data = [
                ('Увлажняющая сыворотка с гиалуроновой кислотой', 'Для сухой кожи', 650.0, 'images/serum_hyaluronic.jpg'),
                ('Очищающая пенка для умывания с AHA-кислотами', 'Для жирной кожи', 700.0, 'images/foam_aha.jpg'),
                ('Успокаивающий тонер с центеллой азиатской', 'Для чувствительной кожи', 750.0, 'images/toner_centella.jpg'),
                ('Питательный крем для лица с керамидами', 'Для сухой кожи', 800.0, 'images/cream_ceramide.jpg'),
                ('Матирующая глиняная маска против пор', 'Для жирной кожи', 850.0, 'images/mask_clay.jpg'),
                ('Восстанавливающий крем для защиты барьера кожи', 'Для чувствительной кожи', 900.0, 'images/cream_barrier.jpg'),
                ('Гидрофильное масло для бережного демакияжа', 'Для сухой кожи', 950.0, 'images/oil_cleansing.jpg'),
                ('Себорегулирующая сыворотка с ниацинамидом и цинком', 'Для жирной кожи', 1000.0, 'images/serum_zinc.jpg'),
                ('Эссенция с муцином улитки для регенерации', 'Для чувствительной кожи', 1050.0, 'images/essence_snail.jpg'),
                ('Ночная маска для глубокого экстремального увлажнения', 'Для сухой кожи', 1100.0, 'images/mask_night.jpg'),
                ('Отшелушивающий гель-пилинг скатка для сияния', 'Для жирной кожи', 1150.0, 'images/peeling_gel.jpg'),
                ('Солнцезащитный крем SPF50+ для чувствительной кожи', 'Для чувствительной кожи', 1200.0, 'images/sunscreen_spf.jpg'),
                ('Энзимная пудра для нежного отшелушивания', 'Для всех типов кожи', 550.0, 'images/enzyme_powder.jpg'),
                ('Лифтинг-крем вокруг глаз с пептидами', 'Для возрастной кожи', 1350.0, 'images/eye_cream.jpg'),
                ('Тканевая маска с экстрактом зеленого чая', 'Для проблемной кожи', 120.0, 'images/sheet_mask.jpg'),
                ('Точечный гель против воспалений и акне', 'Для проблемной кожи', 480.0, 'images/spot_gel.jpg')
            ]
            cursor.executemany(
                "INSERT INTO products (title, description, price, image_url) VALUES (?, ?, ?, ?)",
                products_data
            )

        conn.commit()


init_db()


class UserAuth(BaseModel):
    username: str
    password: str


class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1


@app.get("/api/products")
def get_products():
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products")
        return [dict(row) for row in cursor.fetchall()]


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Товар не найден")
        return dict(row)


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user: UserAuth):
    if len(user.username.strip()) < 3 or len(user.password) < 4:
        raise HTTPException(status_code=400, detail="Логин должен быть от 3 символов, пароль — от 4")

    hashed_password = get_password_hash(user.password)
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (user.username.strip(), hashed_password)
            )
            conn.commit()
        return {"message": "Вы успешно зарегистрировались в Китти Шоп!"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Этот логин уже занят")


@app.post("/api/login")
def login(user: UserAuth):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
        db_user = cursor.fetchone()

    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    return {
        "message": "Успешный вход",
        "user_id": db_user["id"],
        "username": db_user["username"]
    }


@app.post("/api/cart", status_code=status.HTTP_201_CREATED)
def add_to_cart(item: CartItemAdd, user_id: int = Header(...)):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=401, detail="Пользователь не найден")

        cursor.execute("SELECT id FROM products WHERE id = ?", (item.product_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Товар не найден")

        cursor.execute(
            "SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?",
            (user_id, item.product_id)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                "UPDATE cart SET quantity = ? WHERE id = ?",
                (existing + item.quantity, existing)
            )
        else:
            cursor.execute(
                "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
                (user_id, item.product_id, item.quantity)
            )
        conn.commit()
    return {"message": "Товар добавлен в корзину"}


@app.get("/api/cart")
def get_cart(user_id: int = Header(...)):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=401, detail="Пользователь не авторизован")

        cursor.execute("""
            SELECT cart.id AS cart_id, cart.quantity,
                   products.id AS product_id, products.title, products.price, products.image_url
            FROM cart
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = ?
        """, (user_id,))
        return [dict(row) for row in cursor.fetchall()]


app.mount("/", StaticFiles(directory=".", html=True), name="static")
