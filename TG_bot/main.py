# Telegram Food Delivery Bot (BiotactBot-like)
# Framework: pyTelegramBotAPI (telebot)
# Storage: SQLite3 (db.py)
# Keyboards/Localization: keyboards.py
#
# Configure environment variables before running:
#   BOT_TOKEN=<your_telegram_bot_token>
#   ADMIN_PASSWORD=<password_to_become_admin>
#
# Run:  python main.py

import os
import re
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple

import requests

import telebot
from telebot import types

# Ensure Django settings are loaded for ORM access
import django_setup  # noqa: F401  # side effect: configures Django
import db_orm as db  # Using Django ORM
import keyboards as kb
from api_client import api_client

MEDIA_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Shop_site', 'media'))

ADMIN_PASSWORD = ("admin123")

bot = telebot.TeleBot("8410888338:AAGyfpRLL8j4r7nQivMY-sURGReuDpZtNEY", parse_mode='HTML')

# In-memory user states
STATE: Dict[int, Dict[str, Any]] = {}


# Localization helpers

def get_tr(user_id: int) -> Dict[str, str]:
    lang = db.get_lang(user_id)
    return kb.LANG.get(lang, kb.LANG['ru'])


def t(user_id: int, key: str) -> str:
    return get_tr(user_id).get(key, key)


# State management

def get_state(user_id: int) -> Dict[str, Any]:
    return STATE.setdefault(user_id, {'step': None, 'data': {}})


def set_state(user_id: int, step: Optional[str], data_update: Optional[Dict[str, Any]] = None):
    st = get_state(user_id)
    st['step'] = step
    if data_update:
        st['data'].update(data_update)


def clear_state(user_id: int):
    if user_id in STATE:
        pending_raw = STATE[user_id]['data'].get('pending_orders') if 'data' in STATE[user_id] else {}
        submitted_raw = STATE[user_id]['data'].get('submitted_proof_ids') if 'data' in STATE[user_id] else []
        pending = dict(pending_raw) if pending_raw else {}
        submitted = list(submitted_raw) if submitted_raw else []
        STATE[user_id] = {'step': None, 'data': {}}
        if pending:
            STATE[user_id]['data']['pending_orders'] = pending
        if submitted:
            STATE[user_id]['data']['submitted_proof_ids'] = submitted


# Message formatting

def format_cart(user_id: int) -> str:
    items = db.get_cart(user_id)
    tr = get_tr(user_id)
    if not items:
        return tr['cart_empty']
    
    # Формат как на скриншоте: название - количество - цена
    lines = [f"<b>{tr['your_cart']}</b>"]
    for product, qty in items:
        product_name = product.get('name') or product.get('title') or 'Товар'
        price = int(product.get('price', 0)) * qty
        # Форматируем цену с пробелами для тысяч
        price_str = f"{price:,}".replace(",", " ")
        lines.append(f"{product_name} - {qty} шт. - {price_str} сум")
    
    total = db.cart_sum(user_id)
    total_str = f"{total:,}".replace(",", " ")
    lines.append(f"\n<b>Итого: {total_str} сум</b>")
    return '\n'.join(lines)


def format_orders(user_id: int) -> str:
    tr = get_tr(user_id)
    orders = db.list_orders(user_id, limit=5)
    if not orders:
        return tr['orders_none']
    lines = []
    for order in orders:
        status_key = f"status_{order.get('status', '')}"
        status_label = tr.get(status_key, order.get('status', ''))
        lines.append(f"📦 <b>Заказ #{order['order_id']}</b> — {status_label}")
        lines.append(f"{tr['order_created_label']} {order.get('created_at', '')}")
        if order.get('address'):
            lines.append(f"{tr['order_address_label']} {order['address']}")
        if order.get('delivery_time'):
            lines.append(f"{tr['order_delivery_label']} {order['delivery_time']}")
        lines.append(f"{tr['order_total_label']} {order.get('sum', '')}")
        if order.get('items'):
            for it in order['items']:
                lines.append(f"• {it['name']} x{it['qty']}")
        lines.append('')
    return '\n'.join(lines).strip()


def format_order_for_admin(admin_id: int, order_id: int) -> Optional[Dict]:
    """
    Форматирует данные заказа для админа.
    Возвращает словарь с текстом сообщения и опциональной локацией.
    """
    order_data = db.get_order_with_items(order_id)
    if not order_data:
        return None
    
    lines = [
        f"🔔 <b>Новый заказ #{order_data['order_id']}</b>",
        f"👤 Клиент: {order_data['user_name']}",
        f"📞 Телефон: {order_data['phone']}",
    ]
    
    # Форматируем адрес - если есть координаты, отправляем как локацию
    address = order_data['address']
    latitude = order_data.get('latitude')
    longitude = order_data.get('longitude')
    
    # Проверяем, является ли адрес координатами (geo: lat,lon)
    if address and address.startswith('geo:'):
        try:
            # Парсим координаты из формата "geo: lat,lon"
            coords = address.replace('geo:', '').strip().split(',')
            if len(coords) == 2:
                lat = float(coords[0].strip())
                lon = float(coords[1].strip())
                latitude = lat
                longitude = lon
                lines.append(f"📍 Адрес: Координаты ({lat:.6f}, {lon:.6f})")
            else:
                lines.append(f"📍 Адрес: {address}")
        except (ValueError, IndexError):
            lines.append(f"📍 Адрес: {address}")
    elif address:
        lines.append(f"📍 Адрес: {address}")
    else:
        lines.append("📍 Адрес: Не указан")
    
    lines.extend([
        f"⏰ Время доставки: {order_data['delivery_time']}",
        f"🗓 Создан: {order_data['created_at']}",
        "",
        "🧾 Состав заказа:",
    ])
    
    for it in order_data['items']:
        lines.append(f"• {it['name']} x{it['qty']} — {int(it['price']) * it['qty']} сум")
    
    lines.append("")
    lines.append(f"💰 Итого: <b>{order_data['sum']} сум</b>")
    
    return {
        'text': '\n'.join(lines),
        'latitude': latitude,
        'longitude': longitude,
    }


UZ_TZ = timezone(timedelta(hours=5))


def normalize_description(desc: str) -> str:
    if not desc:
        return ''
    text = desc.replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')
    text = text.replace('&nbsp;', ' ')
    text = re.sub(r'</?p>', '\n', text)
    text = re.sub(r'</?strong>', '', text)
    text = re.sub(r'</?em>', '', text)
    text = re.sub(r'</?span[^>]*>', '', text)
    text = re.sub(r'</?div[^>]*>', '\n', text)
    text = re.sub(r'</?ul[^>]*>', '', text)
    text = re.sub(r'</?ol[^>]*>', '', text)
    text = re.sub(r'<li[^>]*>', '\n• ', text)
    text = re.sub(r'<[^>]+>', '', text)
    lines = [line.rstrip() for line in text.splitlines()]
    cleaned = "\n".join(line for line in lines if line.strip())
    return cleaned.strip()


def resolve_local_media_path(raw: Optional[str]) -> Optional[str]:
    """Извлекает локальный путь к файлу из URL или относительного пути"""
    if not raw:
        return None
    
    raw = raw.strip()
    
    # Если это полный URL, извлекаем относительный путь
    if raw.startswith('http://') or raw.startswith('https://'):
        # Извлекаем путь после домена
        # Например: http://localhost:8000/media/products/IMG_0829.PNG -> media/products/IMG_0829.PNG
        try:
            from urllib.parse import urlparse
            parsed = urlparse(raw)
            path = parsed.path.lstrip('/')
            # Убираем префикс media/ если он дублируется
            if path.startswith('media/media/'):
                path = path.replace('media/media/', 'media/')
            elif not path.startswith('media/'):
                # Если путь начинается с products/ или categories/, добавляем media/
                if path.startswith('products/') or path.startswith('categories/'):
                    path = f'media/{path}'
        except Exception:
            return None
    else:
        # Это уже относительный путь
        path = raw.lstrip('/')
        # Убираем префикс media/ если он дублируется
        if path.startswith('media/media/'):
            path = path.replace('media/media/', 'media/')
        elif not path.startswith('media/'):
            # Если путь начинается с products/ или categories/, добавляем media/
            if path.startswith('products/') or path.startswith('categories/'):
                path = f'media/{path}'
    
    # Убираем префикс media/ из пути, так как MEDIA_ROOT уже указывает на папку media
    if path.startswith('media/'):
        path = path[len('media/'):]
    
    # Формируем полный путь к файлу
    full_path = os.path.join(MEDIA_ROOT, path)
    
    # Проверяем существование файла
    if os.path.exists(full_path):
        return full_path
    
    return None


def extract_image_url(raw: Optional[str], base_url: str) -> Optional[str]:
    if not raw:
        return None
    raw = raw.strip()
    if raw.startswith('http://') or raw.startswith('https://'):
        return raw
    # Если путь не начинается с /media/, добавляем его
    raw = raw.lstrip('/')
    if not raw.startswith('media/'):
        if raw.startswith('products/') or raw.startswith('categories/'):
            raw = f'media/{raw}'
        else:
            raw = f'media/{raw}'
    # Убираем дублирование media
    if raw.startswith('media/media/'):
        raw = raw.replace('media/media/', 'media/')
    return f"{base_url.rstrip('/')}/{raw}"


def format_deadline(deadline_iso: Optional[str]) -> str:
    if not deadline_iso:
        return '—'
    try:
        dt = datetime.fromisoformat(deadline_iso.replace('Z', '+00:00'))
        return dt.astimezone(UZ_TZ).strftime('%d.%m.%y %H:%M')
    except Exception:
        return deadline_iso


def remember_pending_order(user_id: int, order_info: Dict[str, Any]):
    state = get_state(user_id)
    pending = dict(state['data'].get('pending_orders', {}))
    pending[order_info['order_id']] = order_info
    submitted = set(state['data'].get('submitted_proof_ids', []))
    STATE[user_id] = {
        'step': 'await_payment_proof',
        'data': {
            'pending_orders': pending,
            'current_order_id': order_info['order_id'],
            'submitted_proof_ids': list(submitted),
        }
    }


