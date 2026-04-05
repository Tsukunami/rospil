"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./PaymentsPage.module.css";
import { useAuth } from "@/components/AuthContext";

type PaymentItem = {
  suppliers_contract_id: number;
  contract_number: string;
  supplier_id: number;
  suppliers_contract_status: string;
  suppliers_contract_cost: number;
  suppliers_contract_scope: number;
  suppliers_contract_date: string;
};

type Supplier = {
  supplier_id: number;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_inn: string;
};

type PaymentRow = {
  id: number;
  number: string;
  supplierName: string;
  supplierId: number;
  status: string;
  create: string;
  createRaw: string;
  cost: number;
  scope: number;
};

type Filters = {
  supplier: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  minCost: string;
  maxCost: string;
};

type SortConfig = {
  key: "number" | "supplierName" | "status" | "create" | "cost" | "scope";
  direction: "asc" | "desc";
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU");
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number) {
  if (!amount) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function PaymentsPage() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "create",
    direction: "desc",
  });

  const [filters, setFilters] = useState<Filters>({
    supplier: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    minCost: "",
    maxCost: "",
  });

  const isReadOnly = useMemo(() => {
    if (!user) return false;

    const access = (user as any).access;
    const role = String((user as any).role || "").toLowerCase();

    return access === "3" || access === 3 || role === "бухгалтер";
  }, [user]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [contractsRes, suppliersRes] = await Promise.all([
        fetch("http://localhost:8000/api/table/suppliers_contract/"),
        fetch("http://localhost:8000/api/table/suppliers_info/"),
      ]);

      if (!contractsRes.ok) throw new Error("Ошибка загрузки контрактов");
      if (!suppliersRes.ok) throw new Error("Ошибка загрузки поставщиков");

      const contractsData = await contractsRes.json();
      const suppliersData = await suppliersRes.json();

      setPayments(contractsData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo<PaymentRow[]>(() => {
    return payments.map((item) => {
      const supplier = suppliers.find((s) => s.supplier_id === item.supplier_id);

      return {
        id: item.suppliers_contract_id,
        number: item.contract_number,
        supplierName: supplier?.supplier_name || "Неизвестный поставщик",
        supplierId: item.supplier_id,
        status: item.suppliers_contract_status,
        create: formatDate(item.suppliers_contract_date),
        createRaw: item.suppliers_contract_date,
        cost: item.suppliers_contract_cost || 0,
        scope: item.suppliers_contract_scope || 0,
      };
    });
  }, [payments, suppliers]);

  const uniqueSuppliers = useMemo(() => {
    const suppliersList = rows.map((row) => row.supplierName);
    return [...new Set(suppliersList)].sort();
  }, [rows]);

  const uniqueStatuses = useMemo(() => {
    const statusesList = rows.map((row) => row.status);
    return [...new Set(statusesList)];
  }, [rows]);

  const filteredAndSortedRows = useMemo(() => {
    let filtered = [...rows];

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(
        (row) =>
          row.number.toLowerCase().includes(normalizedSearch) ||
          row.supplierName.toLowerCase().includes(normalizedSearch)
      );
    }

    if (filters.supplier) {
      filtered = filtered.filter((row) => row.supplierName === filters.supplier);
    }

    if (filters.status) {
      filtered = filtered.filter((row) => row.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((row) => row.createRaw >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((row) => row.createRaw <= filters.dateTo);
    }

    if (filters.minCost) {
      const minCost = Number(filters.minCost);
      filtered = filtered.filter((row) => row.cost >= minCost);
    }

    if (filters.maxCost) {
      const maxCost = Number(filters.maxCost);
      filtered = filtered.filter((row) => row.cost <= maxCost);
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case "number":
          comparison = a.number.localeCompare(b.number);
          break;
        case "supplierName":
          comparison = a.supplierName.localeCompare(b.supplierName, "ru");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status, "ru");
          break;
        case "create":
          comparison = a.createRaw.localeCompare(b.createRaw);
          break;
        case "cost":
          comparison = a.cost - b.cost;
          break;
        case "scope":
          comparison = a.scope - b.scope;
          break;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [search, filters, rows, sortConfig]);

  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setFilters({
      supplier: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      minCost: "",
      maxCost: "",
    });
  };

  const handleStatusChange = async (contractId: number, newStatus: string) => {
    if (isReadOnly) return;

    setUpdatingStatus(contractId);

    try {
      const contractToUpdate = payments.find((p) => p.suppliers_contract_id === contractId);
      if (!contractToUpdate) {
        throw new Error("Контракт не найден");
      }

      const updateData = {
        suppliers_contract_id: contractToUpdate.suppliers_contract_id,
        supplier_id: contractToUpdate.supplier_id,
        contract_number: contractToUpdate.contract_number,
        suppliers_contract_status: newStatus,
        suppliers_contract_cost: contractToUpdate.suppliers_contract_cost,
        suppliers_contract_scope: contractToUpdate.suppliers_contract_scope,
        suppliers_contract_date: contractToUpdate.suppliers_contract_date,
      };

      const response = await fetch("http://localhost:8000/api/table/suppliers_contract/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка обновления статуса");
      }

      setPayments((prev) =>
        prev.map((p) =>
          p.suppliers_contract_id === contractId
            ? { ...p, suppliers_contract_status: newStatus }
            : p
        )
      );
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
      alert("Ошибка обновления статуса оплаты");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;

    if (!confirm("Вы уверены, что хотите удалить этот контракт? Это действие необратимо.")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/table/suppliers_contract/?id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка удаления");
      }

      setPayments((prev) => prev.filter((item) => item.suppliers_contract_id !== id));
      alert("Контракт удален");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Ошибка удаления контракта");
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "оплачено":
        return styles.statusReady;
      case "просрочено":
        return styles.statusProgress;
      case "срок оплаты не наступил":
      default:
        return styles.statusDoing;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "оплачено":
        return "Оплачено";
      case "просрочено":
        return "Просрочено";
      case "срок оплаты не наступил":
        return "Срок оплаты не наступил";
      default:
        return status;
    }
  };

  const getSortIcon = (key: SortConfig["key"]) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? "↑" : "↓";
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
            placeholder="Поиск по номеру контракта или поставщику"
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
          {(filters.supplier ||
            filters.status ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.minCost ||
            filters.maxCost) && <span className={styles.filterBadge}>●</span>}
        </button>
      </div>

      {isFilterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Поставщик</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="">Все поставщики</option>
                {uniqueSuppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Статус</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="">Все статусы</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Дата от</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Дата до</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Стоимость от (₽)</label>
              <input
                type="number"
                step="1000"
                placeholder="0"
                value={filters.minCost}
                onChange={(e) => setFilters({ ...filters, minCost: e.target.value })}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Стоимость до (₽)</label>
              <input
                type="number"
                step="1000"
                placeholder="9999999"
                value={filters.maxCost}
                onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
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
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow} ${isReadOnly ? styles.readonlyRow : ""}`}>
            <div
              className={`${styles.colNumber} ${styles.sortable}`}
              onClick={() => handleSort("number")}
            >
              Номер контракта {getSortIcon("number")}
            </div>
            <div
              className={`${styles.colSupplier} ${styles.sortable}`}
              onClick={() => handleSort("supplierName")}
            >
              Поставщик {getSortIcon("supplierName")}
            </div>
            <div
              className={`${styles.colStatus} ${styles.sortable}`}
              onClick={() => handleSort("status")}
            >
              Статус оплаты {getSortIcon("status")}
            </div>
            <div
              className={`${styles.colDate} ${styles.sortable}`}
              onClick={() => handleSort("create")}
            >
              Дата контракта {getSortIcon("create")}
            </div>
            <div
              className={`${styles.colCost} ${styles.sortable}`}
              onClick={() => handleSort("cost")}
            >
              Стоимость {getSortIcon("cost")}
            </div>
            <div
              className={`${styles.colScope} ${styles.sortable}`}
              onClick={() => handleSort("scope")}
            >
              Объем {getSortIcon("scope")}
            </div>
            {!isReadOnly && <div className={styles.colActions}>Действия</div>}
          </div>

          {filteredAndSortedRows.map((row) => (
            <div
              key={row.id}
              className={`${styles.row} ${isReadOnly ? styles.readonlyRow : ""}`}
            >
              <div className={styles.colNumber}>№{row.number}</div>
              <div className={styles.colSupplier}>{row.supplierName}</div>

              <div className={styles.colStatus}>
                {isReadOnly ? (
                  <span className={`${styles.statusBadge} ${getStatusClass(row.status)}`}>
                    {getStatusText(row.status)}
                  </span>
                ) : (
                  <>
                    <select
                      value={row.status}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                      className={`${styles.statusSelect} ${getStatusClass(row.status)}`}
                      disabled={updatingStatus === row.id}
                    >
                      <option value="срок оплаты не наступил">Срок оплаты не наступил</option>
                      <option value="оплачено">Оплачено</option>
                      <option value="просрочено">Просрочено</option>
                    </select>
                    {updatingStatus === row.id && (
                      <span className={styles.statusUpdating}>⏳</span>
                    )}
                  </>
                )}
              </div>

              <div className={styles.colDate}>{row.create}</div>
              <div className={styles.colCost}>{formatCurrency(row.cost)}</div>
              <div className={styles.colScope}>{row.scope} м³</div>

              {!isReadOnly && (
                <div className={styles.colActions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => handleDelete(row.id)}
                    title="Удалить контракт"
                  >
                    <Image
                      src="/icons/delete-document.svg"
                      alt="Удалить"
                      width={50}
                      height={50}
                    />
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredAndSortedRows.length === 0 && (
            <div className={styles.empty}>Контракты не найдены</div>
          )}
        </div>
      </div>
    </div>
  );
}