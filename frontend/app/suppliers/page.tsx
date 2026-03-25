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
};

type Product = {
  wood_id: number;
  wood_type: string;
  wood_grade: string;
  wood_length: number;
  wood_cross_section: string;
};

type SupplierWithProducts = Supplier & {
  products: {
    wood_id: number;
    wood_type: string;
    wood_grade: string;
    available_quantity: number;
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
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<number>>(new Set());
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    inn: "",
  });

  const [productFormData, setProductFormData] = useState({
    wood_id: "",
    available_quantity: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log("Загрузка данных поставщиков...");
      
      const [suppliersRes, supplierWoodRes, productsRes] = await Promise.all([
        fetch('http://localhost:8000/api/table/suppliers_info/'),
        fetch('http://localhost:8000/api/table/supplier_wood/'),
        fetch('http://localhost:8000/api/table/product/')
      ]);
      
      if (!suppliersRes.ok) throw new Error('Ошибка загрузки поставщиков');
      
      const suppliersData = await suppliersRes.json();
      const supplierWoodData = supplierWoodRes.ok ? await supplierWoodRes.json() : [];
      const productsData = productsRes.ok ? await productsRes.json() : [];
      
      console.log("Загружено поставщиков:", suppliersData.length);
      console.log("Загружено связей поставщик-материал:", supplierWoodData.length);
      
      setSuppliers(suppliersData);
      setSupplierWood(supplierWoodData);
      setProducts(productsData);
      
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Обогащаем поставщиков информацией о продуктах
  const enrichedSuppliers = useMemo(() => {
    const suppliersMap = new Map<number, SupplierWithProducts>();
    
    // Инициализируем поставщиков
    suppliers.forEach(supplier => {
      suppliersMap.set(supplier.supplier_id, {
        ...supplier,
        products: []
      });
    });
    
    // Добавляем продукты к поставщикам
    supplierWood.forEach(sw => {
      const supplier = suppliersMap.get(sw.supplier_id);
      if (supplier) {
        const product = products.find(p => p.wood_id === sw.wood_id);
        if (product) {
          supplier.products.push({
            wood_id: sw.wood_id,
            wood_type: product.wood_type,
            wood_grade: product.wood_grade,
            available_quantity: sw.available_quantity
          });
        }
      }
    });
    
    // Сортируем продукты
    suppliersMap.forEach(supplier => {
      supplier.products.sort((a, b) => a.wood_type.localeCompare(b.wood_type));
    });
    
    return Array.from(suppliersMap.values());
  }, [suppliers, supplierWood, products]);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return enrichedSuppliers;
    
    return enrichedSuppliers.filter(supplier =>
      supplier.supplier_name.toLowerCase().includes(normalizedSearch) ||
      supplier.supplier_inn?.toLowerCase().includes(normalizedSearch) ||
      supplier.supplier_phone?.toLowerCase().includes(normalizedSearch)
    );
  }, [search, enrichedSuppliers]);

  const toggleExpand = (supplierId: number) => {
    setExpandedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого поставщика? Все связанные контракты и материалы также будут удалены.')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/table/suppliers_info/?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      
      alert('Поставщик удален');
      await fetchAllData();
      
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления поставщика');
    }
  };

  const handleDeleteProduct = async (supplierId: number, woodId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот материал у поставщика?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/table/supplier_wood/?supplier_id=${supplierId}&wood_id=${woodId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Ошибка удаления материала');
      }
      
      alert('Материал удален');
      await fetchAllData();
      
    } catch (err) {
      console.error('Ошибка удаления материала:', err);
      alert('Ошибка удаления материала');
    }
  };

  const handleCreate = async () => {
    // Валидация
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
        supplier_inn: formData.inn.trim()
      };
      
      console.log("Создаем поставщика:", supplierData);
      
      const response = await fetch('http://localhost:8000/api/table/suppliers_info/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания поставщика');
      }
      
      const result = await response.json();
      console.log("Поставщик создан, ID:", result.id);
      
      alert('Поставщик успешно создан');
      
      // Обновляем список
      await fetchAllData();
      
      // Закрываем модальное окно и сбрасываем форму
      setFormData({
        name: "",
        address: "",
        phone: "",
        inn: "",
      });
      setIsModalOpen(false);
      
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка создания поставщика: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setIsCreating(false);
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
    
    setIsAddingProduct(true);
    
    try {
      const productData = {
        supplier_id: selectedSupplier.supplier_id,
        wood_id: parseInt(productFormData.wood_id),
        available_quantity: parseFloat(productFormData.available_quantity)
      };
      
      const response = await fetch('http://localhost:8000/api/table/supplier_wood/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка добавления материала');
      }
      
      alert('Материал успешно добавлен');
      
      // Обновляем данные
      await fetchAllData();
      
      // Закрываем модальное окно и сбрасываем форму
      setIsProductModalOpen(false);
      setSelectedSupplier(null);
      setProductFormData({
        wood_id: "",
        available_quantity: "",
      });
      
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка добавления материала: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setIsAddingProduct(false);
    }
  };

  const openProductModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setProductFormData({
      wood_id: "",
      available_quantity: "",
    });
    setIsProductModalOpen(true);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '—';
    return phone;
  };

  const formatAddress = (address: string) => {
    if (!address) return '—';
    return address;
  };

  // Получаем список доступных материалов (которых еще нет у поставщика)
  const getAvailableProducts = () => {
    if (!selectedSupplier) return [];
    
    const currentSupplier = enrichedSuppliers.find(s => s.supplier_id === selectedSupplier.supplier_id);
    const currentProductIds = currentSupplier?.products.map(p => p.wood_id) || [];
    
    return products.filter(product => !currentProductIds.includes(product.wood_id));
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
            placeholder="Поиск по названию, ИНН или телефону"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>⌕</span>
        </div>
      </div>

      <div className={styles.tableActions}>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setIsModalOpen(true)}
          title="Добавить поставщика"
        >
          <Image
            src="/icons/create-document.svg"
            alt="Добавить"
            width={40}
            height={40}
          />
          <span>Добавить поставщика</span>
        </button>
      </div>

      <div className={styles.list}>
        {filteredSuppliers.map((supplier) => {
          const isExpanded = expandedSuppliers.has(supplier.supplier_id);
          const hasProducts = supplier.products.length > 0;
          
          return (
            <div key={supplier.supplier_id} className={styles.card}>
              <div className={styles.cardTitle}>
                {supplier.supplier_name}
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.infoLine}>
                  <span className={styles.label}>ИНН:</span>
                  <span className={styles.value}>{supplier.supplier_inn || '—'}</span>
                </div>
                
                <div className={styles.infoLine}>
                  <span className={styles.label}>Телефон:</span>
                  <span className={styles.value}>{formatPhone(supplier.supplier_phone)}</span>
                </div>
                
                <div className={styles.infoLine}>
                  <span className={styles.label}>Адрес:</span>
                  <span className={styles.value}>{formatAddress(supplier.supplier_address)}</span>
                </div>
                
                {/* Кнопка "Показать подробнее" */}
                <div className={styles.expandSection}>
                  <button
                    type="button"
                    className={styles.expandButton}
                    onClick={() => toggleExpand(supplier.supplier_id)}
                  >
                    <span className={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    {isExpanded ? 'Скрыть материалы' : 'Показать материалы'}
                    {!isExpanded && hasProducts && (
                      <span className={styles.productCount}>
                        ({supplier.products.length})
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Скрытый блок с материалами */}
                {isExpanded && (
                  <>
                    <div className={styles.productsHeader}>
                      <div className={styles.productsTitle}>Поставляемые материалы:</div>
                      <button
                        type="button"
                        className={styles.addProductButton}
                        onClick={() => openProductModal(supplier)}
                        title="Добавить материал"
                      >
                        + Добавить материал
                      </button>
                    </div>
                    
                    {hasProducts ? (
                      <div className={styles.productsBlock}>
                        {supplier.products.map((product) => (
                          <div key={product.wood_id} className={styles.productLine}>
                            <div className={styles.productNameBlock}>
                              <span className={styles.productIcon}>📦</span>
                              <span>
                                {product.wood_type} {product.wood_grade && `(${product.wood_grade})`}
                              </span>
                            </div>
                            <div className={styles.productActions}>
                              <div className={styles.priceBlock}>
                                <span>Доступно:</span>
                                <strong>{product.available_quantity.toLocaleString("ru-RU", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })} м³</strong>
                              </div>
                              <button
                                type="button"
                                className={styles.deleteProductButton}
                                onClick={() => handleDeleteProduct(supplier.supplier_id, product.wood_id)}
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
          <div className={styles.empty}>
            {search ? "Поставщики не найдены" : "Нет добавленных поставщиков"}
          </div>
        )}
      </div>

      {/* Модальное окно для добавления поставщика */}
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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, inn: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Адрес</label>
                <textarea
                  placeholder="г. Москва, ул. Лесная, д. 1"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                  {isCreating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для добавления материала */}
      {isProductModalOpen && selectedSupplier && (
        <div className={styles.overlay} onClick={() => setIsProductModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Добавление материала для {selectedSupplier.supplier_name}
            </div>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Материал *</label>
                <select
                  value={productFormData.wood_id}
                  onChange={(e) => setProductFormData({...productFormData, wood_id: e.target.value})}
                  className={styles.select}
                  required
                >
                  <option value="">Выберите материал</option>
                  {getAvailableProducts().map((product) => (
                    <option key={product.wood_id} value={product.wood_id}>
                      {product.wood_type} {product.wood_grade && `(${product.wood_grade})`} - {product.wood_length}мм, {product.wood_cross_section}
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
                  onChange={(e) => setProductFormData({...productFormData, available_quantity: e.target.value})}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={isAddingProduct}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleAddProduct}
                  disabled={isAddingProduct}
                >
                  {isAddingProduct ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}