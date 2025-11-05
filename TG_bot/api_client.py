"""
API Client for Django REST API
Connects the Telegram bot to the Django backend
"""
import os
import requests
from typing import Dict, Optional, List, Any, Union
from decimal import Decimal


class DjangoAPIClient:
    """Client for interacting with Django REST API"""
    
    def __init__(self, base_url: str = "http://localhost:8000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def _get(self, endpoint: str, **kwargs) -> Union[Dict, List]:
        """GET request"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        try:
            response = self.session.get(url, **kwargs, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            raise requests.RequestException(f"Request to {url} timed out")
        except requests.exceptions.ConnectionError as e:
            raise requests.RequestException(f"Failed to connect to {url}: {e}")
        except requests.exceptions.HTTPError as e:
            raise requests.RequestException(f"HTTP error {e.response.status_code} for {url}: {e}")
        except Exception as e:
            raise requests.RequestException(f"Unexpected error for {url}: {e}")
    
    def _post(self, endpoint: str, data: Dict = None, **kwargs) -> Dict:
        """POST request"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.post(url, json=data, **kwargs)
        response.raise_for_status()
        return response.json()
    
    def _put(self, endpoint: str, data: Dict = None, **kwargs) -> Dict:
        """PUT request"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.put(url, json=data, **kwargs)
        response.raise_for_status()
        return response.json()
    
    def _patch(self, endpoint: str, data: Dict = None, **kwargs) -> Dict:
        """PATCH request"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.patch(url, json=data, **kwargs)
        response.raise_for_status()
        return response.json()
    
    def _delete(self, endpoint: str, **kwargs) -> None:
        """DELETE request"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.delete(url, **kwargs)
        response.raise_for_status()
    
    # Telegram User operations
    def get_telegram_user(self, telegram_id: int) -> Optional[Dict]:
        """Get or create telegram user"""
        try:
            return self._get(f"telegram-users/{telegram_id}/")
        except requests.HTTPError:
            return None
    
    def update_telegram_user(self, telegram_id: int, data: Dict) -> Dict:
        """Update telegram user"""
        return self._patch(f"telegram-users/{telegram_id}/", data=data)
    
    def create_telegram_address(self, telegram_id: int, address: str, latitude: Optional[float] = None, longitude: Optional[float] = None) -> Dict:
        """Create address for telegram user"""
        data = {
            'user': telegram_id,
            'address': address,
            'latitude': latitude,
            'longitude': longitude
        }
        return self._post("telegram-addresses/", data=data)
    
    def get_telegram_addresses(self, telegram_id: int) -> List[Dict]:
        """Get addresses for telegram user"""
        return self._get("telegram-addresses/", params={'user_id': telegram_id})
    
    # Product operations
    def get_products(self, category_slug: Optional[str] = None, category_id: Optional[int] = None) -> List[Dict]:
        """Get all products or by category"""
        params = {}
        if category_slug:
            params['category__slug'] = category_slug
        elif category_id:
            params['category__id'] = category_id
        result = self._get("products/", params=params)
        # Если API возвращает объект с results, извлекаем список
        if isinstance(result, dict) and 'results' in result:
            return result['results']
        # Если это список, возвращаем как есть
        if isinstance(result, list):
            return result
        return []
    
    def get_product(self, product_id: int) -> Optional[Dict]:
        """Get product by ID"""
        try:
            return self._get(f"products/{product_id}/")
        except requests.HTTPError:
            return None
    
    def get_categories(self) -> List[Dict]:
        """Get all categories"""
        try:
            result = self._get("categories/")
            # Если API возвращает объект с results, извлекаем список
            if isinstance(result, dict) and 'results' in result:
                return result['results']
            # Если это список, возвращаем как есть
            if isinstance(result, list):
                return result
            # Если это не список и не dict с results, возвращаем пустой список
            print(f"Warning: Unexpected format from categories API: {type(result)}")
            return []
        except requests.RequestException as e:
            print(f"Error getting categories: {e}")
            raise
        except Exception as e:
            print(f"Unexpected error getting categories: {e}")
            raise
    
    # Cart operations (these would need to be adapted for Telegram users)
    # For now, we'll keep the bot's local cart functionality
    
    def calculate_order_total(self, items: List[Dict]) -> Decimal:
        """Calculate total for cart items"""
        total = Decimal(0)
        for item in items:
            product = self.get_product(item['product_id'])
            if product:
                total += Decimal(str(product['price'])) * item['quantity']
        return total

    # Checkout & payments
    def create_checkout(
        self,
        telegram_user_id: int,
        cart_items: List[Dict],
        comment: str = '',
        deadline_minutes: Optional[int] = None,
        address: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        delivery_time: Optional[str] = None,
    ) -> Dict:
        data = {
            'telegram_user_id': telegram_user_id,
            'cart_items': cart_items,
            'comment': comment,
        }
        if deadline_minutes:
            data['deadline_minutes'] = deadline_minutes
        if address:
            data['address'] = address
        if latitude is not None:
            data['latitude'] = latitude
        if longitude is not None:
            data['longitude'] = longitude
        if delivery_time:
            data['delivery_time'] = delivery_time
        return self._post('checkout/', data=data)

    def get_order_detail(self, order_id: int, telegram_user_id: int) -> Dict:
        return self._get(f'telegram/orders/{order_id}/', params={'telegram_user_id': telegram_user_id})

    def get_order_deadline(self, order_id: int, telegram_user_id: int) -> Dict:
        return self._get(f'orders/{order_id}/deadline/', params={'telegram_user_id': telegram_user_id})

    def submit_payment_proof(self, *, order_id: int, telegram_user_id: int, telegram_file_id: str, message_id: Optional[str] = None, comment: str = '') -> Dict:
        data = {
            'order_id': order_id,
            'telegram_user_id': telegram_user_id,
            'telegram_file_id': telegram_file_id,
            'comment': comment,
        }
        if message_id:
            data['message_id'] = message_id
        return self._post('telegram/payment/proof/', data=data)

    def remind_order(self, order_id: int, telegram_user_id: int) -> Dict:
        data = {'order_id': order_id, 'telegram_user_id': telegram_user_id}
        return self._post('telegram/order/remind/', data=data)
    
    def approve_payment_telegram(self, payment_id: int, telegram_admin_id: int) -> Dict:
        """Approve payment by Telegram admin"""
        data = {'telegram_admin_id': telegram_admin_id}
        return self._post(f'telegram/payment/{payment_id}/approve/', data=data)
    
    def reject_payment_telegram(self, payment_id: int, telegram_admin_id: int, reason: str) -> Dict:
        """Reject payment by Telegram admin"""
        data = {
            'telegram_admin_id': telegram_admin_id,
            'reason': reason
        }
        return self._post(f'telegram/payment/{payment_id}/reject/', data=data)
    
    def get_payment_proof(self, order_id: int) -> Optional[Dict]:
        """Get payment proof file_id for order"""
        try:
            # Получаем информацию о заказе и платеже
            order_data = self._get(f'telegram/orders/{order_id}/', params={})
            if order_data and order_data.get('payments'):
                # Берем последний активный платеж
                for payment in order_data['payments']:
                    if payment.get('is_active') and payment.get('proofs'):
                        # Берем последний чек
                        proof = payment['proofs'][-1]
                        # Получаем telegram_user_id из заказа
                        telegram_user_id = None
                        if order_data.get('telegram_user'):
                            # Если telegram_user это ID
                            if isinstance(order_data['telegram_user'], int):
                                telegram_user_id = order_data['telegram_user']
                            # Если это объект с telegram_id
                            elif isinstance(order_data['telegram_user'], dict):
                                telegram_user_id = order_data['telegram_user'].get('telegram_id')
                        
                        return {
                            'file_id': proof.get('telegram_file_id'),
                            'payment_id': payment.get('id'),
                            'user_id': telegram_user_id,
                        }
        except Exception as e:
            print(f"Error getting payment proof: {e}")
        return None


# Global API client instance
api_client = DjangoAPIClient(
    base_url=os.getenv('DJANGO_API_URL', 'http://localhost:8000/api')
)
