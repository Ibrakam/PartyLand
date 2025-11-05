from telebot import types
from typing import Dict, List

# Localization strings
LANG = {
    'ru': {
        'choose_language': 'Выберите язык:',
        'choose_category_text': '📦 <b>Выберите категорию</b>',
        'webapp_info': '💡 Можете также заказать через веб-приложение:',
        'webapp_order': '🛒 Заказать через веб-апп',
        'delivery_info': '🚕 <b>Доставка через Яндекс Такси</b>\n\n✅ Мы отправляем заказ через Яндекс Такси по вашему номеру телефона\n💰 Оплата за доставку отдельно и взимается Яндекс Такси\n\n⏰ Во сколько привезти заказ?',
        'error': 'Произошла ошибка. Попробуйте позже.',
        'no_categories': 'Категории не найдены. Попробуйте позже.',
        'products_list_end': 'Используйте кнопки ниже:',
        'try_again': 'Нажмите "Назад" чтобы вернуться к выбору времени.',
        'lang_ru': '🇷🇺 Русский',
        'lang_uz': '🇺🇿 O‘zbekcha',

        'ask_name': 'Введите ваше имя:',
        'ask_phone': 'Отправьте номер телефона кнопкой ниже.',
        'send_phone_button': '📱 Отправить номер',

        'welcome': 'Добро пожаловать! Мы рады видеть вас снова 👋\nВыберите нужный раздел ниже 👇',

        'menu_order': '🛍 Заказать',
        'menu_orders': '📦 Мои заказы',
        'menu_settings': '⚙️ Настройки',
        'menu_about': 'ℹ️ О нас',
        'back': '🔙 Назад',

        'ask_address': 'Отправьте адрес доставки: геолокацию, ссылку из карт или текстом.',
        'send_location_button': '📍 Отправить локацию',
        'confirm_address': '✅ Подтвердить',
        'change_address': '✏️ Изменить адрес',
        'add_address': '➕ Добавить в мои адреса',
        'address_saved': 'Адрес добавлен в ваши адреса.',
        'address_confirmed': 'Адрес подтверждён.',
        'address_changed': 'Отправьте новый адрес.',

        'when_deliver': 'Во сколько привезти заказ?',
        'asap': '🚀 В ближайшее время',
        'choose_time': '⏰ Выбрать время',

        'times_prompt': 'Выберите время доставки:',

        'catalog_products': '🍱 Продукция',
        'catalog_sets': '🥢 Эксклюзивные сеты',
        'catalog_cart': '🛒 Корзина',

        'your_cart': 'Ваша корзина:',
        'cart_empty': 'Корзина пуста.',
        'cart_add': '➕ Добавить товар',
        'cart_clear': '🗑 Очистить корзину',
        'cart_checkout': '✅ Оформить заказ',
        'cart_continue': 'Продолжить заказ',
        'cart_remove': '❌ Удалить',
        'cart_synced': '✅ Корзина синхронизирована из веб-приложения!',

        'payment_instructions': '💳 Оплата заказа №{order_id}\nСумма: {total}\nСсылка на оплату: {link}\n⏳ До: {deadline}\nПосле оплаты пришлите фото чека одним сообщением.',
        'payment_button_pay': '💳 Оплатить',
        'payment_button_send_proof': '📸 Отправить чек',
        'payment_button_remind': '🔔 Напомнить позже',
        'payment_proof_prompt': 'Отправьте фото чека одним сообщением. Сделайте фото ближе, чтобы были видны сумма и время.',
        'payment_proof_received': '✅ Чек получен. Статус: на проверке.',
        'payment_proof_duplicate': 'Этот чек уже получен и находится на проверке.',
        'payment_remind_sent': 'Напоминание отправим ближе к дедлайну.',
        'admin_view_proof': '👁 Посмотреть чек',
        'admin_approve': '✅ Подтвердить',
        'admin_reject': '❌ Отклонить',
        'payment_approved': '🎉 Ваш заказ №{order_id} подтвержден! Спасибо за оплату.',
        'payment_rejected': '❌ К сожалению, ваш чек к заказу №{order_id} был отклонен. Пожалуйста, пришлите корректный чек или свяжитесь с поддержкой.',
        'payment_deadline_expired': '⏰ Срок оплаты истёк. Если вы уже оплатили, свяжитесь с поддержкой.',
        'payment_under_review': 'Статус: на проверке.',
        'payment_paid': '🎉 Оплата подтверждена! Заказ №{order_id} перешёл в обработку.',
        'payment_rejected': '❌ Чек отклонён: {reason}. Пожалуйста, пришлите корректный чек или свяжитесь с поддержкой.',
        'payment_canceled': 'Заказ отменён. Если это ошибка, оформите новый заказ.',
        'payment_error': 'Не удалось обработать запрос. Попробуйте позже или свяжитесь с поддержкой.',
        'status_pending_payment_link': 'Ожидает оплаты',
        'status_awaiting_proof': 'Ждём чек',
        'status_under_review': 'На проверке',
        'status_paid': 'Оплачен',
        'status_rejected': 'Отклонён',
        'status_canceled': 'Отменён',
        'order_created_label': 'Создан:',
        'order_address_label': 'Адрес:',
        'order_delivery_label': 'Доставка:',
        'order_total_label': 'Сумма:',

        'order_confirmed': 'Ваш заказ на сумму {sum} сум успешно оформлен!\nВремя доставки: {time}.\nСпасибо за заказ ❤️',
        'orders_none': 'Вы ещё не делали заказов.',

        'settings': 'Настройки',
        'settings_language': '🌐 Изменить язык',
        'settings_phone': '📱 Изменить номер телефона',
        'settings_birthday': '🎂 Добавить день рождения',

        'about_text': 'О нас: мы доставляем вкусные блюда быстро и с любовью ❤️',

        'admin_menu': 'Админ-панель',
        'admin_add': '➕ Добавить продукт',
        'admin_edit': '✏️ Изменить продукт',
        'admin_delete': '❌ Удалить продукт',
        'admin_list': '📋 Просмотреть список товаров',
        'not_admin': 'У вас нет прав администратора.',

        'enter_product_name': 'Введите название продукта:',
        'choose_category': 'Выберите категорию:',
        'category_product': 'Продукция',
        'category_set': 'Эксклюзивный сет',
        'enter_price': 'Введите цену (в сумах, целое число):',
        'enter_description': 'Введите описание (или - для пропуска):',
        'send_photo': 'Отправьте фото товара (или - для пропуска):',
        'saved': 'Сохранено.',
        'product_created': 'Товар создан с ID: {id}',
        'enter_product_id': 'Введит�� ID товара:',
        'product_not_found': 'Товар не найден.',
        'what_edit': 'Что изменить?',
        'edit_name': 'Название',
        'edit_category': 'Категория',
        'edit_price': 'Цена',
        'edit_description': 'Описание',
        'edit_photo': 'Фото',
        'deleted': 'Удалено.',
        'are_you_sure_delete': 'Вы уверены, что хотите удалить товар ID {id}? Введите "да" для подтверждения.',
        'yes': 'да',

        'phone_updated': 'Номер телефона обновлен.',
        'birthday_prompt': 'Введите дату рождения в формате ГГГГ-ММ-ДД:',
        'birthday_saved': 'День рождения сохранён.',

        'select_from_menu': 'Выберите пункт меню.',
        'added_to_cart': 'Товар добавлен в корзину.',
        'no_products_in_category': 'В этой категории пока нет товаров.',
        'choose_product': 'Выберите продукт из списка ниже:',
        'add_to_cart_btn': '🧺 Добавить в корзину',
        'product_more_link': 'Подробнее',

        'admin_login': 'Введите пароль администратора:',
        'admin_login_success': 'Вы успешно вошли как администратор.',
        'admin_login_failed': 'Неверный пароль администратора.',
    },
    'uz': {
        'choose_language': 'Tilni tanlang:',
        'choose_category_text': '📦 <b>Kategoriya tanlang</b>',
        'webapp_info': '💡 Shuningdek, veb-ilova orqali buyurtma berishingiz mumkin:',
        'webapp_order': '🛒 Veb-ilova orqali buyurtma berish',
        'delivery_info': '🚕 <b>Yandex Taksi orqali yetkazib berish</b>\n\n✅ Biz buyurtmani telefon raqamingiz bo\'yicha Yandex Taksi orqali yuboramiz\n💰 Yetkazib berish uchun to\'lov alohida va Yandex Taksi tomonidan olinadi\n\n⏰ Buyurtmani qachon yetkazib beraylik?',
        'error': 'Xatolik yuz berdi. Keyinroq urinib ko\'ring.',
        'no_categories': 'Kategoriyalar topilmadi. Keyinroq urinib ko\'ring.',
        'products_list_end': 'Quyidagi tugmalardan foydalaning:',
        'try_again': 'Orqaga tugmasini bosing va vaqtni qayta tanlang.',
        'lang_ru': '🇷🇺 Русский',
        'lang_uz': '🇺🇿 O‘zbekcha',

        'ask_name': 'Ismingizni yozing:',
        'ask_phone': 'Quyidagi tugma orqali telefon raqamingizni yuboring.',
        'send_phone_button': '📱 Raqamni yuborish',

        'welcome': 'Xush kelibsiz! Sizni yana ko‘rib turganimizdan xursandmiz 👋\nQuyidagi bo‘limlardan birini tanlang 👇',

        'menu_order': '🛍 Buyurtma',
        'menu_orders': '📦 Buyurtmalarim',
        'menu_settings': '⚙️ Sozlamalar',
        'menu_about': 'ℹ️ Biz haqimizda',
        'back': '🔙 Orqaga',

        'ask_address': 'Yetkazib berish manzilini yuboring: geolokatsiya, xarita havolasi yoki matn.',
        'send_location_button': '📍 Geolokatsiya yuborish',
        'confirm_address': '��� Tasdiqlash',
        'change_address': '✏️ Manzilni o‘zgartirish',
        'add_address': '➕ Manzillarimga qo‘shish',
        'address_saved': 'Manzil saqlandi.',
        'address_confirmed': 'Manzil tasdiqlandi.',
        'address_changed': 'Yangi manzil yuboring.',

        'when_deliver': 'Buyurtmani qachon yetkazib beraylik?',
        'asap': '🚀 Eng yaqin vaqtda',
        'choose_time': '⏰ Vaqtni tanlash',

        'times_prompt': 'Yetkazib berish vaqtini tanlang:',

        'catalog_products': '🍱 Mahsulotlar',
        'catalog_sets': '🥢 Eksklyuziv setlar',
        'catalog_cart': '🛒 Savat',

        'your_cart': 'Savatdagi mahsulotlar:',
        'cart_empty': 'Savat bo‘sh.',
        'cart_add': '➕ Tovar qo‘shish',
        'cart_clear': '🗑 Savatni tozalash',
        'cart_checkout': '✅ Buyurtmani rasmiylashtirish',
        'cart_continue': 'Buyurtmani davom ettirish',
        'cart_remove': '❌ O‘chirish',
        'cart_synced': '✅ Savat veb-ilovadan sinxronlashtirildi!',

        'payment_instructions': '💳 Buyurtma №{order_id} uchun to‘lov\nSummasi: {total}\nTo‘lov havolasi: {link}\n⏳ Muddati: {deadline}\nTo‘lovdan so‘ng, chek fotosini bitta xabar bilan yuboring.',
        'payment_button_pay': '💳 To‘lash',
        'payment_button_send_proof': '📸 Chek yuborish',
        'payment_button_remind': '🔔 Keyinroq eslatish',
        'payment_proof_prompt': 'Chek fotosini bitta xabar bilan yuboring. Summa va vaqt aniq ko‘rinsin.',
        'payment_proof_received': '✅ Chek qabul qilindi. Tekshirilmoqda.',
        'payment_proof_duplicate': 'Bu chek allaqachon qabul qilingan va tekshiruvda.',
        'payment_remind_sent': 'Muddati yaqinlashganda eslatma yuboramiz.',
        'admin_view_proof': '👁 Chekni ko\'rish',
        'admin_approve': '✅ Tasdiqlash',
        'admin_reject': '❌ Rad etish',
        'payment_approved': '🎉 Sizning №{order_id} buyurtmangiz tasdiqlandi! To\'lov uchun rahmat.',
        'payment_rejected': '❌ Afsuski, №{order_id} buyurtmangiz uchun chek rad etildi. Iltimos, to\'g\'ri chek yuboring yoki qo\'llab-quvvatlashga murojaat qiling.',
        'payment_deadline_expired': '⏰ To‘lov muddati tugagan. Agar allaqachon to‘lagan bo‘lsangiz, qo‘llab-quvvatlashga murojaat qiling.',
        'payment_under_review': 'Holat: tekshiruvda.',
        'payment_paid': '🎉 To‘lov tasdiqlandi! №{order_id} buyurtma qayta ishlanmoqda.',
        'payment_rejected': '❌ Chek rad etildi: {reason}. Iltimos, to‘g‘ri chek yuboring yoki qo‘llab-quvvatlashga murojaat qiling.',
        'payment_canceled': 'Buyurtma bekor qilindi. Agar bu xato bo‘lsa, yangi buyurtma yarating.',
        'payment_error': 'So‘rovni bajarib bo‘lmadi. Keyinroq urinib ko‘ring yoki qo‘llab-quvvatlashga yozing.',
        'status_pending_payment_link': 'To‘lov havolasi kutilmoqda',
        'status_awaiting_proof': 'Chek kutilmoqda',
        'status_under_review': 'Tekshiruvda',
        'status_paid': 'To‘langan',
        'status_rejected': 'Rad etilgan',
        'status_canceled': 'Bekor qilingan',
        'order_created_label': 'Yaratilgan:',
        'order_address_label': 'Manzil:',
        'order_delivery_label': 'Yetkazib berish:',
        'order_total_label': 'Summa:',

        'order_confirmed': 'Sizning {sum} so‘mga teng buyurtmangiz rasmiylashtirildi!\nYetkazib berish vaqti: {time}.\nBuyurtma uchun rahmat ❤️',
        'orders_none': 'Siz hali buyurtma qilmagansiz.',

        'settings': 'Sozlamalar',
        'settings_language': '🌐 Tilni o‘zgartirish',
        'settings_phone': '📱 Telefon raqamini o‘zgartirish',
        'settings_birthday': '🎂 Tug‘ilgan kun qo‘shish',

        'about_text': 'Biz haqimizda: mazali taomlarni tez va mehr bilan yetkazib beramiz ❤️',

        'admin_menu': 'Admin panel',
        'admin_add': '➕ Mahsulot qo‘shish',
        'admin_edit': '✏️ Mahsulotni tahrirlash',
        'admin_delete': '❌ Mahsulotni o‘chirish',
        'admin_list': '📋 Tovarlar ro‘yxati',
        'not_admin': 'Sizda administrator huquqlari yo‘q.',

        'enter_product_name': 'Mahsulot nomini kiriting:',
        'choose_category': 'Kategoriya tanlang:',
        'category_product': 'Mahsulot',
        'category_set': 'Eksklyuziv set',
        'enter_price': 'Narxni kiriting (so‘m, butun son):',
        'enter_description': 'Tavsifni kiriting (yoki - bilan o‘tkazing):',
        'send_photo': 'Mahsulot fotosini yuboring (yoki - bilan o‘tkazing):',
        'saved': 'Saqlandi.',
        'product_created': 'Mahsulot yaratildi. ID: {id}',
        'enter_product_id': 'Mahsulot ID sini kiriting:',
        'product_not_found': 'Mahsulot topilmadi.',
        'what_edit': 'Nimani o‘zgartiramiz?',
        'edit_name': 'Nomi',
        'edit_category': 'Kategoriya',
        'edit_price': 'Narxi',
        'edit_description': 'Tavsif',
        'edit_photo': 'Foto',
        'deleted': 'O‘chirildi.',
        'are_you_sure_delete': 'ID {id} mahsulotni o‘chirishni tasdiqlang. Tasdiqlash uchun "ha" deb yozing.',
        'yes': 'ha',

        'phone_updated': 'Telefon raqami yangilandi.',
        'birthday_prompt': 'Tug‘ilgan kun: YYYY-MM-DD formatda yuboring:',
        'birthday_saved': 'Tug‘ilgan kun saqlandi.',

        'select_from_menu': 'Menyudan tanlang.',
        'added_to_cart': 'Mahsulot savatga qo‘shildi.',
        'no_products_in_category': 'Bu toifada hozircha mahsulot yo‘q.',
        'choose_product': 'Quyidagi ro‘yxatdan mahsulotni tanlang:',
        'add_to_cart_btn': '🧺 Savatga qo‘shish',
        'product_more_link': "Batafsil",

        'admin_login': 'Admin parolini kiriting:',
        'admin_login_success': 'Siz admin sifatida tizimga kirdingiz.',
        'admin_login_failed': 'Admin paroli noto‘g‘ri.',
    }
}


