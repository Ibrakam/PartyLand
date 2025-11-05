# PartyLand - Django Shop + Telegram Bot Integration

Integration of Django REST API e-commerce platform with Telegram delivery bot.

## 🚀 Quick Start

### 1. Start Django Server

Terminal 1 - Django:
```bash
./start_django.sh
```

Or manually:
```bash
cd Shop_site
source venv/bin/activate
python manage.py runserver
```

Django will be available at: http://localhost:8000

### 2. Start Telegram Bot

Terminal 2 - Bot:
```bash
./start_bot.sh
```

Or manually:
```bash
cd TG_bot
python main.py
```

### 3. Start Frontend (Optional)

Terminal 3 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:3000

## 📁 Project Structure

```
PartyLand/
├── Shop_site/                    # 🐍 Django Backend
│   ├── db.sqlite3               # 🗄️ UNIFIED DATABASE
│   ├── site_app/
│   │   ├── models.py            # TelegramUser, TelegramAddress
│   │   ├── views.py             # API views
│   │   ├── urls.py              # API routes
│   │   └── admin.py             # Admin panel
│   ├── site_proj/               # Django settings
│   └── requirements.txt         # Python dependencies
│
├── TG_bot/                       # 🤖 Telegram Bot
│   ├── main.py                   # Bot logic
│   ├── db_orm.py                 # Django ORM integration
│   ├── api_client.py             # Django API client
│   ├── keyboards.py              # Bot keyboards
│   └── requirements.txt         # Python dependencies
│
├── frontend/                     # ⚛️ Next.js Frontend
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   ├── components/           # React components
│   │   └── lib/                 # API client & utils
│   ├── package.json             # Node dependencies
│   └── README.md                # Frontend docs
│
├── start_django.sh               # Django startup
├── start_bot.sh                  # Bot startup
└── README.md                     # This file
```

## 🎯 What's Integrated

### ✅ Completed
- **Unified Database** - Single SQLite database for Django and Bot
- **Django ORM** - Bot uses Django models instead of SQL
- **Next.js Frontend** - Modern React frontend with TypeScript
- Django models for Telegram users and addresses
- REST API endpoints for Telegram bot
- API client in bot for Django communication
- Product fetching from Django API
- Type-safe ORM operations
- Automatic migrations
- Admin panel for managing users and products
- Frontend integrated with Django backend

### 🚧 In Progress
- Full cart synchronization with Django
- Order creation in Django
- Image URL support for products

## 📡 API Endpoints

Access the API documentation at:
- **Swagger**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/
- **Django Admin**: http://localhost:8000/admin/

### Key Endpoints

```
GET    /api/products/                # List products
GET    /api/products/{id}/            # Product details
GET    /api/telegram-users/{id}/     # Get/update telegram user
GET    /api/telegram-addresses/       # List addresses
POST   /api/telegram-addresses/      # Create address
```

## ⚙️ Configuration

### Environment Variables

Set `DJANGO_API_URL` for the bot:
```bash
export DJANGO_API_URL="http://localhost:8000/api"
```

### Bot Token

Get your bot token from [@BotFather](https://t.me/botfather)

Edit `TG_bot/main.py`:
```python
bot = telebot.TeleBot("YOUR_BOT_TOKEN", parse_mode='HTML')
```

### Admin Password

Edit `TG_bot/main.py`:
```python
ADMIN_PASSWORD = "your_secure_password"
```

## 🗄️ Database Models

### Django Models

**TelegramUser**
- `telegram_id` - Unique Telegram user ID
- `name`, `phone`, `language`, `birthday`
- `is_admin` - Admin flag
- Timestamps

**TelegramAddress**
- `user` - Foreign key to TelegramUser
- `address`, `latitude`, `longitude`
- Timestamps

**Order** (updated)
- Supports both web users and telegram users
- Added address and delivery_time fields
- Links to appropriate user type

## 🔧 Development

### Running Migrations

```bash
cd Shop_site
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
```

### Creating Superuser

```bash
cd Shop_site
source venv/bin/activate
python manage.py createsuperuser
```

### Adding Products

1. Go to http://localhost:8000/admin/
2. Login with superuser
3. Create Categories and Products

## 🧪 Testing

1. Start Django server: `./start_django.sh`
2. Start the bot: `./start_bot.sh`
3. Open Telegram and message your bot
4. Use `/start` command
5. Browse products (now from Django!)

## 📝 Usage

### Telegram Bot Commands

- `/start` - Start/register
- `/admin` - Admin menu (requires password)

### Main Menu
- 🛍 Заказать - Make order
- 📦 Мои заказы - View orders
- ⚙️ Настройки - Settings
- ℹ️ О нас - About

### Admin Features
- ➕ Add products
- ✏️ Edit products
- ❌ Delete products
- 📋 List products

## 🔍 How It Works

### Product Flow
```
User → Bot → Django API → Database
              ↓
         Display products
```

### Order Flow
```
User → Bot → Local Cart → Create Order → Django API
```

## 🐛 Troubleshooting

### "Can't connect to Django"
- Ensure Django server is running
- Check `DJANGO_API_URL` environment variable
- Verify port 8000 is available

### "Products not showing"
- Check Django admin for products
- Visit http://localhost:8000/api/products/
- Check bot console logs

### Database errors
```bash
cd Shop_site
python manage.py migrate
```

## 📚 Documentation

- [Integration Guide](INTEGRATION_GUIDE.md) - Detailed integration documentation
- [Django Docs](https://docs.djangoproject.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Django REST Framework](https://www.django-rest-framework.org/)

## 🤝 Contributing

1. Make changes
2. Test locally
3. Update documentation
4. Submit PR

## 📄 License

Project for learning and development purposes.

## 🎉 Features

- ✅ Bilingual support (Russian, Uzbek)
- ✅ Product catalog from Django
- ✅ Order management
- ✅ Admin panel for products
- ✅ Address management
- ✅ Cart functionality
- ✅ Fallback to local database

## 📞 Support

Check logs for issues:
- Django: Server console
- Bot: Bot console

## 🚀 Production Notes

Before deploying:

1. Set `DEBUG = False` in Django settings
2. Configure `ALLOWED_HOSTS`
3. Use environment variables for secrets
4. Use PostgreSQL instead of SQLite
5. Set up HTTPS
6. Configure proper logging
7. Use process managers (systemd, supervisor)

## 🎯 Next Steps

- [ ] Complete cart sync with Django
- [ ] Full order creation in Django
- [ ] Image upload and display
- [ ] Category filtering
- [ ] API authentication
- [ ] Order status tracking
- [ ] Payment integration

---

Happy coding! 🎉

