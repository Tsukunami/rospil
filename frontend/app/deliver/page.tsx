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
};

type Supplier = {
  supplier_id: number;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_inn: string;
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

type SupplierWood = {
  supplier_id: number;
  wood_id: number;
  available_quantity: number;
};

type StorageItem = {
  wood_id: number;
  current_scope: string;
  storage_cell: string;
};

type DeliveryRow = {
  id: number;
  number: string;
  supplierName: string;
  productName: string;
  status: string;
  create: string;
  scope: number;
  actId: number;
  woodId?: number;
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
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
      console.log("Начинаем загрузку данных...");
      
      // Загружаем все данные через универсальный API
      const [deliveriesRes, suppliersRes, productsRes, contractsRes, supplierWoodRes, storageRes] = await Promise.all([
        fetch('http://localhost:8000/api/table/delivery/'),
        fetch('http://localhost:8000/api/table/suppliers_info/'),
        fetch('http://localhost:8000/api/table/product/'),
        fetch('http://localhost:8000/api/table/suppliers_contract/'),
        fetch('http://localhost:8000/api/table/supplier_wood/'),
        fetch('http://localhost:8000/api/table/storage/')
      ]);
      
      if (!deliveriesRes.ok) throw new Error('Ошибка загрузки поставок');
      if (!suppliersRes.ok) throw new Error('Ошибка загрузки поставщиков');
      if (!productsRes.ok) throw new Error('Ошибка загрузки продуктов');
      if (!contractsRes.ok) throw new Error('Ошибка загрузки контрактов');
      
      const deliveriesData = await deliveriesRes.json();
      const suppliersData = await suppliersRes.json();
      const productsData = await productsRes.json();
      const contractsData = await contractsRes.json();
      const supplierWoodData = supplierWoodRes.ok ? await supplierWoodRes.json() : [];
      const storageData = storageRes.ok ? await storageRes.json() : [];
      
      console.log("Загружено поставок:", deliveriesData.length);
      console.log("Загружено склада:", storageData.length);
      
      setDeliveries(deliveriesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setContracts(contractsData);
      setSupplierWood(supplierWoodData);
      setStorage(storageData);
      
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Получаем доступные материалы для выбранного контракта
  const availableProducts = useMemo(() => {
    if (!formData.contractId) return [];
    
    const selectedContract = contracts.find(c => c.suppliers_contract_id === parseInt(formData.contractId));
    if (!selectedContract) return [];
    
    const supplierWoodItems = supplierWood.filter(sw => sw.supplier_id === selectedContract.supplier_id);
    
    const availableProductsList = supplierWoodItems
      .map(sw => {
        const product = products.find(p => p.wood_id === sw.wood_id);
        if (!product) return null;
        return {
          wood_id: sw.wood_id,
          wood_type: product.wood_type,
          wood_grade: product.wood_grade,
          wood_length: product.wood_length,
          wood_cross_section: product.wood_cross_section,
          available_quantity: sw.available_quantity
        };
      })
      .filter(p => p !== null);
    
    return availableProductsList;
  }, [formData.contractId, contracts, supplierWood, products]);

  // Получаем контракты с информацией о поставщиках
  const enrichedContracts = useMemo(() => {
    return contracts.map(contract => {
      const supplier = suppliers.find(s => s.supplier_id === contract.supplier_id);
      return {
        ...contract,
        supplier_name: supplier?.supplier_name || 'Неизвестный поставщик',
        supplier_id: contract.supplier_id
      };
    });
  }, [contracts, suppliers]);

  // Получаем информацию о продукте для поставки
  const getProductForDelivery = (delivery: DeliveryItem) => {
    if (delivery.wood_id) {
      const product = products.find(p => p.wood_id === delivery.wood_id);
      if (product) return `${product.wood_type} (${product.wood_grade})`;
    }
    
    const contract = contracts.find(c => c.suppliers_contract_id === delivery.suppliers_contract_id);
    if (!contract) return 'Неизвестный материал';
    
    const supplierWoodItem = supplierWood.find(sw => sw.supplier_id === contract.supplier_id);
    if (!supplierWoodItem) return 'Неизвестный материал';
    
    const product = products.find(p => p.wood_id === supplierWoodItem.wood_id);
    return product ? `${product.wood_type} (${product.wood_grade})` : 'Неизвестный материал';
  };

  const rows = useMemo<DeliveryRow[]>(() => {
    return deliveries.map((item) => {
      const contract = contracts.find(c => c.suppliers_contract_id === item.suppliers_contract_id);
      const supplier = suppliers.find(s => s.supplier_id === contract?.supplier_id);
      
      return {
        id: item.delivery_id,
        number: contract?.contract_number || `ДОГ-${item.suppliers_contract_id}`,
        supplierName: supplier?.supplier_name || "Неизвестный поставщик",
        productName: getProductForDelivery(item),
        status: item.delivery_status,
        create: formatDate(item.delivery_date),
        scope: item.delivery_scope,
        actId: item.act_id,
        woodId: item.wood_id
      };
    });
  }, [deliveries, contracts, suppliers, supplierWood, products]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return rows;
    
    return rows.filter(
      (row) =>
        row.number.toLowerCase().includes(normalizedSearch) ||
        row.productName.toLowerCase().includes(normalizedSearch) ||
        row.supplierName.toLowerCase().includes(normalizedSearch)
    );
  }, [search, rows]);

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту поставку?')) return;
    
    try {
      const deliveryToDelete = deliveries.find(d => d.delivery_id === id);
      
      const response = await fetch(`http://localhost:8000/api/table/delivery/?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      
      alert('Поставка удалена');
      
      // Полностью обновляем все данные
      await fetchAllData();
      
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления поставки');
    }
  };

  const handleOpenPdf = (number: string) => {
    window.open(`/docs/${number}.pdf`, "_blank");
  };

  // Функция для обновления склада - возвращает обновленные данные
  const updateStorage = async (woodId: number, scope: number, isAdd: boolean) => {
    console.log(`Обновление склада: wood_id=${woodId}, scope=${scope}, isAdd=${isAdd}`);
    
    // Сначала получаем актуальные данные склада
    const storageRes = await fetch('http://localhost:8000/api/table/storage/');
    const currentStorage = await storageRes.json();
    const storageItem = currentStorage.find((s: StorageItem) => s.wood_id === woodId);
    
    if (storageItem) {
      // Обновляем существующую запись
      const currentScope = parseFloat(storageItem.current_scope);
      const newScope = isAdd ? currentScope + scope : currentScope - scope;
      
      console.log(`Текущий остаток: ${currentScope}, новый: ${newScope}`);
      
      const updateRes = await fetch('http://localhost:8000/api/table/storage/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wood_id: woodId,
          current_scope: newScope.toString(),
          storage_cell: storageItem.storage_cell
        }),
      });
      
      if (!updateRes.ok) {
        const error = await updateRes.text();
        console.error("Ошибка обновления склада:", error);
        throw new Error('Ошибка обновления склада');
      }
      
      console.log("Склад успешно обновлен");
    } else {
      // Создаем новую запись на складе
      const newStorageItem = {
        wood_id: woodId,
        current_scope: scope.toString(),
        storage_cell: `Ячейка-${String.fromCharCode(65 + Math.floor((woodId - 1) / 10))}${((woodId - 1) % 10) + 1}`
      };
      
      console.log("Создаем новую запись на складе:", newStorageItem);
      
      const createRes = await fetch('http://localhost:8000/api/table/storage/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStorageItem),
      });
      
      if (!createRes.ok) {
        const error = await createRes.text();
        console.error("Ошибка создания записи на складе:", error);
        throw new Error('Ошибка создания записи на складе');
      }
      
      console.log("Новая запись на складе создана");
    }
  };

  const handleCreate = async () => {
    console.log("Начинаем создание поставки с данными:", formData);
    
    // Валидация
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
      // Проверяем, доступен ли выбранный материал для этого поставщика
      const selectedContract = contracts.find(c => c.suppliers_contract_id === parseInt(formData.contractId));
      if (!selectedContract) {
        throw new Error("Контракт не найден");
      }
      
      const supplierWoodItem = supplierWood.find(
        sw => sw.supplier_id === selectedContract.supplier_id && 
        sw.wood_id === parseInt(formData.woodId)
      );
      
      if (!supplierWoodItem) {
        throw new Error("Выбранный материал недоступен у этого поставщика");
      }
      
      const deliveryScopeNum = parseFloat(formData.deliveryScope);
      
      // Создаем акт приемки
      let actId = formData.actId;
      
      if (!actId) {
        const actData = {
          act_type: formData.deliveryStatus === "нарушение" ? "акт о расхождении" : "акт приемки",
          act_date: formData.deliveryDate,
          employee_id: 4
        };
        
        const actResponse = await fetch('http://localhost:8000/api/table/act/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(actData),
        });
        
        if (!actResponse.ok) {
          throw new Error('Ошибка создания акта');
        }
        
        const actResult = await actResponse.json();
        actId = actResult.id;
      }
      
      // Создаем поставку с wood_id
      const deliveryData = {
        suppliers_contract_id: parseInt(formData.contractId),
        delivery_scope: deliveryScopeNum,
        delivery_date: formData.deliveryDate,
        delivery_status: formData.deliveryStatus,
        act_id: actId,
        wood_id: parseInt(formData.woodId)
      };
      
      const response = await fetch('http://localhost:8000/api/table/delivery/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error('Ошибка создания поставки: ' + error);
      }
      
      const result = await response.json();
      console.log("Поставка создана, ID:", result.id);
      
      // ЕСЛИ ПОСТАВКА ДОСТАВЛЕНА - ОБНОВЛЯЕМ СКЛАД
      if (formData.deliveryStatus === 'доставлено') {
        console.log("Поставка доставлена, обновляем склад...");
        await updateStorage(parseInt(formData.woodId), deliveryScopeNum, true);
      }
      
      // Обновляем количество доступного материала у поставщика
      await fetch('http://localhost:8000/api/supplier_wood/update/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier_id: selectedContract.supplier_id,
          wood_id: parseInt(formData.woodId),
          available_quantity: supplierWoodItem.available_quantity - deliveryScopeNum
        }),
      });
      
      alert('Поставка успешно создана');
      
      // ПРИНУДИТЕЛЬНО ОБНОВЛЯЕМ ВСЕ ДАННЫЕ
      await fetchAllData();
      
      // Закрываем модальное окно и сбрасываем форму
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
      console.error('Ошибка:', err);
      alert('Ошибка создания поставки: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'доставлено':
        return styles.statusReady;
      case 'нарушение':
        return styles.statusProgress;
      case 'ожидается':
      default:
        return styles.statusDoing;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'доставлено':
        return 'Доставлено';
      case 'нарушение':
        return 'Нарушение';
      case 'ожидается':
        return 'Ожидается';
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
            placeholder="Поиск по номеру документа, поставщику или материалу"
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
            title="Создать поставку"
          >
            <Image
              src="/icons/create-document.svg"
              alt="Создать"
              width={40}
              height={40}
            />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={styles.colNumber}>Номер контракта</div>
            <div className={styles.colSupplier}>Поставщик</div>
            <div className={styles.colProduct}>Материал</div>
            <div className={styles.colStatus}>Статус</div>
            <div className={styles.colDate}>Дата поставки</div>
            <div className={styles.colScope}>Объем</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredRows.map((row) => (
            <div key={row.id} className={styles.row}>
              <div className={styles.colNumber}>№{row.number}</div>
              <div className={styles.colSupplier}>{row.supplierName}</div>
              <div className={styles.colProduct}>{row.productName}</div>
              <div className={`${styles.colStatus} ${getStatusClass(row.status)}`}>
                {getStatusText(row.status)}
              </div>
              <div className={styles.colDate}>{row.create}</div>
              <div className={styles.colScope}>{row.scope} м³</div>
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
                    width={40}
                    height={40}
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
                    width={40}
                    height={40}
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
              <select
                value={formData.contractId}
                onChange={(e) => {
                  setFormData({
                    ...formData, 
                    contractId: e.target.value,
                    woodId: ""
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
                onChange={(e) => setFormData({...formData, woodId: e.target.value})}
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
                    {product.wood_length ? `, длина: ${product.wood_length}м` : ''}
                    {product.wood_cross_section ? `, сечение: ${product.wood_cross_section}` : ''}
                    {` (доступно: ${product.available_quantity} м³)`}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Объем поставки (м³) *"
                value={formData.deliveryScope}
                onChange={(e) => setFormData({...formData, deliveryScope: e.target.value})}
                className={styles.input}
                required
              />

              <input
                type="date"
                placeholder="Дата поставки *"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                className={styles.input}
                required
              />

              <select
                value={formData.deliveryStatus}
                onChange={(e) => setFormData({...formData, deliveryStatus: e.target.value})}
                className={styles.input}
              >
                <option value="ожидается">Ожидается</option>
                <option value="доставлено">Доставлено</option>
                <option value="нарушение">Нарушение</option>
              </select>

              <input
                type="number"
                placeholder="ID акта (необязательно)"
                value={formData.actId}
                onChange={(e) => setFormData({...formData, actId: e.target.value})}
                className={styles.input}
              />
              <small className={styles.hint}>
                Если акт не указан, он будет создан автоматически
              </small>

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
                  {isCreating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}