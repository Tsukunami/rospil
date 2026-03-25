"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./ContractsPage.module.css";

type DocumentItem = {
  id: number;
  number: string;
  status: string;
  create: string;
  supplierName: string;
  supplierId?: number;
  cost?: number;
  scope?: number;
};

type Supplier = {
  id: number;
  name: string;
};

export default function ContractsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Загружаем контракты через универсальный API
      const contractsRes = await fetch('http://localhost:8000/api/table/suppliers_contract/');
      if (!contractsRes.ok) throw new Error('Ошибка загрузки контрактов');
      const contracts = await contractsRes.json();
      
      // Загружаем поставщиков
      const suppliersRes = await fetch('http://localhost:8000/api/suppliers/');
      if (!suppliersRes.ok) throw new Error('Ошибка загрузки поставщиков');
      const suppliersData = await suppliersRes.json();
      setSuppliers(suppliersData);
      
      // Создаем карту поставщиков
      const supplierMap = new Map<number, string>();
      suppliersData.forEach((s: Supplier) => {
        supplierMap.set(s.id, s.name);
      });
      
      // Преобразуем контракты
      const mapped = contracts.map((contract: any) => ({
        id: contract.suppliers_contract_id,
        number: contract.contract_number,
        status: contract.suppliers_contract_status,
        create: formatDate(contract.suppliers_contract_date),
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
      
      // Если выбран существующий поставщик
      if (formData.supplierId) {
        const selectedSupplier = suppliers.find(s => s.id === Number(formData.supplierId));
        payload.supplier_name = selectedSupplier?.name || formData.supplierName;
      } else {
        // Если введен новый поставщик
        payload.supplier_name = formData.supplierName.trim();
      }
      
      // Добавляем необязательные поля
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
      
      const result = await response.json();
      alert('Контракт успешно создан');
      
      // Обновляем список
      await fetchData();
      
      // Закрываем модальное окно и сбрасываем форму
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
      
      // Обновляем список
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      alert('Контракт удален');
      
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления контракта');
    }
  };

  const handleOpenDocument = (number: string) => {
    window.open(`/docs/${number}.pdf`, "_blank");
  };

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return documents;
    return documents.filter(doc =>
      doc.number.toLowerCase().includes(normalizedSearch) ||
      doc.supplierName.toLowerCase().includes(normalizedSearch)
    );
  }, [search, documents]);

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
      </div>

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
              width={40}
              height={40}
            />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={styles.colNumber}>Номер контракта</div>
            <div className={styles.colSupplier}>Поставщик</div>
            <div className={styles.colStatus}>Статус</div>
            <div className={styles.colDate}>Дата</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredDocuments.map((doc) => (
            <div key={doc.id} className={styles.row}>
              <div className={styles.colNumber}>№{doc.number}</div>
              <div className={styles.colSupplier}>{doc.supplierName}</div>
              <div
                className={`${styles.colStatus} ${
                  doc.status === "оплачено"
                    ? styles.statusReady
                    : doc.status === "просрочено"
                    ? styles.statusProgress
                    : styles.statusDoing
                }`}
              >
                {doc.status}
              </div>
              <div className={styles.colDate}>{doc.create}</div>
              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleOpenDocument(doc.number)}
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
                  onClick={() => handleDeleteContract(doc.id)}
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

          {filteredDocuments.length === 0 && (
            <div className={styles.empty}>Контракты не найдены</div>
          )}
        </div>
      </div>

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
              
              <input
                type="number"
                step="0.01"
                placeholder="Объем (необязательно)"
                value={formData.scope}
                onChange={(e) => setFormData({...formData, scope: e.target.value})}
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
    </div>
  );
}