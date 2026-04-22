# 🏸 羽球揪團 PWA

和朋友找共同有空的時間，一起預約貓羅羽球館！

---

## 部署步驟（全部免費）

### 第一步：建立 Supabase 資料庫

1. 到 [supabase.com](https://supabase.com) 註冊免費帳號
2. 點 **New Project**，填入名稱，設定密碼
3. 等待建立完成（約1分鐘）
4. 左側選 **SQL Editor**
5. 把 `supabase_schema.sql` 的內容全部貼上，點 **Run**
6. 左側選 **Settings → API**，複製：
   - `Project URL`
   - `anon public` key

### 第二步：上傳到 GitHub

1. 到 [github.com](https://github.com) 建立新 Repository（名稱隨意）
2. 把這整個資料夾上傳上去（或用 git push）

### 第三步：部署到 Vercel

1. 到 [vercel.com](https://vercel.com) 用 GitHub 帳號登入
2. 點 **Add New Project**，選你剛建的 Repository
3. 在 **Environment Variables** 加入：
   - `REACT_APP_SUPABASE_URL` = 你的 Project URL
   - `REACT_APP_SUPABASE_ANON_KEY` = 你的 anon key
4. 點 **Deploy**，等約2分鐘
5. 完成！Vercel 會給你一個網址，例如 `https://badminton-xxx.vercel.app`

### 讓朋友加入主畫面（PWA）

iPhone：用 Safari 開啟網址 → 點分享按鈕 → **加入主畫面**
Android：用 Chrome 開啟網址 → 點選單 → **新增至主畫面**

---

## 使用方式

1. **發起球局**：設定名稱和日期範圍，複製連結傳給朋友
2. **朋友加入**：點連結，輸入暱稱，勾選有空的日期和時段
3. **看結果**：自動顯示大家重疊的時間，排序最多人有空的
4. **預約球場**：選定時段，一鍵跳轉到貓羅羽球館預約頁面

---

## 技術架構

- **前端**：React PWA
- **後端/資料庫**：Supabase（PostgreSQL）
- **部署**：Vercel
- **球場**：貓羅羽球館 (vip.hengfu-i.com)
