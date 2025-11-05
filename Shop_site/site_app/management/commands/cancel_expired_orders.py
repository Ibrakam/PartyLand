from __future__ import annotations

import logging
from typing import Optional

import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from site_app.models import Order, Payment

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Cancel orders with expired payment deadlines and notify customers."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do not persist changes, only log actions.",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        now = timezone.now()
        eligible_statuses = [
            Order.Status.PENDING_PAYMENT_LINK,
            Order.Status.AWAITING_PROOF,
            Order.Status.UNDER_REVIEW,
        ]

        orders = (
            Order.objects
            .filter(status__in=eligible_statuses, payment_deadline_at__isnull=False)
            .filter(payment_deadline_at__lt=now)
            .prefetch_related("payments", "telegram_user")
        )

        if not orders.exists():
            self.stdout.write(self.style.SUCCESS("No expired orders found."))
            return

        processed = 0
        for order in orders:
            processed += 1
            self.stdout.write(f"Processing order #{order.id} (status={order.status})")

            if dry_run:
                continue

            with transaction.atomic():
                order.set_status(
                    Order.Status.CANCELED,
                    comment="Автоотмена: дедлайн оплаты истёк.",
                )
                Order.objects.filter(pk=order.pk).update(payment_reminder_sent_at=now)

                active_payment = (
                    order.payments.filter(is_active=True)
                    .exclude(status=Payment.Status.PAID)
                    .first()
                )
                if active_payment:
                    active_payment.status = Payment.Status.REJECTED
                    active_payment.rejection_reason = "Дедлайн оплаты истёк"
                    active_payment.save(update_fields=["status", "rejection_reason", "updated_at"])

                self._notify_telegram(
                    order.telegram_user.telegram_id if order.telegram_user else None,
                    f"❌ Срок оплаты истёк. Заказ №{order.id} отменён. Оформите новый заказ при необходимости.",
                )

        self.stdout.write(self.style.SUCCESS(f"Processed {processed} expired orders."))

    def _notify_telegram(self, telegram_id: Optional[int], message: str) -> None:
        bot_token = getattr(settings, 'BOT_TOKEN', '')
        if not telegram_id or not bot_token:
            return
        try:
            requests.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={
                    "chat_id": telegram_id,
                    "text": message,
                },
                timeout=10,
            )
        except requests.RequestException as exc:  # pragma: no cover
            logger.warning("Failed to send telegram notification: %s", exc)
