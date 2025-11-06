import path from 'path';
import fs from 'fs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dir, isServer }) => {
    // Используем dir из контекста Next.js - это всегда путь к корню проекта
    const projectRoot = dir;
    const srcPath = path.resolve(projectRoot, 'src');
    
    // Отладочный вывод
    console.log('[Next.js Config] Project root:', projectRoot);
    console.log('[Next.js Config] Source path:', srcPath);
    console.log('[Next.js Config] Is server:', isServer);
    
    // Проверяем существование директории src
    if (fs.existsSync(srcPath)) {
      console.log('[Next.js Config] ✓ src directory exists');
    } else {
      console.error('[Next.js Config] ✗ src directory NOT FOUND at:', srcPath);
    }
    
    // Проверяем существование lib директории
    const libPath = path.resolve(srcPath, 'lib');
    if (fs.existsSync(libPath)) {
      console.log('[Next.js Config] ✓ lib directory exists');
      const files = fs.readdirSync(libPath);
      console.log('[Next.js Config] Files in lib:', files);
    } else {
      console.error('[Next.js Config] ✗ lib directory NOT FOUND at:', libPath);
    }
    
    // Настраиваем алиас для @ - используем абсолютный путь
    const absoluteSrcPath = path.resolve(projectRoot, 'src');
    
    // Удаляем старые алиасы, если они есть, чтобы избежать конфликтов
    const existingAliases = config.resolve.alias || {};
    const newAliases = {};
    
    // Копируем существующие алиасы, кроме @
    Object.keys(existingAliases).forEach(key => {
      if (key !== '@') {
        newAliases[key] = existingAliases[key];
      }
    });
    
    // Добавляем наш алиас @
    newAliases['@'] = absoluteSrcPath;
    
    config.resolve.alias = newAliases;
    
    console.log('[Next.js Config] Alias @ resolved to:', absoluteSrcPath);
    console.log('[Next.js Config] All aliases:', Object.keys(config.resolve.alias));
    
    // Убедимся, что модули разрешаются из node_modules и src
    config.resolve.modules = [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(projectRoot, 'src'),
      'node_modules',
      ...(config.resolve.modules || []),
    ].filter((value, index, self) => self.indexOf(value) === index); // Убираем дубликаты
    
    // Убедимся, что расширения файлов разрешаются правильно
    config.resolve.extensions = [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
      ...(config.resolve.extensions || []),
    ];
    
    // Отключаем полностью разрешение только из node_modules
    config.resolve.symlinks = true;
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'publicdomainvectors.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '81.162.55.70',
        port: '8001',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
