import logging
import uuid
from decimal import Decimal
from datetime import timedelta
from typing import List, Optional, Tuple

import requests
from django.conf import settings
from django.db import transaction
from django.db.models import Sum, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.exceptions import ValidationError, NotFound

from .models import Category, Product, CartItem, Favorite, Order, OrderProduct, TelegramUser, TelegramAddress, Payment, PaymentProof, format_sum

logger = logging.getLogger(__name__)
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    CartItemSerializer,
    CartItemCreateSerializer,
    CartSerializer,
    FavoriteSerializer,
    FavoriteCreateSerializer,
    OrderSerializer,
    UserRegisterSerializer,
    UserSerializer,
    TelegramUserSerializer,
    TelegramAddressSerializer,
    CheckoutRequestSerializer,
    CheckoutResponseSerializer,
    OrderDeadlineSerializer,
    PaymentProofCreateSerializer,
    PaymentSerializer,
    PaymentModerationSerializer,
    OrderCancelSerializer,
)


DEFAULT_PAYMENT_DEADLINE_MINUTES = getattr(settings, 'PAYMENT_DEADLINE_MINUTES', 180)


def generate_payment_link(provider: str = 'link') -> str:
    base_url = getattr(settings, 'PAYMENT_LINK_BASE_URL', 'https://pay.partyland.uz/i/')
    suffix = uuid.uuid4().hex[:10]
    return f"{base_url}{suffix}"


def send_telegram_notification(telegram_user: Optional[TelegramUser], message: str) -> None:
    bot_token = getattr(settings, 'BOT_TOKEN', '')
    if not telegram_user or not bot_token:
        return
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    try:
        requests.post(url, json={"chat_id": telegram_user.telegram_id, "text": message}, timeout=10)
    except requests.RequestException as exc:  # pragma: no cover
        logger.warning("Failed to send telegram notification: %s", exc)


