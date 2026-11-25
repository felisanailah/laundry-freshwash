# Kumpulan Prompt Desain UI — Website Laundry (Google Stitch)

Dokumen ini berisi kumpulan *prompt* terstruktur yang dirancang berdasarkan skema database (`erd_website_laundry.md`) untuk menghasilkan desain antarmuka modern di **Google Stitch**.

> **Tips Penggunaan:** Salin dan tempelkan masing-masing prompt di bawah ini satu per satu ke dalam Google Stitch agar hasil generasi tiap halaman lebih fokus, detail, dan konsisten.

---

## 1. Design System & Global Style (Sertakan atau Gunakan sebagai Acuan Awal)

Gunakan arahan gaya visual ini agar seluruh layar memiliki identitas desain yang seragam:
* **Tema Warna:** *Clean & Fresh* — Dominasi putih bersih (`#FFFFFF`) dan abu-abu lembut (`#F8FAFC`), warna utama biru cerah (`#0284C7` / Sky Blue), serta aksen hijau mint (`#10B981`) untuk indikator selesai/lunas.
* **Tipografi:** Sans-serif modern yang bersih dan mudah dibaca (*Plus Jakarta Sans* atau *Inter*).
* **Gaya Komponen:** *Rounded corners* (`12px`–`16px`), bayangan halus (*soft drop shadow*), ikon garis (*outline icons*), dan tata letak responsif.

---

## 2. Prompt Halaman Utama & Lacak Cucian (Customer Landing & Order Tracking)

```text
Design a modern, clean, and trustworthy landing page and order tracking interface for an online laundry web application named "FreshWash Laundry". 

Color palette: Crisp white background, soft slate gray sections, vibrant sky blue (#0284C7) primary buttons, and mint green (#10B981) status accents. Clean sans-serif typography, rounded cards (16px radius), and subtle shadows.

Include the following sections from top to bottom:
1. Top Navigation Bar: Logo on the left, links ("Layanan", "Cara Kerja", "Cek Status", "Promo") in the center, and "Masuk" / "Pesan Sekarang" buttons on the right.
2. Hero Section with Quick Order Tracking Card: Left side has a catchy headline ("Cucian Bersih, Wangi & Rapi Tanpa Ribet") and a primary CTA button "Pesan Antar-Jemput". Right side features a floating card widget titled "Lacak Status Cucian" with an input field for Invoice Code (placeholder: "Contoh: LND-20261125-001") and a "Lacak" button.
3. Live Order Tracking Result Preview Card: Below the hero, show an active tracking result card for invoice "LND-20261125-001" featuring:
   - A 5-step horizontal progress stepper: "Dijemput" (completed) -> "Dicuci" (completed) -> "Disetrika" (active/pulsing blue) -> "Siap Diantar" (pending) -> "Selesai" (pending).
   - Order summary details: Service list ("Cuci Komplit Kiloan - 3.5 kg", "Cuci Sepatu - 1 pasang"), Total Price ("Rp 49.500"), and a green badge reading "Lunas (QRIS)".
4. Service Catalog Grid: 4 clean service cards displaying service icon, title ("Cuci Komplit Kiloan", "Cuci Setrika Ekspres 6 Jam", "Dry Clean Jas & Gaun", "Cuci Sepatu & Tas"), price per unit ("Rp 7.000 / kg", "Rp 12.000 / kg", "Rp 35.000 / pcs", "Rp 25.000 / pasang"), estimated hours badge, and a "Pilih Layanan" button.
```

---

## 3. Prompt Halaman Pemesanan Online (Customer Order & Checkout)

```text
Design a clean, user-friendly online laundry booking and checkout page for "FreshWash Laundry" using a 2-column desktop layout (Left: Order Form, Right: Sticky Order Summary).

Style: Modern SaaS / e-commerce aesthetic, white cards on a light gray (#F8FAFC) background, sky blue (#0284C7) accents, rounded corners.

Left Column (Form Steps):
1. Order Type Toggle: Two selectable pill cards — "Antar-Jemput Kurir" (selected, with delivery truck icon) and "Antar Sendiri ke Outlet" (store icon).
2. Pickup & Delivery Details: Input fields for Customer Name, WhatsApp Phone Number, Full Pickup Address textarea with a "Gunakan Lokasi Saat Ini" button, and a Date & Time picker for Pickup Schedule.
3. Service Selection: Interactive list of laundry services with minus/plus quantity steppers (e.g., "Cuci Komplit Kiloan - Rp 7.000/kg" with input "3.5 kg", "Dry Clean Jas - Rp 35.000/pcs" with input "1 pcs") and a special notes input field (placeholder: "Contoh: Pisahkan pakaian putih, alergi pewangi tajam").

Right Column (Sticky Checkout Summary):
- Card titled "Ringkasan Pesanan".
- Itemized breakdown showing quantity, unit price, and subtotal.
- Promo Code input field with an "Apply" button (showing an applied green tag "HEMAT20 - Diskon 20%").
- Final Total Price in bold large text.
- Payment Method radio cards with icons: "QRIS Instan", "Transfer Bank", "E-Wallet (GoPay/OVO/DANA)", and "Bayar di Tempat (COD)".
- Full-width primary button: "Konfirmasi & Buat Pesanan".
```

