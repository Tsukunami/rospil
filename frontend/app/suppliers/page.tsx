"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import styles from "./SuppliersPage.module.css";

import suppliersData from "@/data/suplier.json";
import productsData from "@/data/products.json";
import relationsData from "@/data/Suppliers_And_Product.json";

type Supplier = {
  suplier_id: number;
  supplier_name: string;
  supplier_adress: string;
  supplier_INN: string;
  supplier_phone: string;
};

type Product = {
  wood_id: number;
  swood_type: string;
};

type SupplierProductRelation = {
  product_id: number;
  supplier_id: number;
  product_cost: number;
};

type SupplierItem = {
  productName: string;
  cost: number;
};

type SupplierCard = {
  id: number;
  name: string;
  adress: string;
  inn: string;
  phone: string;
  items: SupplierItem[];
};

function formatPrice(price: number) {
  return `${price.toLocaleString("ru-RU")} руб`;
}

export default function SuppliersPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const searchFromQuery = searchParams.get("search") || "";
    setSearch(searchFromQuery);
  }, [searchParams]);

  const suppliers = suppliersData.suppliers as Supplier[];
  const products = productsData.products as Product[];
  const relations = relationsData.suppliers as SupplierProductRelation[];

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return [];
    }

    const result: SupplierCard[] = [];

    suppliers.forEach((supplier) => {
      const supplierRelations = relations.filter(
        (relation) => relation.supplier_id === supplier.suplier_id
      );

      const allSupplierItems: SupplierItem[] = supplierRelations
        .map((relation) => {
          const product = products.find((p) => p.wood_id === relation.product_id);
          if (!product) return null;

          return {
            productName: product.swood_type,
            cost: relation.product_cost,
          };
        })
        .filter(Boolean) as SupplierItem[];

      const companyMatches = supplier.supplier_name
        .toLowerCase()
        .includes(normalizedSearch);

      const matchedItems = allSupplierItems.filter((item) =>
        item.productName.toLowerCase().includes(normalizedSearch)
      );

      if (companyMatches) {
        result.push({
          id: supplier.suplier_id,
          name: supplier.supplier_name,
          adress: supplier.supplier_adress,
          inn: supplier.supplier_INN?.trim() || "Не указан",
          phone: supplier.supplier_phone,
          items: allSupplierItems.sort((a, b) =>
            a.productName.localeCompare(b.productName, "ru")
          ),
        });

        return;
      }

      if (matchedItems.length > 0) {
        result.push({
          id: supplier.suplier_id,
          name: supplier.supplier_name,
          adress: supplier.supplier_adress,
          inn: supplier.supplier_INN?.trim() || "Не указан",
          phone: supplier.supplier_phone,
          items: matchedItems.sort((a, b) =>
            a.productName.localeCompare(b.productName, "ru")
          ),
        });
      }
    });

    return result.sort((a, b) => a.id - b.id);
  }, [search, suppliers, products, relations]);

  return (
    <div className={styles.page}>
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Введите тип древесины или компанию"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>⌕</span>
        </div>
      </div>

      <div className={styles.list}>
        {search.trim() !== "" && filteredSuppliers.length === 0 && (
          <div className={styles.empty}>Поставщики не найдены</div>
        )}

        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className={styles.card}>
            <div className={styles.cardTitle}>{supplier.name}</div>

            <div className={styles.cardBody}>
              <div className={styles.infoLine}>
                <Image
                  src="/icons/location.svg"
                  alt="Адрес"
                  width={16}
                  height={16}
                  className={styles.lineIcon}
                />
                <span>{supplier.adress}</span>
              </div>

              <div className={styles.infoLine}>
                <Image
                  src="/icons/inn.svg"
                  alt="ИНН"
                  width={16}
                  height={16}
                  className={styles.lineIcon}
                />
                <span>ИНН: {supplier.inn}</span>
              </div>

              <div className={styles.infoLine}>
                <Image
                  src="/icons/phone.svg"
                  alt="Телефон"
                  width={16}
                  height={16}
                  className={styles.lineIcon}
                />
                <span>Телефон: {supplier.phone}</span>
              </div>

              <div className={styles.productsBlock}>
                {supplier.items.map((item, index) => (
                  <div
                    key={`${supplier.id}-${item.productName}-${index}`}
                    className={styles.productLine}
                  >
                    <div className={styles.productNameBlock}>
                      <Image
                        src="/icons/wood.svg"
                        alt="Материал"
                        width={16}
                        height={16}
                        className={styles.lineIcon}
                      />
                      <span>{item.productName}</span>
                    </div>

                    <div className={styles.priceBlock}>
                      <Image
                        src="/icons/price.svg"
                        alt="Цена"
                        width={16}
                        height={16}
                        className={styles.lineIcon}
                      />
                      <span>{formatPrice(item.cost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}