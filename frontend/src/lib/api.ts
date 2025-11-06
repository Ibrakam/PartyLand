// Определяем API URL динамически при каждом запросе
function getApiBaseUrl(): string {
  // Если указана переменная окружения, используем её
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    // Если это относительный путь, возвращаем как есть
    if (url.startsWith('/')) {
      return url;
    }
    // Полный URL - проверяем на ngrok
    if (url.includes('ngrok') || url.includes('ngrok-free.app')) {
      // Если это ngrok URL, используем прокси
      return '/api-proxy';
    }
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  
  // ВАЖНО: Работаем только на клиенте (в браузере)
  // На сервере всегда возвращаем относительный путь для прокси
  if (typeof window === 'undefined') {
    return '/api-proxy';
  }
  
  // Только на клиенте определяем по hostname
  const hostname = window.location.hostname;
  
  // Если открыто через ngrok, ИСПОЛЬЗУЕМ ПРОКСИ через Next.js
  if (hostname.includes('ngrok') || hostname.includes('ngrok-free.app')) {
    // ВСЕГДА используем относительный путь для прокси
    return '/api-proxy';
  }
  
  // Для локальной разработки используем localhost напрямую
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000/api';
  }
  
  // По умолчанию используем продакшн сервер
  return 'http://81.162.55.70:8001/api';
}

// Не вычисляем сразу, а получаем динамически
const getApiUrl = () => getApiBaseUrl();

export interface Product {
  id: number;
  title: string;
  title_uz?: string;
  description: string;
  description_uz?: string;
  price: string;
  category: string | Category; // Может быть строкой или объектом Category в детальном ответе
  image?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  name_uz?: string;
  slug: string;
  parent?: number | null;
  image?: string;
}

export interface CheckoutItemPayload {
  product_id: number;
  quantity: number;
}

export interface CheckoutPayload {
  telegram_user_id?: number;
  cart_items: CheckoutItemPayload[];
  address?: string;
  latitude?: number;
  longitude?: number;
  delivery_time?: string;
  customer_name?: string;
  customer_phone?: string;
  comment?: string;
  deadline_minutes?: number;
}

export interface CheckoutResponse {
  order_id: number;
  status: string;
  total_uzs: number;
  formatted_total: string;
  payment_link: string;
  payment_deadline_at: string;
  payment_id: number;
}

export interface PaymentProofSummary {
  id: number;
  image?: string | null;
  image_url?: string | null;
  telegram_file_id?: string | null;
  message_id?: string | null;
  submitted_by?: string | null;
  submitted_at: string;
  comment?: string;
}

export interface AdminPayment {
  id: number;
  order_id: number;
  order_status: string;
  status: string;
  provider: string;
  amount_uzs: number;
  formatted_amount: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rejection_reason: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  proofs: PaymentProofSummary[];
}

export interface AdminOrderSummary {
  id: number;
  status: string;
  formatted_total: string;
  payment_link?: string | null;
  payment_deadline_at?: string | null;
  payment_comment?: string;
  address?: string | null;
  delivery_time?: string | null;
  created_at?: string;
  items: Array<{
    id: number;
    quantity: number;
    total: number;
    product?: {
      id: number;
      title: string;
    };
  }>;
}

export interface AdminPaymentDetail {
  payment: AdminPayment;
  order: AdminOrderSummary;
}

export async function getProducts(category?: string): Promise<Product[]> {
  const apiBaseUrl = getApiUrl();
  
  // Формируем URL
  let baseUrl: string;
  if (apiBaseUrl.startsWith('/')) {
    // Относительный путь - добавляем /api
    baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
  } else {
    // Абсолютный URL
    baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
  }
  
  const url = category 
    ? `${baseUrl}/products/?category__slug=${category}`
    : `${baseUrl}/products/`;
  
  console.log('[API] getProducts - hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR', 'apiBaseUrl:', apiBaseUrl, 'baseUrl:', baseUrl, 'final URL:', url);
  
  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Django REST Framework returns paginated data with a 'results' property
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getProduct(id: number): Promise<Product> {
  try {
    const apiBaseUrl = getApiUrl();
    let baseUrl: string;
    if (apiBaseUrl.startsWith('/')) {
      baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
    } else {
      baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
    }
    const url = `${baseUrl}/products/${id}/`;
    
    console.log('[API] getProduct - hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR', 'apiBaseUrl:', apiBaseUrl, 'final URL:', url);
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const apiBaseUrl = getApiUrl();
    
    // Формируем URL
    let baseUrl: string;
    if (apiBaseUrl.startsWith('/')) {
      // Относительный путь - добавляем /api
      baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
    } else {
      // Абсолютный URL
      baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
    }
    
    const url = `${baseUrl}/categories/`;
    
    console.log('[API] getCategories - hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR', 'apiBaseUrl:', apiBaseUrl, 'baseUrl:', baseUrl, 'final URL:', url);
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Django REST Framework returns paginated data with a 'results' property
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function createCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const apiBaseUrl = getApiUrl();
  const response = await fetch(`${apiBaseUrl}/checkout/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create checkout');
  }
  return response.json();
}

export async function getAdminPayments(status = 'under_review'): Promise<AdminPayment[]> {
  const apiBaseUrl = getApiUrl();
  const url = new URL(`${apiBaseUrl}/admin/payments/`);
  if (status) {
    url.searchParams.set('status', status);
  }
  const response = await fetch(url.toString(), {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch payments');
  }
  return response.json();
}

export async function getAdminPaymentDetail(paymentId: number): Promise<AdminPaymentDetail> {
    const apiBaseUrl = getApiUrl();
    const response = await fetch(`${apiBaseUrl}/admin/payments/${paymentId}/`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to load payment');
  }
  return response.json();
}

export async function approveAdminPayment(paymentId: number): Promise<AdminPayment> {
    const apiBaseUrl = getApiUrl();
    const response = await fetch(`${apiBaseUrl}/admin/payments/${paymentId}/approve/`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to approve payment');
  }
  return response.json();
}

export async function rejectAdminPayment(paymentId: number, reason: string): Promise<AdminPayment> {
    const apiBaseUrl = getApiUrl();
    const response = await fetch(`${apiBaseUrl}/admin/payments/${paymentId}/reject/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to reject payment');
  }
  return response.json();
}
