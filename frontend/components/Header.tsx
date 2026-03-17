"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./Header.module.css";
import LoginModal from "./LoginModal";
import { useAuth } from "./AuthContext";

function formatUserName(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[1]} ${parts[0]}`;
  return name;
}

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/logo.svg"
              alt="Роспил"
              width={170}
              height={36}
              priority
              className={styles.logo}
            />
          </Link>
        </div>

        <div className={styles.right}>
          {!user ? (
            <div className={styles.authArea}>
              <button
                type="button"
                className={styles.loginButton}
                onClick={() => setIsLoginOpen(true)}
              >
                Вход
              </button>
            </div>
          ) : (
            <div className={styles.userPanel}>
              <div className={styles.userCell}>
                <span className={styles.userIcon}>◉</span>
                <span className={styles.userName}>
                  {formatUserName(user.name)}
                </span>
              </div>

              <div className={styles.roleCell}>{user.role}</div>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={logout}
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
}