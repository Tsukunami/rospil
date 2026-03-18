"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./StoragePage.module.css";

import storageData from "@/data/storage.json";
import productsData from "@/data/products.json";

type StorageItem = {
  wood_id: number;
  current_scope: string;
  storage_cell: string;
};

type Product = {
  wood_id: number;
  swood_type: string;
};

type StorageRow = {
  woodId: number;
  woodName: string;
  currentScope: number;
  storageCell: string | null;
};

type SortField = "woodName" | "currentScope" | "storageCell";
type SortDirection = "asc" | "desc";

export default function StoragePage() {
  const [search, setSearch] = useState("");
  const [showAllWoodTypes, setShowAllWoodTypes] = useState(false);
  const [sortField, setSortField] = useState<SortField>("woodName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const storageItems = storageData.storage as StorageItem[];
  const products = productsData.products as Product[];

  const rows = useMemo<StorageRow[]>(() => {
    return products
      .map((product) => {
        const storageEntry = storageItems.find(
          (item) => item.wood_id === product.wood_id
        );

        return {
          woodId: product.wood_id,
          woodName: product.swood_type,
          currentScope: storageEntry ? Number(storageEntry.current_scope) : 0,
          storageCell: storageEntry ? storageEntry.storage_cell : null,
        };
      })
      .sort((a, b) => a.woodId - b.woodId);
  }, [products, storageItems]);

  const sortedAndFilteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let baseRows = showAllWoodTypes
      ? rows
      : rows.filter((row) => row.currentScope > 0);

    if (normalizedSearch) {
      baseRows = baseRows.filter((row) =>
        row.woodName.toLowerCase().includes(normalizedSearch)
      );
    }

    const sortedRows = [...baseRows].sort((a, b) => {
      let compareValue = 0;

      if (sortField === "woodName") {
        compareValue = a.woodName.localeCompare(b.woodName, "ru");
      }

      if (sortField === "currentScope") {
        compareValue = a.currentScope - b.currentScope;
      }

      if (sortField === "storageCell") {
        const cellA = a.storageCell ? Number(a.storageCell) : -1;
        const cellB = b.storageCell ? Number(b.storageCell) : -1;
        compareValue = cellA - cellB;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

    return sortedRows;
  }, [rows, search, showAllWoodTypes, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const getSortMarker = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск древесины"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>⌕</span>
        </div>

        <div className={styles.dropdownBlock}>
          <button
            type="button"
            className={styles.dropdownButton}
            onClick={() => setShowAllWoodTypes((prev) => !prev)}
          >
            {showAllWoodTypes
              ? "Показать только наличие"
              : "Показать все типы древесины"}
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <button
              type="button"
              className={styles.headerButton}
              onClick={() => handleSort("woodName")}
            >
              Наименование древесины{getSortMarker("woodName")}
            </button>

            <button
              type="button"
              className={styles.headerButton}
              onClick={() => handleSort("currentScope")}
            >
              Количество на складе{getSortMarker("currentScope")}
            </button>

            <button
              type="button"
              className={styles.headerButton}
              onClick={() => handleSort("storageCell")}
            >
              Ячейка хранения{getSortMarker("storageCell")}
            </button>
          </div>

          {sortedAndFilteredRows.map((row) => (
            <div key={row.woodId} className={styles.row}>
              <div className={styles.colName}>
                <Link
                  href={`/suppliers?search=${encodeURIComponent(row.woodName)}`}
                  className={styles.woodLink}
                >
                  {row.woodName}
                </Link>
              </div>

              <div className={styles.colAmount}>
                {row.currentScope.toLocaleString("ru-RU")}
              </div>

              <div className={styles.colCell}>
                {row.storageCell ? `Ячейка №${row.storageCell}` : "—"}
              </div>
            </div>
          ))}

          {sortedAndFilteredRows.length === 0 && (
            <div className={styles.empty}>Данные по складу не найдены</div>
          )}
        </div>
      </div>
    </div>
  );
}