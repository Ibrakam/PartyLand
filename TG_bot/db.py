import os
import sqlite3
from datetime import datetime
from typing import Optional, Any, List, Tuple, Dict

# Use Django's database - unified storage
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'Shop_site', 'db.sqlite3')

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.execute('PRAGMA foreign_keys = ON;')
conn.row_factory = sqlite3.Row


def now_str() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def _column_exists(table: str, column: str) -> bool:
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cur.fetchall()]
    return column in cols


def init_db():
    """Initialize bot-specific tables if they don't exist"""
    cur = conn.cursor()
    
    # Check if bot users table exists (different from Django's auth_user)
    cur.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='bot_users'
    """)
    if not cur.fetchone():
        # Create bot_users table (separate from Django TelegramUser)
        cur.execute(
            '''CREATE TABLE bot_users (
                user_id INTEGER PRIMARY KEY,
                name TEXT,
                phone TEXT,
                language TEXT,
                birthday TEXT,
                created_at TEXT,
                updated_at TEXT,
                is_admin INTEGER DEFAULT 0
            )'''
        )
        
        cur.execute(
            '''CREATE TABLE bot_addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                address TEXT,
                latitude REAL,
                longitude REAL,
                created_at TEXT,
                FOREIGN KEY(user_id) REFERENCES bot_users(user_id) ON DELETE CASCADE
            )'''
        )
        
        cur.execute(
            '''CREATE TABLE bot_cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_id INTEGER,
                qty INTEGER,
                UNIQUE(user_id, product_id)
            )'''
        )
        
        cur.execute(
            '''CREATE TABLE bot_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                address TEXT,
                latitude REAL,
                longitude REAL,
                sum INTEGER,
                delivery_time TEXT,
                created_at TEXT,
                FOREIGN KEY(user_id) REFERENCES bot_users(user_id) ON DELETE CASCADE
            )'''
        )
        
        cur.execute(
            '''CREATE TABLE bot_order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                product_id INTEGER,
                name TEXT,
                qty INTEGER,
                price INTEGER,
                FOREIGN KEY(order_id) REFERENCES bot_orders(id) ON DELETE CASCADE
            )'''
        )
        conn.commit()


# Users

def get_user(user_id: int) -> Optional[sqlite3.Row]:
    cur = conn.cursor()
    cur.execute('SELECT * FROM bot_users WHERE user_id=?', (user_id,))
    return cur.fetchone()


def set_user_language(user_id: int, lang: str):
    cur = conn.cursor()
    if get_user(user_id):
        cur.execute('UPDATE bot_users SET language=?, updated_at=? WHERE user_id=?', (lang, now_str(), user_id))
    else:
        cur.execute('INSERT INTO bot_users (user_id, language, created_at, updated_at, is_admin) VALUES (?, ?, ?, ?, 0)', (user_id, lang, now_str(), now_str()))
    conn.commit()


def update_user_registration(user_id: int, name: str, phone: str):
    cur = conn.cursor()
    if get_user(user_id):
        cur.execute('UPDATE bot_users SET name=?, phone=?, updated_at=? WHERE user_id=?', (name, phone, now_str(), user_id))
    else:
        cur.execute('INSERT INTO bot_users (user_id, name, phone, created_at, updated_at, is_admin) VALUES (?, ?, ?, ?, ?, 0)', (user_id, name, phone, now_str(), now_str()))
    conn.commit()


def set_user_phone(user_id: int, phone: str):
    cur = conn.cursor()
    cur.execute('UPDATE bot_users SET phone=?, updated_at=? WHERE user_id=?', (phone, now_str(), user_id))
    conn.commit()


def set_user_birthday(user_id: int, birthday: str):
    cur = conn.cursor()
    cur.execute('UPDATE bot_users SET birthday=?, updated_at=? WHERE user_id=?', (birthday, now_str(), user_id))
    conn.commit()


def set_user_admin(user_id: int, is_admin: bool):
    cur = conn.cursor()
    cur.execute('UPDATE bot_users SET is_admin=?, updated_at=? WHERE user_id=?', (1 if is_admin else 0, now_str(), user_id))
    if cur.rowcount == 0:
        cur.execute(
            'INSERT INTO bot_users (user_id, name, phone, language, birthday, created_at, updated_at, is_admin) '
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (
                user_id,
                '',
                '',
                'ru',
                None,
                now_str(),
                now_str(),
                1 if is_admin else 0,
            ),
        )
    conn.commit()


def is_admin(user_id: int) -> bool:
    u = get_user(user_id)
    return bool(u and u['is_admin'])


def list_admin_ids() -> List[int]:
    cur = conn.cursor()
    cur.execute('SELECT user_id FROM bot_users WHERE is_admin=1')
    rows = cur.fetchall()
    return [int(r['user_id']) for r in rows]


def get_lang(user_id: int) -> str:
    u = get_user(user_id)
    if u and u['language']:
        return u['language']
    return 'ru'


# Addresses

def add_user_address(user_id: int, address_text: str, lat: Optional[float], lon: Optional[float]):
    cur = conn.cursor()
    cur.execute('INSERT INTO bot_addresses (user_id, address, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?)', (user_id, address_text, lat, lon, now_str()))
    conn.commit()


# Products

def add_product(name: str, description: str, price: int, category: str, photo_file_id: Optional[str]) -> int:
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO products (name, description, price, category, photo_file_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        (name, description, price, category, photo_file_id, now_str())
    )
    conn.commit()
    return cur.lastrowid


def update_product_field(product_id: int, field: str, value: Any):
    if field not in {'name', 'description', 'price', 'category', 'photo_file_id'}:
        return
    cur = conn.cursor()
    cur.execute(f'UPDATE products SET {field}=? WHERE id=?', (value, product_id))
    conn.commit()


def delete_product(product_id: int):
    cur = conn.cursor()
    cur.execute('DELETE FROM products WHERE id=?', (product_id,))
    conn.commit()


def get_product(product_id: int) -> Optional[sqlite3.Row]:
    cur = conn.cursor()
    cur.execute('SELECT * FROM products WHERE id=?', (product_id,))
    return cur.fetchone()


def list_products(category: Optional[str] = None) -> List[sqlite3.Row]:
    cur = conn.cursor()
    if category:
        cur.execute('SELECT * FROM products WHERE category=? ORDER BY id DESC', (category,))
    else:
        cur.execute('SELECT * FROM products ORDER BY id DESC')
    return cur.fetchall()


# Cart

def add_cart_item(user_id: int, product_id: int, qty: int = 1):
    cur = conn.cursor()
    cur.execute('SELECT qty FROM bot_cart_items WHERE user_id=? AND product_id=?', (user_id, product_id))
    row = cur.fetchone()
    if row:
        new_qty = row['qty'] + qty
        cur.execute('UPDATE bot_cart_items SET qty=? WHERE user_id=? AND product_id=?', (new_qty, user_id, product_id))
    else:
        cur.execute('INSERT INTO bot_cart_items (user_id, product_id, qty) VALUES (?, ?, ?)', (user_id, product_id, qty))
    conn.commit()


def clear_cart(user_id: int):
    cur = conn.cursor()
    cur.execute('DELETE FROM bot_cart_items WHERE user_id=?', (user_id,))
    conn.commit()


def get_cart(user_id: int) -> List[Tuple[sqlite3.Row, int]]:
    cur = conn.cursor()
    cur.execute('SELECT c.product_id, c.qty, p.* FROM bot_bot_cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=?', (user_id,))
    rows = cur.fetchall()
    result: List[Tuple[sqlite3.Row, int]] = []
    for r in rows:
        result.append((r, r['qty']))
    return result


def cart_sum(user_id: int) -> int:
    items = get_cart(user_id)
    total = 0
    for prod_row, qty in items:
        total += int(prod_row['price']) * int(qty)
    return total


# Orders

def create_order(user_id: int, address_text: str, lat: Optional[float], lon: Optional[float], delivery_time: str) -> int:
    total = cart_sum(user_id)
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO bot_orders (user_id, address, latitude, longitude, sum, delivery_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (user_id, address_text, lat, lon, total, delivery_time, now_str())
    )
    order_id = cur.lastrowid
    items = get_cart(user_id)
    for prod_row, qty in items:
        cur.execute(
            'INSERT INTO bot_order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)',
            (order_id, prod_row['id'], prod_row['name'], qty, prod_row['price'])
        )
    conn.commit()
    clear_cart(user_id)
    return order_id


def list_orders(user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    cur = conn.cursor()
    cur.execute('SELECT * FROM bot_orders WHERE user_id=? ORDER BY id DESC LIMIT ?', (user_id, limit))
    orders = cur.fetchall()
    results: List[Dict[str, Any]] = []
    for o in orders:
        cur.execute('SELECT * FROM bot_order_items WHERE order_id=?', (o['id'],))
        items = cur.fetchall()
        results.append({'order': o, 'items': items})
    return results


def get_order_with_items(order_id: int) -> Optional[Dict[str, Any]]:
    cur = conn.cursor()
    cur.execute('SELECT * FROM bot_orders WHERE id=?', (order_id,))
    order = cur.fetchone()
    if not order:
        return None
    cur.execute('SELECT * FROM bot_order_items WHERE order_id=?', (order_id,))
    items = cur.fetchall()
    return {'order': order, 'items': items}
