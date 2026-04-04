// DeliveryPage.tsx - полная версия с поддержкой новых полей в актах

"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./DeliveryPage.module.css";

type DeliveryItem = {
  delivery_id: number;
  suppliers_contract_id: number;
  delivery_scope: number;
  delivery_date: string;
  delivery_status: string;
  act_id: number;
  wood_id?: number;
};

type SupplierContract = {
  suppliers_contract_id: number;
  contract_number: string;
  supplier_id: number;
  suppliers_contract_status: string;
  suppliers_contract_cost: number;
  suppliers_contract_scope: number;
  suppliers_contract_date: string;
  contract_bank?: string;
  contract_bik?: string;
  contract_correspondent_account?: string;
};

type Supplier = {
  supplier_id: number;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_inn: string;
  supplier_ogrnip?: string;
  supplier_bank_account?: string;
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

type StorageItem = {
  wood_id: number;
  current_scope: string;
  storage_cell: string;
};

type Act = {
  act_id: number;
  act_type: string;
  act_date: string;
  employee_id: number;
  employee_name?: string;
  discrepancy_type?: string;
  defect_quantity?: number;
  shortage_quantity?: number;
  actually_accepted?: number;
  defect_description?: string;
};

type Employee = {
  employee_id: number;
  employee_name: string;
  employee_pasport_number: string;
  employee_phone: string;
  employee_post: string;
};

type DeliveryRow = {
  id: number;
  number: string;
  supplierName: string;
  supplierId: number;
  productName: string;
  productId?: number;
  status: string;
  create: string;
  createRaw: string;
  scope: number;
  actId: number;
  woodId?: number;
  contractId: number;
  contractDate?: string;
  offeredPrice?: number;
};

type Filters = {
  supplier: string;
  product: string;
  status: string;
  contract: string;
  dateFrom: string;
  dateTo: string;
  minScope: string;
  maxScope: string;
};

type SortConfig = {
  key: "number" | "supplierName" | "productName" | "status" | "create" | "scope";
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

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contracts, setContracts] = useState<SupplierContract[]>([]);
  const [supplierWood, setSupplierWood] = useState<SupplierWood[]>([]);
  const [storage, setStorage] = useState<StorageItem[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActModalOpen, setIsActModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({
    supplier: "",
    product: "",
    status: "",
    contract: "",
    dateFrom: "",
    dateTo: "",
    minScope: "",
    maxScope: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "create",
    direction: "desc",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [actFormData, setActFormData] = useState({
    act_type: "акт приемки",
    employee_id: "",
    discrepancy_type: "",
    defect_quantity: "0",
    shortage_quantity: "0",
    actually_accepted: "",
    defect_description: "",
  });

  const [formData, setFormData] = useState({
    contractId: "",
    woodId: "",
    deliveryScope: "",
    deliveryDate: "",
    deliveryStatus: "ожидается",
    actId: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [
        deliveriesRes,
        suppliersRes,
        productsRes,
        contractsRes,
        supplierWoodRes,
        storageRes,
        actsRes,
        employeesRes,
      ] = await Promise.all([
        fetch("http://localhost:8000/api/table/delivery/"),
        fetch("http://localhost:8000/api/table/suppliers_info/"),
        fetch("http://localhost:8000/api/table/product/"),
        fetch("http://localhost:8000/api/table/suppliers_contract/"),
        fetch("http://localhost:8000/api/table/supplier_wood/"),
        fetch("http://localhost:8000/api/table/storage/"),
        fetch("http://localhost:8000/api/table/act/"),
        fetch("http://localhost:8000/api/table/employees/"),
      ]);

      if (!deliveriesRes.ok) throw new Error("Ошибка загрузки поставок");
      if (!suppliersRes.ok) throw new Error("Ошибка загрузки поставщиков");
      if (!productsRes.ok) throw new Error("Ошибка загрузки продуктов");
      if (!contractsRes.ok) throw new Error("Ошибка загрузки контрактов");

      const deliveriesData = await deliveriesRes.json();
      const suppliersData = await suppliersRes.json();
      const productsData = await productsRes.json();
      const contractsData = await contractsRes.json();
      const supplierWoodData = supplierWoodRes.ok ? await supplierWoodRes.json() : [];
      const storageData = storageRes.ok ? await storageRes.json() : [];
      const actsData = actsRes.ok ? await actsRes.json() : [];
      const employeesData = employeesRes.ok ? await employeesRes.json() : [];

      setDeliveries(deliveriesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setContracts(contractsData);
      setSupplierWood(supplierWoodData);
      setStorage(storageData);
      setActs(actsData);
      setEmployees(employeesData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActModal = (delivery: DeliveryRow) => {
    setSelectedDelivery(delivery);

    if (delivery.actId) {
      const existingAct = acts.find((a) => a.act_id === delivery.actId);
      if (existingAct) {
        setActFormData({
          act_type: existingAct.act_type,
          employee_id: existingAct.employee_id.toString(),
          discrepancy_type: existingAct.discrepancy_type || "",
          defect_quantity: (existingAct.defect_quantity || 0).toString(),
          shortage_quantity: (existingAct.shortage_quantity || 0).toString(),
          actually_accepted: existingAct.actually_accepted !== undefined ? existingAct.actually_accepted.toString() : "",
          defect_description: existingAct.defect_description || "",
        });
      } else {
        setActFormData({
          act_type: "акт приемки",
          employee_id: "",
          discrepancy_type: "",
          defect_quantity: "0",
          shortage_quantity: "0",
          actually_accepted: "",
          defect_description: "",
        });
      }
    } else {
      setActFormData({
        act_type: "акт приемки",
        employee_id: "",
        discrepancy_type: "",
        defect_quantity: "0",
        shortage_quantity: "0",
        actually_accepted: "",
        defect_description: "",
      });
    }

    setIsActModalOpen(true);
  };

  const storekeepers = useMemo(() => {
    return employees.filter((emp) => emp.employee_post === "Кладовщик");
  }, [employees]);

  const handleSaveAct = async () => {
    if (!selectedDelivery) return;

    if (!actFormData.employee_id) {
      alert("Выберите сотрудника");
      return;
    }

    setIsCreating(true);

    try {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      const actData: any = {
        act_type: actFormData.act_type,
        act_date: formattedDate,
        employee_id: parseInt(actFormData.employee_id),
      };

      if (actFormData.act_type === "акт о расхождении") {
        if (actFormData.discrepancy_type) {
          actData.discrepancy_type = actFormData.discrepancy_type;
        }
        actData.defect_quantity = parseFloat(actFormData.defect_quantity) || 0;
        actData.shortage_quantity = parseFloat(actFormData.shortage_quantity) || 0;
        if (actFormData.actually_accepted) {
          actData.actually_accepted = parseFloat(actFormData.actually_accepted);
        }
        if (actFormData.defect_description) {
          actData.defect_description = actFormData.defect_description;
        }
      }

      let actId: number;

      if (selectedDelivery.actId) {
        const updateResponse = await fetch(`http://localhost:8000/api/table/act/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            act_id: selectedDelivery.actId,
            ...actData,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error("Ошибка обновления акта");
        }

        actId = selectedDelivery.actId;
      } else {
        const createResponse = await fetch("http://localhost:8000/api/table/act/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(actData),
        });

        if (!createResponse.ok) {
          throw new Error("Ошибка создания акта");
        }

        const result = await createResponse.json();
        actId = result.id;

        const updateDeliveryResponse = await fetch(`http://localhost:8000/api/table/delivery/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            delivery_id: selectedDelivery.id,
            act_id: actId,
          }),
        });

        if (!updateDeliveryResponse.ok) {
          throw new Error("Ошибка обновления поставки");
        }
      }

      alert("Акт успешно сохранен");
      await fetchAllData();
      setIsActModalOpen(false);
      setSelectedDelivery(null);
    } catch (err) {
      console.error("Ошибка:", err);
      alert("Ошибка сохранения акта: " + (err instanceof Error ? err.message : "Неизвестная ошибка"));
    } finally {
      setIsCreating(false);
    }
  };

  const getWoodIdForDelivery = (delivery: DeliveryItem): number | undefined => {
    if (delivery.wood_id) return delivery.wood_id;

    const contract = contracts.find((c) => c.suppliers_contract_id === delivery.suppliers_contract_id);
    if (!contract) return undefined;

    const supplierWoodItem = supplierWood.find((sw) => sw.supplier_id === contract.supplier_id);
    return supplierWoodItem?.wood_id;
  };

  const handleProductClick = (woodId?: number) => {
    if (!woodId) {
      alert("Информация о материале недоступна (ID не найден)");
      return;
    }

    const product = products.find((p) => p.wood_id === woodId);

    if (product) {
      setSelectedProduct(product);
      setIsProductModalOpen(true);
    } else {
      alert(`Информация о материале не найдена (ID: ${woodId})`);
    }
  };

  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusChange = async (
    deliveryId: number,
    newStatus: string,
    woodId?: number,
    scope?: number
  ) => {
    setUpdatingStatus(deliveryId);

    try {
      const currentDelivery = deliveries.find((d) => d.delivery_id === deliveryId);
      if (!currentDelivery) {
        throw new Error("Поставка не найдена");
      }

      if (newStatus === "доставлено" && currentDelivery.delivery_status !== "доставлено") {
        if (woodId && scope) {
          await updateStorage(woodId, scope, true);
        }
      }

      if (currentDelivery.delivery_status === "доставлено" && newStatus !== "доставлено") {
        if (woodId && scope) {
          await updateStorage(woodId, scope, false);
        }
      }

      const response = await fetch(`http://localhost:8000/api/table/delivery/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_id: deliveryId,
          delivery_status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка обновления статуса");
      }

      setDeliveries((prev) =>
        prev.map((delivery) =>
          delivery.delivery_id === deliveryId
            ? { ...delivery, delivery_status: newStatus }
            : delivery
        )
      );
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
      alert("Ошибка обновления статуса поставки");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateStorage = async (woodId: number, scope: number, isAdd: boolean) => {
    const storageRes = await fetch("http://localhost:8000/api/table/storage/");
    const currentStorage = await storageRes.json();
    const storageItem = currentStorage.find((s: StorageItem) => s.wood_id === woodId);

    if (storageItem) {
      const currentScope = parseFloat(storageItem.current_scope);
      const newScope = isAdd ? currentScope + scope : currentScope - scope;

      await fetch("http://localhost:8000/api/table/storage/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wood_id: woodId,
          current_scope: newScope.toString(),
          storage_cell: storageItem.storage_cell,
        }),
      });
    } else {
      const newStorageItem = {
        wood_id: woodId,
        current_scope: scope.toString(),
        storage_cell: `Ячейка-${String.fromCharCode(65 + Math.floor((woodId - 1) / 10))}${((woodId - 1) % 10) + 1}`,
      };

      await fetch("http://localhost:8000/api/table/storage/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStorageItem),
      });
    }
  };

  const availableProducts = useMemo(() => {
    if (!formData.contractId) return [];

    const selectedContract = contracts.find(
      (c) => c.suppliers_contract_id === parseInt(formData.contractId)
    );
    if (!selectedContract) return [];

    const supplierWoodItems = supplierWood.filter(
      (sw) => sw.supplier_id === selectedContract.supplier_id
    );

    return supplierWoodItems
      .map((sw) => {
        const product = products.find((p) => p.wood_id === sw.wood_id);
        if (!product) return null;
        return {
          wood_id: sw.wood_id,
          wood_type: product.wood_type,
          wood_grade: product.wood_grade,
          wood_length: product.wood_length,
          wood_cross_section: product.wood_cross_section,
          available_quantity: sw.available_quantity,
        };
      })
      .filter((p) => p !== null);
  }, [formData.contractId, contracts, supplierWood, products]);

  const enrichedContracts = useMemo(() => {
    return contracts.map((contract) => {
      const supplier = suppliers.find((s) => s.supplier_id === contract.supplier_id);
      return {
        ...contract,
        supplier_name: supplier?.supplier_name || "Неизвестный поставщик",
        supplier_id: contract.supplier_id,
      };
    });
  }, [contracts, suppliers]);

  const getProductForDelivery = (delivery: DeliveryItem) => {
    if (delivery.wood_id) {
      const product = products.find((p) => p.wood_id === delivery.wood_id);
      if (product) return `${product.wood_type} (${product.wood_grade})`;
    }

    const contract = contracts.find((c) => c.suppliers_contract_id === delivery.suppliers_contract_id);
    if (!contract) return "Неизвестный материал";

    const supplierWoodItem = supplierWood.find((sw) => sw.supplier_id === contract.supplier_id);
    if (!supplierWoodItem) return "Неизвестный материал";

    const product = products.find((p) => p.wood_id === supplierWoodItem.wood_id);
    return product ? `${product.wood_type} (${product.wood_grade})` : "Неизвестный материал";
  };

  const rows = useMemo<DeliveryRow[]>(() => {
    return deliveries.map((item) => {
      const contract = contracts.find((c) => c.suppliers_contract_id === item.suppliers_contract_id);
      const supplier = suppliers.find((s) => s.supplier_id === contract?.supplier_id);
      const woodId = getWoodIdForDelivery(item);

      const supplierWoodItem =
        contract && woodId
          ? supplierWood.find(
              (sw) => sw.supplier_id === contract.supplier_id && sw.wood_id === woodId
            )
          : undefined;

      return {
        id: item.delivery_id,
        number: contract?.contract_number || `ДОГ-${item.suppliers_contract_id}`,
        supplierName: supplier?.supplier_name || "Неизвестный поставщик",
        supplierId: contract?.supplier_id || 0,
        productName: getProductForDelivery(item),
        productId: item.wood_id,
        status: item.delivery_status,
        create: formatDate(item.delivery_date),
        createRaw: item.delivery_date,
        scope: item.delivery_scope,
        actId: item.act_id,
        woodId,
        contractId: item.suppliers_contract_id,
        contractDate: contract?.suppliers_contract_date,
        offeredPrice: supplierWoodItem?.offered_price,
      };
    });
  }, [deliveries, contracts, suppliers, supplierWood, products]);

  const uniqueSuppliers = useMemo(() => [...new Set(rows.map((row) => row.supplierName))].sort(), [rows]);
  const uniqueProducts = useMemo(() => [...new Set(rows.map((row) => row.productName))].sort(), [rows]);
  const uniqueStatuses = useMemo(() => [...new Set(rows.map((row) => row.status))], [rows]);
  const uniqueContracts = useMemo(() => [...new Set(rows.map((row) => row.number))].sort(), [rows]);

  const filteredAndSortedRows = useMemo(() => {
    let filtered = rows;

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(
        (row) =>
          row.number.toLowerCase().includes(normalizedSearch) ||
          row.productName.toLowerCase().includes(normalizedSearch) ||
          row.supplierName.toLowerCase().includes(normalizedSearch)
      );
    }

    if (filters.contract) filtered = filtered.filter((row) => row.number === filters.contract);
    if (filters.supplier) filtered = filtered.filter((row) => row.supplierName === filters.supplier);
    if (filters.product) filtered = filtered.filter((row) => row.productName === filters.product);
    if (filters.status) filtered = filtered.filter((row) => row.status === filters.status);
    if (filters.dateFrom) filtered = filtered.filter((row) => row.createRaw >= filters.dateFrom);
    if (filters.dateTo) filtered = filtered.filter((row) => row.createRaw <= filters.dateTo);
    if (filters.minScope) filtered = filtered.filter((row) => row.scope >= Number(filters.minScope));
    if (filters.maxScope) filtered = filtered.filter((row) => row.scope <= Number(filters.maxScope));

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case "number":
          comparison = a.number.localeCompare(b.number);
          break;
        case "supplierName":
          comparison = a.supplierName.localeCompare(b.supplierName, "ru");
          break;
        case "productName":
          comparison = a.productName.localeCompare(b.productName, "ru");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status, "ru");
          break;
        case "create":
          comparison = a.createRaw.localeCompare(b.createRaw);
          break;
        case "scope":
          comparison = a.scope - b.scope;
          break;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [search, filters, rows, sortConfig]);

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту поставку?")) return;

    try {
      const deliveryToDelete = deliveries.find((d) => d.delivery_id === id);

      if (deliveryToDelete?.delivery_status === "доставлено" && deliveryToDelete.wood_id) {
        await updateStorage(deliveryToDelete.wood_id, deliveryToDelete.delivery_scope, false);
      }

      const response = await fetch(`http://localhost:8000/api/table/delivery/?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка удаления");
      }

      alert("Поставка удалена");
      await fetchAllData();
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Ошибка удаления поставки");
    }
  };

  const handleCreate = async () => {
    if (!formData.contractId) {
      alert("Выберите контракт");
      return;
    }

    if (!formData.woodId) {
      alert("Выберите материал");
      return;
    }

    if (!formData.deliveryScope || parseFloat(formData.deliveryScope) <= 0) {
      alert("Введите корректный объем поставки");
      return;
    }

    if (!formData.deliveryDate) {
      alert("Выберите дату поставки");
      return;
    }

    setIsCreating(true);

    try {
      const selectedContract = contracts.find(
        (c) => c.suppliers_contract_id === parseInt(formData.contractId)
      );
      if (!selectedContract) {
        throw new Error("Контракт не найден");
      }

      const supplierWoodItem = supplierWood.find(
        (sw) =>
          sw.supplier_id === selectedContract.supplier_id &&
          sw.wood_id === parseInt(formData.woodId)
      );

      if (!supplierWoodItem) {
        throw new Error("Выбранный материал недоступен у этого поставщика");
      }

      const deliveryScopeNum = parseFloat(formData.deliveryScope);
      let actId = formData.actId;

      if (!actId) {
        const actData = {
          act_type: formData.deliveryStatus === "нарушение" ? "акт о расхождении" : "акт приемки",
          act_date: formData.deliveryDate,
          employee_id: 4,
        };

        const actResponse = await fetch("http://localhost:8000/api/table/act/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(actData),
        });

        if (!actResponse.ok) {
          throw new Error("Ошибка создания акта");
        }

        const actResult = await actResponse.json();
        actId = actResult.id;
      }

      const deliveryData = {
        suppliers_contract_id: parseInt(formData.contractId),
        delivery_scope: deliveryScopeNum,
        delivery_date: formData.deliveryDate,
        delivery_status: formData.deliveryStatus,
        act_id: actId,
        wood_id: parseInt(formData.woodId),
      };

      const response = await fetch("http://localhost:8000/api/table/delivery/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deliveryData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error("Ошибка создания поставки: " + error);
      }

      if (formData.deliveryStatus === "доставлено") {
        await updateStorage(parseInt(formData.woodId), deliveryScopeNum, true);
      }

      await fetch("http://localhost:8000/api/supplier_wood/update/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier_id: selectedContract.supplier_id,
          wood_id: parseInt(formData.woodId),
          available_quantity: supplierWoodItem.available_quantity - deliveryScopeNum,
        }),
      });

      alert("Поставка успешно создана");
      await fetchAllData();

      setFormData({
        contractId: "",
        woodId: "",
        deliveryScope: "",
        deliveryDate: "",
        deliveryStatus: "ожидается",
        actId: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ошибка:", err);
      alert("Ошибка создания поставки: " + (err instanceof Error ? err.message : "Неизвестная ошибка"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadActPdf = async (row: DeliveryRow) => {
    try {
      const act = acts.find((a) => a.act_id === row.actId);
      
      const response = await fetch("/api/delivery-act/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: "Сыктывкар",
          actDate: row.createRaw,
          contractDate: row.contractDate,
          contractNumber: row.number,
          supplierName: row.supplierName,
          productName: row.productName,
          price: row.offeredPrice || 0,
          scope: row.scope,
          actType: act?.act_type,
          discrepancyType: act?.discrepancy_type,
          defectQuantity: act?.defect_quantity,
          shortageQuantity: act?.shortage_quantity,
          actuallyAccepted: act?.actually_accepted,
          defectDescription: act?.defect_description,
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
      a.download = `delivery-act-${row.number}-${row.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка скачивания акта PDF:", error);
      alert(error instanceof Error ? error.message : "Не удалось скачать PDF");
    }
  };

  const clearFilters = () => {
    setFilters({
      supplier: "",
      product: "",
      status: "",
      contract: "",
      dateFrom: "",
      dateTo: "",
      minScope: "",
      maxScope: "",
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "доставлено":
        return styles.statusReady;
      case "нарушение":
        return styles.statusProgress;
      case "ожидается":
      default:
        return styles.statusDoing;
    }
  };

  const getStatusText = (status: string) => {
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

  const getSortIcon = (key: SortConfig["key"]) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const formatProductCharacteristics = (product: Product) => {
    const characteristics = [];

    if (product.wood_type) characteristics.push({ label: "Порода", value: product.wood_type });
    if (product.wood_grade) characteristics.push({ label: "Сорт", value: product.wood_grade });
    if (product.wood_length) characteristics.push({ label: "Длина", value: `${product.wood_length} м` });
    if (product.wood_diameter) characteristics.push({ label: "Диаметр", value: `${product.wood_diameter} мм` });
    if (product.wood_the_upper_end_diameter)
      characteristics.push({ label: "Верхний диаметр", value: `${product.wood_the_upper_end_diameter} мм` });
    if (product.wood_lower_end_diameter)
      characteristics.push({ label: "Нижний диаметр", value: `${product.wood_lower_end_diameter} мм` });
    if (product.wood_graduation) characteristics.push({ label: "Градация", value: product.wood_graduation });
    if (product.wood_cross_section) characteristics.push({ label: "Сечение", value: product.wood_cross_section });

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
            placeholder="Поиск по номеру документа, поставщику или материалу"
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
            filters.product ||
            filters.status ||
            filters.contract ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.minScope ||
            filters.maxScope) && <span className={styles.filterBadge}>●</span>}
        </button>
      </div>

      {isFilterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Контракт</label>
              <select
                value={filters.contract}
                onChange={(e) => setFilters({ ...filters, contract: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="">Все контракты</option>
                {uniqueContracts.map((contract) => (
                  <option key={contract} value={contract}>
                    {contract}
                  </option>
                ))}
              </select>
            </div>

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
              <label>Материал</label>
              <select
                value={filters.product}
                onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="">Все материалы</option>
                {uniqueProducts.map((product) => (
                  <option key={product} value={product}>
                    {product}
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
              <label>Объем от (м³)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={filters.minScope}
                onChange={(e) => setFilters({ ...filters, minScope: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, maxScope: e.target.value })}
                className={styles.filterInput}
              />
            </div>

            <button type="button" className={styles.clearFiltersButton} onClick={clearFilters}>
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
            title="Создать поставку"
          >
            <Image src="/icons/create-document.svg" alt="Создать" width={50} height={50} />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={`${styles.colNumber} ${styles.sortable}`} onClick={() => handleSort("number")}>
              Номер контракта {getSortIcon("number")}
            </div>
            <div className={`${styles.colSupplier} ${styles.sortable}`} onClick={() => handleSort("supplierName")}>
              Поставщик {getSortIcon("supplierName")}
            </div>
            <div className={`${styles.colProduct} ${styles.sortable}`} onClick={() => handleSort("productName")}>
              Материал {getSortIcon("productName")}
            </div>
            <div className={`${styles.colStatus} ${styles.sortable}`} onClick={() => handleSort("status")}>
              Статус {getSortIcon("status")}
            </div>
            <div className={`${styles.colDate} ${styles.sortable}`} onClick={() => handleSort("create")}>
              Дата поставки {getSortIcon("create")}
            </div>
            <div className={`${styles.colScope} ${styles.sortable}`} onClick={() => handleSort("scope")}>
              Объем {getSortIcon("scope")}
            </div>
            <div className={styles.colActions}>Действия</div>
            <div className={styles.colAct}>Акт</div>
          </div>

          {filteredAndSortedRows.map((row) => (
            <div key={row.id} className={styles.row}>
              <div className={styles.colNumber}>{row.number}</div>
              <div className={styles.colSupplier}>{row.supplierName}</div>
              <div
                className={`${styles.colProduct} ${styles.clickableProduct}`}
                onClick={() => handleProductClick(row.woodId)}
                title="Нажмите для просмотра характеристик"
              >
                {row.productName}
              </div>
              <div className={styles.colStatus}>
                <select
                  value={row.status}
                  onChange={(e) => handleStatusChange(row.id, e.target.value, row.woodId, row.scope)}
                  className={`${styles.statusSelect} ${getStatusClass(row.status)}`}
                  disabled={updatingStatus === row.id}
                >
                  <option value="ожидается">Ожидается</option>
                  <option value="доставлено">Доставлено</option>
                  <option value="нарушение">Нарушение</option>
                </select>
                {updatingStatus === row.id && <span className={styles.statusUpdating}>⏳</span>}
              </div>
              <div className={styles.colDate}>{row.create}</div>
              <div className={styles.colScope}>{row.scope} м³</div>
              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleDownloadActPdf(row)}
                  title="Скачать PDF"
                >
                  <Image src="/icons/download.svg" alt="Скачать" width={50} height={50} />
                </button>

                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleDelete(row.id)}
                  title="Удалить"
                >
                  <Image src="/icons/delete-document.svg" alt="Удалить" width={50} height={50} />
                </button>
              </div>
              <div className={styles.colAct}>
                <button
                  type="button"
                  className={styles.actButton}
                  onClick={() => handleOpenActModal(row)}
                  title={row.actId ? "Редактировать акт" : "Создать акт"}
                >
                  {row.actId ? (
                    <>
                      <span className={styles.actIcon}>📄</span>
                      Акт №{row.actId}
                    </>
                  ) : (
                    <>
                      <span className={styles.actIcon}>➕</span>
                      Создать акт
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {filteredAndSortedRows.length === 0 && (
            <div className={styles.empty}>Поставки не найдены</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Создание поставки
              <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className={styles.form}>
              <select
                value={formData.contractId}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    contractId: e.target.value,
                    woodId: "",
                  });
                }}
                className={styles.input}
                required
              >
                <option value="">Выберите контракт *</option>
                {enrichedContracts.map((contract) => (
                  <option key={contract.suppliers_contract_id} value={contract.suppliers_contract_id}>
                    {contract.contract_number} - {contract.supplier_name}
                  </option>
                ))}
              </select>

              <select
                value={formData.woodId}
                onChange={(e) => setFormData({ ...formData, woodId: e.target.value })}
                className={styles.input}
                required
                disabled={!formData.contractId}
              >
                <option value="">
                  {!formData.contractId
                    ? "Сначала выберите контракт"
                    : availableProducts.length === 0
                    ? "Нет доступных материалов для этого поставщика"
                    : "Выберите материал *"}
                </option>
                {availableProducts.map((product) => (
                  <option key={product.wood_id} value={product.wood_id}>
                    {product.wood_type} - {product.wood_grade} сорт
                    {product.wood_length ? `, длина: ${product.wood_length}м` : ""}
                    {product.wood_cross_section ? `, сечение: ${product.wood_cross_section}` : ""}
                    {` (доступно: ${product.available_quantity} м³)`}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Объем поставки (м³) *"
                value={formData.deliveryScope}
                onChange={(e) => setFormData({ ...formData, deliveryScope: e.target.value })}
                className={styles.input}
                required
              />

              <input
                type="date"
                placeholder="Дата поставки *"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className={styles.input}
                required
              />

              <select
                value={formData.deliveryStatus}
                onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value })}
                className={styles.input}
              >
                <option value="ожидается">Ожидается</option>
                <option value="доставлено">Доставлено</option>
                <option value="нарушение">Нарушение</option>
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
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? "Создание..." : "Создать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isActModalOpen && selectedDelivery && (
        <div className={styles.overlay} onClick={() => setIsActModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              {selectedDelivery.actId ? "Редактирование акта" : "Создание акта"}
              <button className={styles.closeButton} onClick={() => setIsActModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className={styles.actInfo}>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Поставка №:</span>
                <span className={styles.actInfoValue}>{selectedDelivery.id}</span>
              </div>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Контракт:</span>
                <span className={styles.actInfoValue}>{selectedDelivery.number}</span>
              </div>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Поставщик:</span>
                <span className={styles.actInfoValue}>{selectedDelivery.supplierName}</span>
              </div>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Материал:</span>
                <span className={styles.actInfoValue}>{selectedDelivery.productName}</span>
              </div>
              <div className={styles.actInfoRow}>
                <span className={styles.actInfoLabel}>Объем:</span>
                <span className={styles.actInfoValue}>{selectedDelivery.scope} м³</span>
              </div>
            </div>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Тип акта *</label>
                <select
                  value={actFormData.act_type}
                  onChange={(e) => setActFormData({ ...actFormData, act_type: e.target.value })}
                  className={styles.input}
                  required
                >
                  <option value="акт приемки">Акт приемки</option>
                  <option value="акт о расхождении">Акт о расхождении</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Кладовщик *</label>
                <select
                  value={actFormData.employee_id}
                  onChange={(e) => setActFormData({ ...actFormData, employee_id: e.target.value })}
                  className={styles.input}
                  required
                >
                  <option value="">Выберите кладовщика</option>
                  {storekeepers.map((employee) => (
                    <option key={employee.employee_id} value={employee.employee_id}>
                      {employee.employee_name}
                    </option>
                  ))}
                </select>
              </div>

              {actFormData.act_type === "акт о расхождении" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Тип расхождения</label>
                    <select
                      value={actFormData.discrepancy_type}
                      onChange={(e) => setActFormData({ ...actFormData, discrepancy_type: e.target.value })}
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
                        value={actFormData.defect_quantity}
                        onChange={(e) => setActFormData({ ...actFormData, defect_quantity: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Количество недостачи (м³)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={actFormData.shortage_quantity}
                        onChange={(e) => setActFormData({ ...actFormData, shortage_quantity: e.target.value })}
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
                      value={actFormData.actually_accepted}
                      onChange={(e) => setActFormData({ ...actFormData, actually_accepted: e.target.value })}
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
                      value={actFormData.defect_description}
                      onChange={(e) => setActFormData({ ...actFormData, defect_description: e.target.value })}
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Дата акта</label>
                <div className={styles.readonlyDate}>{new Date().toLocaleDateString("ru-RU")}</div>
                <small className={styles.hint}>Дата устанавливается автоматически</small>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsActModalOpen(false)}
                  disabled={isCreating}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleSaveAct}
                  disabled={isCreating}
                >
                  {isCreating ? "Сохранение..." : selectedDelivery.actId ? "Обновить" : "Создать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && selectedProduct && (
        <div className={styles.overlay} onClick={() => setIsProductModalOpen(false)}>
          <div
            className={`${styles.modal} ${styles.productModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>
              Характеристики материала
              <button className={styles.closeButton} onClick={() => setIsProductModalOpen(false)}>
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
                <div className={styles.productId}>ID материала: {selectedProduct.wood_id}</div>
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