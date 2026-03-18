"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./DeliveryPage.module.css";

import deliverData from "@/data/deliver.json";
import suppliersData from "@/data/suplier.json";
import productsData from "@/data/products.json";

type DeliverItem = {
  id: number;
  number: string;
  suplier_id: number;
  product_id: number;
  status: string;
  create: string;
};

type Supplier = {
  suplier_id: number;
  supplier_name: string;
};

type Product = {
  wood_id: number;
  swood_type: string;
};

type DeliveryRow = {
  id: number;
  number: string;
  supplierName: string;
  productName: string;
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

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliverItem[]>(deliverData.deliver);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [number, setNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("Готов");
  const [createDate, setCreateDate] = useState("");

  const suppliers = suppliersData.suppliers as Supplier[];
  const products = productsData.products as Product[];

  const rows = useMemo<DeliveryRow[]>(() => {
    return deliveries.map((item) => {
      const supplier = suppliers.find((s) => s.suplier_id === item.suplier_id);
      const product = products.find((p) => p.wood_id === item.product_id);

      return {
        id: item.id,
        number: item.number,
        supplierName: supplier?.supplier_name || "Неизвестный поставщик",
        productName: product?.swood_type || "Неизвестный материал",
        status: item.status,
        create: item.create,
      };
    });
  }, [deliveries, suppliers, products]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return rows;

    return rows.filter(
      (row) =>
        row.number.toLowerCase().includes(normalizedSearch) ||
        row.productName.toLowerCase().includes(normalizedSearch)
    );
  }, [search, rows]);

  const handleDelete = (id: number) => {
    setDeliveries((prev) => prev.filter((item) => item.id !== id));
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

    if (!productId.trim()) {
      alert("Выберите материал");
      return;
    }

    const newItem: DeliverItem = {
      id: Date.now(),
      number: number.trim(),
      suplier_id: Number(supplierId),
      product_id: Number(productId),
      status,
      create: createDate.trim() || getTodayDate(),
    };

    setDeliveries((prev) => [newItem, ...prev]);

    setNumber("");
    setSupplierId("");
    setProductId("");
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
            placeholder="Поиск по номеру документа или древесине"
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
              width={24}
              height={24}
            />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={styles.colNumber}>Номер документа</div>
            <div className={styles.colSupplier}>Наименование</div>
            <div className={styles.colProduct}>Материал</div>
            <div className={styles.colStatus}>Статус</div>
            <div className={styles.colDate}>Дата поставки</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredRows.map((row) => (
            <div key={row.id} className={styles.row}>
              <div className={styles.colNumber}>№{row.number}</div>
              <div className={styles.colSupplier}>{row.supplierName}</div>
              <div className={styles.colProduct}>{row.productName}</div>

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
                    width={24}
                    height={24}
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
                    width={24}
                    height={24}
                  />
                </button>
              </div>
            </div>
          ))}

          {filteredRows.length === 0 && (
            <div className={styles.empty}>Поставки не найдены</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Создание поставки</div>

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
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={styles.input}
              >
                <option value="">Выберите материал</option>
                {products.map((product) => (
                  <option key={product.wood_id} value={product.wood_id}>
                    {product.swood_type}
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
                placeholder="Дата поставки (необязательно)"
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