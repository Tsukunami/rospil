"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./MaterialsExpensePage.module.css";

type ExpenseItem = {
  id: number;
  wood_id: number;
  expenditure_scope?: number;
  expenditure_data: string;
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
  expenseDateRaw: string;
  characteristics: string[];
};

type Filters = {
  product: string;
  dateFrom: string;
  dateTo: string;
  minScope: string;
  maxScope: string;
};

type SortConfig = {
  key: 'productName' | 'expenseScope' | 'expenseDate';
  direction: 'asc' | 'desc';
};

function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateForAPI(dateStr: string) {
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function formatDateForDisplay(dateStr: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  } catch {
    return dateStr;
  }
}

export default function MaterialsExpensePage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedWoodId, setExpandedWoodId] = useState<number | null>(null);
  const [selectedWoodId, setSelectedWoodId] = useState("");
  const [expenseScope, setExpenseScope] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Состояния для сортировки и фильтрации
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'expenseDate',
    direction: 'desc'
  });
  const [filters, setFilters] = useState<Filters>({
    product: "",
    dateFrom: "",
    dateTo: "",
    minScope: "",
    maxScope: ""
  });
  
  // Состояние для карточки товара
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log("Загрузка данных расхода материалов...");

      const [expensesRes, productsRes, storageRes] = await Promise.all([
        fetch("http://localhost:8000/api/table/expenditure/"),
        fetch("http://localhost:8000/api/table/product/"),
        fetch("http://localhost:8000/api/table/storage/"),
      ]);

      if (!expensesRes.ok) throw new Error("Ошибка загрузки расходов");
      if (!productsRes.ok) throw new Error("Ошибка загрузки продуктов");
      if (!storageRes.ok) throw new Error("Ошибка загрузки склада");

      const expensesData = await expensesRes.json();
      const productsData = await productsRes.json();
      const storageData = await storageRes.json();

      console.log("Загружено расходов:", expensesData.length);
      console.log("Загружено продуктов:", productsData.length);
      console.log("Загружено склада:", storageData.length);

      setExpenses(expensesData);
      setProducts(productsData);
      setStorageItems(storageData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  // Функция для открытия карточки товара
  const handleProductClick = (woodId: number) => {
    console.log("=== КЛИК ПО МАТЕРИАЛУ В РАСХОДЕ ===");
    console.log("woodId:", woodId);
    
    const product = products.find(p => p.wood_id === woodId);
    console.log("Найденный продукт:", product);
    
    if (product) {
      setSelectedProduct(product);
      setIsProductModalOpen(true);
    } else {
      alert(`Информация о материале не найдена (ID: ${woodId})`);
    }
  };

  // Функция для сортировки
  const handleSort = (key: 'productName' | 'expenseScope' | 'expenseDate') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Функция для сброса фильтров
  const clearFilters = () => {
    setFilters({
      product: "",
      dateFrom: "",
      dateTo: "",
      minScope: "",
      maxScope: ""
    });
  };

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
    return expenses
      .map((item) => {
        const product = products.find((p) => p.wood_id === item.wood_id);
        
        // Получаем объем расхода
        const scope = item.expenditure_scope || 0;

        // Формируем характеристики из таблицы product
        const characteristics: string[] = [];
        if (product?.wood_grade) characteristics.push(`Сорт: ${product.wood_grade}`);
        if (product?.wood_length) characteristics.push(`Длина: ${product.wood_length} м`);
        if (product?.wood_cross_section)
          characteristics.push(`Сечение: ${product.wood_cross_section}`);
        if (product?.wood_diameter)
          characteristics.push(`Диаметр: ${product.wood_diameter} мм`);
        if (product?.wood_graduation)
          characteristics.push(`Градация: ${product.wood_graduation}`);
        if (product?.wood_the_upper_end_diameter)
          characteristics.push(`Верхний диаметр: ${product.wood_the_upper_end_diameter} мм`);
        if (product?.wood_lower_end_diameter)
          characteristics.push(`Нижний диаметр: ${product.wood_lower_end_diameter} мм`);

        return {
          id: item.id,
          woodId: item.wood_id,
          productName: product?.wood_type || "Неизвестный материал",
          expenseScope: scope,
          expenseDate: formatDateForDisplay(item.expenditure_data),
          expenseDateRaw: item.expenditure_data,
          characteristics,
        };
      });
  }, [expenses, products]);

  // Получаем уникальные продукты для фильтра
  const uniqueProducts = useMemo(() => {
    const productsList = rows.map(row => row.productName);
    return [...new Set(productsList)].sort();
  }, [rows]);

  // Применяем фильтры и сортировку
  const filteredAndSortedRows = useMemo(() => {
    let filtered = rows;
    
    // Поиск по названию материала
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter((row) =>
        row.productName.toLowerCase().includes(normalizedSearch)
      );
    }
    
    // Фильтр по продукту
    if (filters.product) {
      filtered = filtered.filter(row => row.productName === filters.product);
    }
    
    // Фильтр по дате (от)
    if (filters.dateFrom) {
      filtered = filtered.filter(row => row.expenseDateRaw >= filters.dateFrom);
    }
    
    // Фильтр по дате (до)
    if (filters.dateTo) {
      filtered = filtered.filter(row => row.expenseDateRaw <= filters.dateTo);
    }
    
    // Фильтр по минимальному объему
    if (filters.minScope) {
      const minScope = Number(filters.minScope);
      filtered = filtered.filter(row => row.expenseScope >= minScope);
    }
    
    // Фильтр по максимальному объему
    if (filters.maxScope) {
      const maxScope = Number(filters.maxScope);
      filtered = filtered.filter(row => row.expenseScope <= maxScope);
    }
    
    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.key) {
        case 'productName':
          comparison = a.productName.localeCompare(b.productName, 'ru');
          break;
        case 'expenseScope':
          comparison = a.expenseScope - b.expenseScope;
          break;
        case 'expenseDate':
          comparison = a.expenseDateRaw.localeCompare(b.expenseDateRaw);
          break;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [search, filters, rows, sortConfig]);

  const handleAddExpense = async () => {
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
      alert(`Недостаточно материала на складе. Доступно: ${available.toFixed(2)} м³`);
      return;
    }

    try {
      const expenseData = {
        wood_id: woodId,
        expenditure_scope: scope,
        expenditure_data: formatDateForAPI(getTodayDate()),
      };

      console.log("Отправляем данные:", expenseData);

      const response = await fetch("http://localhost:8000/api/table/expenditure/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка добавления расхода");
      }

      // Обновляем склад
      const updatedScope = available - scope;
      const updateStorageRes = await fetch("http://localhost:8000/api/table/storage/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wood_id: woodId,
          current_scope: updatedScope.toString(),
          storage_cell: storageEntry?.storage_cell || "",
        }),
      });

      if (!updateStorageRes.ok) {
        throw new Error("Ошибка обновления склада");
      }

      alert("Расход материала успешно добавлен");
      
      await fetchAllData();
      
      setSelectedWoodId("");
      setExpenseScope("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ошибка:", err);
      alert("Ошибка добавления расхода: " + (err instanceof Error ? err.message : "Неизвестная ошибка"));
    }
  };

  const toggleCharacteristics = (woodId: number) => {
    setExpandedWoodId((prev) => (prev === woodId ? null : woodId));
  };

  // Получаем иконку сортировки
  const getSortIcon = (key: 'productName' | 'expenseScope' | 'expenseDate') => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Функция для форматирования характеристик товара для модального окна
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

  if (loading) {
    return <div className={styles.page}>Загрузка данных...</div>;
  }

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
        
        <button
          type="button"
          className={styles.filterButton}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <span className={styles.filterIcon}>🔍</span>
          Фильтры
          {(filters.product || filters.dateFrom || filters.dateTo || filters.minScope || filters.maxScope) && (
            <span className={styles.filterBadge}>●</span>
          )}
        </button>
      </div>

      {/* Панель фильтров */}
      {isFilterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Материал</label>
              <select
                value={filters.product}
                onChange={(e) => setFilters({...filters, product: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Все материалы</option>
                {uniqueProducts.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Дата от</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Дата до</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Объем от (м³)</label>
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
              <label>Объем до (м³)</label>
              <input
                type="number"
                step="0.01"
                placeholder="9999"
                value={filters.maxScope}
                onChange={(e) => setFilters({...filters, maxScope: e.target.value})}
                className={styles.filterInput}
              />
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
            <div 
              className={`${styles.colProduct} ${styles.sortable}`}
              onClick={() => handleSort('productName')}
            >
              Продукт {getSortIcon('productName')}
            </div>
            <div 
              className={`${styles.colScope} ${styles.sortable}`}
              onClick={() => handleSort('expenseScope')}
            >
              Кол-во в производство {getSortIcon('expenseScope')}
            </div>
            <div 
              className={`${styles.colDate} ${styles.sortable}`}
              onClick={() => handleSort('expenseDate')}
            >
              Дата {getSortIcon('expenseDate')}
            </div>
          </div>

          {filteredAndSortedRows.map((row) => (
            <div key={row.id} className={styles.rowGroup}>
              <div className={styles.row}>
                <div className={styles.colProduct}>
                  <button
                    type="button"
                    className={`${styles.productButton} ${styles.clickableProduct}`}
                    onClick={() => handleProductClick(row.woodId)}
                    title="Нажмите для просмотра полных характеристик"
                  >
                    {row.productName}
                  </button>
                </div>

                <div className={styles.colScope}>
                  {row.expenseScope && row.expenseScope > 0 ? (
                    <>
                      {row.expenseScope.toLocaleString("ru-RU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} м³
                    </>
                  ) : (
                    "0.00 м³"
                  )}
                </div>

                <div className={styles.colDate}>{row.expenseDate}</div>
              </div>

              {expandedWoodId === row.woodId && (
                <div className={styles.characteristicsBox}>
                  <div className={styles.characteristicsTitle}>Характеристики:</div>
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

          {filteredAndSortedRows.length === 0 && (
            <div className={styles.empty}>Записи о расходе материалов не найдены</div>
          )}
        </div>
      </div>

      {/* Модальное окно добавления расхода */}
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
                    {product.wood_type} {product.wood_grade && `(${product.wood_grade})`} — 
                    доступно {product.currentScope.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} м³
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