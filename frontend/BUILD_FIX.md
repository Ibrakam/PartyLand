# Инструкция по исправлению ошибок сборки на сервере

## Проблема
Ошибки вида:
```
Module not found: Can't resolve '@/lib/telegram'
Module not found: Can't resolve '@/lib/api'
Module not found: Can't resolve '@/lib/utils'
```

## Решение

### 1. Убедитесь, что все файлы синхронизированы
Проверьте, что на сервере есть все файлы:
```bash
cd frontend
ls -la src/lib/
```

Должны быть файлы:
- `src/lib/api.ts`
- `src/lib/telegram.ts`
- `src/lib/utils.ts`
- `src/lib/index.ts`

### 2. Полная очистка и пересборка

Выполните на сервере:
```bash
cd frontend

# Удалить кэш и зависимости
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# Переустановить зависимости
npm install

# Запустить сборку
npm run build
```

Или используйте готовый скрипт:
```bash
cd frontend
chmod +x rebuild.sh
./rebuild.sh
```

### 3. Проверьте версию Node.js

Next.js 14 требует Node.js 18.17 или выше:
```bash
node --version
```

Если версия ниже, обновите Node.js:
```bash
# Используя nvm (рекомендуется)
nvm install 18
nvm use 18

# Или установите через пакетный менеджер вашей системы
```

### 4. Проверьте конфигурацию

Убедитесь, что файлы обновлены:
- `next.config.mjs` - должен содержать webpack конфигурацию с алиасом `@`
- `tsconfig.json` - должен содержать `baseUrl: "."` и `paths: { "@/*": ["./src/*"] }`

### 5. Если проблема сохраняется

Проверьте структуру проекта на сервере:
```bash
cd frontend
find src/lib -type f
```

Убедитесь, что структура совпадает с локальной версией.

## Альтернативное решение

Если проблема всё ещё сохраняется, попробуйте использовать относительные пути вместо алиасов (временно для отладки):

Замените в файлах:
- `@/lib/telegram` → `../lib/telegram` (для файлов в `src/app/`)
- `@/lib/api` → `../lib/api`
- `@/lib/utils` → `../lib/utils`
- `@/components/...` → `../components/...`

Но это временное решение. Лучше исправить конфигурацию webpack.

