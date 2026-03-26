"use client";

import { useMemo, useState, useEffect } from "react";
import styles from "./StatisticsPage.module.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Contract = {
  suppliers_contract_id: number;
  contract_number: string;
  supplier_id: number;
  suppliers_contract_status: string;
  suppliers_contract_cost: number | null;
  suppliers_contract_scope: number | null;
  suppliers_contract_date: string;
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

type StatsPoint = {
  date: string;
  count: number;
  оплачено: number;
  просрочено: number;
  "срок оплаты не наступил": number;
  expense: number;
};

const COLORS = {
  оплачено: "#7be08a",
  просрочено: "#ff5b57",
  "срок оплаты не наступил": "#ffb347",
  expense: "#ef4444",
  ожидается: "#ffb347",
  доставлено: "#7be08a",
  нарушение: "#ff5b57",
};

const STATUS_LABELS = {
  оплачено: "Оплачено",
  просрочено: "Просрочено",
  "срок оплаты не наступил": "Срок не наступил",
  ожидается: "Ожидается",
  доставлено: "Доставлено",
  нарушение: "Нарушение",
};

const formatDateLabel = (dateStr: string) => {
  const [year, month] = dateStr.split("-");
  const months: Record<string, string> = {
    "01": "Янв",
    "02": "Фев",
    "03": "Мар",
    "04": "Апр",
    "05": "Май",
    "06": "Июн",
    "07": "Июл",
    "08": "Авг",
    "09": "Сен",
    "10": "Окт",
    "11": "Ноя",
    "12": "Дек",
  };
  return `${months[month]} ${year}`;
};

