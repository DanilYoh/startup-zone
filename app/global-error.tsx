"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ru">
      <body>
        <main
          style={{
            margin: "0 auto",
            maxWidth: 640,
            minHeight: "100vh",
            padding: "4rem 1.25rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1>Startup Zone временно недоступен</h1>
          <p>Попробуйте загрузить приложение ещё раз. Эта страница не отправляла данные форм.</p>
          <button type="button" onClick={reset} style={{ padding: "0.6rem 1rem" }}>
            Повторить
          </button>
        </main>
      </body>
    </html>
  );
}
