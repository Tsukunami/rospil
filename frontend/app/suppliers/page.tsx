"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./SuppliersPage.module.css";

type Supplier = {
  supplier_id: number;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_inn: string;
};

type SupplierWood = {
  supplier_id: number;
  wood_id: number;
  available_quantity: number;
  offered_price: number;
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

type SupplierWithProducts = Supplier & {
  products: {
    wood_id: number;
    wood_type: string;
    wood_grade: string;
    wood_length: number;
    wood_diameter: number;
    wood_the_upper_end_diameter?: number;
    wood_lower_end_diameter?: number;
    wood_graduation: string;
    wood_cross_section: string;
    available_quantity: number;
    offered_price: number;
  }[];
};

type SortConfig = {
  key: "supplier_name" | "supplier_inn" | "supplier_phone" | "supplier_address";
  direction: "asc" | "desc";
};

type Filters = {
  name: string;
  inn: string;
  phone: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierWood, setSupplierWood] = useState<SupplierWood[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithProducts | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isProductInfoModalOpen, setIsProductInfoModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "supplier_name",
    direction: "asc",
  });
  const [filters, setFilters] = useState<Filters>({
    name: "",
    inn: "",
    phone: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    inn: "",
  });

  const [productFormData, setProductFormData] = useState({
    wood_id: "",
    available_quantity: "",
    offered_price: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [suppliersRes, supplierWoodRes, productsRes] = await Promise.all([
        fetch("http://localhost:8000/api/table/suppliers_info/"),
        fetch("http://localhost:8000/api/table/supplier_wood/"),
        fetch("http://localhost:8000/api/table/product/"),
      ]);

      if (!suppliersRes.ok) throw new Error("Ошибка загрузки поставщиков");

      const suppliersData = await suppliersRes.json();
      const supplierWoodData = supplierWoodRes.ok ? await supplierWoodRes.json() : [];
      const productsData = productsRes.ok ? await productsRes.json() : [];

      setSuppliers(suppliersData);
      setSupplierWood(supplierWoodData);
      setProducts(productsData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const enrichedSuppliers = useMemo((): SupplierWithProducts[] => {
    const suppliersMap = new Map<number, SupplierWithProducts>();

    suppliers.forEach((supplier) => {
      suppliersMap.set(supplier.supplier_id, {
        ...supplier,
        products: [],
      });
    });

    supplierWood.forEach((sw) => {
      const supplier = suppliersMap.get(sw.supplier_id);
      if (supplier) {
        const product = products.find((p) => p.wood_id === sw.wood_id);
        if (product) {
          supplier.products.push({
            wood_id: sw.wood_id,
            wood_type: product.wood_type,
            wood_grade: product.wood_grade,
            wood_length: product.wood_length,
            wood_diameter: product.wood_diameter,
            wood_the_upper_end_diameter: product.wood_the_upper_end_diameter,
            wood_lower_end_diameter: product.wood_lower_end_diameter,
            wood_graduation: product.wood_graduation,
            wood_cross_section: product.wood_cross_section,
            available_quantity: sw.available_quantity,
            offered_price: sw.offered_price || 0,
          });
        }
      }
    });

    suppliersMap.forEach((supplier) => {
      supplier.products.sort((a, b) => a.wood_type.localeCompare(b.wood_type, "ru"));
    });

    return Array.from(suppliersMap.values());
  }, [suppliers, supplierWood, products]);

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
    setFilters({ name: "", inn: "", phone: "" });
  };

  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = [...enrichedSuppliers];

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.supplier_name.toLowerCase().includes(normalizedSearch) ||
          supplier.supplier_inn?.toLowerCase().includes(normalizedSearch) ||
          supplier.supplier_phone?.toLowerCase().includes(normalizedSearch) ||
          supplier.products.some(
            (p) =>
              p.wood_type.toLowerCase().includes(normalizedSearch) ||
              p.wood_grade?.toLowerCase().includes(normalizedSearch)
          )
      );
    }

    if (filters.name) {
      filtered = filtered.filter((supplier) =>
        supplier.supplier_name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.inn) {
      filtered = filtered.filter((supplier) =>
        supplier.supplier_inn?.toLowerCase().includes(filters.inn.toLowerCase())
      );
    }
    if (filters.phone) {
      filtered = filtered.filter((supplier) =>
        supplier.supplier_phone?.toLowerCase().includes(filters.phone.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case "supplier_name":
          comparison = a.supplier_name.localeCompare(b.supplier_name, "ru");
          break;
        case "supplier_inn":
          comparison = (a.supplier_inn || "").localeCompare(b.supplier_inn || "", "ru");
          break;
        case "supplier_phone":
          comparison = (a.supplier_phone || "").localeCompare(b.supplier_phone || "", "ru");
          break;
        case "supplier_address":
          comparison = (a.supplier_address || "").localeCompare(b.supplier_address || "", "ru");
          break;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [enrichedSuppliers, search, filters, sortConfig]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("Введите название поставщика");
      return;
    }
    if (!formData.inn.trim()) {
      alert("Введите ИНН поставщика");
      return;
    }

    setIsCreating(true);
    try {
      const supplierData = {
        supplier_name: formData.name.trim(),
        supplier_address: formData.address.trim() || null,
        supplier_phone: formData.phone.trim() || null,
        supplier_inn: formData.inn.trim(),
      };

      const response = await fetch("http://localhost:8000/api/table/suppliers_info/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка создания поставщика");
      }

      alert("Поставщик успешно создан");
      await fetchAllData();
      setFormData({ name: "", address: "", phone: "", inn: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err instanceof Error ? err.message : "Ошибка создания поставщика");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого поставщика? Все связанные контракты и материалы будут удалены."))
      return;
    try {
      const response = await fetch(`http://localhost:8000/api/table/suppliers_info/?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка удаления");
      }
      alert("Поставщик удален");
      await fetchAllData();
      if (selectedSupplier?.supplier_id === id) {
        setSelectedSupplier(null);
        setIsProductModalOpen(false);
      }
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Ошибка удаления поставщика");
    }
  };

  const handleDeleteProduct = async (supplierId: number, woodId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот материал у поставщика?")) return;
    try {
      const response = await fetch(
        `http://localhost:8000/api/table/supplier_wood/?supplier_id=${supplierId}&wood_id=${woodId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Ошибка удаления материала");
      alert("Материал удален");
      await fetchAllData();
      if (selectedSupplier && selectedSupplier.supplier_id === supplierId) {
        const updated = enrichedSuppliers.find(s => s.supplier_id === supplierId);
        if (updated) setSelectedSupplier(updated);
      }
    } catch (err) {
      console.error("Ошибка удаления материала:", err);
      alert("Ошибка удаления материала");
    }
  };

  const openProductModal = (supplier: Supplier) => {
    const enriched = enrichedSuppliers.find(s => s.supplier_id === supplier.supplier_id);
    if (enriched) {
      setSelectedSupplier(enriched);
      setProductFormData({ wood_id: "", available_quantity: "", offered_price: "" });
      setIsProductModalOpen(true);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedSupplier) return;
    if (!productFormData.wood_id) {
      alert("Выберите материал");
      return;
    }
    if (!productFormData.available_quantity || parseFloat(productFormData.available_quantity) <= 0) {
      alert("Введите корректное количество");
      return;
    }
    if (!productFormData.offered_price || parseFloat(productFormData.offered_price) <= 0) {
      alert("Введите корректную цену");
      return;
    }

    setIsAddingProduct(true);
    try {
      const productData = {
        supplier_id: selectedSupplier.supplier_id,
        wood_id: parseInt(productFormData.wood_id),
        available_quantity: parseFloat(productFormData.available_quantity),
        offered_price: parseFloat(productFormData.offered_price),
      };

      const response = await fetch("http://localhost:8000/api/table/supplier_wood/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка добавления материала");
      }

      alert("Материал успешно добавлен");
      await fetchAllData();
      const updated = enrichedSuppliers.find(s => s.supplier_id === selectedSupplier.supplier_id);
      if (updated) setSelectedSupplier(updated);
      setIsProductModalOpen(false);
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err instanceof Error ? err.message : "Ошибка добавления материала");
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleProductClick = (woodId: number) => {
    const product = products.find(p => p.wood_id === woodId);
    if (product) {
      setSelectedProduct(product);
      setIsProductInfoModalOpen(true);
    } else {
      alert(`Информация о материале не найдена (ID: ${woodId})`);
    }
  };

  const getAvailableProducts = (): Product[] => {
    if (!selectedSupplier) return [];
    const currentProductIds = selectedSupplier.products.map(p => p.wood_id);
    return products.filter(product => !currentProductIds.includes(product.wood_id));
  };

  const formatPhone = (phone: string) => phone || "—";
  const formatAddress = (address: string) => address || "—";
  const formatCurrency = (amount: number) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };
  const formatProductCharacteristics = (product: Product) => {
    const chars = [];
    if (product.wood_type) chars.push({ label: 'Порода', value: product.wood_type });
    if (product.wood_grade) chars.push({ label: 'Сорт', value: product.wood_grade });
    if (product.wood_length) chars.push({ label: 'Длина', value: `${product.wood_length} м` });
    if (product.wood_diameter) chars.push({ label: 'Диаметр', value: `${product.wood_diameter} мм` });
    if (product.wood_the_upper_end_diameter) chars.push({ label: 'Верхний диаметр', value: `${product.wood_the_upper_end_diameter} мм` });
    if (product.wood_lower_end_diameter) chars.push({ label: 'Нижний диаметр', value: `${product.wood_lower_end_diameter} мм` });
    if (product.wood_graduation) chars.push({ label: 'Градация', value: product.wood_graduation });
    if (product.wood_cross_section) chars.push({ label: 'Сечение', value: product.wood_cross_section });
    return chars;
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
            placeholder="Поиск по названию, ИНН, телефону или материалу"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>⌕</span>
        </div>

        <button
          type="button"
          className={styles.createButton}
          onClick={() => setIsModalOpen(true)}
          title="Добавить поставщика"
        >
          <Image src="/icons/create-document.svg" alt="Добавить" width={50} height={50} />
          <span>Добавить поставщика</span>
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <div className={`${styles.colName} ${styles.sortable}`} onClick={() => handleSort("supplier_name")}>
              Название {getSortIcon("supplier_name")}
            </div>
            <div className={`${styles.colInn} ${styles.sortable}`} onClick={() => handleSort("supplier_inn")}>
              ИНН {getSortIcon("supplier_inn")}
            </div>
            <div className={`${styles.colPhone} ${styles.sortable}`} onClick={() => handleSort("supplier_phone")}>
              Телефон {getSortIcon("supplier_phone")}
            </div>
            <div className={`${styles.colAddress} ${styles.sortable}`} onClick={() => handleSort("supplier_address")}>
              Адрес {getSortIcon("supplier_address")}
            </div>
            <div className={styles.colMaterials}>Материалы</div>
            <div className={styles.colActions}>Действия</div>
          </div>

          {filteredAndSortedSuppliers.map((supplier) => (
            <div key={supplier.supplier_id} className={styles.row}>
              <div className={styles.colName}>{supplier.supplier_name}</div>
              <div className={styles.colInn}>{supplier.supplier_inn || "—"}</div>
              <div className={styles.colPhone}>{formatPhone(supplier.supplier_phone)}</div>
              <div className={styles.colAddress}>{formatAddress(supplier.supplier_address)}</div>
              <div className={styles.colMaterials}>
                <button
                  type="button"
                  className={styles.materialsButton}
                  onClick={() => openProductModal(supplier)}
                  title="Просмотр материалов"
                >
                  <span>📦</span> Материалы ({supplier.products.length})
                </button>
              </div>
              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(supplier.supplier_id)}
                  title="Удалить поставщика"
                >
                  <Image src="/icons/delete-document.svg" alt="Удалить" width={50} height={50} />
                </button>
              </div>
            </div>
          ))}

          {filteredAndSortedSuppliers.length === 0 && (
            <div className={styles.empty}>Поставщики не найдены</div>
          )}
        </div>
      </div>

      {/* Модальное окно создания поставщика */}
      {isModalOpen && (
        <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Добавление поставщика</div>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Название поставщика *</label>
                <input
                  type="text"
                  placeholder="ООО ЛесПром"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>ИНН *</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Телефон</label>
                <input
                  type="text"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Адрес</label>
                <textarea
                  placeholder="г. Москва, ул. Лесная, д. 1"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={styles.textarea}
                  rows={3}
                />
              </div>
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

      {/* Модальное окно списка материалов поставщика */}
      {isProductModalOpen && selectedSupplier && (
        <div className={styles.overlay} onClick={() => setIsProductModalOpen(false)}>
          <div className={`${styles.modal} ${styles.deliveriesModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Материалы поставщика: {selectedSupplier.supplier_name}
              <button className={styles.closeButton} onClick={() => setIsProductModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className={styles.contractInfo}>
              <div className={styles.contractInfoRow}>
                <span className={styles.contractInfoLabel}>ИНН:</span>
                <span className={styles.contractInfoValue}>{selectedSupplier.supplier_inn || "—"}</span>
              </div>
              <div className={styles.contractInfoRow}>
                <span className={styles.contractInfoLabel}>Телефон:</span>
                <span className={styles.contractInfoValue}>{formatPhone(selectedSupplier.supplier_phone)}</span>
              </div>
              <div className={styles.contractInfoRow}>
                <span className={styles.contractInfoLabel}>Адрес:</span>
                <span className={styles.contractInfoValue}>{formatAddress(selectedSupplier.supplier_address)}</span>
              </div>
            </div>

            <div className={styles.deliveriesSection}>
              <div className={styles.deliveriesHeader}>
                <div className={styles.deliveryColMaterial}>Материал</div>
                <div className={styles.deliveryColScope}>Доступно (м³)</div>
                <div className={styles.deliveryColPrice}>Цена за м³</div>
                <div className={styles.deliveryColTotal}>Итого</div>
                <div className={styles.deliveryColActions}>Действия</div>
              </div>

              {selectedSupplier.products.length > 0 ? (
                selectedSupplier.products.map((product) => (
                  <div key={product.wood_id} className={styles.deliveryRow}>
                    <div className={styles.deliveryColMaterial}>
                      <span
                        className={styles.clickableProduct}
                        onClick={() => handleProductClick(product.wood_id)}
                        title="Нажмите для просмотра характеристик"
                      >
                        {product.wood_type} {product.wood_grade && `(${product.wood_grade})`}
                      </span>
                    </div>
                    <div className={styles.deliveryColScope}>
                      {product.available_quantity.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} м³
                    </div>
                    <div className={styles.deliveryColPrice}>
                      {formatCurrency(product.offered_price)}/м³
                    </div>
                    <div className={styles.deliveryColTotal}>
                      {formatCurrency(product.available_quantity * product.offered_price)}
                    </div>
                    <div className={styles.deliveryColActions}>
                      <button
                        type="button"
                        className={styles.deleteProductButton}
                        onClick={() => handleDeleteProduct(selectedSupplier.supplier_id, product.wood_id)}
                        title="Удалить материал"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noDeliveries}>Нет поставляемых материалов</div>
              )}

              <div className={styles.addProductSection}>
                <button
                  type="button"
                  className={styles.addProductButton}
                  onClick={() => setIsAddingProduct(true)}
                >
                  + Добавить материал
                </button>
              </div>
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

      {/* Модальное окно добавления материала */}
      {isAddingProduct && selectedSupplier && (
        <div className={styles.overlay} onClick={() => setIsAddingProduct(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Добавление материала для {selectedSupplier.supplier_name}
            </div>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Материал *</label>
                <select
                  value={productFormData.wood_id}
                  onChange={(e) => setProductFormData({ ...productFormData, wood_id: e.target.value })}
                  className={styles.select}
                >
                  <option value="">Выберите материал</option>
                  {getAvailableProducts().map((product) => (
                    <option key={product.wood_id} value={product.wood_id}>
                      {product.wood_type} {product.wood_grade && `(${product.wood_grade})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Доступное количество (м³) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={productFormData.available_quantity}
                  onChange={(e) => setProductFormData({ ...productFormData, available_quantity: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Цена за м³ (₽) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={productFormData.offered_price}
                  onChange={(e) => setProductFormData({ ...productFormData, offered_price: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsAddingProduct(false)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleAddProduct}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно карточки товара */}
      {isProductInfoModalOpen && selectedProduct && (
        <div className={styles.overlay} onClick={() => setIsProductInfoModalOpen(false)}>
          <div className={`${styles.modal} ${styles.productModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Характеристики материала
              <button className={styles.closeButton} onClick={() => setIsProductInfoModalOpen(false)}>✕</button>
            </div>
            <div className={styles.productContent}>
              {formatProductCharacteristics(selectedProduct).map((char, idx) => (
                <div key={idx} className={styles.productChar}>
                  <span className={styles.charLabel}>{char.label}:</span>
                  <span className={styles.charValue}>{char.value}</span>
                </div>
              ))}
              <div className={styles.productId}>ID материала: {selectedProduct.wood_id}</div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.closeModalButton} onClick={() => setIsProductInfoModalOpen(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}