def notify_admin_new_order(order: Order) -> None:
    """
    Отправляет уведомление всем админам в Telegram о новом заказе.
    """
    bot_token = getattr(settings, 'BOT_TOKEN', '')
    if not bot_token:
        logger.warning("BOT_TOKEN not configured, skipping admin notification")
        return

    # Получаем всех админов из базы данных
    admin_users = TelegramUser.objects.filter(is_admin=True)
    if not admin_users.exists():
        # Fallback: используем ADMIN_TELEGRAM_CHAT_ID из settings если есть
        admin_chat_id = getattr(settings, 'ADMIN_TELEGRAM_CHAT_ID', '')
        if admin_chat_id:
            admin_ids = [int(admin_chat_id)]
        else:
            logger.warning("No admin users found in database and ADMIN_TELEGRAM_CHAT_ID not set")
            return
    else:
        admin_ids = [admin.telegram_id for admin in admin_users]

    # Формируем сообщение
    lines = [
        f"🔔 <b>Новый заказ #{order.pk}</b>",
    ]
    
    # Определяем источник заказа
    source_label = order.source_label()
    if source_label == "Website":
        lines.append("🌐 Источник: Сайт")
    elif source_label == "Telegram":
        lines.append("💬 Источник: Telegram бот")
    else:
        lines.append(f"📱 Источник: {source_label}")

    # Информация о клиенте
    if order.telegram_user:
        lines.append(f"👤 Клиент: {order.telegram_user.name or f'TG {order.telegram_user.telegram_id}'}")
        if order.telegram_user.phone:
            lines.append(f"📞 Телефон: {order.telegram_user.phone}")
    elif order.customer_name:
        lines.append(f"👤 Имя: {order.customer_name}")
    if order.customer_phone:
        lines.append(f"📞 Контакт: {order.customer_phone}")

    # Адрес доставки
    if order.address:
        if order.latitude and order.longitude:
            lines.append(f"📍 Адрес: {order.address} (координаты: {order.latitude:.6f}, {order.longitude:.6f})")
        else:
            lines.append(f"📍 Адрес: {order.address}")
    else:
        lines.append("📍 Адрес: Не указан")

    # Время доставки
    if order.delivery_time:
        lines.append(f"⏰ Время доставки: {order.delivery_time}")
    
    # Комментарий
    if order.payment_comment:
        lines.append(f"💬 Комментарий: {order.payment_comment}")

    lines.append("")
    lines.append("🧾 Состав заказа:")

    # Товары из заказа
    for item in order.order_products.all():
        lines.append(
            f"• {item.product_title} × {item.quantity} — {format_sum(item.total_price)}"
        )

    lines.append("")
    lines.append(f"💰 Итого: <b>{order.formatted_total}</b>")
    
    if order.payment_link:
        lines.append(f"🔗 Ссылка для оплаты: {order.payment_link}")
    
    if order.payment_deadline_at:
        deadline_str = order.payment_deadline_at.strftime('%d.%m.%Y %H:%M')
        lines.append(f"⏳ Срок оплаты: {deadline_str}")

    message_text = "\n".join(lines)
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    # Получаем активный payment для заказа
    active_payment = order.payments.filter(is_active=True).first()
    payment_id = active_payment.pk if active_payment else None

    # Создаем inline клавиатуру с кнопками подтверждения/отклонения
    reply_markup = None
    if payment_id:
        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Подтвердить оплату",
                        "callback_data": f"approve_order:{order.pk}:{payment_id}"
                    },
                    {
                        "text": "❌ Отклонить",
                        "callback_data": f"reject_order:{order.pk}:{payment_id}"
                    }
                ]
            ]
        }

    # Отправляем сообщение всем админам
    success_count = 0
    for admin_id in admin_ids:
        try:
            payload = {
                "chat_id": admin_id,
                "text": message_text,
                "parse_mode": "HTML"
            }
            if reply_markup:
                payload["reply_markup"] = reply_markup

            response = requests.post(
                url,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            success_count += 1
            logger.info(f"Admin notification sent to {admin_id} for order {order.pk}")
        except requests.RequestException as exc:
            logger.warning(f"Failed to notify admin {admin_id} about order {order.pk}: {exc}")
    
    if success_count == 0:
        logger.error(f"Failed to notify any admin about order {order.pk}")
    else:
        logger.info(f"Successfully notified {success_count} admin(s) about order {order.pk}")


def calculate_manual_total(cart_items: List[dict]) -> Tuple[Decimal, List[Tuple[Product, int]]]:
    total = Decimal('0')
    detailed_items = []
    for item in cart_items:
        product_id = item.get('product_id')
        quantity = item.get('quantity', 1)
        product = get_object_or_404(Product, pk=product_id)
        qty = int(quantity)
        line_total = Decimal(product.price) * qty
        total += line_total
        detailed_items.append((product, qty))
    return total, detailed_items


def create_checkout_order(
    *,
    user: Optional[User],
    telegram_user: Optional[TelegramUser],
    cart_items_query: Optional[List[CartItem]],
    manual_items: Optional[List[Tuple[Product, int]]],
    comment: str,
    payment_link: str | None,
    provider: str,
    deadline_minutes: int | None,
    address: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float],
    delivery_time: Optional[str],
    customer_name: str = '',
    customer_phone: str = '',
) -> Tuple[Order, Payment]:
    deadline_minutes = deadline_minutes or DEFAULT_PAYMENT_DEADLINE_MINUTES
    payment_deadline = timezone.now() + timedelta(minutes=deadline_minutes)

    if cart_items_query:
        total = sum([Decimal(item.get_total_price()) for item in cart_items_query])
    else:
        total = sum([Decimal(product.price) * qty for product, qty in (manual_items or [])])

    if total <= 0:
        raise ValueError("Order total must be positive.")

    link = payment_link or generate_payment_link(provider)

    with transaction.atomic():
        order = Order.objects.create(
            user=user,
            telegram_user=telegram_user,
            total_price=total,
            total_uzs=total,
            payment_link=link,
            payment_comment=comment,
            payment_deadline_at=payment_deadline,
            status=Order.Status.PENDING_PAYMENT_LINK,
            address=address,
            latitude=latitude,
            longitude=longitude,
            delivery_time=delivery_time,
            customer_name=customer_name.strip(),
            customer_phone=customer_phone.strip(),
        )

        if cart_items_query:
            order.items.set(cart_items_query)
            for cart_item in cart_items_query:
                OrderProduct.objects.create(
                    order=order,
                    product=cart_item.product,
                    product_title=cart_item.product.title,
                    quantity=cart_item.quantity,
                    price_uzs=cart_item.product.price,
                )
        elif manual_items:
            for product, qty in manual_items:
                OrderProduct.objects.create(
                    order=order,
                    product=product,
                    product_title=product.title,
                    quantity=qty,
                    price_uzs=product.price,
                )

        payment = Payment.objects.create(
            order=order,
            amount_uzs=total,
            provider=provider or 'link',
            status=Payment.Status.AWAITING_PROOF,
        )

    return order, payment