def update_pending_order(user_id: int, order_id: int, **kwargs):
    state = get_state(user_id)
    pending = state['data'].get('pending_orders', {})
    if order_id in pending:
        pending[order_id].update(kwargs)


def resolve_current_order_id(user_id: int) -> Optional[int]:
    state = get_state(user_id)
    pending = state['data'].get('pending_orders', {})
    if not pending:
        return None
    current = state['data'].get('current_order_id')
    if current and current in pending:
        return current
    if len(pending) == 1:
        return next(iter(pending.keys()))
    return None


def process_payment_proof(user_id: int, message: types.Message, file_id: Optional[str]):
    tr = get_tr(user_id)
    if not file_id:
        bot.send_message(user_id, tr['payment_error'])
        return

    state = get_state(user_id)
    pending = state['data'].get('pending_orders', {})
    if not pending:
        bot.send_message(user_id, tr['payment_error'])
        return

    order_id = resolve_current_order_id(user_id)
    if not order_id:
        bot.send_message(user_id, tr['payment_error'])
        return

    submitted = set(state['data'].get('submitted_proof_ids', []))
    if file_id in submitted:
        bot.send_message(user_id, tr['payment_proof_duplicate'])
        return

    try:
        resp = api_client.submit_payment_proof(
            order_id=order_id,
            telegram_user_id=user_id,
            telegram_file_id=file_id,
            message_id=str(message.message_id),
        )
    except (requests.HTTPError, requests.RequestException) as exc:
        status_code = getattr(getattr(exc, 'response', None), 'status_code', None)
        if status_code == 400:
            bot.send_message(user_id, tr['payment_deadline_expired'])
        else:
            bot.send_message(user_id, tr['payment_error'])
        return

    submitted.add(file_id)
    state['data']['submitted_proof_ids'] = list(submitted)
    update_pending_order(user_id, order_id, status=resp.get('order_status') or resp.get('status'))

    bot.send_message(user_id, tr['payment_proof_received'])
    state['data']['current_order_id'] = None
    state['step'] = None

    # Сохраняем file_id для отправки админу
    payment_id = resp.get('payment_id')
    
    # Получаем formatted_total из pending или из ответа API
    formatted_total = pending.get(order_id, {}).get('formatted_total', '')
    if not formatted_total:
        # Пытаемся получить из ответа API
        total_uzs = resp.get('total_uzs') or resp.get('order', {}).get('total_uzs')
        if total_uzs:
            formatted_total = f"{total_uzs} сум"
        else:
            formatted_total = "—"
    
    admin_msg = f"🧾 Новый чек к заказу №{order_id} на {formatted_total} — проверьте."
    
    # Отправляем уведомление админам с кнопкой просмотра
    admin_ids = db.list_admin_ids()
    if not admin_ids:
        print("Warning: No admin IDs found")
        return
    
    for admin_id in admin_ids:
        try:
            admin_tr = get_tr(admin_id)
            admin_kb = kb.ikb_admin_view_proof(admin_tr, order_id)
            bot.send_message(admin_id, admin_msg, reply_markup=admin_kb)
            # Сохраняем file_id и payment_id в state для админа
            admin_state = get_state(admin_id)
            if 'pending_proofs' not in admin_state['data']:
                admin_state['data']['pending_proofs'] = {}
            admin_state['data']['pending_proofs'][order_id] = {
                'file_id': file_id,
                'payment_id': payment_id,
                'user_id': user_id,
            }
            print(f"Admin notification sent to {admin_id} for order {order_id}")
        except Exception as e:
            print(f"Error sending admin notification to {admin_id}: {e}")
            import traceback
            traceback.print_exc()
            continue

# Handlers
@bot.message_handler(commands=['start'])
def cmd_start(message: types.Message):
    user_id = message.from_user.id
    user = db.get_user(user_id)
    if not user or not user.language:
        # ask language
        bot.send_message(user_id, kb.LANG['ru']['choose_language'], reply_markup=kb.kb_language())
        set_state(user_id, 'await_language')
        return
    # Проверяем наличие телефона при старте (проверяем и None, и пустую строку)
    if not user.phone or not user.phone.strip():
        bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(get_tr(user_id)))
        set_state(user_id, 'await_phone_reg', {'name': user.name or message.from_user.first_name or ''})
        return
    bot.send_message(user_id, t(user_id, 'welcome'), reply_markup=kb.kb_main(get_tr(user_id)))
    set_state(user_id, None)


@bot.message_handler(commands=['admin'])
def cmd_admin(message: types.Message):
    user_id = message.from_user.id
    if db.is_admin(user_id):
        bot.send_message(user_id, t(user_id, 'admin_menu'), reply_markup=kb.kb_admin(get_tr(user_id)))
        set_state(user_id, 'admin_menu')
        return
    # Ask for admin password
    bot.send_message(user_id, t(user_id, 'admin_login'), reply_markup=types.ReplyKeyboardRemove())
    set_state(user_id, 'admin_login')


@bot.message_handler(commands=['become_admin'])
def cmd_become_admin(message: types.Message):
    user_id = message.from_user.id
    parts = (message.text or '').split(maxsplit=1)
    if len(parts) < 2:
        bot.reply_to(message, t(user_id, 'admin_login'))
        return
    entered_password = parts[1].strip()
    if ADMIN_PASSWORD and entered_password == ADMIN_PASSWORD:
        db.set_user_admin(user_id, True)
        bot.send_message(user_id, t(user_id, 'admin_login_success'), reply_markup=kb.kb_admin(get_tr(user_id)))
        set_state(user_id, 'admin_menu')
    else:
        bot.send_message(user_id, t(user_id, 'admin_login_failed'))


@bot.message_handler(content_types=['contact'])
def on_contact(message: types.Message):
    user_id = message.from_user.id
    st = get_state(user_id)
    phone = message.contact.phone_number if message.contact else None
    tr = get_tr(user_id)
    
    if st['step'] == 'await_phone_reg' and phone:
        name = st['data'].get('name') or message.from_user.first_name or ''
        db.update_user_registration(user_id, name, phone)
        # Обновляем объект пользователя в кэше, если он есть
        clear_state(user_id)
        bot.send_message(user_id, t(user_id, 'welcome'), reply_markup=kb.kb_main(get_tr(user_id)))
        return
    
    if st['step'] == 'await_phone_checkout' and phone:
        db.set_user_phone(user_id, phone)
        # Продолжаем оформление заказа - проверяем адрес
        state_data = st['data']
        addr = state_data.get('address_text')
        if not addr:
            set_state(user_id, 'await_address')
            bot.send_message(user_id, t(user_id, 'ask_address'), reply_markup=kb.kb_location_request(tr))
            return
        
        # Если адрес уже есть, продолжаем оформление
        cart_items = db.get_cart(user_id)
        if not cart_items:
            bot.send_message(user_id, tr['cart_empty'])
            clear_state(user_id)
            return
        
        # Оформляем заказ
        payload_items = []
        for product, qty in cart_items:
            payload_items.append({'product_id': product['id'], 'quantity': qty})

        try:
            checkout_resp = api_client.create_checkout(
                telegram_user_id=user_id,
                cart_items=payload_items,
                comment=state_data.get('comment', ''),
                address=addr,
                latitude=state_data.get('lat'),
                longitude=state_data.get('lon'),
                delivery_time=state_data.get('delivery_time') or tr['asap'],
            )
        except (requests.HTTPError, requests.RequestException, Exception):
            bot.send_message(user_id, tr['payment_error'])
            clear_state(user_id)
            return

        order_id = checkout_resp.get('order_id')
        raw_total = checkout_resp.get('formatted_total')
        if not raw_total:
            total_value = checkout_resp.get('total_uzs')
            raw_total = f"{total_value} сум" if total_value is not None else '—'
        formatted_total = raw_total
        deadline_text = format_deadline(checkout_resp.get('payment_deadline_at'))
        payment_link = checkout_resp.get('payment_link')

        message_text = tr['payment_instructions'].format(
            order_id=order_id,
            total=formatted_total,
            link=payment_link,
            deadline=deadline_text,
        )

        bot.send_message(
            user_id,
            message_text,
            reply_markup=kb.ikb_payment_actions(tr, payment_link, order_id),
        )
        bot.send_message(user_id, tr['payment_proof_prompt'])

        db.clear_cart(user_id)

        remember_pending_order(user_id, {
            'order_id': order_id,
            'payment_id': checkout_resp.get('payment_id'),
            'payment_link': payment_link,
            'deadline': checkout_resp.get('payment_deadline_at'),
            'status': checkout_resp.get('status'),
            'formatted_total': formatted_total,
        })
        clear_state(user_id)
        return
    
    if st['step'] == 'settings_change_phone' and phone:
        db.set_user_phone(user_id, phone)
        bot.send_message(user_id, t(user_id, 'phone_updated'), reply_markup=kb.kb_main(get_tr(user_id)))
        clear_state(user_id)
        return


