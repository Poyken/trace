# 🛡️ VINATECH MES OPERATIONS WEB PORTAL (VERCEL DEPLOYMENT GUIDE)

> **Tác giả:** Nguyen Van Duc (`vanduc` - EA Team)  
> **Nền tảng:** Next.js 16 (Turbopack) • React 19 • Tailwind CSS • Vercel Free Tier

---

## 1. TỔNG QUAN HỆ THỐNG

Web Portal thay thế hoàn toàn trải nghiệm chật hẹp, bị động của Telegram Bot bằng một giao diện điều hành sản xuất hiện đại chuẩn Enterprise:
- 💬 **AI Operations Copilot:** Tự động chẩn đoán lỗi theo chuẩn **"4 Dòng Vàng"** (Root Cause, Status, Workaround, Hotfix SQL).
- 📊 **Real-time Live Dashboard:** Giám sát thời gian thực WIP 24h, tắc nghẽn đồng bộ POP ➔ MES (`MongoToMesPerformance`), thiết bị kẹt khóa `ACTIVE`.
- 🔍 **1-Shot Diagnostics Suite:**
  - *Trace 360°:* Visual Timeline vòng đời Lot, thiết bị, sản lượng OK/NG.
  - *BOM & Tồn kho:* Đối soát tồn kho khả dụng `ROUTE_VN_WH` vs `MAIN_VN_WH`.
  - *PackingID & Tem nhãn:* Kiểm tra khóa in tem `IsPrintAllow`, số lần in.
  - *Nhân sự 5 CSDL:* Ma trận phân quyền trên ERP NEOE, Kiosk POP, SmartFramework, Groupware, SSO.
- ⚡ **Hotfix & Deploy Console:** Sinh mã SQL bọc Transaction an toàn (`BEGIN TRAN...ROLLBACK`), định danh `vanduc`.

---

## 2. HƯỚNG DẪN DEPLOY LÊN VERCEL (HOÀN TOÀN MIỄN PHÍ)

### Bước 1: Đẩy mã nguồn lên GitHub (Private Repo)
Mở PowerShell tại thư mục `MES_POP/web`:
```powershell
cd "c:\Users\User Vinatech.DESKTOP-RJJSEQU\Desktop\PROCESS\MES_POP\web"
git init
git add .
git commit -m "feat: Vinatech MES Operations Web Portal"
git branch -M main
git remote add origin https://github.com/<your-username>/vinatech-mes-portal.git
git push -u origin main
```

### Bước 2: Import vào Vercel
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Bấm **Add New...** ➔ **Project**.
3. Chọn repository `vinatech-mes-portal`.
4. Giữ nguyên các thiết lập mặc định (Framework Preset: **Next.js**).
5. Bấm **Deploy**. Sau ~45 giây, Vercel sẽ cấp cho anh một đường link HTTPS bảo mật tốc độ cao (ví dụ: `https://vinatech-mes-portal.vercel.app`).

### Bước 3: Cấu hình Biến Môi Trường (Environment Variables) trên Vercel
Tại trang quản trị dự án trên Vercel: **Settings** ➔ **Environment Variables**:
- `GEMINI_API_KEY`: Khóa API Gemini (để AI Copilot sinh phản hồi theo thời gian thực).
- `MES_RELAY_URL`: URL Cloudflare Tunnel trỏ về máy tính nội bộ (xem mục 3).
- `MES_RELAY_SECRET`: `vinatech_secret_token_2026`

---

## 3. CẦU NỐI CSDL NỘI BỘ (HYBRID CLOUDFLARE TUNNEL)

Hệ thống cho phép Web Portal trên Vercel đọc dữ liệu trực tiếp từ 15 CSDL tại nhà máy mà **không cần mở bất kỳ cổng firewall nào**:

1. **Khởi động API Relay nội bộ:**
```powershell
python "c:\Users\User Vinatech.DESKTOP-RJJSEQU\Desktop\PROCESS\MES_POP\tools\api_relay.py"
```
2. **Khởi tạo đường hầm Cloudflare Tunnel:**
```powershell
cloudflared tunnel --url http://localhost:5000
```
3. Copy URL do Cloudflare sinh ra (dạng `https://xyz.trycloudflare.com`) dán vào biến `MES_RELAY_URL` trên Vercel.

---

## 4. CHẠY THỬ NGHIỆM LOCAL TRÊN MÁY TÍNH
```powershell
cd "c:\Users\User Vinatech.DESKTOP-RJJSEQU\Desktop\PROCESS\MES_POP\web"
npm run dev
```
Truy cập: `http://localhost:3000`
