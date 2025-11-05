"""
Django setup for Telegram Bot
Initializes Django so we can use ORM
"""
import os
import sys

# Add Shop_site to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, 'Shop_site'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'site_proj.settings')

import django
django.setup()

# Now we can import Django models
from site_app.models import (
    Category,
    Product,
    TelegramUser,
    TelegramAddress,
    Order,
    Payment,
    PaymentProof,
    OrderStatusHistory,
)

__all__ = ['Category', 'Product', 'TelegramUser', 'TelegramAddress', 'Order', 'Payment', 'PaymentProof', 'OrderStatusHistory']
