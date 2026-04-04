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
  supplier_ogrnip: string;
  supplier_bank_account: string;
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
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    inn: "",
    ogrnip: "",
    bank_account: "",
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

    return Array.from(suppliersMap.values()).sort((a, b) =>
      a.supplier_name.localeCompare(b.supplier_name, "ru")
    );
  }, [suppliers, supplierWood, products]);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return enrichedSuppliers;

    return enrichedSuppliers.filter((supplier) => {
      const matchesSupplier =
        supplier.supplier_name.toLowerCase().includes(normalizedSearch) ||
        supplier.supplier_inn?.toLowerCase().includes(normalizedSearch) ||
        supplier.supplier_ogrnip?.toLowerCase().includes(normalizedSearch) ||
        supplier.supplier_phone?.toLowerCase().includes(normalizedSearch);

      const matchesWood = supplier.products.some(
        (p) =>
          p.wood_type.toLowerCase().includes(normalizedSearch) ||
          p.wood_grade?.toLowerCase().includes(normalizedSearch)
      );

      return matchesSupplier || matchesWood;
    });
  }, [enrichedSuppliers, search]);

  const toggleExpand = (supplierId: number) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

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
        supplier_ogrnip: formData.ogrnip.trim() || null,
        supplier_bank_account: formData.bank_account.trim() || null,
      };

      const response = await fetch("http://localhost:8000/api/table/suppliers_info/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка создания поставщика");
      }

      alert("Поставщик успешно создан");
      await fetchAllData();

      setFormData({
        name: "",
        address: "",
        phone: "",
        inn: "",
        ogrnip: "",
        bank_account: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err instanceof Error ? err.message : "Ошибка создания поставщика");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Вы уверены, что хотите удалить этого поставщика? Все связанные контракты и материалы будут удалены."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/table/suppliers_info/?id=${id}`,
        { method: "DELETE" }
      );

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
    } catch (err) {
      console.error("Ошибка удаления материала:", err);
      alert("Ошибка удаления материала");
    }
  };

  const openProductModal = (supplier: SupplierWithProducts) => {
    setSelectedSupplier(supplier);
    setProductFormData({
      wood_id: "",
      available_quantity: "",
      offered_price: "",
    });
    setIsProductModalOpen(true);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка добавления материала");
      }

      alert("Материал успешно добавлен");
      await fetchAllData();

      setIsAddingProduct(false);
      setIsProductModalOpen(false);
      setProductFormData({
        wood_id: "",
        available_quantity: "",
        offered_price: "",
      });
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err instanceof Error ? err.message : "Ошибка добавления материала");
      setIsAddingProduct(false);
    }
  };

  const handleProductClick = (woodId: number) => {
    const product = products.find((p) => p.wood_id === woodId);
    if (product) {
      setSelectedProduct(product);
      setIsProductInfoModalOpen(true);
    } else {
      alert(`Информация о материале не найдена (ID: ${woodId})`);
    }
  };

  const getAvailableProducts = (): Product[] => {
    if (!selectedSupplier) return [];
    const currentProductIds = selectedSupplier.products.map((p) => p.wood_id);
    return products.filter((product) => !currentProductIds.includes(product.wood_id));
  };

  const formatPhone = (phone: string) => phone || "—";
  const formatAddress = (address: string) => address || "—";

  const formatCurrency = (amount: number) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatProductCharacteristics = (product: Product) => {
    const chars = [];
    if (product.wood_type) chars.push({ label: "Порода", value: product.wood_type });
    if (product.wood_grade) chars.push({ label: "Сорт", value: product.wood_grade });
    if (product.wood_length) chars.push({ label: "Длина", value: `${product.wood_length} м` });
    if (product.wood_diameter) chars.push({ label: "Диаметр", value: `${product.wood_diameter} мм` });
    if (product.wood_the_upper_end_diameter)
      chars.push({ label: "Верхний диаметр", value: `${product.wood_the_upper_end_diameter} мм` });
    if (product.wood_lower_end_diameter)
      chars.push({ label: "Нижний диаметр", value: `${product.wood_lower_end_diameter} мм` });
    if (product.wood_graduation) chars.push({ label: "Градация", value: product.wood_graduation });
    if (product.wood_cross_section) chars.push({ label: "Сечение", value: product.wood_cross_section });
    return chars;
  };

  if (loading) {
    return <div className={styles.page}>Загрузка данных...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск по названию, ИНН, ОГРНИП, телефону или материалу"
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
          <Image src="/icons/create-document.svg" alt="Добавить" width={32} height={32} />
          <span>Добавить поставщика</span>
        </button>
      </div>

      <div className={styles.list}>
        {filteredSuppliers.map((supplier) => {
          const isExpanded = expandedSuppliers.has(supplier.supplier_id);

          return (
            <div key={supplier.supplier_id} className={styles.card}>
              <div className={styles.cardTitle}>{supplier.supplier_name}</div>

              <div className={styles.cardBody}>
                <div className={styles.infoLine}>
                  <span className={styles.label}>ИНН:</span>
                  <span className={styles.value}>{supplier.supplier_inn || "—"}</span>
                </div>

                <div className={styles.infoLine}>
                  <span className={styles.label}>Телефон:</span>
                  <span className={styles.value}>{formatPhone(supplier.supplier_phone)}</span>
                </div>

                <div className={styles.infoLine}>
                  <span className={styles.label}>Адрес:</span>
                  <span className={styles.value}>{formatAddress(supplier.supplier_address)}</span>
                </div>

                <div className={styles.expandSection}>
                  <button
                    type="button"
                    className={styles.expandButton}
                    onClick={() => toggleExpand(supplier.supplier_id)}
                  >
                    <span className={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</span>
                    {isExpanded ? "Скрыть подробности" : "Показать подробнее"}
                  </button>
                </div>

                {isExpanded && (
                  <>
                    <div className={styles.extraInfoBlock}>
                      <div className={styles.infoLine}>
                        <span className={styles.label}>ОГРНИП:</span>
                        <span className={styles.value}>{supplier.supplier_ogrnip || "—"}</span>
                      </div>
                      <div className={styles.infoLine}>
                        <span className={styles.label}>Р/с:</span>
                        <span className={styles.value}>{supplier.supplier_bank_account || "—"}</span>
                      </div>
                    </div>

                    <div className={styles.productsHeader}>
                      <div className={styles.productsTitle}>
                        Материалы поставщика ({supplier.products.length})
                      </div>
                      <button
                        type="button"
                        className={styles.addProductButton}
                        onClick={() => openProductModal(supplier)}
                      >
                        Добавить материал
                      </button>
                    </div>

                    {supplier.products.length > 0 ? (
                      <div className={styles.productsBlock}>
                        {supplier.products.map((product) => (
                          <div key={product.wood_id} className={styles.productLine}>
                            <div
                              className={styles.productNameBlock}
                              onClick={() => handleProductClick(product.wood_id)}
                            >
                              <Image
                                src="/icons/wood.svg"
                                alt="Материал"
                                width={16}
                                height={16}
                                className={styles.productIconImage}
                              />
                              <span className={styles.clickableProduct}>
                                {product.wood_type}{" "}
                                {product.wood_grade && `(${product.wood_grade})`}
                              </span>
                            </div>

                            <div className={styles.productDetails}>
                              <div className={styles.priceBlock}>
                                <span>Доступно:</span>
                                <strong>
                                  {product.available_quantity.toLocaleString("ru-RU", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  м³
                                </strong>
                              </div>

                              <div className={styles.priceBlock}>
                                <span>Цена:</span>
                                <strong className={styles.priceValue}>
                                  {formatCurrency(product.offered_price)}/м³
                                </strong>
                              </div>

                              <div className={styles.totalPriceBlock}>
                                <span>Итого:</span>
                                <strong className={styles.totalPriceValue}>
                                  {formatCurrency(
                                    product.available_quantity * product.offered_price
                                  )}
                                </strong>
                              </div>
                            </div>

                            <div className={styles.productActions}>
                              <button
                                type="button"
                                className={styles.deleteProductButton}
                                onClick={() =>
                                  handleDeleteProduct(supplier.supplier_id, product.wood_id)
                                }
                                title="Удалить материал"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.noProducts}>
                        Нет поставляемых материалов
                      </div>
                    )}
                  </>
                )}

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(supplier.supplier_id)}
                    title="Удалить поставщика"
                  >
                    <Image
                      src="/icons/delete-document.svg"
                      alt="Удалить"
                      width={20}
                      height={20}
                    />
                    Удалить поставщика
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSuppliers.length === 0 && (
          <div className={styles.empty}>Поставщики не найдены</div>
        )}
      </div>

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
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>ОГРНИП</label>
                <input
                  type="text"
                  placeholder="123456789012345"
                  value={formData.ogrnip}
                  onChange={(e) => setFormData({ ...formData, ogrnip: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Расчётный счёт</label>
                <input
                  type="text"
                  placeholder="40702810123456789012"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  className={styles.input}
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

      {isProductModalOpen && selectedSupplier && (
        <div className={styles.overlay} onClick={() => setIsProductModalOpen(false)}>
          <div
            className={`${styles.modal} ${styles.deliveriesModal}`}
            onClick={(e) => e.stopPropagation()}
          >
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
                <span className={styles.contractInfoLabel}>ОГРНИП:</span>
                <span className={styles.contractInfoValue}>{selectedSupplier.supplier_ogrnip || "—"}</span>
              </div>
              <div className={styles.contractInfoRow}>
                <span className={styles.contractInfoLabel}>Р/с:</span>
                <span className={styles.contractInfoValue}>{selectedSupplier.supplier_bank_account || "—"}</span>
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
                      {product.available_quantity.toLocaleString("ru-RU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      м³
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
                        onClick={() =>
                          handleDeleteProduct(selectedSupplier.supplier_id, product.wood_id)
                        }
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
                  Добавить материал
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
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, wood_id: e.target.value })
                  }
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
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      available_quantity: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      offered_price: e.target.value,
                    })
                  }
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

      {isProductInfoModalOpen && selectedProduct && (
        <div className={styles.overlay} onClick={() => setIsProductInfoModalOpen(false)}>
          <div
            className={`${styles.modal} ${styles.productModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>
              Характеристики материала
              <button className={styles.closeButton} onClick={() => setIsProductInfoModalOpen(false)}>
                ✕
              </button>
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
              <button
                className={styles.closeModalButton}
                onClick={() => setIsProductInfoModalOpen(false)}
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