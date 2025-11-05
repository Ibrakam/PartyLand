"""
Database operations using Django ORM
Replaces SQLite direct queries with Django models
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from decimal import Decimal

from django_setup import TelegramUser, TelegramAddress, Order, Product, Category
from django.db.models import Q


def now() -> datetime:
    """Get current datetime"""
    return datetime.now()


# TelegramUser operations
def get_user(telegram_id: int) -> Optional[TelegramUser]:
    """Get user by Telegram ID"""
    try:
        return TelegramUser.objects.get(telegram_id=telegram_id)
    except TelegramUser.DoesNotExist:
        return None


def get_or_create_user(telegram_id: int, **kwargs) -> TelegramUser:
    """Get or create user"""
    user, created = TelegramUser.objects.get_or_create(
        telegram_id=telegram_id,
        defaults=kwargs
    )
    return user


def update_user(telegram_id: int, **kwargs) -> TelegramUser:
    """Update user"""
    user = get_user(telegram_id)
    if not user:
        return get_or_create_user(telegram_id, **kwargs)
    
    for key, value in kwargs.items():
        setattr(user, key, value)
    user.save()
    return user


def set_user_language(telegram_id: int, language: str):
    """Set user language"""
    get_or_create_user(telegram_id, language=language)


def set_user_name_phone(telegram_id: int, name: str, phone: str):
    """Set user name and phone"""
    get_or_create_user(telegram_id, name=name, phone=phone)


def update_user_registration(telegram_id: int, name: str, phone: str):
    """Update or create user with name and phone"""
    user = get_user(telegram_id)
    if user:
        # Обновляем существующего пользователя
        user.name = name
        user.phone = phone
        user.save()
    else:
        # Создаем нового пользователя
        get_or_create_user(telegram_id, name=name, phone=phone)


def set_user_phone(telegram_id: int, phone: str):
    """Set user phone number"""
    user = get_user(telegram_id)
    if user:
        user.phone = phone
        user.save()
    else:
        # Если пользователь не существует, создаем его с телефоном
        get_or_create_user(telegram_id, phone=phone)


def set_user_admin(telegram_id: int, is_admin: bool):
    """Set user as admin"""
    user = get_user(telegram_id)
    if user:
        user.is_admin = is_admin
        user.save()


def is_admin(telegram_id: int) -> bool:
    """Check if user is admin"""
    user = get_user(telegram_id)
    return user.is_admin if user else False


def list_admin_ids() -> List[int]:
    """Get all admin user IDs"""
    return list(TelegramUser.objects.filter(is_admin=True).values_list('telegram_id', flat=True))


def get_lang(telegram_id: int) -> str:
    """Get user language"""
    user = get_user(telegram_id)
    return user.language if user and user.language else 'ru'


# Address operations
def add_user_address(telegram_id: int, address: str, latitude: Optional[float] = None, 
                     longitude: Optional[float] = None):
    """Add user address"""
    user = get_user(telegram_id)
    if user:
        TelegramAddress.objects.create(
            user=user,
            address=address,
            latitude=latitude,
            longitude=longitude
        )


def get_user_addresses(telegram_id: int) -> List[Dict]:
    """Get user addresses"""
    user = get_user(telegram_id)
    if not user:
        return []
    
    addresses = TelegramAddress.objects.filter(user=user).order_by('-created_at')
    return [
        {
            'id': addr.id,
            'address': addr.address,
            'latitude': addr.latitude,
            'longitude': addr.longitude,
            'created_at': addr.created_at
        }
        for addr in addresses
    ]


# Product operations (for temporary cart/orders in bot)
def get_product(product_id: int) -> Optional[Dict]:
    """Get product from Django"""
    try:
        product = Product.objects.get(pk=product_id)
        return {
            'id': product.pk,
            'name': product.title,
            'description': product.description,
            'price': float(product.price),
            'category': 'product',  # Simplified
            'image': product.image.url if product.image else None
        }
    except Product.DoesNotExist:
        return None


def list_products(category: Optional[str] = None) -> List[Dict]:
    """List products from Django"""
    products = Product.objects.select_related('category').all().order_by('-created_at')
    
    if category == 'set':
        # Filter by category if needed
        products = products.filter(category__name__icontains='set')
    elif category == 'product':
        products = products.exclude(category__name__icontains='set')
    
    return [
        {
            'id': p.pk,
            'name': p.title,
            'description': p.description,
            'price': float(p.price),
            'category': p.category.name if p.category else 'product',
            'image': p.image.url if p.image else None
        }
        for p in products
    ]


# Cart operations (using in-memory for now, can sync to Django later)
# These are kept for bot functionality
CART_STORAGE = {}  # In-memory cart: {user_id: {product_id: qty}}


def add_cart_item(telegram_id: int, product_id: int, qty: int = 1):
    """Add item to cart"""
    if telegram_id not in CART_STORAGE:
        CART_STORAGE[telegram_id] = {}
    
    if product_id in CART_STORAGE[telegram_id]:
        CART_STORAGE[telegram_id][product_id] += qty
    else:
        CART_STORAGE[telegram_id][product_id] = qty


def get_cart(telegram_id: int) -> List[tuple]:
    """Get cart items"""
    if telegram_id not in CART_STORAGE:
        return []
    
    cart_items = []
    for product_id, qty in CART_STORAGE[telegram_id].items():
        product = get_product(product_id)
        if product:
            cart_items.append((product, qty))
    return cart_items


def clear_cart(telegram_id: int):
    """Clear cart"""
    if telegram_id in CART_STORAGE:
        CART_STORAGE[telegram_id] = {}


def remove_cart_item(telegram_id: int, product_id: int):
    """Remove item from cart"""
    if telegram_id in CART_STORAGE:
        if product_id in CART_STORAGE[telegram_id]:
            del CART_STORAGE[telegram_id][product_id]


def cart_sum(telegram_id: int) -> int:
    """Calculate cart total"""
    items = get_cart(telegram_id)
    total = 0
    for product, qty in items:
        total += int(product['price']) * qty
    return total


# Order operations


def list_orders(telegram_id: int, limit: int = 5) -> List[Dict]:
    """Fetch recent orders for a Telegram user from Django"""
    orders = (
        Order.objects.filter(telegram_user__telegram_id=telegram_id)
        .prefetch_related('items__product', 'payments')
        .order_by('-created_at')[:limit]
    )
    result: List[Dict] = []
    for order in orders:
        order_items = []
        for cart_item in order.items.all():
            product = getattr(cart_item, 'product', None)
            order_items.append({
                'product_id': product.id if product else None,
                'name': product.title if product else 'Товар',
                'qty': cart_item.quantity,
                'price': float(product.price) if product else 0,
            })
        result.append({
            'order_id': order.id,
            'status': order.status,
            'sum': order.formatted_total,
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
            'delivery_time': order.delivery_time or '',
            'address': order.address or '',
            'items': order_items,
        })
    return result


def get_order_with_items(order_id: int) -> Optional[Dict]:
    try:
        order = Order.objects.prefetch_related('order_products__product', 'telegram_user').get(pk=order_id)
    except Order.DoesNotExist:
        return None
    items = []
    for order_product in order.order_products.all():
        product = order_product.product
        items.append({
            'product_id': product.id if product else None,
            'name': order_product.product_title or (product.title if product else 'Товар'),
            'qty': order_product.quantity,
            'price': float(order_product.price_uzs),
        })
    
    # Получаем имя и телефон - сначала из customer_name/customer_phone, потом из telegram_user
    user_name = order.customer_name or (order.telegram_user.name if order.telegram_user else '')
    phone = order.customer_phone or (order.telegram_user.phone if order.telegram_user else '')
    
    # Получаем координаты для локации
    latitude = order.latitude
    longitude = order.longitude
    
    return {
        'order_id': order.id,
        'address': order.address or '',
        'latitude': latitude,
        'longitude': longitude,
        'delivery_time': order.delivery_time or '',
        'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
        'items': items,
        'sum': order.formatted_total,
        'user_name': user_name or 'Не указано',
        'phone': phone or 'Не указано',
    }


def init_db():
    """Initialize - no longer needed with ORM"""
    pass
