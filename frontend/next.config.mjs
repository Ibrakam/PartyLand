import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dir, isServer }) => {
    // Используем dir из контекста Next.js - это всегда путь к корню проекта
    const projectRoot = dir;
    const srcPath = path.resolve(projectRoot, 'src');
    
    // Отладочный вывод (можно убрать после проверки)
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log('[Next.js Config] Project root:', projectRoot);
      console.log('[Next.js Config] Source path:', srcPath);
      console.log('[Next.js Config] Is server:', isServer);
    }
    
    // Настраиваем алиас для @
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': srcPath,
    };
    
    // Убедимся, что расширения файлов разрешаются правильно
    if (!config.resolve.extensions) {
      config.resolve.extensions = [];
    }
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
    extensions.forEach(ext => {
      if (!config.resolve.extensions.includes(ext)) {
        config.resolve.extensions.push(ext);
      }
    });
    
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
