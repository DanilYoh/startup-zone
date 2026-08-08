"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
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
          <h1>Startup Zone is temporarily unavailable</h1>
          <p>Try loading the application again. No form data was submitted by this error page.</p>
          <button type="button" onClick={reset} style={{ padding: "0.6rem 1rem" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
