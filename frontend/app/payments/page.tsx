"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./PaymentsPage.module.css";

import paymentsData from "@/data/payment.json";
import suppliersData from "@/data/suplier.json";

type PaymentItem = {
  id: number;
  number: string;
  suplier_id: number;
  status?: string;
  create: string;
};

type Supplier = {
  suplier_id: number;
  supplier_name: string;
};

type PaymentRow = {
  id: number;
  number: string;
  supplierName: string;
  status: string;
  create: string;
};

function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>(paymentsData.deliver);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [number, setNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("Готов");
  const [createDate, setCreateDate] = useState("");

  const suppliers = suppliersData.suppliers as Supplier[];

  const rows = useMemo<PaymentRow[]>(() => {
    return payments.map((item) => {
      const supplier = suppliers.find((s) => s.suplier_id === item.suplier_id);

      return {
        id: item.id,
        number: item.number,
        supplierName: supplier?.supplier_name || "Неизвестный поставщик",
        status: item.status || "Готов",
        create: item.create,
      };
    });
  }, [payments, suppliers]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return rows;

    return rows.filter((row) =>
      row.number.toLowerCase().includes(normalizedSearch)
    );
  }, [search, rows]);

  const handleDelete = (id: number) => {
    setPayments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOpenPdf = (number: string) => {
    window.open(`/docs/${number}.pdf`, "_blank");
  };

  const handleCreate = () => {
    if (!number.trim()) {
      alert("Введите номер документа");
      return;
    }

    if (!supplierId.trim()) {
      alert("Выберите поставщика");
      return;
    }

    const newItem: PaymentItem = {
      id: Date.now(),
      number: number.trim(),
      suplier_id: Number(supplierId),
      status,
      create: createDate.trim() || getTodayDate(),
    };

    setPayments((prev) => [newItem, ...prev]);

    setNumber("");
    setSupplierId("");
    setStatus("Готов");
    setCreateDate("");
    setIsModalOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск документа"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>⌕</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsModalOpen(true)}
            title="Создать запись"
          >
            <Image
              src="/icons/create-document.svg"
              alt="Создать"
              width={40}
              height={40}
            />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={styles.colNumber}>Номер документа</div>
            <div className={styles.colSupplier}>Наименование</div>
            <div className={styles.colStatus}>Статус</div>
            <div className={styles.colDate}>Создан</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredRows.map((row) => (
            <div key={row.id} className={styles.row}>
              <div className={styles.colNumber}>№{row.number}</div>
              <div className={styles.colSupplier}>{row.supplierName}</div>

              <div
                className={`${styles.colStatus} ${
                  row.status === "Готов"
                    ? styles.statusReady
                    : row.status === "Выполняется"
                    ? styles.statusDoing
                    : styles.statusProgress
                }`}
              >
                {row.status}
              </div>

              <div className={styles.colDate}>{row.create}</div>

              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleOpenPdf(row.number)}
                  title="Открыть PDF"
                >
                  <Image
                    src="/icons/download-document.svg"
                    alt="Открыть"
                    width={40}
                    height={40}
                  />
                </button>

                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleDelete(row.id)}
                  title="Удалить"
                >
                  <Image
                    src="/icons/delete-document.svg"
                    alt="Удалить"
                    width={40}
                    height={40}
                  />
                </button>
              </div>
            </div>
          ))}

          {filteredRows.length === 0 && (
            <div className={styles.empty}>Записи не найдены</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Создание расчёта</div>

            <div className={styles.form}>
              <input
                type="text"
                placeholder="Номер документа"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className={styles.input}
              />

              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={styles.input}
              >
                <option value="">Выберите поставщика</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.suplier_id} value={supplier.suplier_id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.input}
              >
                <option value="Готов">Готов</option>
                <option value="В процессе">В процессе</option>
                <option value="Выполняется">Выполняется</option>
              </select>

              <input
                type="text"
                placeholder="Дата создания (необязательно)"
                value={createDate}
                onChange={(e) => setCreateDate(e.target.value)}
                className={styles.input}
              />

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                >
                  Отмена
                </button>

                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleCreate}
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}