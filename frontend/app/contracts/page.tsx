"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./ContractsPage.module.css";

type DocumentItem = {
  id: number;
  number: string;
  status: string;
  create: string;
  createRaw: string;
  supplierName: string;
  supplierId?: number;
  cost?: number;
  scope?: number;
};

type Supplier = {
  id: number;
  name: string;
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
};

type DeliveryItem = {
  id: number;
  scope: number;
  date: string;
  status: string;
  material: string;
};

type Filters = {
  supplier: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

type SortConfig = {
  key: 'number' | 'supplierName' | 'status' | 'create';
  direction: 'asc' | 'desc';
};

export default function ContractsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierWood, setSupplierWood] = useState<SupplierWood[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<DocumentItem | null>(null);
  const [isDeliveriesModalOpen, setIsDeliveriesModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'create',
    direction: 'desc'
  });
  const [filters, setFilters] = useState<Filters>({
    supplier: "",
    status: "",
    dateFrom: "",
    dateTo: ""
  });
  const [formData, setFormData] = useState({
    number: "",
    date: "",
    status: "срок оплаты не наступил",
    supplierId: "",
    supplierName: "",
    cost: "",
    scope: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const contractsRes = await fetch('http://localhost:8000/api/table/suppliers_contract/');
      if (!contractsRes.ok) throw new Error('Ошибка загрузки контрактов');
      const contracts = await contractsRes.json();
      
      const suppliersRes = await fetch('http://localhost:8000/api/suppliers/');
      if (!suppliersRes.ok) throw new Error('Ошибка загрузки поставщиков');
      const suppliersData = await suppliersRes.json();
      setSuppliers(suppliersData);
      
      const deliveriesRes = await fetch('http://localhost:8000/api/table/delivery/');
      let deliveriesData = [];
      if (deliveriesRes.ok) {
        deliveriesData = await deliveriesRes.json();
        setDeliveries(deliveriesData);
      }
      
      const productsRes = await fetch('http://localhost:8000/api/table/product/');
      let productsData = [];
      if (productsRes.ok) {
        productsData = await productsRes.json();
        setProducts(productsData);
      }
      
      const supplierWoodRes = await fetch('http://localhost:8000/api/table/supplier_wood/');
      let supplierWoodData = [];
      if (supplierWoodRes.ok) {
        supplierWoodData = await supplierWoodRes.json();
        setSupplierWood(supplierWoodData);
      }
      
      const supplierMap = new Map<number, string>();
      suppliersData.forEach((s: Supplier) => {
        supplierMap.set(s.id, s.name);
      });
      
      const mapped = contracts.map((contract: any) => ({
        id: contract.suppliers_contract_id,
        number: contract.contract_number,
        status: contract.suppliers_contract_status,
        create: formatDate(contract.suppliers_contract_date),
        createRaw: contract.suppliers_contract_date,
        supplierName: supplierMap.get(contract.supplier_id) || 'Неизвестный поставщик',
        supplierId: contract.supplier_id,
        cost: contract.suppliers_contract_cost,
        scope: contract.suppliers_contract_scope
      }));
      
      setDocuments(mapped);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  const getMaterialForDelivery = (delivery: Delivery, contractSupplierId: number): string => {
    if (delivery.wood_id) {
      const product = products.find(p => p.wood_id === delivery.wood_id);
      if (product) {
        return `${product.wood_type} (${product.wood_grade})`;
      }
    }
    
    const supplierWoodItem = supplierWood.find(sw => sw.supplier_id === contractSupplierId);
    if (supplierWoodItem) {
      const product = products.find(p => p.wood_id === supplierWoodItem.wood_id);
      if (product) {
        return `${product.wood_type} (${product.wood_grade})`;
      }
    }
    
    return "Материал не указан";
  };

  const handleContractClick = (contract: DocumentItem) => {
    setSelectedContract(contract);
    setIsDeliveriesModalOpen(true);
  };

  const contractDeliveries = useMemo(() => {
    if (!selectedContract) return [];
    
    const contractDeliveriesList = deliveries.filter(
      d => d.suppliers_contract_id === selectedContract.id
    );
    
    return contractDeliveriesList.map(delivery => {
      const material = getMaterialForDelivery(delivery, selectedContract.supplierId || 0);
      
      return {
        id: delivery.delivery_id,
        scope: delivery.delivery_scope,
        date: formatDate(delivery.delivery_date),
        status: delivery.delivery_status,
        material: material
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedContract, deliveries, products, supplierWood]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingStatus(id);
    
    try {
      const response = await fetch(`http://localhost:8000/api/table/suppliers_contract/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suppliers_contract_id: id,
          suppliers_contract_status: newStatus
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка обновления статуса');
      }
      
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, status: newStatus } : doc
      ));
      
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
      alert('Ошибка обновления статуса контракта');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setFilters({
      supplier: "",
      status: "",
      dateFrom: "",
      dateTo: ""
    });
  };

  const uniqueSuppliers = useMemo(() => {
    const suppliersList = documents.map(doc => doc.supplierName);
    return [...new Set(suppliersList)].sort();
  }, [documents]);

  const uniqueStatuses = useMemo(() => {
    const statusesList = documents.map(doc => doc.status);
    return [...new Set(statusesList)];
  }, [documents]);

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = [...documents];
    
    // Поиск
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(doc =>
        doc.number.toLowerCase().includes(normalizedSearch) ||
        doc.supplierName.toLowerCase().includes(normalizedSearch)
      );
    }
    
    // Фильтр по поставщику
    if (filters.supplier) {
      filtered = filtered.filter(doc => doc.supplierName === filters.supplier);
    }
    
    // Фильтр по статусу
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    
    // Фильтр по дате (от)
    if (filters.dateFrom) {
      filtered = filtered.filter(doc => doc.createRaw >= filters.dateFrom);
    }
    
    // Фильтр по дате (до)
    if (filters.dateTo) {
      filtered = filtered.filter(doc => doc.createRaw <= filters.dateTo);
    }
    
    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.key) {
        case 'number':
          comparison = a.number.localeCompare(b.number);
          break;
        case 'supplierName':
          comparison = a.supplierName.localeCompare(b.supplierName, 'ru');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status, 'ru');
          break;
        case 'create':
          comparison = a.createRaw.localeCompare(b.createRaw);
          break;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [documents, search, filters, sortConfig]);

  const handleCreateContract = async () => {
    if (!formData.number.trim()) {
      alert("Введите номер документа");
      return;
    }
    
    if (!formData.supplierId && !formData.supplierName.trim()) {
      alert("Выберите или введите поставщика");
      return;
    }
    
    if (!formData.date) {
      alert("Введите дату контракта");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const payload: any = {
        contract_number: formData.number.trim(),
        contract_date: formData.date,
        status: formData.status,
      };
      
      if (formData.supplierId) {
        const selectedSupplier = suppliers.find(s => s.id === Number(formData.supplierId));
        payload.supplier_name = selectedSupplier?.name || formData.supplierName;
      } else {
        payload.supplier_name = formData.supplierName.trim();
      }
      
      if (formData.cost) {
        payload.cost = parseFloat(formData.cost);
      }
      if (formData.scope) {
        payload.scope = parseFloat(formData.scope);
      }
      
      const response = await fetch('http://localhost:8000/api/contract/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания контракта');
      }
      
      alert('Контракт успешно создан');
      await fetchData();
      
      setFormData({
        number: "",
        date: "",
        status: "срок оплаты не наступил",
        supplierId: "",
        supplierName: "",
        cost: "",
        scope: ""
      });
      setIsModalOpen(false);
      
    } catch (err) {
      console.error('Ошибка:', err);
      alert(err instanceof Error ? err.message : 'Ошибка создания контракта');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteContract = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот контракт?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/table/suppliers_contract/?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      alert('Контракт удален');
      
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления контракта');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'оплачено':
        return styles.statusReady;
      case 'просрочено':
        return styles.statusProgress;
      case 'срок оплаты не наступил':
      default:
        return styles.statusDoing;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'оплачено':
        return 'Оплачено';
      case 'просрочено':
        return 'Просрочено';
      case 'срок оплаты не наступил':
        return 'Срок оплаты не наступил';
      default:
        return status;
    }
  };

  const getDeliveryStatusClass = (status: string) => {
    switch (status) {
      case 'доставлено':
        return styles.deliveryStatusReady;
      case 'нарушение':
        return styles.deliveryStatusProgress;
      case 'ожидается':
      default:
        return styles.deliveryStatusDoing;
    }
  };

  const getDeliveryStatusText = (status: string) => {
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
            placeholder="Поиск по номеру или поставщику"
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
          {(filters.supplier || filters.status || filters.dateFrom || filters.dateTo) && (
            <span className={styles.filterBadge}>●</span>
          )}
        </button>
      </div>

      {/* Панель фильтров */}
      {isFilterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Поставщик</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({...filters, supplier: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Все поставщики</option>
                {uniqueSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Статус</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Все статусы</option>
                {uniqueStatuses.map(status => (
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
            title="Создать контракт"
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
              onClick={() => handleSort('number')}
            >
              Номер контракта {getSortIcon('number')}
            </div>
            <div 
              className={`${styles.colSupplier} ${styles.sortable}`}
              onClick={() => handleSort('supplierName')}
            >
              Поставщик {getSortIcon('supplierName')}
            </div>
            <div 
              className={`${styles.colStatus} ${styles.sortable}`}
              onClick={() => handleSort('status')}
            >
              Статус {getSortIcon('status')}
            </div>
            <div 
              className={`${styles.colDate} ${styles.sortable}`}
              onClick={() => handleSort('create')}
            >
              Дата {getSortIcon('create')}
            </div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredAndSortedDocuments.map((doc) => (
            <div key={doc.id} className={styles.row}>
              <div 
                className={`${styles.colNumber} ${styles.clickableNumber}`}
                onClick={() => handleContractClick(doc)}
                title="Нажмите для просмотра поставок"
              >
                ДОГ-№{doc.number}
              </div>
              <div className={styles.colSupplier}>{doc.supplierName}</div>
              <div className={styles.colStatus}>
                <select
                  value={doc.status}
                  onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                  className={`${styles.statusSelect} ${getStatusClass(doc.status)}`}
                  disabled={updatingStatus === doc.id}
                >
                  <option value="срок оплаты не наступил">Срок оплаты не наступил</option>
                  <option value="оплачено">Оплачено</option>
                  <option value="просрочено">Просрочено</option>
                </select>
                {updatingStatus === doc.id && (
                  <span className={styles.statusUpdating}>⏳</span>
                )}
              </div>
              <div className={styles.colDate}>{doc.create}</div>
              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleDeleteContract(doc.id)}
                  title="Удалить"
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

          {filteredAndSortedDocuments.length === 0 && (
            <div className={styles.empty}>Контракты не найдены</div>
          )}
        </div>
      </div>

      {/* Модальное окно создания контракта */}
      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Создание контракта</div>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Номер контракта *"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                className={styles.input}
                required
              />
              
              <select
                value={formData.supplierId}
                onChange={(e) => {
                  setFormData({
                    ...formData, 
                    supplierId: e.target.value,
                    supplierName: e.target.value ? "" : formData.supplierName
                  });
                }}
                className={styles.input}
              >
                <option value="">Выберите существующего поставщика</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Или введите нового поставщика *"
                value={formData.supplierName}
                onChange={(e) => {
                  setFormData({
                    ...formData, 
                    supplierName: e.target.value,
                    supplierId: ""
                  });
                }}
                className={styles.input}
              />
              
              <input
                type="date"
                placeholder="Дата контракта *"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className={styles.input}
                required
              />
              
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className={styles.input}
              >
                <option value="срок оплаты не наступил">Срок оплаты не наступил</option>
                <option value="оплачено">Оплачено</option>
                <option value="просрочено">Просрочено</option>
              </select>
              
              <input
                type="number"
                step="0.01"
                placeholder="Стоимость (необязательно)"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className={styles.input}
              />
              
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
                  onClick={handleCreateContract}
                  disabled={isCreating}
                >
                  {isCreating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с поставками по контракту */}
      {isDeliveriesModalOpen && selectedContract && (
        <div className={styles.overlay} onClick={() => setIsDeliveriesModalOpen(false)}>
          <div className={`${styles.modal} ${styles.deliveriesModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Поставки по контракту {selectedContract.number}
              <button
                className={styles.closeButton}
                onClick={() => setIsDeliveriesModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.contractInfo}>
              <div className={styles.contractInfoRow}>
                <span className={styles.contractInfoLabel}>Поставщик:</span>
                <span className={styles.contractInfoValue}>{selectedContract.supplierName}</span>
              </div>
              <div className={styles.contractInfoRow}>
                <span className={styles.contractInfoLabel}>Дата контракта:</span>
                <span className={styles.contractInfoValue}>{selectedContract.create}</span>
              </div>
              {selectedContract.cost && (
                <div className={styles.contractInfoRow}>
                  <span className={styles.contractInfoLabel}>Стоимость:</span>
                  <span className={styles.contractInfoValue}>
                    {selectedContract.cost.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              )}
              {selectedContract.scope && (
                <div className={styles.contractInfoRow}>
                  <span className={styles.contractInfoLabel}>Объем:</span>
                  <span className={styles.contractInfoValue}>{selectedContract.scope} м³</span>
                </div>
              )}
              <div className={styles.contractInfoRow}>
                <span className={styles.contractInfoLabel}>Статус оплаты:</span>
                <span className={`${styles.contractStatusBadge} ${getStatusClass(selectedContract.status)}`}>
                  {getStatusText(selectedContract.status)}
                </span>
              </div>
            </div>
            
            <div className={styles.deliveriesSection}>
              <h4 className={styles.deliveriesTitle}>
                Список поставок ({contractDeliveries.length})
              </h4>
              
              {contractDeliveries.length > 0 ? (
                <div className={styles.deliveriesList}>
                  <div className={styles.deliveriesHeader}>
                    <div className={styles.deliveryColMaterial}>Материал</div>
                    <div className={styles.deliveryColScope}>Объем</div>
                    <div className={styles.deliveryColDate}>Дата</div>
                    <div className={styles.deliveryColStatus}>Статус</div>
                  </div>
                  
                  {contractDeliveries.map((delivery) => (
                    <div key={delivery.id} className={styles.deliveryRow}>
                      <div className={styles.deliveryColMaterial}>{delivery.material}</div>
                      <div className={styles.deliveryColScope}>{delivery.scope} м³</div>
                      <div className={styles.deliveryColDate}>{delivery.date}</div>
                      <div className={styles.deliveryColStatus}>
                        <span className={`${styles.deliveryStatusBadge} ${getDeliveryStatusClass(delivery.status)}`}>
                          {getDeliveryStatusText(delivery.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noDeliveries}>
                  По этому контракту пока нет поставок
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