@bot.message_handler(content_types=['web_app_data'])
def on_web_app_data(message: types.Message):
    """Обработка данных из Telegram WebApp"""
    user_id = message.from_user.id
    tr = get_tr(user_id)
    
    try:
        # В pyTelegramBotAPI данные из веб-аппа приходят в message.web_app_data.data
        # Если нет такого атрибута, пробуем получить из message.text или message.data
        data_str = None
        
        if hasattr(message, 'web_app_data') and message.web_app_data:
            # Стандартный способ для pyTelegramBotAPI
            data_str = message.web_app_data.data
        elif hasattr(message, 'data'):
            # Альтернативный способ
            data_str = message.data
        elif message.text and message.text.startswith('{'):
            # Если данные пришли как текст JSON
            data_str = message.text
        
        if not data_str:
            print(f"No web_app_data found in message for user {user_id}")
            bot.send_message(user_id, tr.get('error', 'Произошла ошибка. Попробуйте позже.'))
            return
        
        data = json.loads(data_str)
        print(f"Received data from web app for user {user_id}: {data}")
        
        # Проверяем тип данных
        data_type = data.get('type')
        
        # Обработка созданного заказа
        if data_type == 'order_created':
            order_id = data.get('order_id')
            total = data.get('total', '—')
            items = data.get('items', [])
            address = data.get('address', 'Не указан')
            comment = data.get('comment')
            delivery_time = data.get('delivery_time')
            payment_id = data.get('payment_id')
            payment_link = data.get('payment_link')
            payment_deadline_at = data.get('payment_deadline_at')
            
            if not order_id:
                print(f"Error: order_id is missing in order_created data for user {user_id}")
                bot.send_message(user_id, tr.get('error', 'Произошла ошибка при обработке заказа.'))
                return
            
            try:
                # Формируем deadline текст
                deadline_text = format_deadline(payment_deadline_at) if payment_deadline_at else '—'
                
                # Формируем сообщение с инструкциями по оплате
                # Проверяем наличие ключа в словаре локализации
                if 'payment_instructions' in tr:
                    message_text = tr['payment_instructions'].format(
                        order_id=order_id,
                        total=total,
                        link=payment_link or tr.get('payment_link_placeholder', 'Ссылка будет отправлена отдельно'),
                        deadline=deadline_text,
                    )
                else:
                    # Fallback если нет локализации
                    message_text = (
                        f"📦 <b>Заказ #{order_id}</b>\n\n"
                        f"💰 Сумма к оплате: {total}\n"
                        f"⏰ Срок оплаты: {deadline_text}\n\n"
                        f"Оплатите по ссылке: {payment_link or 'Ссылка будет отправлена отдельно'}"
                    )
                
                # Если есть payment_link, отправляем с кнопками
                if payment_link:
                    bot.send_message(
                        user_id,
                        message_text,
                        reply_markup=kb.ikb_payment_actions(tr, payment_link, order_id),
                    )
                else:
                    bot.send_message(user_id, message_text)
                
                # Отправляем детальную информацию о заказе
                order_details = f"📦 <b>Заказ #{order_id}</b>\n\n"
                order_details += f"💰 Сумма: {total}\n"
                order_details += f"📍 Адрес: {address}\n"
                if delivery_time:
                    order_details += f"⏰ Время доставки: {delivery_time}\n"
                if comment:
                    order_details += f"💬 Комментарий: {comment}\n"
                order_details += "\n🧾 Состав заказа:\n"
                for item in items:
                    item_name = item.get('name', 'Товар')
                    item_qty = item.get('quantity', 1)
                    item_price = item.get('price', 0)
                    try:
                        item_total = int(float(item_price)) * int(item_qty)
                        order_details += f"• {item_name} × {item_qty} — {item_total:,} сум\n".replace(",", " ")
                    except (ValueError, TypeError):
                        order_details += f"• {item_name} × {item_qty}\n"
                
                bot.send_message(user_id, order_details)
                
                # Отправляем инструкции по оплате
                if 'payment_proof_prompt' in tr:
                    bot.send_message(user_id, tr['payment_proof_prompt'])
                else:
                    bot.send_message(user_id, "📸 Отправьте фото чека об оплате для подтверждения заказа.")
                
                # Сохраняем заказ в pending_orders для отслеживания
                remember_pending_order(user_id, {
                    'order_id': order_id,
                    'payment_id': payment_id,
                    'payment_link': payment_link,
                    'deadline': payment_deadline_at,
                    'status': 'pending',
                    'formatted_total': total,
                })
                
                # Очищаем корзину
                db.clear_cart(user_id)
                clear_state(user_id)
                
                print(f"Successfully processed order {order_id} from Web App for user {user_id}")
                
            except Exception as e:
                print(f"Error processing order data for user {user_id}: {e}")
                import traceback
                traceback.print_exc()
                bot.send_message(user_id, tr.get('error', 'Произошла ошибка при обработке заказа.'))
            
            return
        
        # Обработка данных корзины (старая логика)
        cart_data = data
        print(f"Received cart data from web app for user {user_id}: {cart_data}")
        
        # Очищаем текущую корзину
        db.clear_cart(user_id)
        
        # Добавляем товары из веб-аппа в корзину бота
        items_added = 0
        for item in cart_data.get('items', []):
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            if product_id and quantity > 0:
                db.add_cart_item(user_id, product_id, quantity)
                items_added += 1
        
        if items_added == 0:
            bot.send_message(user_id, tr.get('error', 'Не удалось добавить товары в корзину.'))
            return
        
        # Показываем корзину
        set_state(user_id, 'cart')
        # Сохраняем главное меню при показе корзины
        show_cart(user_id, preserve_reply_markup=kb.kb_main(tr))
        
        # Отправляем сообщение о том, что корзина синхронизирована
        bot.send_message(user_id, tr.get('cart_synced', '✅ Корзина синхронизирована из веб-приложения!'))
        
    except json.JSONDecodeError as e:
        print(f"Error parsing web_app_data JSON for user {user_id}: {e}, data: {data_str}")
        bot.send_message(user_id, tr.get('error', 'Произошла ошибка при обработке данных.'))
    except Exception as e:
        print(f"Error handling web_app_data for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        bot.send_message(user_id, tr.get('error', 'Произошла ошибка. Попробуйте позже.'))


@bot.message_handler(content_types=['location'])
def on_location(message: types.Message):
    user_id = message.from_user.id
    st = get_state(user_id)
    if st['step'] == 'await_address':
        lat = message.location.latitude
        lon = message.location.longitude
        set_state(user_id, 'time_choice', {'address_text': f"geo: {lat:.6f},{lon:.6f}", 'lat': lat, 'lon': lon})
        # Отправляем описание про Яндекс Такси и время доставки
        tr = get_tr(user_id)
        delivery_info = tr.get('delivery_info', 
            '🚕 <b>Доставка через Яндекс Такси</b>\n\n'
            '✅ Мы отправляем заказ через Яндекс Такси по вашему номеру телефона\n'
            '💰 Оплата за доставку отдельно и взимается Яндекс Такси\n\n'
            '⏰ Во сколько привезти заказ?')
        bot.send_message(user_id, delivery_info, reply_markup=kb.kb_time_choice(tr))


@bot.callback_query_handler(func=lambda call: True)
def on_callback(call: types.CallbackQuery):
    user_id = call.from_user.id
    data = call.data or ''
    tr = get_tr(user_id)

    if data.startswith('qty:'):
        parts = data.split(':')
        if len(parts) != 3:
            bot.answer_callback_query(call.id)
            return
        _, prod_id_str, action = parts
        if action == 'noop':
            bot.answer_callback_query(call.id)
            return
        try:
            prod_id = int(prod_id_str)
        except ValueError:
            bot.answer_callback_query(call.id)
            return
        st = get_state(user_id)
        if st.get('step') != 'product_detail' or st['data'].get('selected_product_id') != prod_id:
            bot.answer_callback_query(call.id)
            return
        quantity = st['data'].get('selected_quantity', 1)
        if action == 'inc':
            quantity += 1
        elif action == 'dec':
            quantity = max(1, quantity - 1)
        st['data']['selected_quantity'] = quantity
        message_id = st['data'].get('product_message_id')
        try:
            markup = build_product_inline_markup(prod_id, quantity, tr)
            if message_id:
                bot.edit_message_reply_markup(chat_id=user_id, message_id=message_id, reply_markup=markup)
        except Exception:
            pass
        bot.answer_callback_query(call.id)
        return

    if data.startswith('add_to_cart:'):
        try:
            prod_id = int(data.split(':', 1)[1])
        except ValueError:
            bot.answer_callback_query(call.id, 'Error')
            return
        st = get_state(user_id)
        qty = max(1, st['data'].get('selected_quantity', 1))
        try:
            db.add_cart_item(user_id, prod_id, qty)
            bot.answer_callback_query(call.id, t(user_id, 'added_to_cart'))
            message_id = st['data'].get('product_message_id')
            if message_id:
                try:
                    bot.delete_message(user_id, message_id)
                except Exception:
                    pass
            msg_text = t(user_id, 'added_to_cart')
            bot.send_message(user_id, msg_text)
            category_state = st['data'].get('active_products_category')
            if category_state and category_state.get('products'):
                kb_products = build_product_reply_kb({**get_tr(user_id), '_lang': db.get_lang(user_id)}, category_state['products'])
                bot.send_message(user_id, t(user_id, 'choose_product'), reply_markup=kb_products)
            set_state(user_id, 'products_list')
        except Exception:
            bot.answer_callback_query(call.id, 'Error')
        return

    if data.startswith('add:'):
        try:
            pid = int(data.split(':', 1)[1])
            if db.get_product(pid):
                db.add_cart_item(user_id, pid, 1)
                bot.answer_callback_query(call.id, t(user_id, 'added_to_cart'))
            else:
                bot.answer_callback_query(call.id, 'Not found')
        except Exception:
            bot.answer_callback_query(call.id, 'Error')
        return

    if data.startswith('send_proof:'):
        try:
            order_id = int(data.split(':', 1)[1])
        except ValueError:
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        pending = get_state(user_id)['data'].get('pending_orders', {})
        if order_id not in pending:
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        get_state(user_id)['data']['current_order_id'] = order_id
        get_state(user_id)['step'] = 'await_payment_proof'
        bot.answer_callback_query(call.id, tr['payment_proof_prompt'])
        bot.send_message(user_id, tr['payment_proof_prompt'])
        return

    if data.startswith('remind:'):
        try:
            order_id = int(data.split(':', 1)[1])
        except ValueError:
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        try:
            resp = api_client.remind_order(order_id, user_id)
        except requests.HTTPError:
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return

        update_pending_order(user_id, order_id, deadline=resp.get('payment_deadline_at'), status=resp.get('status'))
        message_text = tr['payment_instructions'].format(
            order_id=order_id,
            total=resp.get('formatted_total') or get_state(user_id)['data'].get('pending_orders', {}).get(order_id, {}).get('formatted_total', '—'),
            link=resp.get('payment_link') or get_state(user_id)['data'].get('pending_orders', {}).get(order_id, {}).get('payment_link'),
            deadline=format_deadline(resp.get('payment_deadline_at')),
        )
        link = resp.get('payment_link') or get_state(user_id)['data'].get('pending_orders', {}).get(order_id, {}).get('payment_link')
        bot.send_message(user_id, message_text, reply_markup=kb.ikb_payment_actions(tr, link, order_id))
        bot.answer_callback_query(call.id, tr['payment_remind_sent'])

    # Обработка просмотра чека админом
    if data.startswith('view_proof:'):
        if not db.is_admin(user_id):
            bot.answer_callback_query(call.id, tr.get('not_admin', 'У вас нет прав администратора.'), show_alert=True)
            return
        
        try:
            order_id = int(data.split(':', 1)[1])
        except ValueError:
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        
        # Получаем сохраненные данные о чеке
        admin_state = get_state(user_id)
        pending_proofs = admin_state['data'].get('pending_proofs', {})
        proof_data = pending_proofs.get(order_id)
        
        # Если нет в state, пытаемся получить из API
        if not proof_data:
            try:
                proof_info = api_client.get_payment_proof(order_id)
                if proof_info:
                    file_id = proof_info.get('file_id')
                    payment_id = proof_info.get('payment_id')
                    if file_id and payment_id:
                        # Сохраняем в state для будущего использования
                        if 'pending_proofs' not in admin_state['data']:
                            admin_state['data']['pending_proofs'] = {}
                        admin_state['data']['pending_proofs'][order_id] = {
                            'file_id': file_id,
                            'payment_id': payment_id,
                            'user_id': proof_info.get('user_id'),
                        }
                        proof_data = admin_state['data']['pending_proofs'][order_id]
            except Exception as e:
                print(f"Error getting proof from API: {e}")
        
        if not proof_data:
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        
        file_id = proof_data.get('file_id')
        payment_id = proof_data.get('payment_id')
        
        if not file_id:
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        
        # Отправляем фото чека админу с кнопками подтвердить/отклонить
        try:
            admin_tr = get_tr(user_id)
            proof_kb = kb.ikb_admin_proof_actions(admin_tr, order_id, payment_id)
            bot.send_photo(user_id, file_id, caption=f"Чек к заказу №{order_id}", reply_markup=proof_kb)
            bot.answer_callback_query(call.id)
        except Exception as e:
            print(f"Error sending proof photo: {e}")
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
        return

    # Обработка подтверждения оплаты админом
    if data.startswith('approve_payment:'):
        if not db.is_admin(user_id):
            bot.answer_callback_query(call.id, tr.get('not_admin', 'У вас нет прав администратора.'), show_alert=True)
            return
        
        try:
            parts = data.split(':')
            payment_id = int(parts[1])
            order_id = int(parts[2])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        
        try:
            # Подтверждаем оплату через API
            result = api_client.approve_payment_telegram(payment_id, user_id)
            
            bot.answer_callback_query(call.id, "✅ Оплата подтверждена")
            
            # Получаем сохраненные данные о чеке для получения user_id клиента
            admin_state = get_state(user_id)
            pending_proofs = admin_state['data'].get('pending_proofs', {})
            proof_data = pending_proofs.get(order_id)
            
            # Получаем полные данные о заказе для отправки админу
            try:
                order_info = format_order_for_admin(user_id, order_id)
                if order_info:
                    # Отправляем текстовое сообщение
                    bot.send_message(user_id, order_info['text'], parse_mode='HTML')
                    # Если есть координаты, отправляем локацию
                    if order_info.get('latitude') and order_info.get('longitude'):
                        try:
                            bot.send_location(
                                user_id,
                                latitude=order_info['latitude'],
                                longitude=order_info['longitude']
                            )
                        except Exception as e:
                            print(f"Error sending location: {e}")
            except Exception as e:
                print(f"Error getting order details: {e}")
                import traceback
                traceback.print_exc()
            
            # Отправляем уведомление клиенту
            if proof_data:
                client_id = proof_data.get('user_id')
                if client_id:
                    client_tr = get_tr(client_id)
                    approval_msg = client_tr['payment_approved'].format(order_id=order_id)
                    try:
                        bot.send_message(client_id, approval_msg)
                    except Exception:
                        pass
            
            # Удаляем из pending_proofs
            if order_id in pending_proofs:
                del pending_proofs[order_id]
                
        except (requests.HTTPError, requests.RequestException) as e:
            print(f"Error approving payment: {e}")
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
        except Exception as e:
            print(f"Unexpected error approving payment: {e}")
            import traceback
            traceback.print_exc()
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
        return

    # Обработка отклонения оплаты админом
    if data.startswith('reject_payment:'):
        if not db.is_admin(user_id):
            bot.answer_callback_query(call.id, tr.get('not_admin', 'У вас нет прав администратора.'), show_alert=True)
            return
        
        try:
            parts = data.split(':')
            payment_id = int(parts[1])
            order_id = int(parts[2])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, tr['payment_error'], show_alert=True)
            return
        
        # Запрашиваем причину отклонения
        bot.answer_callback_query(call.id)
        bot.send_message(user_id, "Введите причину отклонения чека:")
        
        # Сохраняем состояние для получения причины
        admin_state = get_state(user_id)
        admin_state['step'] = 'admin_reject_payment'
        admin_state['data']['rejecting_payment_id'] = payment_id
        admin_state['data']['rejecting_order_id'] = order_id
        return

    # Обработка удаления товара из корзины
    if data.startswith('remove_cart:'):
        try:
            product_id = int(data.split(':', 1)[1])
        except ValueError:
            bot.answer_callback_query(call.id, tr.get('error', 'Ошибка'), show_alert=True)
            return
        
        # Удаляем товар из корзины
        try:
            db.remove_cart_item(user_id, product_id)
            bot.answer_callback_query(call.id, tr.get('cart_remove', 'Товар удален'))
            
            # Обновляем сообщение корзины
            items = db.get_cart(user_id)
            if not items:
                # Если корзина пуста, удаляем сообщение и отправляем новое
                try:
                    bot.delete_message(user_id, call.message.message_id)
                except Exception:
                    pass
                bot.send_message(user_id, tr['cart_empty'], reply_markup=kb.kb_main(tr))
                clear_state(user_id)
            else:
                # Обновляем текст и клавиатуру корзины
                cart_text = format_cart(user_id)
                cart_markup = kb.ikb_cart(tr, items)
                try:
                    bot.edit_message_text(
                        chat_id=user_id,
                        message_id=call.message.message_id,
                        text=cart_text,
                        reply_markup=cart_markup
                    )
                except Exception as e:
                    print(f"Error editing cart message: {e}")
                    # Если не получилось обновить, отправляем новое сообщение
                    bot.send_message(user_id, cart_text, reply_markup=cart_markup)
        except Exception as e:
            print(f"Error removing cart item: {e}")
            bot.answer_callback_query(call.id, tr.get('error', 'Ошибка'), show_alert=True)
        return

    # Обработка "Продолжить заказ"
    if data == 'cart_continue':
        bot.answer_callback_query(call.id)
        set_state(user_id, 'category_choice')
        show_categories(user_id)
        return

    # Обработка "Оформить заказ" из inline-кнопки
    if data == 'cart_checkout':
        bot.answer_callback_query(call.id)
        
        # Проверяем наличие телефона у пользователя
        user = db.get_user(user_id)
        if not user or not user.phone or not user.phone.strip():
            set_state(user_id, 'await_phone_checkout')
            bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(tr))
            return
        
        state_data = get_state(user_id)['data']
        addr = state_data.get('address_text')
        if not addr:
            set_state(user_id, 'await_address')
            bot.send_message(user_id, t(user_id, 'ask_address'), reply_markup=kb.kb_location_request(tr))
            return

        cart_items = db.get_cart(user_id)
        if not cart_items:
            bot.send_message(user_id, tr['cart_empty'])
            return

        payload_items = []
        for product, qty in cart_items:
            payload_items.append({'product_id': product['id'], 'quantity': qty})

        try:
            checkout_resp = api_client.create_checkout(
                telegram_user_id=user_id,
                cart_items=payload_items,
                comment=state_data.get('comment', ''),
                address=addr,
                latitude=state_data.get('lat'),
                longitude=state_data.get('lon'),
                delivery_time=state_data.get('delivery_time') or tr['asap'],
            )
        except (requests.HTTPError, requests.RequestException, Exception):
            bot.send_message(user_id, tr['payment_error'])
            return

        order_id = checkout_resp.get('order_id')
        raw_total = checkout_resp.get('formatted_total')
        if not raw_total:
            total_value = checkout_resp.get('total_uzs')
            raw_total = f"{total_value} сум" if total_value is not None else '—'
        formatted_total = raw_total
        deadline_text = format_deadline(checkout_resp.get('payment_deadline_at'))
        payment_link = checkout_resp.get('payment_link')

        message_text = tr['payment_instructions'].format(
            order_id=order_id,
            total=formatted_total,
            link=payment_link,
            deadline=deadline_text,
        )

        bot.send_message(
            user_id,
            message_text,
            reply_markup=kb.ikb_payment_actions(tr, payment_link, order_id),
        )
        bot.send_message(user_id, tr['payment_proof_prompt'])

        db.clear_cart(user_id)

        remember_pending_order(user_id, {
            'order_id': order_id,
            'payment_id': checkout_resp.get('payment_id'),
            'payment_link': payment_link,
            'deadline': checkout_resp.get('payment_deadline_at'),
            'status': checkout_resp.get('status'),
            'formatted_total': formatted_total,
        })
        return


