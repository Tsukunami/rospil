// ActsPage.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./ActsPage.module.css";

type ActItem = {
  id: number;
  type: string;
  date: string;
  dateRaw: string;
  employeeName: string;
  employeeId: number;
};

type Employee = {
  employee_id: number;
  employee_name: string;
  employee_pasport_number: string;
  employee_phone: string;
  employee_post: string;
};

type Supplier = {
  id: number;
  name: string;
};

type SuppliersContract = {
  suppliers_contract_id: number;
  supplier_id: number;
  contract_number: string;
  suppliers_contract_status: string;
  suppliers_contract_cost: number | null;
  suppliers_contract_scope: number | null;
  suppliers_contract_date: string;
};

type Delivery = {
  delivery_id: number;
  suppliers_contract_id: number;
  delivery_scope: number;
  delivery_date: string;
  delivery_status: string;
  act_id: number;
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

type SupplierWood = {
  supplier_id: number;
  wood_id: number;
  available_quantity: number;
};

type DeliveryItem = {
  id: number;
  scope: number;
  date: string;
  status: string;
  material: string;
};

type Filters = {
  type: string;
  employee: string;
  dateFrom: string;
  dateTo: string;
};

type SortConfig = {
  key: "id" | "type" | "employeeName" | "date";
  direction: "asc" | "desc";
};

export default function ActsPage() {
  const [acts, setActs] = useState<ActItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [suppliersContracts, setSuppliersContracts] = useState<SuppliersContract[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierWood, setSupplierWood] = useState<SupplierWood[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAct, setSelectedAct] = useState<ActItem | null>(null);
  const [isDeliveriesModalOpen, setIsDeliveriesModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "desc",
  });
  const [filters, setFilters] = useState<Filters>({
    type: "",
    employee: "",
    dateFrom: "",
    dateTo: "",
  });
  const [formData, setFormData] = useState({
    type: "акт приемки",
    date: "",
    employeeId: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU');
};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    setLoading(true);

    // Загрузка актов (обязательна)
    let actsData = [];
    try {
      const res = await fetch("http://localhost:8000/api/table/act/");
      if (res.ok) actsData = await res.json();
      else console.error("Ошибка загрузки актов:", res.status);
    } catch (err) {
      console.error("Сетевая ошибка при загрузке актов:", err);
    }

    // Загрузка сотрудников
    let employeesData = [];
    try {
      const res = await fetch("http://localhost:8000/api/table/employees/");
      if (res.ok) employeesData = await res.json();
      else console.error("Ошибка загрузки сотрудников:", res.status);
    } catch (err) {
      console.error("Сетевая ошибка при загрузке сотрудников:", err);
    }
    setEmployees(employeesData);

    // Загрузка поставок
    let deliveriesData = [];
    try {
      const res = await fetch("http://localhost:8000/api/table/delivery/");
      if (res.ok) deliveriesData = await res.json();
      else console.error("Ошибка загрузки поставок:", res.status);
    } catch (err) {
      console.error("Сетевая ошибка при загрузке поставок:", err);
    }
    setDeliveries(deliveriesData);

    // Загрузка контрактов поставщиков
    let contractsData = [];
    try {
      const res = await fetch("http://localhost:8000/api/table/suppliers_contract/");
      if (res.ok) contractsData = await res.json();
      else console.error("Ошибка загрузки контрактов:", res.status);
    } catch (err) {
      console.error("Сетевая ошибка при загрузке контрактов:", err);
    }
    setSuppliersContracts(contractsData);

    // Загрузка продукции
    let productsData = [];
    try {
      const res = await fetch("http://localhost:8000/api/table/product/");
      if (res.ok) productsData = await res.json();
      else console.error("Ошибка загрузки продукции:", res.status);
    } catch (err) {
      console.error("Сетевая ошибка при загрузке продукции:", err);
    }
    setProducts(productsData);

    // Загрузка связей поставщик-продукция
    let supplierWoodData = [];
    try {
      const res = await fetch("http://localhost:8000/api/table/supplier_wood/");
      if (res.ok) supplierWoodData = await res.json();
      else console.error("Ошибка загрузки supplier_wood:", res.status);
    } catch (err) {
      console.error("Сетевая ошибка при загрузке supplier_wood:", err);
    }
    setSupplierWood(supplierWoodData);

    // Маппинг актов (только если есть данные)
    if (actsData.length > 0) {
      const employeeMap = new Map<number, string>();
      employeesData.forEach((emp: Employee) => {
        employeeMap.set(emp.employee_id, emp.employee_name);
      });

      const mappedActs = actsData.map((act: any) => ({
        id: act.act_id,
        type: act.act_type,
        date: formatDate(act.act_date),
        dateRaw: act.act_date,
        employeeName: employeeMap.get(act.employee_id) || "Неизвестный сотрудник",
        employeeId: act.employee_id,
      }));
      setActs(mappedActs);
    } else {
      setActs([]);
    }
  } catch (err) {
    console.error("Общая ошибка загрузки:", err);
    alert("Ошибка загрузки данных. Подробности в консоли.");
  } finally {
    setLoading(false);
  }
};

  const getMaterialForDelivery = (delivery: Delivery): string => {
    // Находим контракт, к которому относится поставка
    const contract = suppliersContracts.find(
      (c) => c.suppliers_contract_id === delivery.suppliers_contract_id
    );
    if (!contract) return "Материал не указан";

    // Ищем продукцию, которую поставляет этот поставщик
    const supplierWoodItem = supplierWood.find(
      (sw) => sw.supplier_id === contract.supplier_id
    );
    if (supplierWoodItem) {
      const product = products.find((p) => p.wood_id === supplierWoodItem.wood_id);
      if (product) {
        return `${product.wood_type} (${product.wood_grade})`;
      }
    }
    return "Материал не указан";
  };

  const handleActClick = (act: ActItem) => {
    setSelectedAct(act);
    setIsDeliveriesModalOpen(true);
  };

  const actDeliveries = useMemo(() => {
    if (!selectedAct) return [];

    const deliveriesList = deliveries.filter((d) => d.act_id === selectedAct.id);

    return deliveriesList
      .map((delivery) => ({
        id: delivery.delivery_id,
        scope: delivery.delivery_scope,
        date: formatDate(delivery.delivery_date),
        status: delivery.delivery_status,
        material: getMaterialForDelivery(delivery),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAct, deliveries, suppliersContracts, products, supplierWood]);

  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: SortConfig["key"]) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      employee: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const uniqueTypes = useMemo(() => {
    const types = acts.map((act) => act.type);
    return [...new Set(types)];
  }, [acts]);

  const uniqueEmployees = useMemo(() => {
    const employeesList = acts.map((act) => act.employeeName);
    return [...new Set(employeesList)].sort();
  }, [acts]);

  const filteredAndSortedActs = useMemo(() => {
    let filtered = [...acts];

    // Поиск
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(
        (act) =>
          act.id.toString().includes(normalizedSearch) ||
          act.type.toLowerCase().includes(normalizedSearch) ||
          act.employeeName.toLowerCase().includes(normalizedSearch)
      );
    }

    // Фильтр по типу
    if (filters.type) {
      filtered = filtered.filter((act) => act.type === filters.type);
    }

    // Фильтр по сотруднику
    if (filters.employee) {
      filtered = filtered.filter((act) => act.employeeName === filters.employee);
    }

    // Фильтр по дате (от)
    if (filters.dateFrom) {
      filtered = filtered.filter((act) => act.dateRaw >= filters.dateFrom);
    }

    // Фильтр по дате (до)
    if (filters.dateTo) {
      filtered = filtered.filter((act) => act.dateRaw <= filters.dateTo);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case "id":
          comparison = a.id - b.id;
          break;
        case "type":
          comparison = a.type.localeCompare(b.type, "ru");
          break;
        case "employeeName":
          comparison = a.employeeName.localeCompare(b.employeeName, "ru");
          break;
        case "date":
          comparison = a.dateRaw.localeCompare(b.dateRaw);
          break;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [acts, search, filters, sortConfig]);

  const handleCreateAct = async () => {
    if (!formData.date) {
      alert("Введите дату акта");
      return;
    }

    if (!formData.employeeId) {
      alert("Выберите сотрудника");
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        act_type: formData.type,
        act_date: formData.date,
        employee_id: parseInt(formData.employeeId, 10),
      };

      const response = await fetch("http://localhost:8000/api/act/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка создания акта");
      }

      alert("Акт успешно создан");
      await fetchData();

      setFormData({
        type: "акт приемки",
        date: "",
        employeeId: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err instanceof Error ? err.message : "Ошибка создания акта");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAct = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот акт?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`http://localhost:8000/api/table/act/?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка удаления");
      }

      setActs((prev) => prev.filter((act) => act.id !== id));
      alert("Акт удален");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Ошибка удаления акта");
    } finally {
      setDeletingId(null);
    }
  };

  const getDeliveryStatusClass = (status: string) => {
    switch (status) {
      case "доставлено":
        return styles.deliveryStatusReady;
      case "нарушение":
        return styles.deliveryStatusProgress;
      case "ожидается":
      default:
        return styles.deliveryStatusDoing;
    }
  };

  const getDeliveryStatusText = (status: string) => {
    switch (status) {
      case "доставлено":
        return "Доставлено";
      case "нарушение":
        return "Нарушение";
      case "ожидается":
        return "Ожидается";
      default:
        return status;
    }
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
            placeholder="Поиск по номеру, типу или сотруднику"
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
          {(filters.type || filters.employee || filters.dateFrom || filters.dateTo) && (
            <span className={styles.filterBadge}>●</span>
          )}
        </button>
      </div>

      {/* Панель фильтров */}
      {isFilterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Тип акта</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="">Все типы</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "акт приемки" ? "Акт приемки" : "Акт о расхождении"}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Сотрудник</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="">Все сотрудники</option>
                {uniqueEmployees.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
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
            title="Создать акт"
          >
            <Image
              src="/icons/create-document.svg"
              alt="Создать"
              width={50}
              height={50}
            />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div
              className={`${styles.colNumber} ${styles.sortable}`}
              onClick={() => handleSort("id")}
            >
              Номер акта {getSortIcon("id")}
            </div>
            <div
              className={`${styles.colType} ${styles.sortable}`}
              onClick={() => handleSort("type")}
            >
              Тип акта {getSortIcon("type")}
            </div>
            <div
              className={`${styles.colEmployee} ${styles.sortable}`}
              onClick={() => handleSort("employeeName")}
            >
              Сотрудник {getSortIcon("employeeName")}
            </div>
            <div
              className={`${styles.colDate} ${styles.sortable}`}
              onClick={() => handleSort("date")}
            >
              Дата {getSortIcon("date")}
            </div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredAndSortedActs.map((act) => (
            <div key={act.id} className={styles.row}>
              <div
                className={`${styles.colNumber} ${styles.clickableNumber}`}
                onClick={() => handleActClick(act)}
                title="Нажмите для просмотра поставок"
              >
                Акт-{act.id}
              </div>
              <div className={styles.colType}>
                {act.type === "акт приемки" ? "Акт приемки" : "Акт о расхождении"}
              </div>
              <div className={styles.colEmployee}>{act.employeeName}</div>
              <div className={styles.colDate}>{act.date}</div>
              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleDeleteAct(act.id)}
                  title="Удалить"
                  disabled={deletingId === act.id}
                >
                  <Image
                    src="/icons/delete-document.svg"
                    alt="Удалить"
                    width={50}
                    height={50}
                  />
                </button>
              </div>
            </div>
          ))}

          {filteredAndSortedActs.length === 0 && (
            <div className={styles.empty}>Акты не найдены</div>
          )}
        </div>
      </div>

      {/* Модальное окно создания акта */}
      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Создание акта</div>
            <div className={styles.form}>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={styles.input}
              >
                <option value="акт приемки">Акт приемки</option>
                <option value="акт о расхождении">Акт о расхождении</option>
              </select>

              <input
                type="date"
                placeholder="Дата акта *"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={styles.input}
                required
              />

              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className={styles.input}
                required
              >
                <option value="">Выберите сотрудника</option>
                {employees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.employee_name}
                  </option>
                ))}
              </select>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleCreateAct}
                  disabled={isCreating}
                >
                  {isCreating ? "Создание..." : "Создать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с поставками по акту */}
      {isDeliveriesModalOpen && selectedAct && (
        <div className={styles.overlay} onClick={() => setIsDeliveriesModalOpen(false)}>
          <div
            className={`${styles.modal} ${styles.deliveriesModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>
              Поставки по акту {selectedAct.id}
              <button
                className={styles.closeButton}
                onClick={() => setIsDeliveriesModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.actInfo}>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Тип акта:</span>
                <span className={styles.actInfoValue}>
                  {selectedAct.type === "акт приемки" ? "Акт приемки" : "Акт о расхождении"}
                </span>
              </div>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Сотрудник:</span>
                <span className={styles.actInfoValue}>{selectedAct.employeeName}</span>
              </div>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Дата акта:</span>
                <span className={styles.actInfoValue}>{selectedAct.date}</span>
              </div>
            </div>

            <div className={styles.deliveriesSection}>
              <h4 className={styles.deliveriesTitle}>
                Список поставок ({actDeliveries.length})
              </h4>

              {actDeliveries.length > 0 ? (
                <div className={styles.deliveriesList}>
                  <div className={styles.deliveriesHeader}>
                    <div className={styles.deliveryColMaterial}>Материал</div>
                    <div className={styles.deliveryColScope}>Объем</div>
                    <div className={styles.deliveryColDate}>Дата</div>
                    <div className={styles.deliveryColStatus}>Статус</div>
                  </div>

                  {actDeliveries.map((delivery) => (
                    <div key={delivery.id} className={styles.deliveryRow}>
                      <div className={styles.deliveryColMaterial}>{delivery.material}</div>
                      <div className={styles.deliveryColScope}>{delivery.scope} м³</div>
                      <div className={styles.deliveryColDate}>{delivery.date}</div>
                      <div className={styles.deliveryColStatus}>
                        <span
                          className={`${styles.deliveryStatusBadge} ${getDeliveryStatusClass(
                            delivery.status
                          )}`}
                        >
                          {getDeliveryStatusText(delivery.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noDeliveries}>
                  По этому акту пока нет поставок
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.closeModalButton}
                onClick={() => setIsDeliveriesModalOpen(false)}
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