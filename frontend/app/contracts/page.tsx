"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./ContractsPage.module.css";

type DocumentItem = {
  id: number;
  number: string;
  status: string;
  create: string;
  supplierName: string; // имя поставщика вместо supplier_id
};

export default function ContractsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/export/all/');
        if (!res.ok) throw new Error('Ошибка загрузки');
        const allData = await res.json();

        // 1. Получаем список контрактов (название таблицы может быть 'suppliers_contract' или 'documents')
        const contracts = allData.suppliers_contract || allData.documents || [];
        // 2. Получаем список поставщиков (название таблицы может быть 'suppliers_info' или 'suppliers')
        const suppliers = allData.suppliers_info || allData.suppliers || [];

        // Строим карту: supplier_id -> supplier_name
        const supplierMap = new Map<number, string>();
        suppliers.forEach((s: any) => {
          const id = s.supplier_id;
          const name = s.supplier_name || s.supplier_name;
          if (id && name) supplierMap.set(id, name);
        });

        // Преобразуем контракты в формат DocumentItem
        const mapped = contracts.map((contract: any) => ({
          id: contract.suppliers_contract_id || contract.document_id,
          number: contract.contract_number || contract.document_number,
          status: contract.suppliers_contract_status || contract.status || 'Готов',
          create: contract.suppliers_contract_date || contract.create_date,
          supplierName: supplierMap.get(contract.supplier_id) || 'Неизвестный поставщик',
        }));
        setDocuments(mapped);
      } catch (err) {
        console.error('Ошибка загрузки:', err);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return documents;
    return documents.filter(doc =>
      doc.number.toLowerCase().includes(normalizedSearch) ||
      doc.supplierName.toLowerCase().includes(normalizedSearch)
    );
  }, [search, documents]);

  const handleDelete = (id: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    // TODO: отправить DELETE запрос на сервер
  };

  const handleOpenDocument = (number: string) => {
    window.open(`/docs/${number}.pdf`, "_blank");
  };

  const handleCreateDocument = async () => {
    if (!docNumber.trim()) {
      alert("Введите номер документа");
      return;
    }
    if (!docFile) {
      alert("Загрузите PDF файл");
      return;
    }

    const newDocument: DocumentItem = {
      id: Date.now(),
      number: docNumber.trim(),
      status: "Готов",
      create: docDate.trim() || getTodayDate(),
      supplierName: "Новый поставщик", // временно, нужно добавить выбор поставщика
    };

    setDocuments(prev => [newDocument, ...prev]);

    // Отправка на сервер (раскомментируйте и адаптируйте)
    // const formData = new FormData();
    // formData.append('number', newDocument.number);
    // formData.append('date', newDocument.create);
    // formData.append('file', docFile);
    // await fetch('http://localhost:8000/api/documents/', { method: 'POST', body: formData });

    setDocNumber("");
    setDocDate("");
    setDocFile(null);
    setIsModalOpen(false);
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
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsModalOpen(true)}
            title="Создать документ"
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
            <div className={styles.colNumber}>Номер документа</div>
            <div className={styles.colSupplier}>Поставщик</div>
            <div className={styles.colStatus}>Статус</div>
            <div className={styles.colDate}>Создан</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredDocuments.map((doc) => (
            <div key={doc.id} className={styles.row}>
              <div className={styles.colNumber}>№{doc.number}</div>
              <div className={styles.colSupplier}>{doc.supplierName}</div>
              <div
                className={`${styles.colStatus} ${
                  doc.status === "Готов"
                    ? styles.statusReady
                    : doc.status === "Выполняется"
                    ? styles.statusDoing
                    : styles.statusProgress
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
                  onClick={() => handleDelete(doc.id)}
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
            <div className={styles.empty}>Документы не найдены</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Создание документа</div>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Номер документа"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Дата (необязательно, например 22.01.2026)"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className={styles.input}
              />
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className={styles.fileInput}
              />
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
                  onClick={handleCreateDocument}
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}