// Определяем API URL - используем Next.js API прокси для избежания CORS проблем
function getApiBaseUrl(): string {
  // Используем относительный путь через Next.js API прокси
  // Прокси будет делать запросы на сервере (без CORS ограничений)
  return '/api-proxy/api';
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
  
  // apiBaseUrl уже содержит '/api-proxy/api', просто добавляем путь к ресурсу
  const url = category 
    ? `${apiBaseUrl}/products/?category__slug=${category}`
    : `${apiBaseUrl}/products/`;
  
  console.log('[API] getProducts - hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR', 'apiBaseUrl:', apiBaseUrl, 'final URL:', url);
  
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
    // apiBaseUrl уже содержит '/api-proxy/api'
    const url = `${apiBaseUrl}/products/${id}/`;
    
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
    // apiBaseUrl уже содержит '/api-proxy/api'
    const url = `${apiBaseUrl}/categories/`;
    
    console.log('[API] getCategories - hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR', 'apiBaseUrl:', apiBaseUrl, 'final URL:', url);
    
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
  let url = `${apiBaseUrl}/admin/payments/`;
  if (status) {
    url += `?status=${encodeURIComponent(status)}`;
  }
  const response = await fetch(url, {
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