@bot.message_handler(content_types=['text'])
def on_text(message: types.Message):
    user_id = message.from_user.id
    text = (message.text or '').strip()
    st = get_state(user_id)

    # Admin login via password
    if st['step'] == 'admin_login':
        if ADMIN_PASSWORD and text == ADMIN_PASSWORD:
            db.set_user_admin(user_id, True)
            bot.send_message(user_id, t(user_id, 'admin_login_success'), reply_markup=kb.kb_admin(get_tr(user_id)))
            set_state(user_id, 'admin_menu')
        else:
            bot.send_message(user_id, t(user_id, 'admin_login_failed'))
        return

    # Language selection step
    if st['step'] == 'await_language':
        if text == kb.LANG['ru']['lang_ru']:
            db.set_user_language(user_id, 'ru')
        elif text == kb.LANG['ru']['lang_uz']:
            db.set_user_language(user_id, 'uz')
        else:
            return
        bot.send_message(user_id, t(user_id, 'ask_name'), reply_markup=types.ReplyKeyboardRemove())
        set_state(user_id, 'await_name')
        return

    # Registration name step
    if st['step'] == 'await_name':
        name = text
        set_state(user_id, 'await_phone_reg', {'name': name})
        bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(get_tr(user_id)))
        return

    # Registration phone via text fallback
    if st['step'] == 'await_phone_reg' and text:
        phone = text.strip()
        if not phone:
            bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(get_tr(user_id)))
            return
        name = st['data'].get('name') or message.from_user.first_name or ''
        db.update_user_registration(user_id, name, phone)
        # Обновляем объект пользователя в кэше, если он есть
        clear_state(user_id)
        bot.send_message(user_id, t(user_id, 'welcome'), reply_markup=kb.kb_main(get_tr(user_id)))
        return

    # Phone for checkout via text fallback
    if st['step'] == 'await_phone_checkout' and text:
        phone = text.strip()
        if not phone:
            bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(tr))
            return
        db.set_user_phone(user_id, phone)
        # Продолжаем оформление заказа - проверяем адрес
        state_data = st['data']
        addr = state_data.get('address_text')
        if not addr:
            set_state(user_id, 'await_address')
            bot.send_message(user_id, t(user_id, 'ask_address'), reply_markup=kb.kb_location_request(tr))
            return
        # Если адрес уже есть, продолжаем оформление
        cart_items = db.get_cart(user_id)
        if not cart_items:
            bot.send_message(user_id, tr['cart_empty'])
            clear_state(user_id)
            return
        
        # Если все данные есть, оформляем заказ
        payload_items = []
        for product, qty in cart_items:
            payload_items.append({'product_id': product['id'], 'quantity': qty})

        try:
            checkout_resp = api_client.create_checkout(
                telegram_user_id=user_id,
                cart_items=payload_items,
                comment=state_data.get('comment', ''),
                address=addr,
                latitude=state_data.get('lat'),
                longitude=state_data.get('lon'),
                delivery_time=state_data.get('delivery_time') or tr['asap'],
            )
        except (requests.HTTPError, requests.RequestException, Exception):
            bot.send_message(user_id, tr['payment_error'])
            clear_state(user_id)
            return

        order_id = checkout_resp.get('order_id')
        raw_total = checkout_resp.get('formatted_total')
        if not raw_total:
            total_value = checkout_resp.get('total_uzs')
            raw_total = f"{total_value} сум" if total_value is not None else '—'
        formatted_total = raw_total
        deadline_text = format_deadline(checkout_resp.get('payment_deadline_at'))
        payment_link = checkout_resp.get('payment_link')

        message_text = tr['payment_instructions'].format(
            order_id=order_id,
            total=formatted_total,
            link=payment_link,
            deadline=deadline_text,
        )

        bot.send_message(
            user_id,
            message_text,
            reply_markup=kb.ikb_payment_actions(tr, payment_link, order_id),
        )
        bot.send_message(user_id, tr['payment_proof_prompt'])

        db.clear_cart(user_id)

        remember_pending_order(user_id, {
            'order_id': order_id,
            'payment_id': checkout_resp.get('payment_id'),
            'payment_link': payment_link,
            'deadline': checkout_resp.get('payment_deadline_at'),
            'status': checkout_resp.get('status'),
            'formatted_total': formatted_total,
        })
        clear_state(user_id)
        return

    # Settings: change phone via text fallback
    if st['step'] == 'settings_change_phone' and text:
        phone = text.strip()
        if not phone:
            bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(tr))
            return
        db.set_user_phone(user_id, phone)
        bot.send_message(user_id, t(user_id, 'phone_updated'), reply_markup=kb.kb_main(get_tr(user_id)))
        clear_state(user_id)
        return

    # Settings: birthday
    if st['step'] == 'settings_birthday' and text:
        if re.match(r'^\d{4}-\d{2}-\d{2}$', text):
            db.set_user_birthday(user_id, text)
            bot.send_message(user_id, t(user_id, 'birthday_saved'), reply_markup=kb.kb_main(get_tr(user_id)))
            clear_state(user_id)
        else:
            bot.send_message(user_id, t(user_id, 'birthday_prompt'))
        return

    # Ordering: awaiting address via text
    if st['step'] == 'await_address' and text:
        # If user pressed back on location keyboard, return to main
        tr = get_tr(user_id)
        if text == tr['back']:
            bot.send_message(user_id, t(user_id, 'select_from_menu'), reply_markup=kb.kb_main(tr))
            clear_state(user_id)
            return
        # Текстовый адрес
        set_state(user_id, 'time_choice', {'address_text': text, 'lat': None, 'lon': None})
        delivery_info = tr.get('delivery_info', 
            '🚕 <b>Доставка через Яндекс Такси</b>\n\n'
            '✅ Мы отправляем заказ через Яндекс Такси по вашему номеру телефона\n'
            '💰 Оплата за доставку отдельно и взимается Яндекс Такси\n\n'
            '⏰ Во сколько привезти заказ?')
        bot.send_message(user_id, delivery_info, reply_markup=kb.kb_time_choice(tr))
        return

    if st['step'] == 'time_choice':
        tr = get_tr(user_id)
        if text == tr['asap']:
            # Сохраняем время доставки и переходим к выбору категорий
            state_data = get_state(user_id)['data']
            state_data['delivery_time'] = tr['asap']
            set_state(user_id, 'category_choice', state_data)
            show_categories(user_id)
            return
        if text == tr['choose_time']:
            set_state(user_id, 'choose_time_slot')
            bot.send_message(user_id, tr['times_prompt'], reply_markup=kb.kb_time_slots(tr))
            return
        if text == tr['back']:
            set_state(user_id, 'await_address')
            bot.send_message(user_id, tr['ask_address'], reply_markup=kb.kb_location_request(tr))
            return

    if st['step'] == 'choose_time_slot':
        tr = get_tr(user_id)
        if text == tr['back']:
            set_state(user_id, 'time_choice')
            delivery_info = tr.get('delivery_info', 
                '🚕 <b>Доставка через Яндекс Такси</b>\n\n'
                '✅ Мы отправляем заказ через Яндекс Такси по вашему номеру телефона\n'
                '💰 Оплата за доставку отдельно и взимается Яндекс Такси\n\n'
                '⏰ Во сколько привезти заказ?')
            bot.send_message(user_id, delivery_info, reply_markup=kb.kb_time_choice(tr))
            return
        if re.match(r'^\d{2}:\d{2}$', text):
            # Сохраняем время доставки и переходим к выбору категорий
            state_data = get_state(user_id)['data']
            state_data['delivery_time'] = text
            set_state(user_id, 'category_choice', state_data)
            show_categories(user_id)
            return

    # Catalog and cart flow
    if st['step'] in ('catalog_menu', 'cart', 'await_address', 'await_language', 'await_payment_proof', None):
        tr = get_tr(user_id)
        # Main menu entries
        if text == tr['menu_order']:
            set_state(user_id, 'await_address', {'address_text': None, 'lat': None, 'lon': None, 'delivery_time': None})
            bot.send_message(user_id, tr['ask_address'], reply_markup=kb.kb_location_request(tr))
            return
        if text == tr['menu_orders']:
            bot.send_message(user_id, format_orders(user_id), reply_markup=kb.kb_main(tr))
            return
        if text == tr['menu_settings']:
            bot.send_message(user_id, tr['settings'], reply_markup=kb.kb_settings(tr))
            set_state(user_id, 'settings')
            return
        if text == tr['menu_about']:
            bot.send_message(user_id, tr['about_text'], reply_markup=kb.kb_main(tr))
            return

        # Убрали старые обработчики catalog_products и catalog_sets
        if text == tr['catalog_cart']:
            set_state(user_id, 'cart')
            # Сохраняем текущую reply-клавиатуру (главное меню)
            show_cart(user_id, preserve_reply_markup=kb.kb_main(tr))
            return

        if text == tr['back']:
            bot.send_message(user_id, t(user_id, 'select_from_menu'), reply_markup=kb.kb_main(tr))
            clear_state(user_id)
            return

    # Обработка выбора категории
    if st['step'] == 'category_choice':
        tr = get_tr(user_id)
        if text == tr['catalog_cart']:
            set_state(user_id, 'cart')
            # Сохраняем клавиатуру категорий
            categories = api_client.get_categories()
            parent_cats = [cat for cat in categories if not cat.get('parent')]
            tr_with_lang = {**tr, '_lang': db.get_lang(user_id)}
            categories_kb = kb.kb_categories(tr_with_lang, parent_cats)
            show_cart(user_id, preserve_reply_markup=categories_kb)
            return
        if text == tr['back']:
            set_state(user_id, 'time_choice')
            delivery_info = tr.get('delivery_info', 
                '🚕 <b>Доставка через Яндекс Такси</b>\n\n'
                '✅ Мы отправляем заказ через Яндекс Такси по вашему номеру телефона\n'
                '💰 Оплата за доставку отдельно и взимается Яндекс Такси\n\n'
                '⏰ Во сколько привезти заказ?')
            bot.send_message(user_id, delivery_info, reply_markup=kb.kb_time_choice(tr))
            return
        
        # Проверяем, является ли текст названием категории
        try:
            categories = api_client.get_categories()
            parent_cats = [cat for cat in categories if not cat.get('parent')]
            
            selected_category = None
            for cat in parent_cats:
                cat_name_ru = cat.get('name', '')
                cat_name_uz = cat.get('name_uz', '')
                if text == cat_name_ru or text == cat_name_uz:
                    selected_category = cat
                    break
            
            if selected_category:
                # Показываем продукты выбранной категории
                category_id = selected_category.get('id')
                category_slug = selected_category.get('slug')
                set_state(user_id, 'products_list', {
                    'category_id': category_id,
                    'category_slug': category_slug,
                    'category_name': text
                })
                # Используем slug если есть, иначе id
                if category_slug:
                    show_products_category(user_id, category_slug=category_slug)
                else:
                    show_products_category(user_id, category_id=category_id)
            else:
                # Если не нашли категорию, показываем снова список
                show_categories(user_id)
        except Exception as e:
            bot.send_message(user_id, tr.get('error', 'Произошла ошибка. Попробуйте позже.'))
        return

    # Обработка просмотра продуктов и деталей продукта
    if st['step'] in ('products_list', 'product_detail'):
        tr = get_tr(user_id)
        if text == tr['back']:
            set_state(user_id, 'category_choice')
            show_categories(user_id)
            return
        if text == tr['catalog_cart']:
            set_state(user_id, 'cart')
            # Сохраняем клавиатуру продуктов
            products = st['data'].get('products', [])
            lang = db.get_lang(user_id)
            product_kb = build_product_reply_kb({**tr, '_lang': lang}, products)
            show_cart(user_id, preserve_reply_markup=product_kb)
            return

        products = st['data'].get('products', [])
        selected = None
        lang = db.get_lang(user_id)
        for p in products:
            possible_titles = {p.get('_button_title'), p.get('_full_title'), p.get('title'), p.get('title_uz')}
            if text in filter(None, possible_titles):
                selected = p
                break

        if selected:
            send_product_detail(user_id, selected, quantity=1)
        return

    if st['step'] == 'cart':
        tr = get_tr(user_id)
        if text == tr['cart_add']:
            set_state(user_id, 'category_choice')
            show_categories(user_id)
            return
        if text == tr['cart_clear']:
            db.clear_cart(user_id)
            # Сохраняем текущую клавиатуру (главное меню)
            show_cart(user_id, preserve_reply_markup=kb.kb_main(tr))
            return
        if text == tr['cart_checkout']:
            # Проверяем наличие телефона у пользователя
            user = db.get_user(user_id)
            if not user or not user.phone or not user.phone.strip():
                set_state(user_id, 'await_phone_checkout')
                bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(tr))
                return
            
            state_data = get_state(user_id)['data']
            addr = state_data.get('address_text')
            if not addr:
                set_state(user_id, 'await_address')
                bot.send_message(user_id, t(user_id, 'ask_address'), reply_markup=kb.kb_location_request(tr))
                return

            cart_items = db.get_cart(user_id)
            if not cart_items:
                bot.send_message(user_id, tr['cart_empty'])
                return

            payload_items = []
            for product, qty in cart_items:
                payload_items.append({'product_id': product['id'], 'quantity': qty})

            try:
                checkout_resp = api_client.create_checkout(
                    telegram_user_id=user_id,
                    cart_items=payload_items,
                    comment=state_data.get('comment', ''),
                    address=addr,
                    latitude=state_data.get('lat'),
                    longitude=state_data.get('lon'),
                    delivery_time=state_data.get('delivery_time') or tr['asap'],
                )
            except (requests.HTTPError, requests.RequestException, Exception):
                bot.send_message(user_id, tr['payment_error'])
                return

            order_id = checkout_resp.get('order_id')
            raw_total = checkout_resp.get('formatted_total')
            if not raw_total:
                total_value = checkout_resp.get('total_uzs')
                raw_total = f"{total_value} сум" if total_value is not None else '—'
            formatted_total = raw_total
            deadline_text = format_deadline(checkout_resp.get('payment_deadline_at'))
            payment_link = checkout_resp.get('payment_link')

            message_text = tr['payment_instructions'].format(
                order_id=order_id,
                total=formatted_total,
                link=payment_link,
                deadline=deadline_text,
            )

            bot.send_message(
                user_id,
                message_text,
                reply_markup=kb.ikb_payment_actions(tr, payment_link, order_id),
            )
            bot.send_message(user_id, tr['payment_proof_prompt'])

            db.clear_cart(user_id)

            remember_pending_order(user_id, {
                'order_id': order_id,
                'payment_id': checkout_resp.get('payment_id'),
                'payment_link': payment_link,
                'deadline': checkout_resp.get('payment_deadline_at'),
                'status': checkout_resp.get('status'),
                'formatted_total': formatted_total,
            })
            return
        if text == tr['back']:
            set_state(user_id, 'category_choice')
            show_categories(user_id)
            return

    # Settings menu actions
    if st['step'] == 'settings':
        tr = get_tr(user_id)
        if text == tr['settings_language']:
            set_state(user_id, 'await_language')
            bot.send_message(user_id, t(user_id, 'choose_language'), reply_markup=kb.kb_language())
            return
        if text == tr['settings_phone']:
            set_state(user_id, 'settings_change_phone')
            bot.send_message(user_id, t(user_id, 'ask_phone'), reply_markup=kb.kb_phone(tr))
            return
        if text == tr['settings_birthday']:
            set_state(user_id, 'settings_birthday')
            bot.send_message(user_id, t(user_id, 'birthday_prompt'), reply_markup=types.ReplyKeyboardRemove())
            return
        if text == tr['back']:
            bot.send_message(user_id, t(user_id, 'select_from_menu'), reply_markup=kb.kb_main(tr))
            clear_state(user_id)
            return

    # Обработка причины отклонения чека
    if st['step'] == 'admin_reject_payment':
        if not db.is_admin(user_id):
            bot.send_message(user_id, t(user_id, 'not_admin'))
            clear_state(user_id)
            return
        
        reason = text.strip()
        if not reason:
            bot.send_message(user_id, "Пожалуйста, введите причину отклонения.")
            return
        
        payment_id = st['data'].get('rejecting_payment_id')
        order_id = st['data'].get('rejecting_order_id')
        
        if not payment_id or not order_id:
            bot.send_message(user_id, tr['payment_error'])
            clear_state(user_id)
            return
        
        try:
            # Отклоняем оплату через API
            api_client.reject_payment_telegram(payment_id, user_id, reason)
            
            bot.send_message(user_id, f"❌ Чек отклонен: {reason}")
            
            # Отправляем уведомление клиенту
            admin_state = get_state(user_id)
            pending_proofs = admin_state['data'].get('pending_proofs', {})
            proof_data = pending_proofs.get(order_id)
            if proof_data:
                client_id = proof_data.get('user_id')
                if client_id:
                    client_tr = get_tr(client_id)
                    rejection_msg = client_tr['payment_rejected'].format(order_id=order_id)
                    try:
                        bot.send_message(client_id, rejection_msg)
                    except Exception:
                        pass
            
            # Удаляем из pending_proofs
            if order_id in pending_proofs:
                del pending_proofs[order_id]
            
            clear_state(user_id)
        except (requests.HTTPError, requests.RequestException) as e:
            print(f"Error rejecting payment: {e}")
            bot.send_message(user_id, tr['payment_error'])
            clear_state(user_id)
        except Exception as e:
            print(f"Unexpected error rejecting payment: {e}")
            import traceback
            traceback.print_exc()
            bot.send_message(user_id, tr['payment_error'])
            clear_state(user_id)
        return

    # Admin menu actions
    if st['step'] in (
        'admin_menu', 'admin_add_name', 'admin_add_category', 'admin_add_price', 'admin_add_desc', 'admin_add_photo',
        'admin_edit_select_id', 'admin_edit_field', 'admin_edit_new_value', 'admin_delete_confirm'
    ):
        if not db.is_admin(user_id):
            bot.send_message(user_id, t(user_id, 'not_admin'))
            clear_state(user_id)
            return
        tr = get_tr(user_id)
        # Entering admin menu via text labels
        if st['step'] == 'admin_menu':
            if text == tr['admin_add']:
                set_state(user_id, 'admin_add_name', {'new_product': {}})
                bot.send_message(user_id, t(user_id, 'enter_product_name'), reply_markup=types.ReplyKeyboardRemove())
                return
            if text == tr['admin_edit']:
                set_state(user_id, 'admin_edit_select_id')
                bot.send_message(user_id, t(user_id, 'enter_product_id'), reply_markup=types.ReplyKeyboardRemove())
                return
            if text == tr['admin_delete']:
                set_state(user_id, 'admin_delete_confirm')
                bot.send_message(user_id, t(user_id, 'enter_product_id'), reply_markup=types.ReplyKeyboardRemove())
                return
            if text == tr['admin_list']:
                prods = db.list_products()
                if not prods:
                    bot.send_message(user_id, t(user_id, 'no_products_in_category'))
                else:
                    lines = []
                    for p in prods:
                        lines.append(f"#{p['id']} • {p['name']} • {p['category']} • {p['price']} сум")
                    bot.send_message(user_id, '\n'.join(lines))
                bot.send_message(user_id, t(user_id, 'admin_menu'), reply_markup=kb.kb_admin(tr))
                return
            if text == tr['back']:
                bot.send_message(user_id, t(user_id, 'select_from_menu'), reply_markup=kb.kb_main(tr))
                clear_state(user_id)
                return

        if st['step'] == 'admin_add_name':
            d = st['data'].get('new_product', {})
            d['name'] = text
            set_state(user_id, 'admin_add_category', {'new_product': d})
            kbr = types.ReplyKeyboardMarkup(resize_keyboard=True)
            kbr.add(types.KeyboardButton(tr['category_product']), types.KeyboardButton(tr['category_set']))
            bot.send_message(user_id, t(user_id, 'choose_category'), reply_markup=kbr)
            return

        if st['step'] == 'admin_add_category':
            d = st['data'].get('new_product', {})
            if text == tr['category_product']:
                d['category'] = 'product'
            elif text == tr['category_set']:
                d['category'] = 'set'
            else:
                bot.send_message(user_id, t(user_id, 'choose_category'))
                return
            set_state(user_id, 'admin_add_price', {'new_product': d})
            bot.send_message(user_id, t(user_id, 'enter_price'), reply_markup=types.ReplyKeyboardRemove())
            return

        if st['step'] == 'admin_add_price':
            d = st['data'].get('new_product', {})
            try:
                price = int(text)
            except ValueError:
                bot.send_message(user_id, t(user_id, 'enter_price'))
                return
            d['price'] = price
            set_state(user_id, 'admin_add_desc', {'new_product': d})
            bot.send_message(user_id, t(user_id, 'enter_description'))
            return

        if st['step'] == 'admin_add_desc':
            d = st['data'].get('new_product', {})
            d['description'] = '' if text.strip() == '-' else text
            set_state(user_id, 'admin_add_photo', {'new_product': d})
            bot.send_message(user_id, t(user_id, 'send_photo'))
            return

        if st['step'] == 'admin_add_photo':
            d = st['data'].get('new_product', {})
            if text.strip() == '-':
                pid = db.add_product(d['name'], d.get('description', ''), d['price'], d['category'], None)
                bot.send_message(user_id, t(user_id, 'product_created').format(id=pid), reply_markup=kb.kb_admin(tr))
                set_state(user_id, 'admin_menu')
                return
            else:
                bot.send_message(user_id, t(user_id, 'send_photo'))
                return

        if st['step'] == 'admin_edit_select_id':
            try:
                pid = int(text)
            except ValueError:
                bot.send_message(user_id, t(user_id, 'enter_product_id'))
                return
            p = db.get_product(pid)
            if not p:
                bot.send_message(user_id, t(user_id, 'product_not_found'))
                set_state(user_id, 'admin_menu')
                bot.send_message(user_id, t(user_id, 'admin_menu'), reply_markup=kb.kb_admin(tr))
                return
            set_state(user_id, 'admin_edit_field', {'edit_product_id': pid})
            kbr = types.ReplyKeyboardMarkup(resize_keyboard=True)
            kbr.add(types.KeyboardButton(tr['edit_name']))
            kbr.add(types.KeyboardButton(tr['edit_category']))
            kbr.add(types.KeyboardButton(tr['edit_price']))
            kbr.add(types.KeyboardButton(tr['edit_description']))
            kbr.add(types.KeyboardButton(tr['edit_photo']))
            kbr.add(types.KeyboardButton(tr['back']))
            bot.send_message(user_id, t(user_id, 'what_edit'), reply_markup=kbr)
            return

        if st['step'] == 'admin_edit_field':
            pid = st['data'].get('edit_product_id')
            if text == tr['edit_name']:
                set_state(user_id, 'admin_edit_new_value', {'edit_field': 'name'})
                bot.send_message(user_id, t(user_id, 'enter_product_name'), reply_markup=types.ReplyKeyboardRemove())
                return
            if text == tr['edit_category']:
                set_state(user_id, 'admin_edit_new_value', {'edit_field': 'category'})
                kbr = types.ReplyKeyboardMarkup(resize_keyboard=True)
                kbr.add(types.KeyboardButton(tr['category_product']), types.KeyboardButton(tr['category_set']))
                bot.send_message(user_id, t(user_id, 'choose_category'), reply_markup=kbr)
                return
            if text == tr['edit_price']:
                set_state(user_id, 'admin_edit_new_value', {'edit_field': 'price'})
                bot.send_message(user_id, t(user_id, 'enter_price'), reply_markup=types.ReplyKeyboardRemove())
                return
            if text == tr['edit_description']:
                set_state(user_id, 'admin_edit_new_value', {'edit_field': 'description'})
                bot.send_message(user_id, t(user_id, 'enter_description'))
                return
            if text == tr['edit_photo']:
                set_state(user_id, 'admin_edit_new_value', {'edit_field': 'photo_file_id'})
                bot.send_message(user_id, t(user_id, 'send_photo'))
                return
            if text == tr['back']:
                set_state(user_id, 'admin_menu')
                bot.send_message(user_id, t(user_id, 'admin_menu'), reply_markup=kb.kb_admin(tr))
                return

        if st['step'] == 'admin_edit_new_value':
            pid = st['data'].get('edit_product_id')
            field = st['data'].get('edit_field')
            if field == 'category':
                if text == tr['category_product']:
                    db.update_product_field(pid, 'category', 'product')
                elif text == tr['category_set']:
                    db.update_product_field(pid, 'category', 'set')
                else:
                    bot.send_message(user_id, t(user_id, 'choose_category'))
                    return
            elif field == 'price':
                try:
                    price = int(text)
                except ValueError:
                    bot.send_message(user_id, t(user_id, 'enter_price'))
                    return
                db.update_product_field(pid, 'price', price)
            elif field == 'description':
                db.update_product_field(pid, 'description', '' if text.strip() == '-' else text)
            elif field == 'name':
                db.update_product_field(pid, 'name', text)
            elif field == 'photo_file_id':
                bot.send_message(user_id, t(user_id, 'send_photo'))
                return
            bot.send_message(user_id, t(user_id, 'saved'), reply_markup=kb.kb_admin(tr))
            set_state(user_id, 'admin_menu')
            return

        if st['step'] == 'admin_delete_confirm':
            d = st['data']
            if 'delete_id' not in d:
                try:
                    pid = int(text)
                except ValueError:
                    bot.send_message(user_id, t(user_id, 'enter_product_id'))
                    return
                if not db.get_product(pid):
                    bot.send_message(user_id, t(user_id, 'product_not_found'))
                    set_state(user_id, 'admin_menu')
                    bot.send_message(user_id, t(user_id, 'admin_menu'), reply_markup=kb.kb_admin(tr))
                    return
                set_state(user_id, 'admin_delete_confirm', {'delete_id': pid})
                bot.send_message(user_id, t(user_id, 'are_you_sure_delete').format(id=pid))
                return
            else:
                if text.lower() == t(user_id, 'yes'):
                    db.delete_product(d['delete_id'])
                    bot.send_message(user_id, t(user_id, 'deleted'), reply_markup=kb.kb_admin(tr))
                    set_state(user_id, 'admin_menu', {'delete_id': None})
                    return
                else:
                    set_state(user_id, 'admin_menu', {'delete_id': None})
                    bot.send_message(user_id, t(user_id, 'admin_menu'), reply_markup=kb.kb_admin(tr))
                    return

    # Fallbacks
    if st['step'] is None:
        if db.get_user(user_id):
            bot.send_message(user_id, t(user_id, 'select_from_menu'), reply_markup=kb.kb_main(get_tr(user_id)))
        else:
            bot.send_message(user_id, kb.LANG['ru']['choose_language'], reply_markup=kb.kb_language())
            set_state(user_id, 'await_language')


