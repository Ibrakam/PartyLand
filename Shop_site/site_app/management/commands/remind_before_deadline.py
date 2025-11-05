from __future__ import annotations

import logging
from datetime import timedelta
from typing import Optional

import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from site_app.models import Order

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send Telegram reminders before the payment deadline."

    def add_arguments(self, parser):
        parser.add_argument(
            "--minutes",
            type=int,
            default=30,
            help="How many minutes before deadline to send reminder.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do not persist changes, only log actions.",
        )

    def handle(self, *args, **options):
        minutes: int = options["minutes"]
        dry_run: bool = options["dry_run"]
        now = timezone.now()
        window_end = now + timedelta(minutes=minutes)

        orders = (
            Order.objects
            .filter(status=Order.Status.AWAITING_PROOF)
            .filter(payment_deadline_at__isnull=False)
            .filter(payment_deadline_at__gt=now, payment_deadline_at__lte=window_end)
            .filter(payment_reminder_sent_at__isnull=True)
            .select_related("telegram_user")
        )

        if not orders.exists():
            self.stdout.write(self.style.SUCCESS("No reminders to send."))
            return

        processed = 0
        for order in orders:
            processed += 1
            deadline_text = timezone.localtime(order.payment_deadline_at).strftime("%d.%m.%Y %H:%M")
            message = (
                f"🔔 Напоминание по заказу №{order.id}\n"
                f"Сумма: {order.formatted_total}\n"
                f"Оплатите до: {deadline_text}."
            )
            if order.payment_link:
                message += f"\nСсылка на оплату: {order.payment_link}"

            if dry_run:
                self.stdout.write(f"Would remind order #{order.id}")
                continue

            with transaction.atomic():
                sent = self._notify_telegram(
                    order.telegram_user.telegram_id if order.telegram_user else None,
                    message,
                )
                if sent:
                    Order.objects.filter(pk=order.pk).update(payment_reminder_sent_at=now)

        self.stdout.write(self.style.SUCCESS(f"Processed {processed} reminders."))

    def _notify_telegram(self, telegram_id: Optional[int], message: str) -> bool:
        bot_token = getattr(settings, 'BOT_TOKEN', '')
        if not telegram_id or not bot_token:
            return False
        try:
            requests.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={
                    "chat_id": telegram_id,
                    "text": message,
                },
                timeout=10,
            )
            return True
        except requests.RequestException as exc:  # pragma: no cover
            logger.warning("Failed to send telegram reminder: %s", exc)
            return False
