from django.core.management.base import BaseCommand
from site_app.models import Category
from django.utils.text import slugify


class Command(BaseCommand):
    help = 'Add categories and subcategories to the database'

    def handle(self, *args, **options):
        # Определяем структуру категорий
        categories_data = [
            {
                'name': 'Круглые шары',
                'subcategories': [
                    'Круглые без рисунка',
                    'Круглые с рисунком',
                    'Наборы',
                ]
            },
            {
                'name': 'Фигурные шары',
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
                'name': 'Тематические шары',
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
                'name': 'Хлопушки и конфетти',
                'subcategories': [
                    'Хлопушки',
                    'Конфетти и декор',
                    'Праздничный декор',
                    'Дым, бенгальские огни',
                ]
            },
            {
                'name': 'Свечи и фонтаны',
                'subcategories': [
                    'Свечи для торта',
                    'Фонтаны для торта',
                    'Свечи декоративные',
                ]
            },
            {
                'name': 'Гирлянды и фотозоны',
                'subcategories': [
                    'Гирлянды, плакаты, подвески',
                    'Занавес',
                    'Тассел и дождик',
                    'Фотозона',
                    'Пайетки',
                ]
            },
            {
                'name': 'Банты и ленты',
                'subcategories': [
                    'Банты',
                    'Ленты',
                    'Лента атласная',
                ]
            },
            {
                'name': 'Одноразовая посуда',
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
                'name': 'Упаковка',
                'subcategories': [
                    'Бумага и пленка',
                    'Пакеты',
                    'Коробки',
                    'Коробки для воздушных шаров',
                    'Наполнитель',
                ]
            },
            {
                'name': 'Открытки и аксессуары',
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
            parent_slug = slugify(parent_name)
            
            # Создаем или получаем родительскую категорию
            parent_category, created = Category.objects.get_or_create(
                slug=parent_slug,
                defaults={'name': parent_name}
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Создана категория: {parent_name}')
                )
                created_count += 1
            else:
                # Обновляем название, если оно изменилось
                if parent_category.name != parent_name:
                    parent_category.name = parent_name
                    parent_category.save()
                    self.stdout.write(
                        self.style.WARNING(f'↻ Обновлена категория: {parent_name}')
                    )
                    updated_count += 1
                else:
                    self.stdout.write(
                        self.style.NOTICE(f'→ Категория уже существует: {parent_name}')
                    )

            # Создаем подкатегории
            for subcat_name in cat_data['subcategories']:
                subcat_slug = slugify(subcat_name)
                
                # Проверяем, существует ли уже такая подкатегория с таким же slug
                subcategory, created = Category.objects.get_or_create(
                    slug=subcat_slug,
                    defaults={
                        'name': subcat_name,
                        'parent': parent_category
                    }
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ Создана подкатегория: {subcat_name}')
                    )
                    created_count += 1
                else:
                    # Обновляем родителя и название, если нужно
                    updated = False
                    if subcategory.parent != parent_category:
                        subcategory.parent = parent_category
                        updated = True
                    if subcategory.name != subcat_name:
                        subcategory.name = subcat_name
                        updated = True
                    
                    if updated:
                        subcategory.save()
                        self.stdout.write(
                            self.style.WARNING(f'  ↻ Обновлена подкатегория: {subcat_name}')
                        )
                        updated_count += 1
                    else:
                        self.stdout.write(
                            self.style.NOTICE(f'  → Подкатегория уже существует: {subcat_name}')
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Готово! Создано: {created_count}, Обновлено: {updated_count}'
            )
        )