@bot.message_handler(content_types=['photo'])
def on_photo(message: types.Message):
    user_id = message.from_user.id
    st = get_state(user_id)
    file_id = message.photo[-1].file_id if message.photo else None
    if st['step'] == 'await_payment_proof' or st['data'].get('pending_orders'):
        process_payment_proof(user_id, message, file_id)
        return
    if not db.is_admin(user_id):
        return
    tr = get_tr(user_id)
    if st['step'] == 'admin_add_photo':
        d = st['data'].get('new_product', {})
        pid = db.add_product(d['name'], d.get('description', ''), d['price'], d['category'], file_id)
        bot.send_message(user_id, t(user_id, 'product_created').format(id=pid), reply_markup=kb.kb_admin(tr))
        set_state(user_id, 'admin_menu')
        return
    if st['step'] == 'admin_edit_new_value' and st['data'].get('edit_field') == 'photo_file_id':
        pid = st['data'].get('edit_product_id')
        db.update_product_field(pid, 'photo_file_id', file_id)
        bot.send_message(user_id, t(user_id, 'saved'), reply_markup=kb.kb_admin(tr))
        set_state(user_id, 'admin_menu')
        return


@bot.message_handler(content_types=['document'])
def on_document(message: types.Message):
    user_id = message.from_user.id
    st = get_state(user_id)
    file_id = message.document.file_id if message.document else None
    if st['step'] == 'await_payment_proof' or st['data'].get('pending_orders'):
        process_payment_proof(user_id, message, file_id)
        return
    if db.is_admin(user_id):
        bot.send_message(user_id, t(user_id, 'send_photo'))
    else:
        bot.send_message(user_id, t(user_id, 'payment_error'))


