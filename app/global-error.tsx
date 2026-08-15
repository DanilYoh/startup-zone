"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import styles from "./global-error.module.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body className={styles.body}>
        <main className={styles.page}>
          <section className={styles.panel} aria-labelledby="global-error-title">
            <div className={styles.brand}>
              <span className={styles.brandMark}>SZ</span>
              <span>Startup Zone</span>
            </div>
            <p className={styles.eyebrow}>Сервис временно недоступен</p>
            <h1 id="global-error-title" className={styles.title}>Не удалось открыть площадку</h1>
            <p className={styles.description}>
              Попробуйте загрузить приложение ещё раз. Эта страница не отправляла данные форм.
            </p>
            <button type="button" onClick={reset} className={styles.button}>
              Повторить
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
