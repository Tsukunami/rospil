"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import styles from "./StoragePage.module.css";

type StorageItem = {
  wood_id: number;
  current_scope: string;
  storage_cell: string;
};

type Product = {
  wood_id: number;
  wood_type: string;
  wood_grade: string;
  wood_length: number;
  wood_diameter: number;
  wood_graduation: string;
  wood_cross_section: string;
};

type StorageRow = {
  woodId: number;
  woodName: string;
  woodGrade: string;
  woodLength: number;
  woodCrossSection: string;
  currentScope: number;
  storageCell: string;
};

type SortField = "woodName" | "currentScope" | "storageCell";
type SortDirection = "asc" | "desc";

export default function StoragePage() {
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAllWoodTypes, setShowAllWoodTypes] = useState(false);
  const [sortField, setSortField] = useState<SortField>("woodName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [storageRes, productsRes] = await Promise.all([
        fetch("http://localhost:8000/api/table/storage/"),
        fetch("http://localhost:8000/api/table/product/"),
      ]);

      if (!storageRes.ok) throw new Error("Ошибка загрузки склада");
      if (!productsRes.ok) throw new Error("Ошибка загрузки продуктов");

      const storageData = await storageRes.json();
      const productsData = await productsRes.json();

      setStorageItems(storageData);
      setProducts(productsData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const replaceCellWithBlock = (value: string) => {
    if (!value) return "—";
    return value.replace(/ячейка/gi, "Блок");
  };

  const rows = useMemo<StorageRow[]>(() => {
    const storageMap = new Map<number, StorageItem>();
    storageItems.forEach((item) => {
      storageMap.set(item.wood_id, item);
    });

    return products
      .map((product) => {
        const storage = storageMap.get(product.wood_id);

        return {
          woodId: product.wood_id,
          woodName: product.wood_type,
          woodGrade: product.wood_grade,
          woodLength: product.wood_length,
          woodCrossSection: product.wood_cross_section,
          currentScope: storage ? Number(storage.current_scope) : 0,
          storageCell: storage
            ? replaceCellWithBlock(storage.storage_cell)
            : "—",
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
        compareValue = a.storageCell.localeCompare(b.storageCell, "ru");
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

  const formatWoodInfo = (row: StorageRow) => {
    const parts = [row.woodName];
    if (row.woodGrade) parts.push(`${row.woodGrade}`);
    if (row.woodLength) parts.push(`длина: ${row.woodLength}м`);
    if (row.woodCrossSection) parts.push(`сечение: ${row.woodCrossSection}`);
    return parts.join(" | ");
  };

  if (loading) {
    return <div className={styles.page}>Загрузка данных склада...</div>;
  }

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
              Количество на складе (м³){getSortMarker("currentScope")}
            </button>

            <button
              type="button"
              className={styles.headerButton}
              onClick={() => handleSort("storageCell")}
            >
              Блок хранения{getSortMarker("storageCell")}
            </button>
          </div>

          {sortedAndFilteredRows.map((row) => (
            <div key={row.woodId} className={styles.row}>
              <div className={styles.colName}>
                <Link
                  href={`/suppliers?search=${encodeURIComponent(row.woodName)}`}
                  className={styles.woodLink}
                  title={formatWoodInfo(row)}
                >
                  {row.woodName}
                  {row.woodGrade && (
                    <span className={styles.woodGrade}> ({row.woodGrade})</span>
                  )}
                </Link>
              </div>

              <div
                className={`${styles.colAmount} ${
                  row.currentScope === 0 ? styles.zeroAmount : ""
                }`}
              >
                {row.currentScope.toLocaleString("ru-RU", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {row.currentScope === 0 && (
                  <span className={styles.outOfStock}> (нет в наличии)</span>
                )}
              </div>

              <div className={styles.colCell}>
                {row.storageCell}
                {row.storageCell === "—" && (
                  <span className={styles.noCell}> - блок не назначен</span>
                )}
              </div>
            </div>
          ))}

          {sortedAndFilteredRows.length === 0 && (
            <div className={styles.empty}>Данные по складу не найдены</div>
          )}
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Всего на складе:</span>
          <span className={styles.statValue}>
            {rows
              .reduce((sum, row) => sum + row.currentScope, 0)
              .toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
            м³
          </span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Видов древесины:</span>
          <span className={styles.statValue}>
            {rows.filter((row) => row.currentScope > 0).length} / {rows.length}
          </span>
        </div>
      </div>
    </div>
  );
}