# Product catalog UI helpers

def show_categories(user_id: int):
    """Показать категории с веб-апп кнопкой"""
    tr = get_tr(user_id)
    lang = db.get_lang(user_id)
    
    try:
        categories = api_client.get_categories()
        
        # Обрабатываем разные форматы ответа от API
        if not categories:
            bot.send_message(user_id, tr.get('no_categories', 'Категории не найдены. Попробуйте позже.'))
            return
        
        # Если categories - это список, берем только родительские категории
        if isinstance(categories, list):
            parent_cats = [cat for cat in categories if not cat.get('parent')]
        elif isinstance(categories, dict):
            # Если это результат API с results
            parent_cats = [cat for cat in categories.get('results', []) if not cat.get('parent')]
        else:
            parent_cats = []
        
        if not parent_cats:
            error_msg = tr.get('no_categories', 'Категории не найдены. Попробуйте позже.')
            bot.send_message(user_id, error_msg)
            # Не сбрасываем состояние - оставляем пользователя в процессе заказа
            return
        
        # Сообщение "Выберите категорию"
        msg_text = tr.get('choose_category_text', '📦 <b>Выберите категорию</b>')
        
        # Передаем язык в tr для правильного отображения
        tr_with_lang = {**tr, '_lang': lang}
        categories_kb = kb.kb_categories(tr_with_lang, parent_cats)
        
        # Отправляем сообщение с категориями
        bot.send_message(user_id, msg_text, reply_markup=categories_kb)
        
        # Добавляем веб-апп кнопку (inline)
        webapp_url = os.getenv('WEBAPP_URL', 'https://98d9032fbd06.ngrok-free.app')
        webapp_kb = kb.kb_webapp_button(tr, webapp_url)
        
        # Отправляем отдельное сообщение с веб-апп кнопкой
        webapp_msg = tr.get('webapp_info', '💡 Можете также заказать через веб-приложение:')
        bot.send_message(user_id, webapp_msg, reply_markup=webapp_kb)
        
    except Exception as e:
        # Логируем ошибку для отладки
        print(f"Error in show_categories for user {user_id}: {e}")
        
        # Сообщаем пользователю об ошибке, но НЕ сбрасываем состояние
        error_msg = tr.get('error', 'Произошла ошибка при загрузке категорий. Попробуйте позже.')
        bot.send_message(user_id, error_msg)
        
        # Пытаемся вернуть пользователя к выбору времени, если он был в процессе заказа
        st = get_state(user_id)
        if st.get('step') == 'category_choice':
            # Остаемся в том же состоянии, чтобы пользователь мог попробовать снова
            # Можно показать кнопку "Назад" для возврата
            kb_back = types.ReplyKeyboardMarkup(resize_keyboard=True)
            kb_back.add(types.KeyboardButton(tr['back']))
            bot.send_message(user_id, tr.get('try_again', 'Нажмите "Назад" чтобы вернуться к выбору времени.'), reply_markup=kb_back)


