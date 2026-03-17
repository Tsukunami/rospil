"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./ContractsPage.module.css";
import documentsData from "@/data/documents.json";

type DocumentItem = {
  id: number;
  number: string;
  status: string;
  create: string;
};

function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function ContractsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(
    documentsData.documents
  );
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return documents;

    return documents.filter((doc) =>
      doc.number.toLowerCase().includes(normalizedSearch)
    );
  }, [search, documents]);

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleOpenDocument = (number: string) => {
    window.open(`/docs/${number}.pdf`, "_blank");
  };

  const handleCreateDocument = () => {
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
    };

    setDocuments((prev) => [newDocument, ...prev]);

    setDocNumber("");
    setDocDate("");
    setDocFile(null);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск документа"
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
            <div className={styles.colStatus}>Статус</div>
            <div className={styles.colDate}>Создан</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredDocuments.map((doc) => (
            <div key={doc.id} className={styles.row}>
              <div className={styles.colNumber}>№{doc.number}</div>

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