"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./PaymentsPage.module.css";

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
  status: string;
  create: string;
  cost: number;
  scope: number;
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

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    contractId: "",
    status: "срок оплаты не наступил",
    paymentDate: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Загружаем контракты и поставщиков
      const [contractsRes, suppliersRes] = await Promise.all([
        fetch('http://localhost:8000/api/table/suppliers_contract/'),
        fetch('http://localhost:8000/api/table/suppliers_info/')
      ]);
      
      if (!contractsRes.ok) throw new Error('Ошибка загрузки контрактов');
      if (!suppliersRes.ok) throw new Error('Ошибка загрузки поставщиков');
      
      const contractsData = await contractsRes.json();
      const suppliersData = await suppliersRes.json();
      
      setPayments(contractsData);
      setSuppliers(suppliersData);
      
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo<PaymentRow[]>(() => {
    return payments.map((item) => {
      const supplier = suppliers.find(s => s.supplier_id === item.supplier_id);
      
      return {
        id: item.suppliers_contract_id,
        number: item.contract_number,
        supplierName: supplier?.supplier_name || "Неизвестный поставщик",
        status: item.suppliers_contract_status,
        create: formatDate(item.suppliers_contract_date),
        cost: item.suppliers_contract_cost || 0,
        scope: item.suppliers_contract_scope || 0
      };
    });
  }, [payments, suppliers]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return rows;
    
    return rows.filter(
      (row) =>
        row.number.toLowerCase().includes(normalizedSearch) ||
        row.supplierName.toLowerCase().includes(normalizedSearch)
    );
  }, [search, rows]);

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот контракт? Это действие необратимо.')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/table/suppliers_contract/?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      
      // Обновляем список
      setPayments(prev => prev.filter(item => item.suppliers_contract_id !== id));
      alert('Контракт удален');
      
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления контракта');
    }
  };

  const handleOpenPdf = (number: string) => {
    window.open(`/docs/${number}.pdf`, "_blank");
  };

  const handleUpdateStatus = async () => {
    if (!formData.contractId) {
      alert("Выберите контракт");
      return;
    }
    
    if (!formData.status) {
      alert("Выберите статус оплаты");
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Находим выбранный контракт
      const selectedContract = payments.find(p => p.suppliers_contract_id === parseInt(formData.contractId));
      if (!selectedContract) {
        throw new Error("Контракт не найден");
      }
      
      // Обновляем статус контракта
      const updateData = {
        suppliers_contract_id: selectedContract.suppliers_contract_id,
        supplier_id: selectedContract.supplier_id,
        contract_number: selectedContract.contract_number,
        suppliers_contract_status: formData.status,
        suppliers_contract_cost: selectedContract.suppliers_contract_cost,
        suppliers_contract_scope: selectedContract.suppliers_contract_scope,
        suppliers_contract_date: selectedContract.suppliers_contract_date
      };
      
      const response = await fetch('http://localhost:8000/api/table/suppliers_contract/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка обновления статуса');
      }
      
      alert('Статус оплаты успешно обновлен');
      
      // Обновляем список
      await fetchAllData();
      
      // Закрываем модальное окно и сбрасываем форму
      setFormData({
        contractId: "",
        status: "срок оплаты не наступил",
        paymentDate: "",
      });
      setIsModalOpen(false);
      
    } catch (err) {
      console.error('Ошибка:', err);
      alert(err instanceof Error ? err.message : 'Ошибка обновления статуса');
    } finally {
      setIsUpdating(false);
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

  const formatCurrency = (amount: number) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsModalOpen(true)}
            title="Обновить статус оплаты"
          >
            <Image
              src="/icons/create-document.svg"
              alt="Обновить статус"
              width={50}
              height={50}
            />
          </button>
        </div>

        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={styles.colNumber}>Номер контракта</div>
            <div className={styles.colSupplier}>Поставщик</div>
            <div className={styles.colStatus}>Статус оплаты</div>
            <div className={styles.colDate}>Дата контракта</div>
            <div className={styles.colCost}>Стоимость</div>
            <div className={styles.colScope}>Объем</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredRows.map((row) => (
            <div key={row.id} className={styles.row}>
              <div className={styles.colNumber}>№{row.number}</div>
              <div className={styles.colSupplier}>{row.supplierName}</div>
              <div className={`${styles.colStatus} ${getStatusClass(row.status)}`}>
                {getStatusText(row.status)}
              </div>
              <div className={styles.colDate}>{row.create}</div>
              <div className={styles.colCost}>{formatCurrency(row.cost)}</div>
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
                    width={50}
                    height={50}
                  />
                </button>
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
            </div>
          ))}

          {filteredRows.length === 0 && (
            <div className={styles.empty}>Контракты не найдены</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Обновление статуса оплаты</div>

            <div className={styles.form}>
              <select
                value={formData.contractId}
                onChange={(e) => setFormData({...formData, contractId: e.target.value})}
                className={styles.input}
                required
              >
                <option value="">Выберите контракт *</option>
                {rows.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.number} - {contract.supplierName}
                  </option>
                ))}
              </select>

              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className={styles.input}
                required
              >
                <option value="срок оплаты не наступил">Срок оплаты не наступил</option>
                <option value="оплачено">Оплачено</option>
                <option value="просрочено">Просрочено</option>
              </select>

              <input
                type="date"
                placeholder="Дата оплаты (необязательно)"
                value={formData.paymentDate}
                onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                className={styles.input}
              />
              <small className={styles.hint}>
                Если статус "Оплачено", рекомендуется указать дату оплаты
              </small>

              {formData.contractId && (
                <div className={styles.contractInfo}>
                  <h4>Информация о контракте:</h4>
                  {(() => {
                    const selectedContract = rows.find(r => r.id === parseInt(formData.contractId));
                    if (!selectedContract) return null;
                    return (
                      <>
                        <p><strong>Стоимость:</strong> {formatCurrency(selectedContract.cost)}</p>
                        <p><strong>Объем:</strong> {selectedContract.scope} м³</p>
                        <p><strong>Дата контракта:</strong> {selectedContract.create}</p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUpdating}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleUpdateStatus}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Обновление...' : 'Обновить статус'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}