def build_product_reply_kb(tr: Dict[str, str], products: List[Dict[str, Any]]) -> types.ReplyKeyboardMarkup:
    kb_products = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    buttons = []
    for prod in products:
        display_title = prod.get('_button_title') or prod.get('title') or ''
        buttons.append(types.KeyboardButton(display_title))
    for i in range(0, len(buttons), 2):
        kb_products.add(*buttons[i:i+2])
    kb_products.add(types.KeyboardButton(tr['catalog_cart']))
    kb_products.add(types.KeyboardButton(tr['back']))
    return kb_products


def build_product_inline_markup(product_id: int, quantity: int, tr: Dict[str, str]) -> types.InlineKeyboardMarkup:
    markup = types.InlineKeyboardMarkup(row_width=3)
    markup.row(
        types.InlineKeyboardButton("➖", callback_data=f"qty:{product_id}:dec"),
        types.InlineKeyboardButton(str(quantity), callback_data="qty:noop"),
        types.InlineKeyboardButton("➕", callback_data=f"qty:{product_id}:inc"),
    )
    markup.row(
        types.InlineKeyboardButton(
            tr.get('add_to_cart_btn', '🧺 Добавить в корзину'),
            callback_data=f"add_to_cart:{product_id}"
        )
    )
    return markup


