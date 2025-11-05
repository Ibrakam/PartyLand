from decimal import Decimal
from typing import Optional

from django.db import models, transaction
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
from django.core.exceptions import ValidationError


class Category(models.Model):
    name = models.CharField(max_length=100)
    name_uz = models.CharField(max_length=100, blank=True, default="")
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    image = models.ImageField(upload_to='categories/', blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=200)
    title_uz = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True)
    description_uz = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def get_total_price(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.user.username} - {self.product.title} x{self.quantity}"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} -> {self.product.title}"


class TelegramUser(models.Model):
    """Telegram bot users"""
    telegram_id = models.BigIntegerField(unique=True, primary_key=True)
    name = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    language = models.CharField(max_length=10, default='ru')
    birthday = models.DateField(blank=True, null=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Telegram User'
        verbose_name_plural = 'Telegram Users'

    def __str__(self):
        return f"TG User {self.telegram_id} ({self.name or 'No name'})"


class TelegramAddress(models.Model):
    """User addresses for delivery"""
    user = models.ForeignKey(TelegramUser, on_delete=models.CASCADE, related_name='addresses')
    address = models.TextField()
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Telegram Addresses'

    def __str__(self):
        return f"{self.user.telegram_id} - {self.address[:50]}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT_LINK = 'pending_payment_link', 'Pending Payment Link'
        AWAITING_PROOF = 'awaiting_proof', 'Awaiting Proof'
        UNDER_REVIEW = 'under_review', 'Under Review'
        REJECTED = 'rejected', 'Rejected'
        PAID = 'paid', 'Paid'
        CANCELED = 'canceled', 'Canceled'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', blank=True, null=True)
    telegram_user = models.ForeignKey(TelegramUser, on_delete=models.CASCADE, related_name='tg_orders', blank=True, null=True)
    items = models.ManyToManyField(CartItem)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_uzs = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING_PAYMENT_LINK)
    payment_deadline_at = models.DateTimeField(blank=True, null=True)
    payment_link = models.URLField(max_length=500, blank=True, null=True)
    payment_comment = models.TextField(blank=True, default='')
    payment_reminder_sent_at = models.DateTimeField(blank=True, null=True)
    customer_name = models.CharField(max_length=200, blank=True, default='')
    customer_phone = models.CharField(max_length=100, blank=True, default='')
    
    # Delivery information
    address = models.TextField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    delivery_time = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        if self.user:
            return f"Order #{self.pk} (site user {self.user.username})"
        if self.telegram_user:
            return f"Order #{self.pk} (TG {self.telegram_user.telegram_id})"
        return f"Order #{self.pk} (website guest)"

    @property
    def source(self) -> str:
        if self.user_id:
            return "site_user"
        if self.telegram_user_id:
            return "telegram"
        return "website"

    def source_label(self) -> str:
        mapping = {
            "site_user": "Site user",
            "telegram": "Telegram",
            "website": "Website",
        }
        return mapping.get(self.source, "Unknown")

    @property
    def formatted_total(self) -> str:
        """Возвращает отформатированную сумму заказа"""
        return format_sum(self.total_uzs or self.total_price)

    def set_status(self, new_status: str, changed_by: Optional[User] = None, comment: str = ''):
        """Установить новый статус заказа с сохранением истории"""
        if new_status == self.status:
            return
        
        previous_status = self.status
        self.status = new_status
        self.save(update_fields=['status'])
        
        # Создаем запись в истории изменений статуса
        OrderStatusHistory.objects.create(
            order=self,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=changed_by,
            comment=comment,
        )


class OrderProduct(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_products')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='order_products')
    product_title = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    price_uzs = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "Order product"
        verbose_name_plural = "Order products"

    def __str__(self):
        return f"{self.product_title} x{self.quantity} (Order #{self.order_id})"

    @property
    def total_price(self) -> Decimal:
        return (self.price_uzs or Decimal('0')) * self.quantity

    def clean(self):
        # Проверяем, что цена не отрицательная
        if self.price_uzs is not None and self.price_uzs < 0:
            raise ValidationError("Product price cannot be negative.")
        if self.quantity is not None and self.quantity < 0:
            raise ValidationError("Quantity cannot be negative.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def formatted_total(self) -> str:
        return format_sum(self.total_price)


def format_sum(amount: Decimal) -> str:
    amount = amount or Decimal('0')
    normalized = amount.quantize(Decimal('1')) if amount == amount.to_integral() else amount
    return f"{normalized:,.0f}".replace(",", " ") + " сум"


class Payment(models.Model):
    class Status(models.TextChoices):
        AWAITING_PROOF = 'awaiting_proof', 'Awaiting Proof'
        UNDER_REVIEW = 'under_review', 'Under Review'
        PAID = 'paid', 'Paid'
        REJECTED = 'rejected', 'Rejected'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    amount_uzs = models.DecimalField(max_digits=18, decimal_places=2)
    provider = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AWAITING_PROOF)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    rejection_reason = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_payments')
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('status', 'is_active')),
        ]

    def __str__(self):
        return f"Payment #{self.pk} for Order #{self.order_id} - {self.status}"

    def clean(self):
        if self.amount_uzs <= 0:
            raise ValidationError("Payment amount must be positive.")
        if self.order and self.amount_uzs != (self.order.total_uzs or self.order.total_price):
            raise ValidationError("Payment amount must match order total.")
        if self.status == self.Status.REJECTED and not self.rejection_reason:
            raise ValidationError("Rejection reason is required when payment is rejected.")
        if self.is_active and self.order_id:
            qs = Payment.objects.filter(order_id=self.order_id, is_active=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Only one active payment is allowed per order.")

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        self.full_clean()

        with transaction.atomic():
            if self.status in {self.Status.PAID, self.Status.REJECTED}:
                self.is_active = False
                if self.status in {self.Status.PAID, self.Status.REJECTED} and not self.reviewed_at:
                    self.reviewed_at = timezone.now()

            result = super().save(*args, **kwargs)

            if self.is_active:
                Payment.objects.filter(order=self.order, is_active=True).exclude(pk=self.pk).update(is_active=False)

            return result

    @property
    def formatted_amount(self) -> str:
        return format_sum(self.amount_uzs)


class PaymentProof(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='proofs')
    image = models.ImageField(upload_to='payment_proofs/', blank=True, null=True)
    telegram_file_id = models.CharField(max_length=255, blank=True, null=True)
    submitted_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_proofs')
    submitted_by_telegram = models.ForeignKey(TelegramUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_proofs')
    submitted_at = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True, default='')
    message_id = models.CharField(max_length=128, blank=True, null=True)

    class Meta:
        ordering = ('-submitted_at',)
        unique_together = (
            ('payment', 'telegram_file_id'),
            ('payment', 'message_id'),
        )

    def __str__(self):
        return f"PaymentProof #{self.pk} for Payment #{self.payment_id}"

    def clean(self):
        if not self.image and not self.telegram_file_id:
            raise ValidationError("Either image or telegram_file_id must be provided.")
        if not self.submitted_by_user and not self.submitted_by_telegram:
            raise ValidationError("submitted_by_user or submitted_by_telegram is required.")


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    previous_status = models.CharField(max_length=32, blank=True, null=True)
    new_status = models.CharField(max_length=32)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='order_status_changes')
    comment = models.TextField(blank=True, default='')

    class Meta:
        ordering = ('-changed_at',)

    def __str__(self):
        return f"Order #{self.order_id}: {self.previous_status or 'none'} → {self.new_status}"
