#!/usr/bin/env python3
"""
Скрипт для скачивания иконок категорий с сайта donballon.ru
"""

import os
import requests
from urllib.parse import urljoin, urlparse
import re
from pathlib import Path

# Базовый URL сайта
BASE_URL = "https://www.donballon.ru"

# HTML фрагмент с иконками
html_fragment = '''
<div class="top-side__collections">
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/vozdushnye_shary_iz_lateksa/">
    <div class="top-side__collection-title">Воздушные шары <br> из латекса</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/f6f/nv35oxsfbm8wrq1oo70gvmd1m5o2ps4v/Vozdushnye-shary-iz-lateksa.png" srcset="/upload/iblock/f6f/nv35oxsfbm8wrq1oo70gvmd1m5o2ps4v/Vozdushnye-shary-iz-lateksa.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/vozdushnye_shary_iz_folgi/">
    <div class="top-side__collection-title">Воздушные шары <br> из фольги</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/f16/sowrah64jq8wtk3echkjjwntz11wpthi/Vozdushnye-shary-iz-folgi.png" srcset="/upload/iblock/f16/sowrah64jq8wtk3echkjjwntz11wpthi/Vozdushnye-shary-iz-folgi.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/oborudovanie_i_aksessuary/">
    <div class="top-side__collection-title">Оборудование<br>для шаров</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/056/anuxmtbd8gub0lmbboqdtzi6lhtd6kv1/Oborudovanie-dlya-sharov.png" srcset="/upload/iblock/056/anuxmtbd8gub0lmbboqdtzi6lhtd6kv1/Oborudovanie-dlya-sharov.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/tovary_dlya_prazdnika/">
    <div class="top-side__collection-title">Товары<br>для праздника</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/0d6/uugt5xtoqy0vmc6txu08m85ll6yizc05/Tovary-dlya-prazdnika.png" srcset="/upload/iblock/0d6/uugt5xtoqy0vmc6txu08m85ll6yizc05/Tovary-dlya-prazdnika.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/karnavalnye_aksessuary/">
    <div class="top-side__collection-title">Аксессуары <br> для карнавала</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/704/hmzrkjbkgjzj9h0u20fftujjew82u4oz/Aksessuary-dlya-karnavala.png" srcset="/upload/iblock/704/hmzrkjbkgjzj9h0u20fftujjew82u4oz/Aksessuary-dlya-karnavala.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/upakovka_dlya_podarkov/">
    <div class="top-side__collection-title">Праздничная <br> упаковка</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/435/eeymb8fxb4opfc8nthubaspo6o6ulaab/Prazdnichnaya-upakovka.png" srcset="/upload/iblock/435/eeymb8fxb4opfc8nthubaspo6o6ulaab/Prazdnichnaya-upakovka.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/prazdnichnaya_poligrafiya/">
    <div class="top-side__collection-title">Праздничная<br>полиграфия</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/a0f/lhfk81pn7kvc1m0ilf4yqc4q9ft01658/Prazdnichnaya-poligrafiya.png" srcset="/upload/iblock/a0f/lhfk81pn7kvc1m0ilf4yqc4q9ft01658/Prazdnichnaya-poligrafiya.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/servirovka_stola/">
    <div class="top-side__collection-title">Сервировка<br>стола</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/4f2/vf46irefja0jli23oay5thyag4fox2bn/Servirovka-stola.png" srcset="/upload/iblock/4f2/vf46irefja0jli23oay5thyag4fox2bn/Servirovka-stola.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/floristika/">
    <div class="top-side__collection-title">Флористика</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/e77/a52q7b0ld3hkjbj75y8q1qv05yvvjuxo/Floristika.png" srcset="/upload/iblock/e77/a52q7b0ld3hkjbj75y8q1qv05yvvjuxo/Floristika.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/lenty-i-banty/">
    <div class="top-side__collection-title">Ленты и<br>банты</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/df8/1hqextygibogikp8mq4vknf3nh04cf3r/Lenty-i-banty.png" srcset="/upload/iblock/df8/1hqextygibogikp8mq4vknf3nh04cf3r/Lenty-i-banty.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/svechi-i-fontany/">
    <div class="top-side__collection-title">Свечи и<br>фонтаны</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/f92/l0ue6lahrr4492ir8o6jfnmljcqnu5g5/Svechi-i-fontany.png" srcset="/upload/iblock/f92/l0ue6lahrr4492ir8o6jfnmljcqnu5g5/Svechi-i-fontany.png"></div></a></div>
   <div class="top-side__collection"><a class="top-side__collection-wrapper" href="/catalog/girlyandy_osveshchenie_fotozony/">
    <div class="top-side__collection-title">Гирлянды,<br>освещение,<br> фотозоны</div>
    <div class="top-side__collection-icon"><img alt="" class="img-responsive" src="/upload/iblock/b8f/r1yxl2w33dcf060cmzbw4zblj8ii6e9s/Girlyandy_-osveshchenie_-fotozony.png" srcset="/upload/iblock/b8f/r1yxl2w33dcf060cmzbw4zblj8ii6e9s/Girlyandy_-osveshchenie_-fotozony.png"></div></a></div>
</div>
'''

def create_downloads_folder():
    """Создает папку для скачанных иконок"""
    download_dir = Path("category_icons")
    download_dir.mkdir(exist_ok=True)
    return download_dir

def extract_image_urls(html):
    """Извлекает URL изображений из HTML"""
    # Паттерн для поиска src в img тегах
    pattern = r'src="(/upload/[^"]+\.png)"'
    matches = re.findall(pattern, html)
    
    # Преобразуем относительные URL в абсолютные
    urls = [urljoin(BASE_URL, url) for url in matches]
    
    return urls

def get_filename_from_url(url):
    """Получает имя файла из URL"""
    parsed = urlparse(url)
    return os.path.basename(parsed.path)

def download_image(url, save_path):
    """Скачивает изображение по URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            f.write(response.content)
        
        return True
    except Exception as e:
        print(f"Ошибка при скачивании {url}: {e}")
        return False

def main():
    """Основная функция"""
    print("🎈 Скачивание иконок категорий с donballon.ru")
    print("=" * 50)
    
    # Создаем папку для скачивания
    download_dir = create_downloads_folder()
    print(f"📁 Создана папка: {download_dir.absolute()}")
    
    # Извлекаем URLs изображений
    image_urls = extract_image_urls(html_fragment)
    print(f"🔍 Найдено {len(image_urls)} изображений")
    
    # Скачиваем каждое изображение
    success_count = 0
    for i, url in enumerate(image_urls, 1):
        filename = get_filename_from_url(url)
        save_path = download_dir / filename
        
        print(f"⬇️  [{i}/{len(image_urls)}] Скачивание: {filename}")
        
        if download_image(url, save_path):
            print(f"✅ Успешно: {save_path}")
            success_count += 1
        else:
            print(f"❌ Ошибка: {filename}")
    
    print("\n" + "=" * 50)
    print(f"🎉 Скачивание завершено!")
    print(f"✅ Успешно скачано: {success_count}/{len(image_urls)} файлов")
    print(f"📂 Файлы сохранены в: {download_dir.absolute()}")
    
    # Показываем список скачанных файлов
    downloaded_files = list(download_dir.glob("*.png"))
    if downloaded_files:
        print("\n📋 Скачанные файлы:")
        for file_path in sorted(downloaded_files):
            print(f"   • {file_path.name}")

if __name__ == "__main__":
    main()