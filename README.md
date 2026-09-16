# Thuê Xe Nhanh — Web App

## 🌐 Deploy lên DirectAdmin (node.extrainfra.com)

### Bước 1: Build project
```bash
npm run build:web
```
→ Tạo ra thư mục `dist/` (chứa HTML + JS/CSS + assets + .htaccess)

### Bước 2: Upload lên DirectAdmin
1. Đăng nhập DirectAdmin → **File Manager**
2. Vào `domains/yourdomain.com/public_html/`
3. **Xóa hết** nội dung cũ trong `public_html/`
4. Upload **toàn bộ nội dung bên trong** thư mục `dist/` lên đây

Cấu trúc sau khi upload:
```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-[hash].js
    ├── vendor-[hash].js
    ├── firebase-[hash].js
    └── index-[hash].css
```

---

## 📁 Cấu trúc project

```
Web thue xe/
├── src/                  # Source code React
│   ├── App.jsx           # Toàn bộ logic + UI (~3900 dòng)
│   ├── firebase.js       # Firebase config
│   ├── styles.css        # CSS toàn cục
│   └── main.jsx          # Entry point
├── public/               # Static assets (copy vào dist khi build)
│   ├── .htaccess         # Apache SPA routing + cache + security
│   ├── icon.svg          # App icon
│   └── manifest.json     # PWA manifest
├── dist/                 # OUTPUT: upload thư mục này lên DirectAdmin
├── dist-offline/         # Temp folder cho build offline
├── preview_offline.html  # Single-file HTML để test offline
├── vite.config.js        # Config build chuẩn (multi-file)
├── vite.config.offline.js# Config build offline (single-file)
├── copy-build.js         # Script post-build
└── package.json
```

---

## 📦 Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Dev server local |
| `npm run build:web` | Build để deploy lên DirectAdmin → `dist/` |
| `npm run build:offline` | Build file offline → `preview_offline.html` |
| `npm run build` | Build cả hai |
| `npm run preview` | Preview build local |

---

## ⚙️ Firebase — Authorized Domains

Sau khi deploy xong, thêm domain vào Firebase Console:
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Thêm: `yourdomain.com`

---

## 🔑 Firestore Rules (mới nhất)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'huynhbaogia.le@gmail.com' ||
        request.auth.token.email == 'brandon.gia96@gmail.com'
      );
    }

    match /cars/{carId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (request.auth.uid == resource.data.ownerId || isAdmin());
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null;
      allow delete: if isAdmin();
    }

    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read, update, delete: if isAdmin();
    }
  }
}
```
