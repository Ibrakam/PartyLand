from django.core.management.base import BaseCommand
from site_app.models import Category
from django.utils.text import slugify
import os
import re
from django.conf import settings

# Простая транслитерация для кириллицы
def transliterate(text):
    """Транслитерация кириллицы в латиницу"""
    cyrillic_to_latin = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }
    result = ''
    for char in text:
        result += cyrillic_to_latin.get(char, char)
    return result

def make_slug(text):
    """Создает slug из текста с поддержкой кириллицы"""
    # Сначала транслитерируем
    transliterated = transliterate(text)
    # Затем применяем slugify
    slug = slugify(transliterated)
    # Если все еще пустой, создаем на основе первых букв
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', transliterated.lower())[:50]
        slug = slug.strip('-')
    return slug or 'category'


class Command(BaseCommand):
    help = 'Add categories and subcategories to the database'

    def handle(self, *args, **options):
        # Определяем структуру категорий с изображениями
        categories_data = [
            {
                'name': 'Воздушные шары из латекса',
                'image': 'categories/IMG_0829.PNG',  # Используем существующее изображение
                'subcategories': [
                    'Круглые без рисунка',
                    'Круглые с рисунком',
                    'Наборы',
                ]
            },
            {
                'name': 'Воздушные шары из фольги',
                'image': 'categories/IMG_0830.PNG',  # Используем существующее изображение
                'subcategories': [
                    'Цифры',
                    'Буквы и надписи',
                    'Сердца, круги и звезды без рисунка',
                    'Сердца, круги и звезды С рисунком',
                    'Большие фигуры',
                    'Мини-фигуры',
                    'Deco Bubble',
                    'Фигуры на подставках и 3D',
                ]
            },
            {
                'name': 'Композиции из воздушных шаров с гелием',
                'image': None,  # Можно добавить изображение позже
                'subcategories': [
                    'Для детей',
                    'Для мальчиков',
                    'Для девочек',
                    'На годик',
                    'На выписку из роддома',
                    'Для взрослых',
                    'Для женщин',
                    'Для мужчин',
                    'Для родителей',
                    'Романтично',
                ]
            },
            {
                'name': 'Товары для праздника',
                'image': None,
                'subcategories': [
                    'Хлопушки',
                    'Конфетти и декор',
                    'Праздничный декор',
                    'Дым, бенгальские огни',
                ]
            },
            {
                'name': 'Свечи и фонтаны',
                'image': None,
                'subcategories': [
                    'Свечи для торта',
                    'Фонтаны для торта',
                    'Свечи декоративные',
                ]
            },
            {
                'name': 'Гирлянды, фотозоны',
                'image': None,
                'subcategories': [
                    'Гирлянды, плакаты, подвески',
                    'Занавес',
                    'Тассел и дождик',
                    'Фотозона',
                    'Пайетки',
                ]
            },
            {
                'name': 'Ленты и банты',
                'image': None,
                'subcategories': [
                    'Банты',
                    'Ленты',
                    'Лента атласная',
                ]
            },
            {
                'name': 'Сервировка стола',
                'image': None,
                'subcategories': [
                    'Одноразовые тарелки',
                    'Одноразовые стаканы',
                    'Одноразовые салфетки',
                    'Топперы',
                    'Ложки, вилки, ножи',
                    'Трубочки и палочки для коктейлей',
                    'Одноразовые скатерти',
                ]
            },
            {
                'name': 'Праздничная упаковка',
                'image': None,
                'subcategories': [
                    'Бумага и пленка',
                    'Пакеты',
                    'Коробки',
                    'Коробки для воздушных шаров',
                    'Наполнитель',
                ]
            },
            {
                'name': 'Праздничная полиграфия',
                'image': None,
                'subcategories': [
                    'Открытки',
                    'Конверты и коробки для денег',
                    'Наклейки и маркеры',
                ]
            },
        ]

        created_count = 0
        updated_count = 0

        for cat_data in categories_data:
            parent_name = cat_data['name']
            # Генерируем slug с поддержкой кириллицы
            parent_slug = make_slug(parent_name)
            image_path = cat_data.get('image')
            
            # Проверяем существование файла изображения
            image_file = None
            if image_path:
                full_image_path = os.path.join(settings.MEDIA_ROOT, image_path)
                if os.path.exists(full_image_path):
                    image_file = image_path
                    self.stdout.write(
                        self.style.SUCCESS(f'  📷 Найдено изображение: {image_path}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  ⚠ Изображение не найдено: {full_image_path}')
                    )
            
            # Убеждаемся, что slug не пустой
            if not parent_slug:
                parent_slug = slugify(parent_name) or f'category-{parent_name[:10]}'
            
            # Создаем или обновляем родительскую категорию
            # Используем update_or_create с проверкой по slug, но если slug пустой или конфликтует, создаем новую
            try:
                parent_category = Category.objects.get(slug=parent_slug, parent=None)
                # Обновляем существующую
                parent_category.name = parent_name
                if image_file:
                    parent_category.image = image_file
                parent_category.save()
                created = False
            except Category.DoesNotExist:
                # Создаем новую категорию
                parent_category = Category.objects.create(
                    name=parent_name,
                    slug=parent_slug,
                    image=image_file if image_file else None,
                    parent=None
                )
                created = True
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Создана категория: {parent_name}')
                )
                created_count += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f'↻ Обновлена категория: {parent_name}')
                )
                updated_count += 1

            # Создаем подкатегории
            for subcat_name in cat_data['subcategories']:
                # Генерируем slug с поддержкой кириллицы
                subcat_slug = make_slug(subcat_name)
                
                # Создаем или обновляем подкатегорию
                try:
                    subcategory = Category.objects.get(slug=subcat_slug)
                    # Обновляем существующую
                    subcategory.name = subcat_name
                    subcategory.parent = parent_category
                    subcategory.save()
                    created = False
                except Category.DoesNotExist:
                    # Создаем новую подкатегорию
                    subcategory = Category.objects.create(
                        name=subcat_name,
                        slug=subcat_slug,
                        parent=parent_category
                    )
                    created = True
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ Создана подкатегория: {subcat_name}')
                    )
                    created_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  ↻ Обновлена подкатегория: {subcat_name}')
                    )
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Готово! Создано: {created_count}, Обновлено: {updated_count}'
            )
        )