def kb_language() -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(LANG['ru']['lang_ru']), types.KeyboardButton(LANG['ru']['lang_uz']))
    return kb


def kb_main(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    kb.add(types.KeyboardButton(tr['menu_order']))
    kb.add(types.KeyboardButton(tr['menu_orders']))
    kb.add(types.KeyboardButton(tr['menu_settings']))
    kb.add(types.KeyboardButton(tr['menu_about']))
    return kb


def kb_phone(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    kb.add(types.KeyboardButton(tr['send_phone_button'], request_contact=True))
    return kb


def kb_location_request(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(tr['send_location_button'], request_location=True))
    kb.add(types.KeyboardButton(tr['back']))
    return kb


def kb_address_confirm(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(tr['confirm_address']))
    kb.add(types.KeyboardButton(tr['change_address']))
    kb.add(types.KeyboardButton(tr['add_address']))
    kb.add(types.KeyboardButton(tr['back']))
    return kb


def kb_time_choice(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    """Клавиатура выбора времени - только Сейчас/Выбрать время + Назад"""
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    # Первый ряд: две кнопки
    kb.add(
        types.KeyboardButton(tr['asap']),
        types.KeyboardButton(tr['choose_time'])
    )
    # Второй ряд: Назад
    kb.add(types.KeyboardButton(tr['back']))
    return kb


def kb_time_slots(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    row = []
    for hour in range(10, 21):  # 10:00 to 20:00
        label = f"{hour:02d}:00"
        row.append(types.KeyboardButton(label))
        if len(row) == 3:
            kb.add(*row)
            row = []
    if row:
        kb.add(*row)
    kb.add(types.KeyboardButton(tr['back']))
    return kb


def kb_catalog_menu(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    """Клавиатура каталога - Корзина + Назад в один ряд"""
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(tr['catalog_cart']))
    kb.add(types.KeyboardButton(tr['back']))
    return kb


def kb_categories(tr: Dict[str, str], categories: List[Dict]) -> types.ReplyKeyboardMarkup:
    """Клавиатура категорий 2x2 + Назад + Корзина"""
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    
    # Определяем язык из tr (если передается)
    # Если нет, используем русский по умолчанию
    use_uz = tr.get('_lang') == 'uz'
    
    # Разбиваем на пары по 2 кнопки в ряд
    for i in range(0, len(categories), 2):
        row = []
        # Добавляем первую кнопку в ряду
        cat = categories[i]
        cat_name = cat.get('name_uz') if use_uz and cat.get('name_uz') else cat.get('name', '')
        if cat_name:
            row.append(types.KeyboardButton(cat_name))
        
        # Если есть вторая кнопка в ряду
        if i + 1 < len(categories):
            cat2 = categories[i + 1]
            cat2_name = cat2.get('name_uz') if use_uz and cat2.get('name_uz') else cat2.get('name', '')
            if cat2_name:
                row.append(types.KeyboardButton(cat2_name))
        
        if row:
            kb.add(*row)
    
    # Добавляем Корзину и Назад в последний ряд (2 кнопки)
    kb.add(
        types.KeyboardButton(tr['catalog_cart']),
        types.KeyboardButton(tr['back'])
    )
    return kb


def kb_webapp_button(tr: Dict[str, str], webapp_url: str) -> types.InlineKeyboardMarkup:
    """Кнопка для веб-апп Telegram"""
    kb = types.InlineKeyboardMarkup()
    webapp_text = tr.get('webapp_order', '🛒 Заказать через веб-апп')
    kb.add(types.InlineKeyboardButton(webapp_text, web_app=types.WebAppInfo(url=webapp_url)))
    return kb


def kb_cart(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(tr['cart_add']))
    kb.add(types.KeyboardButton(tr['cart_clear']))
    kb.add(types.KeyboardButton(tr['cart_checkout']))
    kb.add(types.KeyboardButton(tr['back']))
    return kb


def ikb_cart(tr: Dict[str, str], cart_items: List[tuple]) -> types.InlineKeyboardMarkup:
    """Inline клавиатура для корзины с кнопками удаления для каждого товара"""
    kb = types.InlineKeyboardMarkup()
    
    # Добавляем кнопку удаления для каждого товара
    for product, qty in cart_items:
        product_id = product.get('id')
        product_name = product.get('name') or product.get('title') or 'Товар'
        # Ограничиваем длину названия для кнопки
        if len(product_name) > 30:
            product_name = product_name[:27] + '...'
        # Кнопка удаления товара с иконкой X
        kb.add(types.InlineKeyboardButton(
            f"❌ {product_name}",
            callback_data=f"remove_cart:{product_id}"
        ))
    
    # Кнопки действий
    kb.add(types.InlineKeyboardButton(
        tr['cart_continue'],
        callback_data="cart_continue"
    ))
    kb.add(types.InlineKeyboardButton(
        tr['cart_checkout'],
        callback_data="cart_checkout"
    ))
    
    return kb


def ikb_payment_actions(tr: Dict[str, str], payment_link: str, order_id: int) -> types.InlineKeyboardMarkup:
    kb = types.InlineKeyboardMarkup()
    kb.add(types.InlineKeyboardButton(tr['payment_button_pay'], url=payment_link))
    kb.add(types.InlineKeyboardButton(tr['payment_button_send_proof'], callback_data=f'send_proof:{order_id}'))
    kb.add(types.InlineKeyboardButton(tr['payment_button_remind'], callback_data=f'remind:{order_id}'))
    return kb


def ikb_admin_view_proof(tr: Dict[str, str], order_id: int) -> types.InlineKeyboardMarkup:
    """Клавиатура для админа: кнопка просмотра чека"""
    kb = types.InlineKeyboardMarkup()
    kb.add(types.InlineKeyboardButton(tr['admin_view_proof'], callback_data=f'view_proof:{order_id}'))
    return kb


def ikb_admin_proof_actions(tr: Dict[str, str], order_id: int, payment_id: int) -> types.InlineKeyboardMarkup:
    """Клавиатура для админа: подтвердить/отклонить чек"""
    kb = types.InlineKeyboardMarkup()
    kb.add(
        types.InlineKeyboardButton(tr['admin_approve'], callback_data=f'approve_payment:{payment_id}:{order_id}'),
        types.InlineKeyboardButton(tr['admin_reject'], callback_data=f'reject_payment:{payment_id}:{order_id}')
    )
    return kb


def kb_settings(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(tr['settings_language']))
    kb.add(types.KeyboardButton(tr['settings_phone']))
    kb.add(types.KeyboardButton(tr['settings_birthday']))
    kb.add(types.KeyboardButton(tr['back']))
    return kb


def kb_admin(tr: Dict[str, str]) -> types.ReplyKeyboardMarkup:
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(tr['admin_add']))
    kb.add(types.KeyboardButton(tr['admin_edit']))
    kb.add(types.KeyboardButton(tr['admin_delete']))
    kb.add(types.KeyboardButton(tr['admin_list']))
    kb.add(types.KeyboardButton(tr['back']))
    return kb
