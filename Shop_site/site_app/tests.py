from datetime import timedelta
from decimal import Decimal
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Product, Order, Payment, TelegramUser, PaymentProof


class PaymentFlowTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test", slug="test")
        self.product = Product.objects.create(
            category=self.category,
            title="Test Product",
            price=Decimal("125000.00"),
        )
        self.telegram_user = TelegramUser.objects.create(
            telegram_id=555111222,
            name="Test User",
        )

    def test_checkout_creates_order_and_payment(self):
        payload = {
            "telegram_user_id": self.telegram_user.telegram_id,
            "cart_items": [
                {"product_id": self.product.id, "quantity": 1},
            ],
            "address": "Test address",
            "delivery_time": "Today",
        }
        response = self.client.post("/api/checkout/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data["order_id"]
        order = Order.objects.get(pk=order_id)
        self.assertEqual(order.status, Order.Status.PENDING_PAYMENT_LINK)
        self.assertEqual(order.total_uzs, Decimal("125000.00"))
        payment = order.payments.first()
        self.assertIsNotNone(payment)
        self.assertEqual(payment.status, Payment.Status.AWAITING_PROOF)
        self.assertEqual(payment.amount_uzs, Decimal("125000.00"))

    def test_submit_payment_proof_moves_to_under_review(self):
        order = Order.objects.create(
            telegram_user=self.telegram_user,
            total_price=Decimal("125000.00"),
            total_uzs=Decimal("125000.00"),
            status=Order.Status.AWAITING_PROOF,
            payment_deadline_at=timezone.now() + timedelta(hours=2),
        )
        payment = Payment.objects.create(
            order=order,
            amount_uzs=Decimal("125000.00"),
            provider="test",
            status=Payment.Status.AWAITING_PROOF,
        )
        payload = {
            "order_id": order.id,
            "telegram_user_id": self.telegram_user.telegram_id,
            "telegram_file_id": "FILE123",
            "message_id": "MSG1",
        }
        response = self.client.post("/api/telegram/payment/proof/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.UNDER_REVIEW)
        self.assertEqual(order.status, Order.Status.UNDER_REVIEW)
        self.assertTrue(PaymentProof.objects.filter(payment=payment).exists())

    def test_admin_approve_payment_updates_status(self):
        admin = User.objects.create_superuser(username="admin", email="admin@example.com", password="adminpass")
        order = Order.objects.create(
            status=Order.Status.UNDER_REVIEW,
            total_price=Decimal("125000.00"),
            total_uzs=Decimal("125000.00"),
            payment_deadline_at=timezone.now() + timedelta(hours=1),
        )
        payment = Payment.objects.create(
            order=order,
            amount_uzs=Decimal("125000.00"),
            provider="test",
            status=Payment.Status.UNDER_REVIEW,
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post(f"/api/admin/payments/{payment.id}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PAID)
        self.assertEqual(order.status, Order.Status.PAID)

    def test_admin_reject_requires_reason(self):
        admin = User.objects.create_superuser(username="admin2", email="admin2@example.com", password="adminpass")
        order = Order.objects.create(
            status=Order.Status.UNDER_REVIEW,
            total_price=Decimal("125000.00"),
            total_uzs=Decimal("125000.00"),
            payment_deadline_at=timezone.now() + timedelta(hours=1),
        )
        payment = Payment.objects.create(
            order=order,
            amount_uzs=Decimal("125000.00"),
            provider="test",
            status=Payment.Status.UNDER_REVIEW,
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post(f"/api/admin/payments/{payment.id}/reject/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post(
            f"/api/admin/payments/{payment.id}/reject/",
            {"reason": "Нечитаемый чек"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.REJECTED)
        self.assertEqual(order.status, Order.Status.REJECTED)
