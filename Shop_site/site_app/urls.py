from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    CategoryViewSet,
    ProductViewSet,
    CartViewSet,
    FavoriteViewSet,
    OrderViewSet,
    RegisterView,
    MeView,
    TelegramUserViewSet,
    TelegramAddressViewSet,
    CheckoutView,
    OrderDeadlineView,
    TelegramPaymentProofView,
    TelegramOrderRemindView,
    AdminPaymentListView,
    AdminPaymentDetailView,
    AdminPaymentApproveView,
    AdminPaymentRejectView,
    AdminOrderCancelView,
    TelegramOrderDetailView,
    TelegramPaymentApproveView,
    TelegramPaymentRejectView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'telegram-users', TelegramUserViewSet, basename='telegram-user')
router.register(r'telegram-addresses', TelegramAddressViewSet, basename='telegram-address')

urlpatterns = [
    path('', include(router.urls)),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('orders/<int:order_id>/deadline/', OrderDeadlineView.as_view(), name='order-deadline'),
    path('telegram/orders/<int:order_id>/', TelegramOrderDetailView.as_view(), name='telegram-order-detail'),
    path('telegram/payment/proof/', TelegramPaymentProofView.as_view(), name='telegram-payment-proof'),
    path('telegram/order/remind/', TelegramOrderRemindView.as_view(), name='telegram-order-remind'),
    path('telegram/payment/<int:payment_id>/approve/', TelegramPaymentApproveView.as_view(), name='telegram-payment-approve'),
    path('telegram/payment/<int:payment_id>/reject/', TelegramPaymentRejectView.as_view(), name='telegram-payment-reject'),
    path('admin/payments/', AdminPaymentListView.as_view(), name='admin-payment-list'),
    path('admin/payments/<int:payment_id>/', AdminPaymentDetailView.as_view(), name='admin-payment-detail'),
    path('admin/payments/<int:payment_id>/approve/', AdminPaymentApproveView.as_view(), name='admin-payment-approve'),
    path('admin/payments/<int:payment_id>/reject/', AdminPaymentRejectView.as_view(), name='admin-payment-reject'),
    path('admin/orders/<int:order_id>/cancel/', AdminOrderCancelView.as_view(), name='admin-order-cancel'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
]
