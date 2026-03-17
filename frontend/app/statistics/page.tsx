"use client";

import { useMemo, useState } from "react";
import styles from "./StatisticsPage.module.css";
import data from "@/data/statistics.json";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type StatsPoint = {
  date: string;
  done: number;
  progress: number;
};

type StatsKey = "orders" | "documents" | "contracts" | "materials" | "income";

const chartLabels: Record<StatsKey, string> = {
  orders: "Все заказы",
  documents: "Документооборот",
  contracts: "Договоры",
  materials: "Расход материала",
  income: "Доход",
};

const sidebarItems: { key: StatsKey; label: string }[] = [
  { key: "orders", label: "Заказы" },
  { key: "documents", label: "Документооборот" },
  { key: "contracts", label: "Договоры" },
  { key: "materials", label: "Расход материала" },
  { key: "income", label: "Доход" },
];

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const months: Record<string, string> = {
    "01": "Январь",
    "02": "Февраль",
    "03": "Март",
    "04": "Апрель",
    "05": "Май",
    "06": "Июнь",
    "07": "Июль",
    "08": "Август",
    "09": "Сентябрь",
    "10": "Октябрь",
    "11": "Ноябрь",
    "12": "Декабрь",
  };

  return `${months[month]} ${year}`;
}

function sumByKey(data: StatsPoint[], key: "done" | "progress") {
  return data.reduce((acc, item) => acc + item[key], 0);
}

export default function StatisticsPage() {
  const [activeChart, setActiveChart] = useState<StatsKey>("orders");
  const [fromDate, setFromDate] = useState("2026-01-22");
  const [toDate, setToDate] = useState("2026-01-22");

  const chartData = useMemo(() => {
    return data[activeChart] as StatsPoint[];
  }, [activeChart]);

  const totalDone = useMemo(() => sumByKey(chartData, "done"), [chartData]);
  const totalProgress = useMemo(
    () => sumByKey(chartData, "progress"),
    [chartData]
  );

  return (
    <div className={styles.page}>
      <div className={styles.topControls}>
        <div className={styles.periodBlock}>
          <span className={styles.periodLabel}>Период</span>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={styles.dateInput}
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <select
          className={styles.select}
          value={activeChart}
          onChange={(e) => setActiveChart(e.target.value as StatsKey)}
        >
          {sidebarItems.map((item) => (
            <option key={item.key} value={item.key}>
              {chartLabels[item.key]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.content}>
        <div className={styles.chartPanel}>
          <div className={styles.chartTitle}>{chartLabels[activeChart]}</div>

          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
<CartesianGrid stroke="rgba(0,0,0,0.08)" vertical={false} />
<XAxis
  dataKey="date"
  tickFormatter={formatMonthLabel}
  tick={{ fill: "#000000", fontSize: 12 }}
  axisLine={{ stroke: "#000000" }}
  tickLine={{ stroke: "#000000" }}
/>
<YAxis
  tick={{ fill: "#000000", fontSize: 12 }}
  axisLine={{ stroke: "#000000" }}
  tickLine={{ stroke: "#000000" }}
/>
<Tooltip
  contentStyle={{
    background: "#f3eddd",
    border: "1px solid #8e8e8e",
    borderRadius: "10px",
    color: "#000",
  }}
  labelStyle={{ color: "#000" }}
/>
                <Line
                  type="monotone"
                  dataKey="done"
                  stroke="#7be08a"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#7be08a" }}
                  activeDot={{ r: 6 }}
                  name="Выполнено"
                />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#ff5b57"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#ff5b57" }}
                  activeDot={{ r: 6 }}
                  name="В процессе"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.sidebarPanel}>
          <div className={styles.tabs}>
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.tabButton} ${
                  activeChart === item.key ? styles.tabButtonActive : ""
                }`}
                onClick={() => setActiveChart(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.legendBox}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.green}`} />
              <span>Выполнено: {totalDone.toLocaleString("ru-RU")}</span>
            </div>

            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.red}`} />
              <span>В процессе: {totalProgress.toLocaleString("ru-RU")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}