// ActsPage.tsx - полная версия с поддержкой новых полей и редактированием

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
  discrepancyType?: string;
  defectQuantity?: number;
  shortageQuantity?: number;
  actuallyAccepted?: number;
  defectDescription?: string;
};

type Employee = {
  employee_id: number;
  employee_name: string;
  employee_pasport_number: string;
  employee_phone: string;
  employee_post: string;
};

type SuppliersContract = {
  suppliers_contract_id: number;
  supplier_id: number;
  contract_number: string;
  suppliers_contract_status: string;
  suppliers_contract_cost: number | null;
  suppliers_contract_scope: number | null;
  suppliers_contract_date: string;
  contract_bank?: string;
  contract_bik?: string;
  contract_correspondent_account?: string;
};

type Delivery = {
  delivery_id: number;
  suppliers_contract_id: number;
  delivery_scope: number;
  delivery_date: string;
  delivery_status: string;
  act_id: number;
  wood_id?: number;
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
  offered_price?: number;
};

type SupplierInfo = {
  supplier_id: number;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_inn: string;
  supplier_ogrnip?: string;
  supplier_bank_account?: string;
};

type DeliveryItem = {
  id: number;
  scope: number;
  date: string;
  dateRaw: string;
  status: string;
  material: string;
  contractNumber: string;
  contractDate: string;
  supplierId: number;
  supplierName: string;
  supplierAddress: string;
  woodId?: number;
  price?: number;
  total?: number;
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
  const [suppliers, setSuppliers] = useState<SupplierInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  const [editFormData, setEditFormData] = useState({
    act_id: "",
    act_type: "акт приемки",
    act_date: "",
    employee_id: "",
    discrepancy_type: "",
    defect_quantity: "0",
    shortage_quantity: "0",
    actually_accepted: "",
    defect_description: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      let actsData = [];
      try {
        const res = await fetch("http://localhost:8000/api/table/act/");
        if (res.ok) actsData = await res.json();
        else console.error("Ошибка загрузки актов:", res.status);
      } catch (err) {
        console.error("Сетевая ошибка при загрузке актов:", err);
      }

      let employeesData = [];
      try {
        const res = await fetch("http://localhost:8000/api/table/employees/");
        if (res.ok) employeesData = await res.json();
        else console.error("Ошибка загрузки сотрудников:", res.status);
      } catch (err) {
        console.error("Сетевая ошибка при загрузке сотрудников:", err);
      }
      setEmployees(employeesData);

      let deliveriesData = [];
      try {
        const res = await fetch("http://localhost:8000/api/table/delivery/");
        if (res.ok) deliveriesData = await res.json();
        else console.error("Ошибка загрузки поставок:", res.status);
      } catch (err) {
        console.error("Сетевая ошибка при загрузке поставок:", err);
      }
      setDeliveries(deliveriesData);

      let contractsData = [];
      try {
        const res = await fetch("http://localhost:8000/api/table/suppliers_contract/");
        if (res.ok) contractsData = await res.json();
        else console.error("Ошибка загрузки контрактов:", res.status);
      } catch (err) {
        console.error("Сетевая ошибка при загрузке контрактов:", err);
      }
      setSuppliersContracts(contractsData);

      let productsData = [];
      try {
        const res = await fetch("http://localhost:8000/api/table/product/");
        if (res.ok) productsData = await res.json();
        else console.error("Ошибка загрузки продукции:", res.status);
      } catch (err) {
        console.error("Сетевая ошибка при загрузке продукции:", err);
      }
      setProducts(productsData);

      let supplierWoodData = [];
      try {
        const res = await fetch("http://localhost:8000/api/table/supplier_wood/");
        if (res.ok) supplierWoodData = await res.json();
        else console.error("Ошибка загрузки supplier_wood:", res.status);
      } catch (err) {
        console.error("Сетевая ошибка при загрузке supplier_wood:", err);
      }
      setSupplierWood(supplierWoodData);

      let suppliersData = [];
      try {
        const res = await fetch("http://localhost:8000/api/table/suppliers_info/");
        if (res.ok) suppliersData = await res.json();
        else console.error("Ошибка загрузки suppliers_info:", res.status);
      } catch (err) {
        console.error("Сетевая ошибка при загрузке suppliers_info:", err);
      }
      setSuppliers(suppliersData);

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
          discrepancyType: act.discrepancy_type,
          defectQuantity: act.defect_quantity !== null ? parseFloat(act.defect_quantity) : 0,
          shortageQuantity: act.shortage_quantity !== null ? parseFloat(act.shortage_quantity) : 0,
          actuallyAccepted: act.actually_accepted !== null ? parseFloat(act.actually_accepted) : undefined,
          defectDescription: act.defect_description,
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

  const handleOpenEditModal = (act: ActItem) => {
    setSelectedAct(act);
    setEditFormData({
      act_id: act.id.toString(),
      act_type: act.type,
      act_date: act.dateRaw,
      employee_id: act.employeeId.toString(),
      discrepancy_type: act.discrepancyType || "",
      defect_quantity: (act.defectQuantity || 0).toString(),
      shortage_quantity: (act.shortageQuantity || 0).toString(),
      actually_accepted: act.actuallyAccepted !== undefined ? act.actuallyAccepted.toString() : "",
      defect_description: act.defectDescription || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAct = async () => {
    if (!editFormData.act_date) {
      alert("Введите дату акта");
      return;
    }

    if (!editFormData.employee_id) {
      alert("Выберите сотрудника");
      return;
    }

    setIsUpdating(true);

    try {
      const payload: any = {
        act_id: parseInt(editFormData.act_id),
        act_type: editFormData.act_type,
        act_date: editFormData.act_date,
        employee_id: parseInt(editFormData.employee_id),
      };

      if (editFormData.act_type === "акт о расхождении") {
        if (editFormData.discrepancy_type) {
          payload.discrepancy_type = editFormData.discrepancy_type;
        }
        payload.defect_quantity = parseFloat(editFormData.defect_quantity) || 0;
        payload.shortage_quantity = parseFloat(editFormData.shortage_quantity) || 0;
        if (editFormData.actually_accepted) {
          payload.actually_accepted = parseFloat(editFormData.actually_accepted);
        }
        if (editFormData.defect_description) {
          payload.defect_description = editFormData.defect_description;
        }
      }

      const response = await fetch("http://localhost:8000/api/table/act/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка обновления акта");
      }

      alert("Акт успешно обновлён");
      await fetchData();
      setIsEditModalOpen(false);
      setSelectedAct(null);
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err instanceof Error ? err.message : "Ошибка обновления акта");
    } finally {
      setIsUpdating(false);
    }
  };

  const getMaterialForDelivery = (delivery: Delivery): string => {
    if (delivery.wood_id) {
      const product = products.find((p) => p.wood_id === delivery.wood_id);
      if (product) {
        return `${product.wood_type} (${product.wood_grade})`;
      }
    }

    const contract = suppliersContracts.find(
      (c) => c.suppliers_contract_id === delivery.suppliers_contract_id
    );
    if (!contract) return "Материал не указан";

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

  const getWoodIdForDelivery = (delivery: Delivery): number | undefined => {
    if (delivery.wood_id) return delivery.wood_id;

    const contract = suppliersContracts.find(
      (c) => c.suppliers_contract_id === delivery.suppliers_contract_id
    );
    if (!contract) return undefined;

    const supplierWoodItem = supplierWood.find(
      (sw) => sw.supplier_id === contract.supplier_id
    );

    return supplierWoodItem?.wood_id;
  };

  const handleActClick = (act: ActItem) => {
    setSelectedAct(act);
    setIsDeliveriesModalOpen(true);
  };

  const actDeliveries = useMemo<DeliveryItem[]>(() => {
    if (!selectedAct) return [];

    const deliveriesList = deliveries.filter((d) => d.act_id === selectedAct.id);

    return deliveriesList
      .map((delivery) => {
        const contract = suppliersContracts.find(
          (c) => c.suppliers_contract_id === delivery.suppliers_contract_id
        );

        const supplier = suppliers.find((s) => s.supplier_id === contract?.supplier_id);
        const woodId = getWoodIdForDelivery(delivery);

        const supplierWoodItem =
          contract && woodId
            ? supplierWood.find(
                (sw) => sw.supplier_id === contract.supplier_id && sw.wood_id === woodId
              )
            : undefined;

        const price = Number(supplierWoodItem?.offered_price || 0);
        const total = price * Number(delivery.delivery_scope || 0);

        return {
          id: delivery.delivery_id,
          scope: delivery.delivery_scope,
          date: formatDate(delivery.delivery_date),
          dateRaw: delivery.delivery_date,
          status: delivery.delivery_status,
          material: getMaterialForDelivery(delivery),
          contractNumber: contract?.contract_number || "",
          contractDate: contract?.suppliers_contract_date || "",
          supplierId: contract?.supplier_id || 0,
          supplierName: supplier?.supplier_name || "Неизвестный поставщик",
          supplierAddress: supplier?.supplier_address || "",
          woodId,
          price,
          total,
        };
      })
      .sort((a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime());
  }, [selectedAct, deliveries, suppliersContracts, products, supplierWood, suppliers]);

  const handleDownloadActPdf = async (act: ActItem) => {
    try {
      const deliveriesForAct = deliveries.filter((d) => d.act_id === act.id);

      if (deliveriesForAct.length === 0) {
        alert("У этого акта нет поставок для формирования PDF");
        return;
      }

      const items = deliveriesForAct.map((delivery, index) => {
        const contract = suppliersContracts.find(
          (c) => c.suppliers_contract_id === delivery.suppliers_contract_id
        );

        const supplier = suppliers.find((s) => s.supplier_id === contract?.supplier_id);
        const woodId = getWoodIdForDelivery(delivery);

        const supplierWoodItem =
          contract && woodId
            ? supplierWood.find(
                (sw) => sw.supplier_id === contract.supplier_id && sw.wood_id === woodId
              )
            : undefined;

        const productName = getMaterialForDelivery(delivery);
        const price = Number(supplierWoodItem?.offered_price || 0);
        const scope = Number(delivery.delivery_scope || 0);
        const total = price * scope;

        return {
          index: index + 1,
          productName,
          price,
          scope,
          total,
          contractNumber: contract?.contract_number || "",
          contractDate: contract?.suppliers_contract_date || "",
          supplierName: supplier?.supplier_name || "Неизвестный поставщик",
          supplierAddress: supplier?.supplier_address || "",
          woodId,
          deliveryDate: delivery.delivery_date,
        };
      });

      const firstItem = items[0];
      const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
      const vat = grandTotal * 0.2;
      const totalWithVat = grandTotal + vat;

      const response = await fetch("/api/acts/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actId: act.id,
          actType: act.type,
          actDate: act.dateRaw,
          employeeName: act.employeeName,
          city: "Сыктывкар",
          supplierName: firstItem?.supplierName || "Поставщик",
          supplierAddress: firstItem?.supplierAddress || "",
          contractNumber: firstItem?.contractNumber || "",
          contractDate: firstItem?.contractDate || "",
          items,
          grandTotal,
          vat,
          totalWithVat,
          discrepancyType: act.discrepancyType,
          defectQuantity: act.defectQuantity,
          shortageQuantity: act.shortageQuantity,
          actuallyAccepted: act.actuallyAccepted,
          defectDescription: act.defectDescription,
          deliveryDate: firstItem?.deliveryDate || "",
          productName: firstItem?.productName || "Товар",
          unit: "м³",
          price: firstItem?.price || 0,
          documentedQuantity: firstItem?.scope || 0,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Ошибка генерации PDF";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `act-${act.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка скачивания PDF:", error);
      alert(error instanceof Error ? error.message : "Не удалось скачать PDF");
    }
  };

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

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(
        (act) =>
          act.id.toString().includes(normalizedSearch) ||
          act.type.toLowerCase().includes(normalizedSearch) ||
          act.employeeName.toLowerCase().includes(normalizedSearch)
      );
    }

    if (filters.type) {
      filtered = filtered.filter((act) => act.type === filters.type);
    }

    if (filters.employee) {
      filtered = filtered.filter((act) => act.employeeName === filters.employee);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((act) => act.dateRaw >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((act) => act.dateRaw <= filters.dateTo);
    }

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

      const response = await fetch("http://localhost:8000/api/table/act/", {
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
                  onClick={() => handleOpenEditModal(act)}
                  title="Редактировать"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleDownloadActPdf(act)}
                  title="Скачать PDF"
                >
                  <Image
                    src="/icons/download.svg"
                    alt="Скачать"
                    width={50}
                    height={50}
                  />
                </button>

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

      {/* Модальное окно редактирования акта */}
      {isEditModalOpen && selectedAct && (
        <div className={styles.overlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Редактирование акта №{selectedAct.id}
              <button className={styles.closeButton} onClick={() => setIsEditModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Тип акта</label>
                <select
                  value={editFormData.act_type}
                  onChange={(e) => setEditFormData({ ...editFormData, act_type: e.target.value })}
                  className={styles.input}
                >
                  <option value="акт приемки">Акт приемки</option>
                  <option value="акт о расхождении">Акт о расхождении</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Дата акта</label>
                <input
                  type="date"
                  value={editFormData.act_date}
                  onChange={(e) => setEditFormData({ ...editFormData, act_date: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Сотрудник</label>
                <select
                  value={editFormData.employee_id}
                  onChange={(e) => setEditFormData({ ...editFormData, employee_id: e.target.value })}
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
              </div>

              {editFormData.act_type === "акт о расхождении" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Тип расхождения</label>
                    <select
                      value={editFormData.discrepancy_type}
                      onChange={(e) => setEditFormData({ ...editFormData, discrepancy_type: e.target.value })}
                      className={styles.input}
                    >
                      <option value="">Выберите тип расхождения</option>
                      <option value="недостаток">Недостаток</option>
                      <option value="брак">Брак</option>
                      <option value="недостаток и брак">Недостаток и брак</option>
                    </select>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Количество брака (м³)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.defect_quantity}
                        onChange={(e) => setEditFormData({ ...editFormData, defect_quantity: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Количество недостачи (м³)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.shortage_quantity}
                        onChange={(e) => setEditFormData({ ...editFormData, shortage_quantity: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Фактически принято (м³)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Автоматический расчёт"
                      value={editFormData.actually_accepted}
                      onChange={(e) => setEditFormData({ ...editFormData, actually_accepted: e.target.value })}
                      className={styles.input}
                    />
                    <small className={styles.hint}>
                      При пустом поле будет автоматически рассчитано: объём поставки - брак - недостача
                    </small>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Описание брака</label>
                    <textarea
                      placeholder="Опишите выявленный брак"
                      value={editFormData.defect_description}
                      onChange={(e) => setEditFormData({ ...editFormData, defect_description: e.target.value })}
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleUpdateAct}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно поставок по акту */}
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
              {selectedAct.type === "акт о расхождении" && (
                <>
                  <div className={styles.actInfoRow}>
                    <span className={styles.actInfoLabel}>Тип расхождения:</span>
                    <span className={styles.actInfoValue}>
                      {selectedAct.discrepancyType === "недостаток" && "Недостаток"}
                      {selectedAct.discrepancyType === "брак" && "Брак"}
                      {selectedAct.discrepancyType === "недостаток и брак" && "Недостаток и брак"}
                      {!selectedAct.discrepancyType && "-"}
                    </span>
                  </div>
                  <div className={styles.actInfoRow}>
                    <span className={styles.actInfoLabel}>Брак:</span>
                    <span className={styles.actInfoValue}>
                      {selectedAct.defectQuantity?.toFixed(2) ?? "0.00"} м³
                    </span>
                  </div>
                  <div className={styles.actInfoRow}>
                    <span className={styles.actInfoLabel}>Недостача:</span>
                    <span className={styles.actInfoValue}>
                      {selectedAct.shortageQuantity?.toFixed(2) ?? "0.00"} м³
                    </span>
                  </div>
                  <div className={styles.actInfoRow}>
                    <span className={styles.actInfoLabel}>Фактически принято:</span>
                    <span className={styles.actInfoValue}>
                      {selectedAct.actuallyAccepted !== undefined && selectedAct.actuallyAccepted !== null
                        ? `${selectedAct.actuallyAccepted.toFixed(2)} м³`
                        : "-"}
                    </span>
                  </div>
                  <div className={styles.actInfoRow}>
                    <span className={styles.actInfoLabel}>Описание дефекта:</span>
                    <span className={styles.actInfoValue}>
                      {selectedAct.defectDescription || "-"}
                    </span>
                  </div>
                </>
              )}
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