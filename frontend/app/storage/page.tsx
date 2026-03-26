"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  wood_the_upper_end_diameter?: number;
  wood_lower_end_diameter?: number;
  wood_graduation: string;
  wood_cross_section: string;
};

type StorageRow = {
  woodId: number;
  woodName: string;
  woodGrade: string;
  woodLength: number;
  woodDiameter: number;
  woodTheUpperEndDiameter?: number;
  woodLowerEndDiameter?: number;
  woodGraduation: string;
  woodCrossSection: string;
  currentScope: number;
  storageCell: string;
};

type Filters = {
  woodType: string;
  woodGrade: string;
  minScope: string;
  maxScope: string;
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Состояние для карточки товара
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    woodType: "",
    woodGrade: "",
    minScope: "",
    maxScope: "",
    storageCell: ""
  });

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

  // Функция для открытия карточки товара
  const handleProductClick = (woodId: number) => {
    const product = products.find(p => p.wood_id === woodId);
    if (product) {
      setSelectedProduct(product);
      setIsProductModalOpen(true);
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
          woodDiameter: product.wood_diameter,
          woodTheUpperEndDiameter: product.wood_the_upper_end_diameter,
          woodLowerEndDiameter: product.wood_lower_end_diameter,
          woodGraduation: product.wood_graduation,
          woodCrossSection: product.wood_cross_section,
          currentScope: storage ? Number(storage.current_scope) : 0,
          storageCell: storage
            ? replaceCellWithBlock(storage.storage_cell)
            : "—",
        };
      })
      .sort((a, b) => a.woodId - b.woodId);
  }, [products, storageItems]);

  // Получаем уникальные значения для фильтров
  const uniqueWoodTypes = useMemo(() => {
    const types = rows.map(row => row.woodName);
    return [...new Set(types)].sort();
  }, [rows]);

  const uniqueWoodGrades = useMemo(() => {
    const grades = rows.map(row => row.woodGrade).filter(g => g);
    return [...new Set(grades)].sort();
  }, [rows]);

  const uniqueStorageCells = useMemo(() => {
    const cells = rows.map(row => row.storageCell).filter(cell => cell !== "—");
    return [...new Set(cells)].sort();
  }, [rows]);

  // Функция для сброса фильтров
  const clearFilters = () => {
    setFilters({
      woodType: "",
      woodGrade: "",
      minScope: "",
      maxScope: "",
      storageCell: ""
    });
  };

  const sortedAndFilteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let baseRows = showAllWoodTypes
      ? rows
      : rows.filter((row) => row.currentScope > 0);

    // Поиск
    if (normalizedSearch) {
      baseRows = baseRows.filter((row) =>
        row.woodName.toLowerCase().includes(normalizedSearch)
      );
    }

    // Фильтр по типу древесины
    if (filters.woodType) {
      baseRows = baseRows.filter(row => row.woodName === filters.woodType);
    }

    // Фильтр по сорту
    if (filters.woodGrade) {
      baseRows = baseRows.filter(row => row.woodGrade === filters.woodGrade);
    }

    // Фильтр по минимальному количеству
    if (filters.minScope) {
      const minScope = Number(filters.minScope);
      baseRows = baseRows.filter(row => row.currentScope >= minScope);
    }

    // Фильтр по максимальному количеству
    if (filters.maxScope) {
      const maxScope = Number(filters.maxScope);
      baseRows = baseRows.filter(row => row.currentScope <= maxScope);
    }

    // Фильтр по блоку хранения
    if (filters.storageCell) {
      baseRows = baseRows.filter(row => row.storageCell === filters.storageCell);
    }

    // Сортировка
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
  }, [rows, search, showAllWoodTypes, sortField, sortDirection, filters]);

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

  // Функция для форматирования характеристик товара
  const formatProductCharacteristics = (product: Product) => {
    const characteristics = [];
    
    if (product.wood_type) {
      characteristics.push({ label: 'Порода', value: product.wood_type });
    }
    if (product.wood_grade) {
      characteristics.push({ label: 'Сорт', value: product.wood_grade });
    }
    if (product.wood_length) {
      characteristics.push({ label: 'Длина', value: `${product.wood_length} м` });
    }
    if (product.wood_diameter) {
      characteristics.push({ label: 'Диаметр', value: `${product.wood_diameter} мм` });
    }
    if (product.wood_the_upper_end_diameter) {
      characteristics.push({ label: 'Верхний диаметр', value: `${product.wood_the_upper_end_diameter} мм` });
    }
    if (product.wood_lower_end_diameter) {
      characteristics.push({ label: 'Нижний диаметр', value: `${product.wood_lower_end_diameter} мм` });
    }
    if (product.wood_graduation) {
      characteristics.push({ label: 'Градация', value: product.wood_graduation });
    }
    if (product.wood_cross_section) {
      characteristics.push({ label: 'Сечение', value: product.wood_cross_section });
    }
    
    return characteristics;
  };

  const hasActiveFilters = filters.woodType || filters.woodGrade || filters.minScope || filters.maxScope || filters.storageCell;

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

        <button
          type="button"
          className={styles.filterButton}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <span className={styles.filterIcon}>🔍</span>
          Фильтры
          {hasActiveFilters && (
            <span className={styles.filterBadge}>●</span>
          )}
        </button>

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

      {/* Панель фильтров */}
      {isFilterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Тип древесины</label>
              <select
                value={filters.woodType}
                onChange={(e) => setFilters({...filters, woodType: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Все типы</option>
                {uniqueWoodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Сорт</label>
              <select
                value={filters.woodGrade}
                onChange={(e) => setFilters({...filters, woodGrade: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Все сорта</option>
                {uniqueWoodGrades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Количество от (м³)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={filters.minScope}
                onChange={(e) => setFilters({...filters, minScope: e.target.value})}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Количество до (м³)</label>
              <input
                type="number"
                step="0.01"
                placeholder="9999"
                value={filters.maxScope}
                onChange={(e) => setFilters({...filters, maxScope: e.target.value})}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Блок хранения</label>
              <select
                value={filters.storageCell}
                onChange={(e) => setFilters({...filters, storageCell: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Все блоки</option>
                {uniqueStorageCells.map(cell => (
                  <option key={cell} value={cell}>{cell}</option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              className={styles.clearFiltersButton}
              onClick={clearFilters}
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

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
                <button
                  type="button"
                  className={styles.woodLink}
                  onClick={() => handleProductClick(row.woodId)}
                  title={formatWoodInfo(row)}
                >
                  {row.woodName}
                  {row.woodGrade && (
                    <span className={styles.woodGrade}> ({row.woodGrade})</span>
                  )}
                </button>
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

      {/* Модальное окно карточки товара */}
      {isProductModalOpen && selectedProduct && (
        <div className={styles.overlay} onClick={() => setIsProductModalOpen(false)}>
          <div className={`${styles.modal} ${styles.productModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Характеристики материала
              <button
                className={styles.closeButton}
                onClick={() => setIsProductModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.productContent}>
              <div className={styles.productInfo}>
                {formatProductCharacteristics(selectedProduct).map((char, index) => (
                  <div key={index} className={styles.productChar}>
                    <span className={styles.charLabel}>{char.label}:</span>
                    <span className={styles.charValue}>{char.value}</span>
                  </div>
                ))}
              </div>
              
              {selectedProduct.wood_id && (
                <div className={styles.productId}>
                  ID материала: {selectedProduct.wood_id}
                </div>
              )}
            </div>
            
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.closeModalButton}
                onClick={() => setIsProductModalOpen(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}