def process_checkout(request, validated_data) -> Tuple[Order, Payment]:
    user = request.user if request.user.is_authenticated else None
    telegram_user = None
    if validated_data.get('telegram_user_id'):
        telegram_user, _ = TelegramUser.objects.get_or_create(telegram_id=validated_data['telegram_user_id'])

    manual_items_details = None
    cart_items_query = None

    if validated_data.get('cart_items'):
        _, manual_items_details = calculate_manual_total(validated_data['cart_items'])
    else:
        if not user:
            raise ValueError("Authenticated user is required when cart_items are not provided.")
        cart_items_query = list(CartItem.objects.filter(user=user, order__isnull=True).select_related('product'))
        if not cart_items_query:
            raise ValueError("Cart is empty.")

    order, payment = create_checkout_order(
        user=user,
        telegram_user=telegram_user,
        cart_items_query=cart_items_query,
        manual_items=manual_items_details,
        comment=validated_data.get('comment', ''),
        payment_link=validated_data.get('payment_link'),
        provider=validated_data.get('payment_provider', 'link'),
        deadline_minutes=validated_data.get('deadline_minutes'),
        address=validated_data.get('address'),
        latitude=validated_data.get('latitude'),
        longitude=validated_data.get('longitude'),
        delivery_time=validated_data.get('delivery_time'),
        customer_name=validated_data.get('customer_name', ''),
        customer_phone=validated_data.get('customer_phone', ''),
    )

    notify_admin_new_order(order)

    return order, payment


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.select_related('category').all().order_by('-created_at')
    permission_classes = [AllowAny]
    filterset_fields = ['category__slug', 'category__id']
    search_fields = ['title']
    ordering_fields = ['price', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer


class CartViewSet(viewsets.GenericViewSet,
                  mixins.ListModelMixin,
                  mixins.CreateModelMixin,
                  mixins.DestroyModelMixin):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Exclude items already included in orders so the cart reflects only pending items
        return CartItem.objects.filter(user=self.request.user, order__isnull=True).select_related('product')

    def get_serializer_class(self):
        if self.action in ['create', 'add']:
            return CartItemCreateSerializer
        return CartItemSerializer

    def perform_create(self, serializer):
        # If item exists for user+product, increase quantity, else create
        product = serializer.validated_data['product']
        quantity = serializer.validated_data.get('quantity', 1)
        item, created = CartItem.objects.get_or_create(user=self.request.user, product=product,
                                                       defaults={'quantity': quantity})
        if not created:
            item.quantity = F('quantity') + quantity
            item.save()
            item.refresh_from_db()
        return item

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.perform_create(serializer)
        output = CartItemSerializer(item)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def list(self, request, *args, **kwargs):
        items = self.get_queryset()
        serialized = CartItemSerializer(items, many=True)
        total = sum([i.get_total_price() for i in items])
        return Response({'items': serialized.data, 'total_price': total})

    @action(detail=False, methods=['post'], url_path='add')
    def add(self, request):
        return self.create(request)

    @action(detail=False, methods=['delete'], url_path=r'remove/(?P<id>[^/.]+)')
    def remove(self, request, id=None):
        instance = self.get_queryset().filter(pk=id).first()
        if not instance:
            return Response(status=status.HTTP_404_NOT_FOUND)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        items = self.get_queryset()
        total = sum([i.get_total_price() for i in items])
        data = CartSerializer({'items': items, 'total_price': total}).data
        return Response(data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        self.get_queryset().delete()
        return Response({'detail': 'Cart cleared'}, status=status.HTTP_200_OK)


class FavoriteViewSet(viewsets.GenericViewSet,
                      mixins.ListModelMixin,
                      mixins.CreateModelMixin,
                      mixins.DestroyModelMixin):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('product')

    def get_serializer_class(self):
        if self.action in ['create', 'add']:
            return FavoriteCreateSerializer
        return FavoriteSerializer

    def perform_create(self, serializer):
        Favorite.objects.get_or_create(user=self.request.user, product=serializer.validated_data['product'])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        favorite, _ = Favorite.objects.get_or_create(user=request.user, product=serializer.validated_data['product'])
        output = FavoriteSerializer(favorite)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'], url_path='add')
    def add(self, request):
        return self.create(request)

    @action(detail=False, methods=['delete'], url_path=r'remove/(?P<id>[^/.]+)')
    def remove(self, request, id=None):
        instance = self.get_queryset().filter(pk=id).first()
        if not instance:
            return Response(status=status.HTTP_404_NOT_FOUND)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderViewSet(viewsets.GenericViewSet,
                   mixins.ListModelMixin,
                   mixins.CreateModelMixin,
                   mixins.RetrieveModelMixin):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            'items__product',
            'payments',
            'payments__proofs',
            'status_history',
        )

    def get_serializer_class(self):
        return OrderSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if getattr(self, 'action', None) == 'retrieve':
            context.update({'include_payment_proofs': True, 'include_status_history': True})
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = CheckoutRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        try:
            order, _ = process_checkout(request, serializer.validated_data)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        response_data = OrderSerializer(
            order,
            context={'request': request, 'include_payment_proofs': False, 'include_status_history': True},
        ).data
        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'], url_path='create')
    def create_from_cart(self, request):
        return self.create(request)


class CheckoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = CheckoutRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        try:
            order, payment = process_checkout(request, serializer.validated_data)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = CheckoutResponseSerializer({
            'order_id': order.id,
            'status': order.status,
            'total_uzs': order.total_uzs,
            'formatted_total': order.formatted_total,
            'payment_link': order.payment_link,
            'payment_deadline_at': order.payment_deadline_at,
            'payment_id': payment.id,
        })
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class OrderDeadlineView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id: int, *args, **kwargs):
        order = get_object_or_404(Order, pk=order_id)
        telegram_id = request.query_params.get('telegram_user_id')
        user = request.user if request.user.is_authenticated else None

        if user and order.user_id == user.id:
            pass
        elif telegram_id and order.telegram_user and str(order.telegram_user.telegram_id) == str(telegram_id):
            pass
        else:
            raise NotFound("Order not found.")

        deadline = order.payment_deadline_at
        if not deadline:
            deadline = timezone.now()
        seconds_left = int((deadline - timezone.now()).total_seconds())
        seconds_left = max(0, seconds_left)
        is_expired = seconds_left <= 0 or order.status in [Order.Status.CANCELED, Order.Status.PAID]

        serializer = OrderDeadlineSerializer({
            'payment_deadline_at': deadline,
            'seconds_left': seconds_left,
            'is_expired': is_expired,
        })
        payload = serializer.data
        payload['status'] = order.status
        return Response(payload)


class TelegramOrderDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id: int, *args, **kwargs):
        telegram_user_id = request.query_params.get('telegram_user_id')
        if not telegram_user_id:
            raise ValidationError("telegram_user_id is required")

        order = get_object_or_404(
            Order.objects.select_related('telegram_user').prefetch_related('payments', 'payments__proofs', 'status_history'),
            pk=order_id,
        )
        if not order.telegram_user or str(order.telegram_user.telegram_id) != str(telegram_user_id):
            raise NotFound("Order not found for this user.")

        serializer = OrderSerializer(
            order,
            context={'request': request, 'include_payment_proofs': True, 'include_status_history': True},
        )
        return Response(serializer.data)


class TelegramPaymentProofView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PaymentProofCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        telegram_user, _ = TelegramUser.objects.get_or_create(telegram_id=data['telegram_user_id'])

        payment = None
        if data.get('payment_id'):
            payment = get_object_or_404(Payment.objects.select_related('order', 'order__telegram_user'), pk=data['payment_id'])
        else:
            order = get_object_or_404(Order.objects.select_related('telegram_user'), pk=data['order_id'])
            payment = order.payments.filter(is_active=True).order_by('-created_at').first()
            if not payment:
                raise ValidationError("Active payment not found for order.")

        order = payment.order
        if order.telegram_user and order.telegram_user.telegram_id != telegram_user.telegram_id:
            raise ValidationError("Order does not belong to this Telegram user.")
        if not order.telegram_user:
            order.telegram_user = telegram_user
            order.save(update_fields=['telegram_user'])

        existing_proof = None
        if data.get('telegram_file_id'):
            existing_proof = payment.proofs.filter(telegram_file_id=data['telegram_file_id']).first()
        if not existing_proof and data.get('message_id'):
            existing_proof = payment.proofs.filter(message_id=data['message_id']).first()

        if existing_proof:
            proof = existing_proof
        else:
            with transaction.atomic():
                proof = PaymentProof(
                    payment=payment,
                    telegram_file_id=data.get('telegram_file_id'),
                    submitted_by_telegram=telegram_user,
                    submitted_by_user=None,
                    comment=data.get('comment', ''),
                    message_id=data.get('message_id'),
                )
                image = data.get('image') or request.FILES.get('image')
                if image:
                    proof.image = image
                try:
                    proof.full_clean()
                except DjangoValidationError as exc:
                    raise ValidationError(exc.message_dict or exc.messages)
                proof.save()

        with transaction.atomic():
            if payment.status != Payment.Status.UNDER_REVIEW:
                payment.status = Payment.Status.UNDER_REVIEW
                payment.save(update_fields=['status', 'updated_at'])
            if order.status != Order.Status.UNDER_REVIEW:
                order.set_status(Order.Status.UNDER_REVIEW, comment=data.get('comment', ''))

        return Response({
            'status': payment.status,
            'message': 'Чек получен. Ожидайте подтверждения.',
            'payment_id': payment.id,
            'order_status': order.status,
        }, status=status.HTTP_200_OK)


