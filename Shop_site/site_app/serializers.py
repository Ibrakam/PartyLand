from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category,
    Product,
    CartItem,
    Favorite,
    Order,
    OrderProduct,
    TelegramUser,
    TelegramAddress,
    Payment,
    PaymentProof,
    OrderStatusHistory,
    format_sum,
)


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(read_only=True)
    image = serializers.ImageField(read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'name_uz', 'slug', 'parent', 'image']


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'title', 'title_uz', 'price', 'category', 'image']
    
    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            # Если нет request, формируем URL вручную
            return obj.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'title', 'title_uz', 'description', 'description_uz', 'price', 'image', 'category', 'created_at']
    
    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            # Если нет request, формируем URL вручную
            return obj.image.url
        return None


class CartItemCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product')

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'quantity']


class ProductShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'title', 'title_uz', 'price']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductShortSerializer(read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'total']

    def get_total(self, obj):
        return obj.get_total_price()


class CartSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductShortSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'product', 'added_at']


class FavoriteCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product')

    class Meta:
        model = Favorite
        fields = ['id', 'product_id']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductShortSerializer(read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = OrderProduct
        fields = ['id', 'product', 'product_title', 'quantity', 'price_uzs', 'total']

    def get_total(self, obj):
        return obj.total_price


class PaymentProofSerializer(serializers.ModelSerializer):
    submitted_by = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentProof
        fields = [
            'id',
            'submitted_at',
            'comment',
            'telegram_file_id',
            'message_id',
            'image',
            'image_url',
            'submitted_by',
        ]
        read_only_fields = fields

    def get_submitted_by(self, obj):
        if obj.submitted_by_user:
            return obj.submitted_by_user.get_username()
        if obj.submitted_by_telegram:
            return str(obj.submitted_by_telegram.telegram_id)
        return None

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PaymentSerializer(serializers.ModelSerializer):
    formatted_amount = serializers.SerializerMethodField()
    proofs = serializers.SerializerMethodField()
    reviewed_by = serializers.SerializerMethodField()
    order_id = serializers.IntegerField(source='order_id', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'order_id',
            'order_status',
            'status',
            'provider',
            'amount_uzs',
            'formatted_amount',
            'is_active',
            'created_at',
            'updated_at',
            'rejection_reason',
            'reviewed_by',
            'reviewed_at',
            'proofs',
        ]
        read_only_fields = fields

    def get_formatted_amount(self, obj):
        return obj.formatted_amount

    def get_proofs(self, obj):
        include = self.context.get('include_proofs', False)
        if not include:
            return []
        serializer = PaymentProofSerializer(obj.proofs.all(), many=True, context=self.context)
        return serializer.data

    def get_reviewed_by(self, obj):
        return obj.reviewed_by.get_username() if obj.reviewed_by else None


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'previous_status', 'new_status', 'comment', 'changed_at', 'changed_by']
        read_only_fields = fields

    def get_changed_by(self, obj):
        return obj.changed_by.get_username() if obj.changed_by else None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='order_products', many=True, read_only=True)
    payments = serializers.SerializerMethodField()
    formatted_total = serializers.SerializerMethodField()
    status_history = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'status',
            'total_price',
            'total_uzs',
            'formatted_total',
            'payment_link',
            'payment_comment',
            'payment_deadline_at',
            'payment_reminder_sent_at',
            'created_at',
             'customer_name',
             'customer_phone',
             'address',
             'delivery_time',
            'items',
            'payments',
            'status_history',
        ]
        read_only_fields = fields

    def get_payments(self, obj):
        serializer = PaymentSerializer(
            obj.payments.all().order_by('-created_at'),
            many=True,
            context={**self.context, 'include_proofs': self.context.get('include_payment_proofs', False)},
        )
        return serializer.data

    def get_formatted_total(self, obj):
        return obj.formatted_total

    def get_status_history(self, obj):
        if not self.context.get('include_status_history', False):
            return []
        serializer = OrderStatusHistorySerializer(obj.status_history.all(), many=True, context=self.context)
        return serializer.data


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutRequestSerializer(serializers.Serializer):
    telegram_user_id = serializers.IntegerField(required=False)
    payment_provider = serializers.CharField(default='link')
    comment = serializers.CharField(required=False, allow_blank=True)
    payment_link = serializers.URLField(required=False)
    cart_items = CheckoutItemSerializer(many=True, required=False)
    deadline_minutes = serializers.IntegerField(required=False, min_value=5, max_value=24 * 60)
    address = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)
    delivery_time = serializers.CharField(required=False, allow_blank=True)
    customer_name = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        user = self.context.get('request').user if self.context.get('request') else None
        has_user_cart = bool(user and user.is_authenticated)
        if not attrs.get('cart_items') and not has_user_cart:
            raise serializers.ValidationError("Either provide cart_items or use an authenticated user with a cart.")
        return attrs


class CheckoutResponseSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    status = serializers.CharField()
    total_uzs = serializers.DecimalField(max_digits=18, decimal_places=2)
    formatted_total = serializers.CharField()
    payment_link = serializers.CharField()
    payment_deadline_at = serializers.DateTimeField()
    payment_id = serializers.IntegerField()


class OrderDeadlineSerializer(serializers.Serializer):
    payment_deadline_at = serializers.DateTimeField()
    seconds_left = serializers.IntegerField()
    is_expired = serializers.BooleanField()


class PaymentProofCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=False)
    payment_id = serializers.IntegerField(required=False)
    telegram_user_id = serializers.IntegerField(required=False)
    telegram_file_id = serializers.CharField(required=False, allow_blank=True)
    message_id = serializers.CharField(required=False, allow_blank=True)
    comment = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False)

    def validate(self, attrs):
        order_id = attrs.get('order_id')
        payment_id = attrs.get('payment_id')
        telegram_user_id = attrs.get('telegram_user_id')
        if not order_id and not payment_id:
            raise serializers.ValidationError("order_id or payment_id is required.")
        if not attrs.get('telegram_file_id') and not attrs.get('image'):
            raise serializers.ValidationError("Provide image upload or telegram_file_id.")
        if not telegram_user_id:
            raise serializers.ValidationError("telegram_user_id is required.")
        return attrs


class PaymentModerationSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class OrderCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False)


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class TelegramUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramUser
        fields = ['telegram_id', 'name', 'phone', 'language', 'birthday', 'is_admin', 'created_at', 'updated_at']
        read_only_fields = ['telegram_id', 'created_at', 'updated_at']


class TelegramAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramAddress
        fields = ['id', 'user', 'address', 'latitude', 'longitude', 'created_at']
        read_only_fields = ['id', 'created_at']