def send_product_detail(user_id: int, product: Dict[str, Any], quantity: int = 1):
    tr = get_tr(user_id)
    lang = db.get_lang(user_id)

    product_id = product.get('id')
    detailed_product = {}
    if product_id:
        try:
            detailed_product = api_client.get_product(product_id)
        except Exception:
            detailed_product = {}

    merged = {**product, **(detailed_product or {})}

    title_ru = merged.get('title') or ''
    title_uz = merged.get('title_uz') or ''
    title = title_uz if lang == 'uz' and title_uz else title_ru

    desc_ru = merged.get('description') or ''
    desc_uz = merged.get('description_uz') or ''
    raw_desc = desc_uz if lang == 'uz' and desc_uz else desc_ru
    desc = normalize_description(raw_desc)

    raw_price = merged.get('price', '0')
    price_value = str(raw_price)
    try:
        price_value = f"{int(float(raw_price)):,}".replace(",", " ")
    except Exception:
        pass

    caption_lines = [f"<b>{title}</b>", "", f"<b>{price_value} сум</b>"]
    if desc:
        caption_lines.extend(["", desc])
    caption = "\n".join(caption_lines).strip()

    # Получаем базовый URL для медиа файлов
    base_url = os.getenv('DJANGO_BASE_URL', os.getenv('DJANGO_API_URL', 'http://localhost:8000').replace('/api', ''))
    
    # Пробуем разные варианты полей для изображения
    image_ref = (
        merged.get('image') or 
        merged.get('photo_url') or 
        merged.get('image_url') or
        merged.get('photo')
    )
    
    # Если image_ref - это словарь (например, {'url': '...'}), извлекаем URL
    if isinstance(image_ref, dict):
        image_ref = image_ref.get('url') or image_ref.get('image') or str(image_ref)
    
    # Логирование для отладки
    if image_ref:
        print(f"Product {product_id} image_ref: {image_ref}, base_url: {base_url}")
    else:
        print(f"Product {product_id} has no image reference in merged data: {list(merged.keys())}")
    
    markup = build_product_inline_markup(product['id'], quantity, tr)
    sent = None
    
    try:
        # Сначала пробуем file_id (если фото уже загружено в Telegram)
        if merged.get('photo_file_id'):
            try:
                sent = bot.send_photo(user_id, merged['photo_file_id'], caption=caption, reply_markup=markup)
            except Exception as e:
                print(f"Error sending photo by file_id: {e}")
        
        # Если не получилось с file_id, пробуем локальный файл
        if not sent and image_ref:
            local_path = resolve_local_media_path(image_ref)
            if local_path and os.path.exists(local_path):
                try:
                    print(f"Trying to send local photo from: {local_path}")
                    with open(local_path, 'rb') as photo:
                        sent = bot.send_photo(user_id, photo, caption=caption, reply_markup=markup)
                    print(f"Successfully sent local photo")
                except Exception as e:
                    print(f"Error sending local photo from {local_path}: {e}")
                    import traceback
                    traceback.print_exc()
        
        # Если локальный файл не найден или не работает, пробуем URL (только если это публичный URL)
        if not sent and image_ref:
            image_url = extract_image_url(image_ref, base_url)
            if image_url:
                # Проверяем, что это не localhost/127.0.0.1 (Telegram не может их загрузить)
                if 'localhost' in image_url or '127.0.0.1' in image_url:
                    print(f"Skipping localhost URL (not accessible by Telegram): {image_url}")
                else:
                    try:
                        print(f"Trying to send photo from URL: {image_url}")
                        sent = bot.send_photo(user_id, image_url, caption=caption, reply_markup=markup)
                        print(f"Successfully sent photo from URL")
                    except Exception as e:
                        print(f"Error sending photo from URL {image_url}: {e}")
        
        # Если фото не найдено или не удалось отправить, отправляем только текст
        if not sent:
            print(f"Could not send photo for product {product_id}, sending text only")
            sent = bot.send_message(user_id, caption, reply_markup=markup)
    except Exception as e:
        print(f"Error in send_product_detail for product {product_id}: {e}")
        import traceback
        traceback.print_exc()
        # В случае ошибки отправляем хотя бы текст с информацией о продукте
        try:
            sent = bot.send_message(user_id, caption, reply_markup=markup)
        except Exception:
            pass

    state_data = get_state(user_id)['data']
    state_data['selected_product_id'] = product['id']
    state_data['selected_quantity'] = quantity
    state_data['product_message_id'] = sent.message_id
    state_data['active_products_category'] = {
        'products': get_state(user_id)['data'].get('products', []),
        'category_id': get_state(user_id)['data'].get('category_id'),
        'category_slug': get_state(user_id)['data'].get('category_slug'),
        'category_name': get_state(user_id)['data'].get('category_name'),
    }
    set_state(user_id, 'product_detail')


def show_products_category(user_id: int, category_slug: Optional[str] = None, category_id: Optional[int] = None):
    """Показать продукты выбранной категории в виде ReplyKeyboard."""
    tr = get_tr(user_id)
    lang = db.get_lang(user_id)
    
    try:
        # Получаем продукты из API по slug или id категории
        prods = api_client.get_products(category_slug=category_slug, category_id=category_id)
        
        if not prods:
            bot.send_message(
                user_id, 
                t(user_id, 'no_products_in_category'), 
                reply_markup=kb.kb_catalog_menu(tr)
            )
            return
        
        # Сохраняем продукты в state
        prepared = []
        for p in prods:
            title = p.get('title') or ''
            title_uz = p.get('title_uz') or ''
            display_title = title if lang != 'uz' or not title_uz else title_uz
            if len(display_title) > 32:
                display_title_btn = display_title[:29] + '...'
            else:
                display_title_btn = display_title
            prod_copy = dict(p)
            prod_copy['_button_title'] = display_title_btn
            prod_copy['_full_title'] = display_title
            prod_copy.setdefault('title', title)
            prod_copy.setdefault('description', p.get('description', ''))
            prepared.append(prod_copy)

        state_data = get_state(user_id)['data']
        state_data['products'] = prepared

        product_kb = build_product_reply_kb({**tr, '_lang': lang}, prepared)
        bot.send_message(user_id, tr.get('choose_product', 'Выберите продукт из списка ниже:'), reply_markup=product_kb)
        
    except Exception as e:
        # Fallback к ORM если API недоступен
        try:
            prods = db.list_products()
            if not prods:
                bot.send_message(user_id, t(user_id, 'no_products_in_category'), reply_markup=kb.kb_catalog_menu(tr))
                return
            prepared = []
            for p in prods:
                display_title = p.get('name', '')
                if len(display_title) > 32:
                    display_title_btn = display_title[:29] + '...'
                else:
                    display_title_btn = display_title
                prod_copy = dict(p)
                prod_copy['_button_title'] = display_title_btn
                prod_copy['_full_title'] = display_title
                prod_copy['title'] = p.get('name', '')
                prod_copy['description'] = p.get('description', '')
                prepared.append(prod_copy)
            get_state(user_id)['data']['products'] = prepared
            fallback_kb = build_product_reply_kb({**tr, '_lang': lang}, prepared)
            bot.send_message(user_id, tr.get('choose_product', 'Выберите продукт из списка ниже:'), reply_markup=fallback_kb)
        except Exception:
            bot.send_message(user_id, tr.get('error', 'Ошибка загрузки продуктов'))


def show_cart(user_id: int, preserve_reply_markup: Optional[types.ReplyKeyboardMarkup] = None):
    """Показать корзину с inline-кнопками, сохраняя reply-клавиатуру"""
    items = db.get_cart(user_id)
    tr = get_tr(user_id)
    
    if not items:
        reply_markup = preserve_reply_markup or kb.kb_main(tr)
        bot.send_message(user_id, tr['cart_empty'], reply_markup=reply_markup)
        return
    
    cart_text = format_cart(user_id)
    cart_markup = kb.ikb_cart(tr, items)
    
    # В Telegram можно одновременно отправить inline-кнопки и сохранить reply-клавиатуру
    # Если нужно сохранить reply-клавиатуру, отправляем её отдельным сообщением после корзины
    # Но сначала отправляем корзину с inline-кнопками
    bot.send_message(user_id, cart_text, reply_markup=cart_markup)
    
    # Если нужно сохранить reply-клавиатуру, отправляем её отдельным сообщением
    # Используем валидный текст, который Telegram принимает
    if preserve_reply_markup:
        # Отправляем сообщение с reply-клавиатурой для её сохранения
        # Используем текст, который пользователь может проигнорировать
        bot.send_message(user_id, tr.get('your_cart', 'Корзина'), reply_markup=preserve_reply_markup)


if __name__ == '__main__':
    db.init_db()
    bot.infinity_polling(skip_pending=True)
