from django.contrib import admin
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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'name_uz', 'slug', 'parent')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'name_uz')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'title_uz', 'category', 'price', 'created_at')
    list_filter = ('category',)
    search_fields = ('title', 'title_uz')


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'quantity')
    list_filter = ('user',)


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'added_at')
    list_filter = ('user',)


class OrderProductInline(admin.TabularInline):
    model = OrderProduct
    extra = 0
    can_delete = False
    readonly_fields = ('product', 'product_title', 'quantity', 'price_uzs', 'total_display')

    def total_display(self, obj):
        return format_sum(obj.total_price)

    total_display.short_description = "Total"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'source_label',
        'customer_name',
        'customer_phone',
        'formatted_total_display',
        'status',
        'payment_deadline_at',
        'payment_reminder_sent_at',
        'created_at',
    )
    list_filter = ('status', 'user', 'telegram_user')
    search_fields = ('id', 'customer_name', 'customer_phone', 'payment_comment', 'user__username', 'telegram_user__telegram_id')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    inlines = [OrderProductInline]

    def source_label(self, obj):
        return obj.source_label()

    source_label.short_description = "Source"

    def formatted_total_display(self, obj):
        return obj.formatted_total

    formatted_total_display.short_description = "Total"


@admin.register(TelegramUser)
class TelegramUserAdmin(admin.ModelAdmin):
    list_display = ('telegram_id', 'name', 'phone', 'language', 'is_admin', 'created_at')
    list_filter = ('is_admin', 'language')
    search_fields = ('telegram_id', 'name', 'phone')


@admin.register(TelegramAddress)
class TelegramAddressAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'address', 'created_at')
    list_filter = ('user',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'provider', 'formatted_amount', 'status', 'is_active', 'created_at')
    list_filter = ('status', 'provider', 'is_active')
    search_fields = ('order__id', 'provider')
    readonly_fields = ('created_at', 'updated_at', 'reviewed_at')


@admin.register(PaymentProof)
class PaymentProofAdmin(admin.ModelAdmin):
    list_display = ('id', 'payment', 'submitted_by_user', 'submitted_by_telegram', 'submitted_at')
    list_filter = ('submitted_at',)
    search_fields = ('payment__id', 'submitted_by_telegram__telegram_id', 'telegram_file_id')
    readonly_fields = ('submitted_at',)


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'previous_status', 'new_status', 'changed_by', 'changed_at')
    list_filter = ('new_status', 'changed_at')
    search_fields = ('order__id', 'changed_by__username')
