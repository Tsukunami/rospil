"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import { useAuth } from "./AuthContext";

type MenuItem = {
  label: string;
  href: string;
  accessList: string[];
};

const menuItems: MenuItem[] = [
  {
    label: "Выбор поставщиков",
    href: "/suppliers",
    accessList: ["1", "4", "5"],
  },
  {
    label: "Заключение договоров",
    href: "/contracts",
    accessList: ["1", "3", "4", "5"],
  },
  {
    label: "Поставка и приемка сырья",
    href: "/deliver",
    accessList: ["2", "4", "5"],
  },
  {
    label: "Расчеты с поставщиками",
    href: "/payments",
    accessList: ["3", "4", "5"],
  },
  {
    label: "Статистика",
    href: "/statistics",
    accessList: ["1", "3", "4", "5"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const currentAccess = user?.access || "0";

  const filteredMenuItems = menuItems.filter((item) =>
    item.accessList.includes(currentAccess)
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.inner}>
        {filteredMenuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.menuButton} ${isActive ? styles.active : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}