---

## 4. Prompt Halaman Kasir / Point of Sale (Admin POS Dashboard)

```text
Design a high-efficiency Point of Sale (POS) web dashboard interface for a laundry cashier ("Admin Kasir") in a 2-column split-screen layout with a compact left sidebar navigation.

Style: Clean, functional, high-contrast UI suitable for fast tablet or desktop cashier operations. White workspace, sky blue (#0284C7) active states, subtle borders.

Left Sidebar (Compact): Icons and labels for "Kasir (POS)", "Daftar Pesanan", "Antar-Jemput Kurir", "Data Pelanggan", and "Laporan Harian".

Main Workspace - Left Panel (60% width - Service Catalog):
- Top bar with search input ("Cari layanan...") and category filter tabs ("Semua", "Kiloan", "Satuan", "Ekspres", "Sepatu & Tas").
- Grid of clickable service cards. Each card shows the service name, price per unit (e.g., "Rp 7.000 / kg"), estimated turnaround time ("48 Jam"), and a subtle "+" add button.

Main Workspace - Right Panel (40% width - Active Order Cart):
- Header: "Transaksi Baru" with auto-generated invoice badge "#LND-20261125-014" and order type toggle ("Walk-In" vs "Pickup/Delivery").
- Customer Selector dropdown with a "+ Pelanggan Baru" quick-add button.
- Cart Item List: Editable decimal weight/quantity inputs (e.g., "4.2 kg" for Cuci Komplit, "2 pcs" for Bed Cover) with delete icons.
- Promo code input & Notes field.
- Payment section: Subtotal, Discount, Grand Total, Payment Status toggle ("Bayar Sekarang / Lunas" vs "Bayar Nanti / Belum Lunas"), and Payment Method selector ("Tunai / Cash", "QRIS", "Transfer").
- Bottom action buttons: "Simpan & Cetak Struk" (Primary Blue) and "Kirim Nota WA" (Outline Green).
```

---

## 5. Prompt Halaman Manajemen Status & Kurir (Admin Order Board)

```text
Design an operational order management screen for a laundry web app displaying active laundry orders in a clean tabbed table and quick-action status workflow.

Style: Clean modern admin dashboard, white background, subtle gray borders, clear color-coded status pills.

Include:
1. Top KPI Summary Strip (4 small cards): "Perlu Dijemput (4)", "Sedang Dicuci (12)", "Proses Setrika (7)", "Siap Diantar / Diambil (5)".
2. Filter & Search Bar: Search by Invoice Code or Customer Name, filter by Order Type ("Semua", "Antar-Jemput", "Walk-In"), and a primary "+ Input Order Baru" button.
3. Data Table with columns:
   - Invoice & Waktu (e.g., "LND-20261125-008" + timestamp)
   - Pelanggan & No. WA (Name + WhatsApp icon button)
   - Layanan & Berat (e.g., "Cuci Komplit (5.0 kg) + 1 item")
   - Tipe & Kurir (Badge "Antar-Jemput" + assigned courier dropdown "Budi Santoso")
   - Status Pengerjaan (Color-coded pill badges: Blue for "Dicuci", Amber for "Disetrika", Purple for "Siap Diantar", Green for "Selesai")
   - Status Pembayaran (Green pill "Lunas" or Red pill "Belum Bayar")
   - Aksi (Quick button "Update Status" with next-step arrow icon and print receipt icon).
```

---

## 6. Prompt Halaman Dashboard Owner (Analytics & Inventory)

```text
Design an executive analytics and inventory management dashboard for a laundry business owner ("Owner Dashboard").

Style: Polished, modern data visualization UI, light gray canvas (#F8FAFC) with crisp white cards, sky blue (#0284C7) and emerald green (#10B981) chart colors, and soft red (#EF4444) alert badges.

Include:
1. Header: "Dashboard Ringkasan Bisnis" with a date range filter ("Bulan Ini: November 2026") and branch selector ("Semua Cabang").
2. Top 4 KPI Metric Cards:
   - "Total Omzet Bulan Ini": "Rp 28.450.000" (+14.5% green trend badge)
   - "Total Transaksi": "642 Order" (+8.2% green trend badge)
   - "Piutang / Belum Lunas": "Rp 1.250.000" (Amber warning text)
   - "Pelanggan Aktif": "318 Pelanggan"
3. Middle Section (2 Charts):
   - Left (65% width): Smooth area/bar chart showing "Grafik Pendapatan Harian" over the last 30 days.
   - Right (35% width): Donut chart showing "Metode Pembayaran" breakdown (QRIS 48%, Cash 32%, Transfer/E-Wallet 20%).
4. Bottom Section (2 Cards):
   - Left: "Layanan Terlaris" horizontal progress bar list (Cuci Komplit Kiloan, Cuci Ekspres, Cuci Sepatu).
   - Right: "Peringatan Stok Bahan Baku" table showing items where stock is below minimum alert: "Deterjen Cair Premium (Sisa: 4 Liter - Min: 10 Liter)" with a red "Stok Menipis" badge, "Pewangi Sakura (Sisa: 3 Liter)", and "Plastik Packing 50x75 (Sisa: 2 Roll)".
```