const formatCurrency = (value: number) => {
  if (!value || isNaN(value)) return "0 ₽";
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function StatisticsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierWood, setSupplierWood] = useState<SupplierWood[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2026-12-31");
  const [activeTab, setActiveTab] = useState<"contracts" | "expenses" | "prices" | "deliveries">("contracts");
  const [contractsChartType, setContractsChartType] = useState<"timeline" | "statusTimeline" | "statusPie">("timeline");
  const [contractsCurrentPage, setContractsCurrentPage] = useState(0);
  
  const [selectedWoodId, setSelectedWoodId] = useState<number | null>(null);
  const [priceSortBy, setPriceSortBy] = useState<"price" | "quantity">("price");
  const [priceSortOrder, setPriceSortOrder] = useState<"asc" | "desc">("asc");
  
  // Состояния для видимости линий на графиках поставок
  const [deliveryVisibleLines, setDeliveryVisibleLines] = useState({
    ожидается: true,
    доставлено: true,
    нарушение: true,
  });
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  
  const [visibleLines, setVisibleLines] = useState({
    оплачено: true,
    просрочено: true,
    "срок оплаты не наступил": true,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [contractsRes, deliveriesRes, suppliersRes, supplierWoodRes, productsRes] = await Promise.all([
        fetch("http://localhost:8000/api/table/suppliers_contract/"),
        fetch("http://localhost:8000/api/table/delivery/"),
        fetch("http://localhost:8000/api/table/suppliers_info/"),
        fetch("http://localhost:8000/api/table/supplier_wood/"),
        fetch("http://localhost:8000/api/table/product/"),
      ]);
      
      if (!contractsRes.ok) throw new Error("Ошибка загрузки контрактов");
      if (!suppliersRes.ok) throw new Error("Ошибка загрузки поставщиков");
      
      const contractsData = await contractsRes.json();
      const deliveriesData = deliveriesRes.ok ? await deliveriesRes.json() : [];
      const suppliersData = await suppliersRes.json();
      const supplierWoodData = supplierWoodRes.ok ? await supplierWoodRes.json() : [];
      const productsData = productsRes.ok ? await productsRes.json() : [];
      
      setContracts(contractsData);
      setDeliveries(deliveriesData);
      setSuppliers(suppliersData);
      setSupplierWood(supplierWoodData);
      setProducts(productsData);
      
      if (productsData.length > 0 && !selectedWoodId) {
        setSelectedWoodId(productsData[0].wood_id);
      }
      
      if (suppliersData.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(suppliersData[0].supplier_id);
      }
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const contractDate = contract.suppliers_contract_date;
      return contractDate >= fromDate && contractDate <= toDate;
    });
  }, [contracts, fromDate, toDate]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      const deliveryDate = delivery.delivery_date;
      return deliveryDate >= fromDate && deliveryDate <= toDate;
    });
  }, [deliveries, fromDate, toDate]);

  const timelineData = useMemo(() => {
    const dataMap = new Map<string, StatsPoint>();
    
    filteredContracts.forEach(contract => {
      const date = contract.suppliers_contract_date.substring(0, 7);
      if (!dataMap.has(date)) {
        dataMap.set(date, {
          date,
          count: 0,
          оплачено: 0,
          просрочено: 0,
          "срок оплаты не наступил": 0,
          expense: 0,
        });
      }
      const point = dataMap.get(date)!;
      point.count++;
      point[contract.suppliers_contract_status as keyof Omit<StatsPoint, 'date' | 'count' | 'expense'>]++;
      
      if (contract.suppliers_contract_status === "оплачено" && contract.suppliers_contract_cost) {
        const cost = typeof contract.suppliers_contract_cost === 'string' 
          ? parseFloat(contract.suppliers_contract_cost) 
          : contract.suppliers_contract_cost;
        if (!isNaN(cost) && cost > 0) {
          point.expense += cost;
        }
      }
    });
    
    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredContracts]);

  const statusTimelineData = useMemo(() => {
    return timelineData.map(point => ({
      date: point.date,
      оплачено: point.оплачено,
      просрочено: point.просрочено,
      "срок оплаты не наступил": point["срок оплаты не наступил"]
    }));
  }, [timelineData]);

  const expenseTimelineData = useMemo(() => {
    return timelineData.map(point => ({
      date: point.date,
      expense: point.expense,
    }));
  }, [timelineData]);

  const statusPieData = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    filteredContracts.forEach(contract => {
      const status = contract.suppliers_contract_status;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    return Array.from(statusMap.entries()).map(([name, value]) => ({
      name: STATUS_LABELS[name as keyof typeof STATUS_LABELS] || name,
      value,
      color: COLORS[name as keyof typeof COLORS] || "#9ca3af"
    }));
  }, [filteredContracts]);

  // Данные для диаграммы поставщиков - группировка по поставщикам
  const supplierStats = useMemo(() => {
    const stats: { [key: string]: { ожидается: number; доставлено: number; нарушение: number; total: number; supplier_name: string } } = {};
    
    filteredDeliveries.forEach(delivery => {
      const contract = contracts.find(c => c.suppliers_contract_id === delivery.suppliers_contract_id);
      if (!contract) return;
      
      const supplier = suppliers.find(s => s.supplier_id === contract.supplier_id);
      if (!supplier) return;
      
      if (!stats[supplier.supplier_name]) {
        stats[supplier.supplier_name] = {
          supplier_name: supplier.supplier_name,
          ожидается: 0,
          доставлено: 0,
          нарушение: 0,
          total: 0
        };
      }
      
      stats[supplier.supplier_name][delivery.delivery_status as keyof typeof stats[typeof supplier.supplier_name]]++;
      stats[supplier.supplier_name].total++;
    });
    
    let result = Object.values(stats);
    
    // Фильтрация по видимым линиям
    result = result.map(item => ({
      ...item,
      ожидается: deliveryVisibleLines.ожидается ? item.ожидается : 0,
      доставлено: deliveryVisibleLines.доставлено ? item.доставлено : 0,
      нарушение: deliveryVisibleLines.нарушение ? item.нарушение : 0,
    }));
    
    // Сортировка по общему количеству
    result.sort((a, b) => b.total - a.total);
    
    return result;
  }, [filteredDeliveries, contracts, suppliers, deliveryVisibleLines]);

  // Данные для поставок выбранного поставщика по месяцам
  const supplierMonthlyData = useMemo(() => {
    if (!selectedSupplierId) return [];
    
    const monthlyData: { [key: string]: { month: string; ожидается: number; доставлено: number; нарушение: number } } = {};
    
    filteredDeliveries.forEach(delivery => {
      const contract = contracts.find(c => c.suppliers_contract_id === delivery.suppliers_contract_id);
      if (!contract || contract.supplier_id !== selectedSupplierId) return;
      
      const date = delivery.delivery_date.substring(0, 7);
      const monthLabel = formatDateLabel(date);
      
      if (!monthlyData[monthLabel]) {
        monthlyData[monthLabel] = {
          month: monthLabel,
          ожидается: 0,
          доставлено: 0,
          нарушение: 0
        };
      }
      
      monthlyData[monthLabel][delivery.delivery_status as keyof typeof monthlyData[typeof monthLabel]]++;
    });
    
    let result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    
    // Фильтрация по видимым линиям
    result = result.map(item => ({
      ...item,
      ожидается: deliveryVisibleLines.ожидается ? item.ожидается : 0,
      доставлено: deliveryVisibleLines.доставлено ? item.доставлено : 0,
      нарушение: deliveryVisibleLines.нарушение ? item.нарушение : 0,
    }));
    
    return result;
  }, [filteredDeliveries, contracts, selectedSupplierId, deliveryVisibleLines]);

  const priceComparisonData = useMemo(() => {
    if (!selectedWoodId) return [];
    
    const suppliersWithPrice = supplierWood
      .filter(sw => sw.wood_id === selectedWoodId && sw.offered_price > 0)
      .map(sw => {
        const supplier = suppliers.find(s => s.supplier_id === sw.supplier_id);
        return {
          supplier_name: supplier?.supplier_name || "Неизвестный поставщик",
          price: sw.offered_price,
          available_quantity: sw.available_quantity,
        };
      })
      .sort((a, b) => {
        if (priceSortBy === "price") {
          return priceSortOrder === "asc" ? a.price - b.price : b.price - a.price;
        } else {
          return priceSortOrder === "asc" ? a.available_quantity - b.available_quantity : b.available_quantity - a.available_quantity;
        }
      });
    
    return suppliersWithPrice;
  }, [selectedWoodId, supplierWood, suppliers, priceSortBy, priceSortOrder]);

  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const toggleDeliveryLine = (lineKey: keyof typeof deliveryVisibleLines) => {
    setDeliveryVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const contractsChartTypes = [
    { key: "timeline", label: "Динамика договоров", icon: "📈" },
    { key: "statusTimeline", label: "Статусы по времени", icon: "📊" },
    { key: "statusPie", label: "Распределение по статусам", icon: "🥧" }
  ];

  const handlePrevContractsChart = () => {
    setContractsCurrentPage((prev) => (prev === 0 ? contractsChartTypes.length - 1 : prev - 1));
    setContractsChartType(contractsChartTypes[(contractsCurrentPage === 0 ? contractsChartTypes.length - 1 : contractsCurrentPage - 1)].key as typeof contractsChartType);
  };

  const handleNextContractsChart = () => {
    setContractsCurrentPage((prev) => (prev === contractsChartTypes.length - 1 ? 0 : prev + 1));
    setContractsChartType(contractsChartTypes[(contractsCurrentPage === contractsChartTypes.length - 1 ? 0 : contractsCurrentPage + 1)].key as typeof contractsChartType);
  };

  const getTotalContracts = () => filteredContracts.length;

  const getStatusCounts = () => {
    const counts = { оплачено: 0, просрочено: 0, "срок оплаты не наступил": 0 };
    filteredContracts.forEach(contract => {
      counts[contract.suppliers_contract_status as keyof typeof counts]++;
    });
    return counts;
  };

  const getTotalExpense = () => {
    let total = 0;
    filteredContracts.forEach(contract => {
      if (contract.suppliers_contract_status === "оплачено" && contract.suppliers_contract_cost) {
        const cost = typeof contract.suppliers_contract_cost === 'string' 
          ? parseFloat(contract.suppliers_contract_cost) 
          : contract.suppliers_contract_cost;
        if (!isNaN(cost) && cost > 0) total += cost;
      }
    });
    return total;
  };

  const handleSortPrice = () => {
    if (priceSortBy === "price") {
      setPriceSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setPriceSortBy("price");
      setPriceSortOrder("asc");
    }
  };

  const handleSortQuantity = () => {
    if (priceSortBy === "quantity") {
      setPriceSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setPriceSortBy("quantity");
      setPriceSortOrder("asc");
    }
  };

  const getSelectedWoodInfo = () => products.find(p => p.wood_id === selectedWoodId);

  if (loading) return <div className={styles.page}>Загрузка данных...</div>;

  const statusCounts = getStatusCounts();
  const totalContracts = getTotalContracts();
  const totalExpense = getTotalExpense();
  const selectedWoodInfo = getSelectedWoodInfo();

  const tooltipFormatter = (value: number) => [value, "Количество"];

  return (
    <div className={styles.page}>
      <div className={styles.topControls}>
        <div className={styles.periodBlock}>
          <span className={styles.periodLabel}>Период</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={styles.dateInput} />
          <span className={styles.dateSeparator}>—</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={styles.dateInput} />
        </div>
      </div>

      <div className={styles.statsCards}>
        <div className={styles.statCard}><div className={styles.statCardTitle}>Всего договоров</div><div className={styles.statCardValue}>{totalContracts}</div></div>
        <div className={styles.statCard}><div className={styles.statCardTitle}>Оплачено</div><div className={styles.statCardValue} style={{ color: COLORS.оплачено }}>{statusCounts.оплачено}</div><div className={styles.statCardPercent}>{totalContracts > 0 ? Math.round((statusCounts.оплачено / totalContracts) * 100) : 0}%</div></div>
        <div className={styles.statCard}><div className={styles.statCardTitle}>Просрочено</div><div className={styles.statCardValue} style={{ color: COLORS.просрочено }}>{statusCounts.просрочено}</div><div className={styles.statCardPercent}>{totalContracts > 0 ? Math.round((statusCounts.просрочено / totalContracts) * 100) : 0}%</div></div>
        <div className={styles.statCard}><div className={styles.statCardTitle}>Срок не наступил</div><div className={styles.statCardValue} style={{ color: COLORS["срок оплаты не наступил"] }}>{statusCounts["срок оплаты не наступил"]}</div><div className={styles.statCardPercent}>{totalContracts > 0 ? Math.round((statusCounts["срок оплаты не наступил"] / totalContracts) * 100) : 0}%</div></div>
        <div className={styles.statCard}><div className={styles.statCardTitle}>Общие расходы</div><div className={styles.statCardValue} style={{ color: COLORS.expense }}>{formatCurrency(totalExpense)}</div><div className={styles.statCardPercent}>по {statusCounts.оплачено} оплаченным договорам</div></div>
      </div>

      <div className={styles.tabsContainer}>
        <button className={`${styles.tabButton} ${activeTab === "contracts" ? styles.activeTab : ""}`} onClick={() => setActiveTab("contracts")}>📋 Договора</button>
        <button className={`${styles.tabButton} ${activeTab === "expenses" ? styles.activeTab : ""}`} onClick={() => setActiveTab("expenses")}>💰 Расходы</button>
        <button className={`${styles.tabButton} ${activeTab === "prices" ? styles.activeTab : ""}`} onClick={() => setActiveTab("prices")}>🏷️ Сравнение цен</button>
        <button className={`${styles.tabButton} ${activeTab === "deliveries" ? styles.activeTab : ""}`} onClick={() => setActiveTab("deliveries")}>📦 Анализ поставок</button>
      </div>

      {/* Вкладка Договора */}
      {activeTab === "contracts" && (
        <div className={styles.chartContainer}>
          <div className={styles.chartNavigation}>
            <button className={styles.navButton} onClick={handlePrevContractsChart}>←</button>
            <div className={styles.chartTitle}>{contractsChartTypes[contractsCurrentPage].icon} {contractsChartTypes[contractsCurrentPage].label}</div>
            <button className={styles.navButton} onClick={handleNextContractsChart}>→</button>
          </div>
          <div className={styles.chartArea}>
            {contractsChartType === "timeline" && (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid stroke="rgba(0,0,0,0.08)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: "#000000", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#f3eddd", border: "1px solid #8e8e8e", borderRadius: "10px" }} labelFormatter={formatDateLabel} formatter={tooltipFormatter} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: "#3b82f6" }} name="Договоров" />
                </LineChart>
              </ResponsiveContainer>
            )}
            {contractsChartType === "statusTimeline" && (
              <>
                <div className={styles.legendControls}>
                  <button className={`${styles.legendButton} ${visibleLines.оплачено ? styles.active : styles.inactive}`} onClick={() => toggleLine("оплачено")}><span className={styles.legendDot} style={{ backgroundColor: COLORS.оплачено }}></span>Оплачено</button>
                  <button className={`${styles.legendButton} ${visibleLines.просрочено ? styles.active : styles.inactive}`} onClick={() => toggleLine("просрочено")}><span className={styles.legendDot} style={{ backgroundColor: COLORS.просрочено }}></span>Просрочено</button>
                  <button className={`${styles.legendButton} ${visibleLines["срок оплаты не наступил"] ? styles.active : styles.inactive}`} onClick={() => toggleLine("срок оплаты не наступил")}><span className={styles.legendDot} style={{ backgroundColor: COLORS["срок оплаты не наступил"] }}></span>Срок не наступил</button>
                </div>
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={statusTimelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.08)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: "#000000", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#f3eddd", border: "1px solid #8e8e8e", borderRadius: "10px" }} labelFormatter={formatDateLabel} />
                    {visibleLines.оплачено && <Line type="monotone" dataKey="оплачено" stroke={COLORS.оплачено} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.оплачено }} name="Оплачено" />}
                    {visibleLines.просрочено && <Line type="monotone" dataKey="просрочено" stroke={COLORS.просрочено} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.просрочено }} name="Просрочено" />}
                    {visibleLines["срок оплаты не наступил"] && <Line type="monotone" dataKey="срок оплаты не наступил" stroke={COLORS["срок оплаты не наступил"]} strokeWidth={2.5} dot={{ r: 4, fill: COLORS["срок оплаты не наступил"] }} name="Срок не наступил" />}
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
            {contractsChartType === "statusPie" && (
              <div className={styles.pieChartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" labelLine={true} label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(1)}%`} outerRadius={150} dataKey="value">
                      {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#f3eddd", border: "1px solid #8e8e8e", borderRadius: "10px" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Вкладка Расходы */}
      {activeTab === "expenses" && (
        <div className={styles.chartContainer}>
          <div className={styles.chartTitle} style={{ textAlign: "center", marginBottom: "24px" }}>💰 Расходы по времени</div>
          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={expenseTimelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.08)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: "#000000", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "#000000", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#f3eddd", border: "1px solid #8e8e8e", borderRadius: "10px" }} labelFormatter={formatDateLabel} formatter={(v: number) => [formatCurrency(v), "Расходы"]} />
                <Bar dataKey="expense" fill={COLORS.expense} radius={[8, 8, 0, 0]} name="Расходы" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Вкладка Сравнение цен */}
      {activeTab === "prices" && (
        <div className={styles.priceComparisonContainer}>
          <div className={styles.priceFilters}>
            <select value={selectedWoodId || ""} onChange={(e) => setSelectedWoodId(Number(e.target.value))} className={styles.filterSelect}>
              {products.map(p => <option key={p.wood_id} value={p.wood_id}>{p.wood_type} {p.wood_grade && `(${p.wood_grade})`} - {p.wood_length}мм</option>)}
            </select>
          </div>
          {selectedWoodInfo && (
            <div className={styles.selectedWoodInfo}>
              <h3>Информация о материале</h3>
              <div className={styles.woodInfoGrid}>
                <div><span>Порода:</span> {selectedWoodInfo.wood_type}</div>
                <div><span>Сорт:</span> {selectedWoodInfo.wood_grade || "—"}</div>
                <div><span>Длина:</span> {selectedWoodInfo.wood_length} м</div>
                <div><span>Диаметр:</span> {selectedWoodInfo.wood_diameter} мм</div>
                <div><span>Сечение:</span> {selectedWoodInfo.wood_cross_section}</div>
              </div>
            </div>
          )}
          <div className={styles.priceTable}>
            <div className={styles.priceTableHeader}>
              <div>Поставщик</div>
              <div className={styles.sortable} onClick={handleSortPrice}>Цена за м³ (₽) {priceSortBy === "price" && (priceSortOrder === "asc" ? "↑" : "↓")}</div>
              <div className={styles.sortable} onClick={handleSortQuantity}>Доступно (м³) {priceSortBy === "quantity" && (priceSortOrder === "asc" ? "↑" : "↓")}</div>
              <div>Общая стоимость</div>
            </div>
            {priceComparisonData.map((item, i) => (
              <div key={i} className={styles.priceTableRow}>
                <div>{item.supplier_name}</div>
                <div style={{ fontWeight: "bold", color: "#10b981" }}>{formatCurrency(item.price)}</div>
                <div>{item.available_quantity.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style={{ fontWeight: "bold" }}>{formatCurrency(item.price * item.available_quantity)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Вкладка Анализ поставок - с интерактивными кнопками */}
      {activeTab === "deliveries" && (
        <div className={styles.deliveriesContainer}>
          {/* Панель управления видимостью линий */}
          <div className={styles.deliveryLegendControls}>
            <button
              className={`${styles.deliveryLegendButton} ${deliveryVisibleLines.ожидается ? styles.activeDelivery : styles.inactiveDelivery}`}
              onClick={() => toggleDeliveryLine("ожидается")}
            >
              <span className={styles.legendDot} style={{ backgroundColor: COLORS.ожидается }}></span>
              Ожидается
            </button>
            <button
              className={`${styles.deliveryLegendButton} ${deliveryVisibleLines.доставлено ? styles.activeDelivery : styles.inactiveDelivery}`}
              onClick={() => toggleDeliveryLine("доставлено")}
            >
              <span className={styles.legendDot} style={{ backgroundColor: COLORS.доставлено }}></span>
              Доставлено
            </button>
            <button
              className={`${styles.deliveryLegendButton} ${deliveryVisibleLines.нарушение ? styles.activeDelivery : styles.inactiveDelivery}`}
              onClick={() => toggleDeliveryLine("нарушение")}
            >
              <span className={styles.legendDot} style={{ backgroundColor: COLORS.нарушение }}></span>
              Нарушение
            </button>
          </div>

          {/* Первая диаграмма - поставщики */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardTitle}>
              <span>📊 Поставки по поставщикам</span>
            </div>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={supplierStats} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 20 }}>
                  <CartesianGrid stroke="rgba(0,0,0,0.08)" horizontal={true} />
                  <XAxis type="number" tick={{ fill: "#000000", fontSize: 12 }} />
                  <YAxis type="category" dataKey="supplier_name" tick={{ fill: "#000000", fontSize: 12 }} width={100} />
                  <Tooltip contentStyle={{ background: "#f3eddd", border: "1px solid #8e8e8e", borderRadius: "10px" }} />
                  <Legend />
                  {deliveryVisibleLines.ожидается && <Bar dataKey="ожидается" fill={COLORS.ожидается} name="Ожидается" />}
                  {deliveryVisibleLines.доставлено && <Bar dataKey="доставлено" fill={COLORS.доставлено} name="Доставлено" />}
                  {deliveryVisibleLines.нарушение && <Bar dataKey="нарушение" fill={COLORS.нарушение} name="Нарушение" />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Вторая диаграмма - динамика поставок выбранного поставщика */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardTitle}>
              <span>📈 Динамика поставок</span>
              <select value={selectedSupplierId || ""} onChange={(e) => setSelectedSupplierId(Number(e.target.value))} className={styles.supplierSelect}>
                {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
              </select>
            </div>
            <div className={styles.chartArea}>
              {supplierMonthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={supplierMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#000000", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#f3eddd", border: "1px solid #8e8e8e", borderRadius: "10px" }} />
                    <Legend />
                    {deliveryVisibleLines.ожидается && <Bar dataKey="ожидается" fill={COLORS.ожидается} name="Ожидается" />}
                    {deliveryVisibleLines.доставлено && <Bar dataKey="доставлено" fill={COLORS.доставлено} name="Доставлено" />}
                    {deliveryVisibleLines.нарушение && <Bar dataKey="нарушение" fill={COLORS.нарушение} name="Нарушение" />}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>Нет данных о поставках для выбранного поставщика</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}