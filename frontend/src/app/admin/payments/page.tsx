"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminPayment,
  AdminPaymentDetail,
  approveAdminPayment,
  getAdminPaymentDetail,
  getAdminPayments,
  rejectAdminPayment,
} from "@/lib/api";
import { formatUZS } from "@/lib/utils";

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    awaiting_proof: { label: "Ждём чек", variant: "secondary" },
    under_review: { label: "На проверке", variant: "default" },
    paid: { label: "Оплачен", variant: "outline" },
    rejected: { label: "Отклонён", variant: "outline" },
    pending_payment_link: { label: "Ожидает оплаты", variant: "secondary" },
    canceled: { label: "Отменён", variant: "outline" },
  };
  return map[status] ?? { label: status, variant: "outline" as const };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminPaymentDetail | null>(null);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadPayments = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const data = await getAdminPayments("under_review");
      setPayments(data);
      if (data.length > 0) {
        setSelectedPaymentId(data[0].id);
      } else {
        setSelectedPaymentId(null);
        setDetail(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить платежи.";
      setError(message);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadPaymentDetail = useCallback(async (paymentId: number) => {
    setDetailLoading(true);
    setActionError(null);
    try {
      const data = await getAdminPaymentDetail(paymentId);
      setDetail(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить детали платежа.";
      setActionError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (selectedPaymentId !== null) {
      loadPaymentDetail(selectedPaymentId);
    } else {
      setDetail(null);
    }
  }, [selectedPaymentId, loadPaymentDetail]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!detail || rejectOpen) return;
      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleApprove();
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        setRejectOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detail, rejectOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const proceedToNextPayment = (removedId: number) => {
    const remaining = payments.filter((payment) => payment.id !== removedId);
    setPayments(remaining);
    if (remaining.length > 0) {
      const next = remaining[0];
      setSelectedPaymentId(next.id);
    } else {
      setSelectedPaymentId(null);
      setDetail(null);
    }
  };

  const handleApprove = useCallback(async () => {
    if (!detail) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await approveAdminPayment(detail.payment.id);
      proceedToNextPayment(detail.payment.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось подтвердить оплату.";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  }, [detail, payments]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReject = async () => {
    if (!detail) return;
    if (!rejectReason.trim()) {
      setActionError("Укажите причину отказа.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await rejectAdminPayment(detail.payment.id, rejectReason.trim());
      setRejectOpen(false);
      setRejectReason("");
      proceedToNextPayment(detail.payment.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось отклонить платеж.";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const selectedPayment = useMemo(
    () => payments.find((payment) => payment.id === selectedPaymentId) || null,
    [payments, selectedPaymentId]
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-semibold text-white">Модерация чеков</h1>
          <p className="text-slate-300">
            Используйте клавиши <span className="font-semibold">A</span> — подтвердить, <span className="font-semibold">R</span> — отклонить.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <Card className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Очередь</h2>
                <p className="text-sm text-slate-400">Статус: under_review</p>
              </div>
              <Badge variant="secondary" className="bg-slate-800 text-slate-100">
                {listLoading ? "…" : payments.length}
              </Badge>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3">Заказ</th>
                    <th className="px-4 py-3">Сумма</th>
                    <th className="px-4 py-3">Провайдер</th>
                    <th className="px-4 py-3">Создан</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        Загружаем…
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        Нет чеков на проверку.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr
                        key={payment.id}
                        onClick={() => setSelectedPaymentId(payment.id)}
                        className={`cursor-pointer transition hover:bg-slate-800 ${
                          payment.id === selectedPaymentId ? "bg-slate-800" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-white">#{payment.order_id}</td>
                        <td className="px-4 py-3 text-slate-100">{payment.formatted_amount}</td>
                        <td className="px-4 py-3 text-slate-300">{payment.provider}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(payment.created_at).toLocaleString("ru-RU")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-lg">
            {detailLoading ? (
              <div className="text-center text-slate-500">Загружаем детали…</div>
            ) : detail ? (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Заказ #{detail.payment.order_id}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Создан: {new Date(detail.payment.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <Badge variant={getStatusBadge(detail.payment.status).variant}>
                    {getStatusBadge(detail.payment.status).label}
                  </Badge>
                </div>

                {actionError && (
                  <Alert variant="destructive">
                    <AlertDescription>{actionError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500">Сумма</p>
                    <p className="text-lg font-semibold text-slate-900">{detail.payment.formatted_amount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500">Провайдер</p>
                    <p className="text-lg font-semibold text-slate-900">{detail.payment.provider}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500">Статус заказа</p>
                    <p className="text-lg font-semibold text-slate-900">{detail.order.status}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500">Дедлайн оплаты</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {detail.order.payment_deadline_at
                        ? new Date(detail.order.payment_deadline_at).toLocaleString("ru-RU")
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Чеки</h3>
                  {detail.payment.proofs.length === 0 ? (
                    <p className="text-sm text-slate-500">Чеки ещё не загружены.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {detail.payment.proofs.map((proof) => (
                        <div key={proof.id} className="space-y-2">
                          {proof.image_url ? (
                            <div className="relative w-full pb-[133%] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              <Image
                                src={proof.image_url}
                                alt={`Чек ${proof.id}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                              Нет изображения, telegram_file_id: {proof.telegram_file_id ?? "—"}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 space-y-1">
                            <p>Загружен: {new Date(proof.submitted_at).toLocaleString("ru-RU")}</p>
                            {proof.submitted_by && <p>От: {proof.submitted_by}</p>}
                            {proof.comment && <p>Комментарий: {proof.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Информация по заказу</h3>
                  <p className="text-sm text-slate-600">Итого: {detail.order.formatted_total}</p>
                  {detail.order.address && (
                    <p className="text-sm text-slate-600">Адрес: {detail.order.address}</p>
                  )}
                  {detail.order.delivery_time && (
                    <p className="text-sm text-slate-600">
                      Время доставки: {detail.order.delivery_time}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Подтвердить (A)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                    disabled={actionLoading}
                    className="border-2 border-slate-900"
                  >
                    Отклонить (R)
                  </Button>
                </div>
              </div>
            ) : selectedPayment ? (
              <div className="text-center text-slate-500">Выберите платеж из списка.</div>
            ) : (
              <div className="text-center text-slate-500">Нет выбранного платежа.</div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Причина отказа</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Например, нечитаемый чек или сумма не совпадает"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleReject} disabled={actionLoading}>
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
