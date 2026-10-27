"use client";

// Last-resort boundary: replaces the root layout, so it carries its own minimal dark styling.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#080F1D", color: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
        <div role="alert" style={{ textAlign: "center", padding: 24, maxWidth: 480 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>TrustLens hit an unexpected error</h1>
          <p style={{ color: "#94A3B8", lineHeight: 1.6 }}>Please try again. Nothing you submitted was stored.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, border: 0, background: "#2DD4BF", color: "#042F2E", fontWeight: 600, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