class TelegramOrderRemindView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        order_id = request.data.get('order_id')
        telegram_user_id = request.data.get('telegram_user_id')
        if not order_id or not telegram_user_id:
            raise ValidationError("order_id and telegram_user_id are required.")

        order = get_object_or_404(Order.objects.select_related('telegram_user'), pk=order_id)
        if not order.telegram_user or str(order.telegram_user.telegram_id) != str(telegram_user_id):
            raise NotFound("Order not found for this user.")

        if order.status == Order.Status.PENDING_PAYMENT_LINK:
            order.set_status(Order.Status.AWAITING_PROOF)

        response = {
            'order_id': order.id,
            'status': order.status,
            'payment_link': order.payment_link,
            'payment_deadline_at': order.payment_deadline_at,
            'formatted_total': order.formatted_total,
        }
        return Response(response, status=status.HTTP_200_OK)


class AdminPaymentListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, *args, **kwargs):
        status_param = request.query_params.get('status', Payment.Status.UNDER_REVIEW)
        payments = Payment.objects.select_related('order', 'order__telegram_user', 'order__user', 'reviewed_by').prefetch_related('proofs')
        if status_param:
            if status_param not in Payment.Status.values:
                raise ValidationError(f"Unknown payment status: {status_param}")
            payments = payments.filter(status=status_param)
        serializer = PaymentSerializer(
            payments.order_by('-created_at'),
            many=True,
            context={'request': request, 'include_proofs': False},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminPaymentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, payment_id: int, *args, **kwargs):
        payment = get_object_or_404(
            Payment.objects.select_related('order', 'order__telegram_user', 'order__user', 'reviewed_by').prefetch_related('proofs'),
            pk=payment_id,
        )
        payment_data = PaymentSerializer(payment, context={'request': request, 'include_proofs': True}).data
        order_data = OrderSerializer(
            payment.order,
            context={'request': request, 'include_payment_proofs': True, 'include_status_history': True},
        ).data
        return Response({'payment': payment_data, 'order': order_data}, status=status.HTTP_200_OK)


class AdminPaymentApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, payment_id: int, *args, **kwargs):
        payment = get_object_or_404(Payment.objects.select_related('order'), pk=payment_id)
        if payment.status == Payment.Status.PAID:
            return Response({'detail': 'Payment already approved.'}, status=status.HTTP_400_BAD_REQUEST)
        if payment.status == Payment.Status.REJECTED:
            return Response({'detail': 'Payment already rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.status = Payment.Status.PAID
            payment.reviewed_by = request.user
            payment.rejection_reason = ''
            payment.save(update_fields=['status', 'reviewed_by', 'rejection_reason', 'updated_at'])
            payment.order.set_status(Order.Status.PAID, changed_by=request.user)
            send_telegram_notification(
                payment.order.telegram_user,
                f"🎉 Оплата подтверждена! Заказ №{payment.order.id} перешёл в обработку.",
            )

        return Response({'status': payment.status, 'order_status': payment.order.status}, status=status.HTTP_200_OK)


class AdminPaymentRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, payment_id: int, *args, **kwargs):
        payment = get_object_or_404(Payment.objects.select_related('order'), pk=payment_id)
        serializer = PaymentModerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '').strip()
        if not reason:
            raise ValidationError("Reason is required for rejection.")

        if payment.status == Payment.Status.PAID:
            return Response({'detail': 'Cannot reject an approved payment.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.status = Payment.Status.REJECTED
            payment.reviewed_by = request.user
            payment.rejection_reason = reason
            payment.save(update_fields=['status', 'reviewed_by', 'rejection_reason', 'updated_at'])
            payment.order.set_status(Order.Status.REJECTED, changed_by=request.user, comment=reason)
            send_telegram_notification(
                payment.order.telegram_user,
                f"❌ Чек отклонён: {reason}. Пожалуйста, пришлите корректный чек или свяжитесь с поддержкой.",
            )

        return Response({'status': payment.status, 'order_status': payment.order.status, 'reason': reason}, status=status.HTTP_200_OK)


class TelegramPaymentApproveView(APIView):
    """Approve payment by Telegram admin"""
    permission_classes = [AllowAny]

    def post(self, request, payment_id: int, *args, **kwargs):
        payment = get_object_or_404(Payment.objects.select_related('order', 'order__telegram_user'), pk=payment_id)
        telegram_admin_id = request.data.get('telegram_admin_id')
        
        if not telegram_admin_id:
            return Response({'detail': 'telegram_admin_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверяем, что пользователь является админом
        try:
            admin_user = TelegramUser.objects.get(telegram_id=telegram_admin_id)
            if not admin_user.is_admin:
                return Response({'detail': 'User is not an admin.'}, status=status.HTTP_403_FORBIDDEN)
        except TelegramUser.DoesNotExist:
            return Response({'detail': 'Admin user not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if payment.status == Payment.Status.PAID:
            return Response({'detail': 'Payment already approved.'}, status=status.HTTP_400_BAD_REQUEST)
        if payment.status == Payment.Status.REJECTED:
            return Response({'detail': 'Payment already rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.status = Payment.Status.PAID
            payment.reviewed_by = None  # Не Django пользователь
            payment.rejection_reason = ''
            payment.save(update_fields=['status', 'reviewed_by', 'rejection_reason', 'updated_at'])
            payment.order.set_status(Order.Status.PAID, changed_by=None)
            send_telegram_notification(
                payment.order.telegram_user,
                f"🎉 Оплата подтверждена! Заказ №{payment.order.id} перешёл в обработку.",
            )

        return Response({'status': payment.status, 'order_status': payment.order.status}, status=status.HTTP_200_OK)


class TelegramPaymentRejectView(APIView):
    """Reject payment by Telegram admin"""
    permission_classes = [AllowAny]

    def post(self, request, payment_id: int, *args, **kwargs):
        payment = get_object_or_404(Payment.objects.select_related('order', 'order__telegram_user'), pk=payment_id)
        telegram_admin_id = request.data.get('telegram_admin_id')
        reason = request.data.get('reason', '').strip()
        
        if not telegram_admin_id:
            return Response({'detail': 'telegram_admin_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not reason:
            return Response({'detail': 'Reason is required for rejection.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверяем, что пользователь является админом
        try:
            admin_user = TelegramUser.objects.get(telegram_id=telegram_admin_id)
            if not admin_user.is_admin:
                return Response({'detail': 'User is not an admin.'}, status=status.HTTP_403_FORBIDDEN)
        except TelegramUser.DoesNotExist:
            return Response({'detail': 'Admin user not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if payment.status == Payment.Status.PAID:
            return Response({'detail': 'Cannot reject an approved payment.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.status = Payment.Status.REJECTED
            payment.reviewed_by = None  # Не Django пользователь
            payment.rejection_reason = reason
            payment.save(update_fields=['status', 'reviewed_by', 'rejection_reason', 'updated_at'])
            payment.order.set_status(Order.Status.REJECTED, changed_by=None, comment=reason)
            send_telegram_notification(
                payment.order.telegram_user,
                f"❌ Чек отклонён: {reason}. Пожалуйста, пришлите корректный чек или свяжитесь с поддержкой.",
            )

        return Response({'status': payment.status, 'order_status': payment.order.status, 'reason': reason}, status=status.HTTP_200_OK)


class AdminOrderCancelView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, order_id: int, *args, **kwargs):
        order = get_object_or_404(Order.objects.prefetch_related('payments'), pk=order_id)
        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        with transaction.atomic():
            order.set_status(Order.Status.CANCELED, changed_by=request.user, comment=reason)
            active_payment = order.payments.filter(is_active=True).exclude(status=Payment.Status.PAID).first()
            if active_payment:
                active_payment.status = Payment.Status.REJECTED
                active_payment.reviewed_by = request.user
                active_payment.rejection_reason = reason
                active_payment.save(update_fields=['status', 'reviewed_by', 'rejection_reason', 'updated_at'])
            send_telegram_notification(
                order.telegram_user,
                f"❌ Заказ №{order.id} отменён: {reason}",
            )

        return Response({'status': order.status, 'reason': reason}, status=status.HTTP_200_OK)


class TelegramUserViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = TelegramUser.objects.all()
    serializer_class = TelegramUserSerializer
    lookup_field = 'telegram_id'

    def get_object(self):
        telegram_id = self.kwargs.get('telegram_id')
        return TelegramUser.objects.get_or_create(telegram_id=telegram_id)[0]


class TelegramAddressViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = TelegramAddress.objects.all()
    serializer_class = TelegramAddressSerializer

    def get_queryset(self):
        telegram_id = self.request.query_params.get('user_id')
        if telegram_id:
            return TelegramAddress.objects.filter(user__telegram_id=telegram_id)
        return TelegramAddress.objects.all()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user).data)
