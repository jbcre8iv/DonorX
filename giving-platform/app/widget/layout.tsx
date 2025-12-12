import "@/app/globals.css";

export const metadata = {
  title: "Donation Widget",
};

// Standalone layout for widget - no header/footer
export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  );
}
