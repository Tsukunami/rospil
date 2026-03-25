"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./MaterialsExpensePage.module.css";

import expenseData from "@/data/materials-expense.json";
import productsData from "@/data/products.json";
import storageData from "@/data/storage.json";

type ExpenseItem = {
  id: number;
  wood_id: number;
  expense_scope: number;
  expense_date: string;
};

type Product = {
  wood_id: number;
  wood_type?: string;
  swood_type?: string;
  wood_grade?: string;
  wood_length?: number;
  wood_diameter?: number;
  wood_graduation?: string;
  wood_cross_section?: string;
};

type StorageItem = {
  wood_id: number;
  current_scope: string;
  storage_cell: string;
};

type ExpenseRow = {
  id: number;
  woodId: number;
  productName: string;
  expenseScope: number;
  expenseDate: string;
  characteristics: string[];
};

function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

function getProductName(product: Product) {
  return product.wood_type || product.swood_type || "Неизвестный материал";
}

export default function MaterialsExpensePage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(
    expenseData.expenses as ExpenseItem[]
  );
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedWoodId, setExpandedWoodId] = useState<number | null>(null);

  const [selectedWoodId, setSelectedWoodId] = useState("");
  const [expenseScope, setExpenseScope] = useState("");

  const products = productsData.products as Product[];
  const storageItems = (storageData as { storage?: StorageItem[]; stprage?: StorageItem[] })
    .storage || (storageData as { stprage?: StorageItem[] }).stprage || [];

  const availableProducts = useMemo(() => {
    return products
      .map((product) => {
        const storageEntry = storageItems.find((item) => item.wood_id === product.wood_id);
        return {
          ...product,
          currentScope: storageEntry ? Number(storageEntry.current_scope) : 0,
        };
      })
      .filter((product) => product.currentScope > 0);
  }, [products, storageItems]);

  const rows = useMemo<ExpenseRow[]>(() => {
    return expenses.map((item) => {
      const product = products.find((p) => p.wood_id === item.wood_id);

      const characteristics: string[] = [];
      if (product?.wood_grade) characteristics.push(`Сорт: ${product.wood_grade}`);
      if (product?.wood_length) characteristics.push(`Длина: ${product.wood_length} м`);
      if (product?.wood_cross_section)
        characteristics.push(`Сечение: ${product.wood_cross_section}`);
      if (product?.wood_diameter)
        characteristics.push(`Диаметр: ${product.wood_diameter}`);
      if (product?.wood_graduation)
        characteristics.push(`Градация: ${product.wood_graduation}`);

      return {
        id: item.id,
        woodId: item.wood_id,
        productName: product ? getProductName(product) : "Неизвестный материал",
        expenseScope: item.expense_scope,
        expenseDate: item.expense_date,
        characteristics,
      };
    });
  }, [expenses, products]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return rows;

    return rows.filter((row) =>
      row.productName.toLowerCase().includes(normalizedSearch)
    );
  }, [search, rows]);

  const handleAddExpense = () => {
    if (!selectedWoodId) {
      alert("Выберите материал");
      return;
    }

    if (!expenseScope || Number(expenseScope) <= 0) {
      alert("Введите корректное количество");
      return;
    }

    const woodId = Number(selectedWoodId);
    const scope = Number(expenseScope);

    const storageEntry = storageItems.find((item) => item.wood_id === woodId);
    const available = storageEntry ? Number(storageEntry.current_scope) : 0;

    if (scope > available) {
      alert("Недостаточно материала на складе");
      return;
    }

    const newExpense: ExpenseItem = {
      id: Date.now(),
      wood_id: woodId,
      expense_scope: scope,
      expense_date: getTodayDate(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setSelectedWoodId("");
    setExpenseScope("");
    setIsModalOpen(false);
  };

  const toggleCharacteristics = (woodId: number) => {
    setExpandedWoodId((prev) => (prev === woodId ? null : woodId));
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск по материалу"
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
            title="Добавить расход"
          >
            <Image
              src="/icons/create-document.svg"
              alt="Добавить"
              width={55}
              height={55}
            />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={styles.colProduct}>Продукт</div>
            <div className={styles.colScope}>Кол-во в производство</div>
            <div className={styles.colDate}>Дата</div>
          </div>

          {filteredRows.map((row) => (
            <div key={row.id} className={styles.rowGroup}>
              <div className={styles.row}>
                <div className={styles.colProduct}>
                  <button
                    type="button"
                    className={styles.productButton}
                    onClick={() => toggleCharacteristics(row.woodId)}
                  >
                    {row.productName}
                  </button>
                </div>

                <div className={styles.colScope}>
                  {row.expenseScope.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  м³
                </div>

                <div className={styles.colDate}>{row.expenseDate}</div>
              </div>

              {expandedWoodId === row.woodId && (
                <div className={styles.characteristicsBox}>
                  {row.characteristics.length > 0 ? (
                    row.characteristics.map((item, index) => (
                      <div key={index} className={styles.characteristicLine}>
                        {item}
                      </div>
                    ))
                  ) : (
                    <div className={styles.characteristicLine}>
                      Характеристики отсутствуют
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredRows.length === 0 && (
            <div className={styles.empty}>Записи о расходе материалов не найдены</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Добавление расхода материала</div>

            <div className={styles.form}>
              <select
                value={selectedWoodId}
                onChange={(e) => setSelectedWoodId(e.target.value)}
                className={styles.input}
              >
                <option value="">Выберите материал со склада</option>
                {availableProducts.map((product) => (
                  <option key={product.wood_id} value={product.wood_id}>
                    {getProductName(product)} — доступно {product.currentScope.toLocaleString("ru-RU")} м³
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Количество в производство (м³)"
                value={expenseScope}
                onChange={(e) => setExpenseScope(e.target.value)}
                className={styles.input}
              />

              <div className={styles.readonlyDate}>
                Дата будет установлена автоматически: {getTodayDate()}
              </div>

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
                  onClick={handleAddExpense}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}