# PROJECT — NCA (Quản lý nhu cầu đặt ảnh)

## Mục tiêu

Web nội bộ giúp công ty quản lý nhu cầu đặt ảnh từ các nguồn thu thập ảnh (vệ tinh, UAV, hàng không) một cách khoa học, dễ mở rộng.

## Bối cảnh

Công ty có nhiều nguồn cung cấp ảnh (vệ tinh, UAV, hàng không). Mỗi nhu cầu đặt ảnh gắn với một mục tiêu quan sát và một nguồn cụ thể, có địa bàn, toạ độ, loại ảnh, độ phân giải, và các mốc thời gian (đặt, chụp, trả). Nhu cầu chia 2 loại:

- **Cố định (CO_DINH)**: có thời gian chụp cụ thể.
- **Đột xuất (DOT_XUAT)**: chỉ có khoảng thời gian mong muốn chụp (từ → đến).

## Thực thể & trường dữ liệu

### 1. Nguồn (đối tượng cung cấp ảnh)

| Trường           | Kiểu            | Ghi chú                                              |
| ---------------- | --------------- | ---------------------------------------------------- |
| `id`             | Int (PK, auto)  |                                                      |
| `nguon`          | String          | loại nguồn: `"vệ tinh"` \| `"UAV"` \| `"hàng không"` |
| `tenNguon`       | String (unique) | tên định danh nguồn                                  |
| `thoiGianSuDung` | String          | khoảng thời gian bắt đầu - kết thúc, lưu dạng chuỗi  |
| `tinhTrang`      | Enum            | `HOAT_DONG` \| `BAO_TRI` \| `NGUNG_HOAT_DONG`        |
| `danhGia`        | String?         | text tự do về chất lượng nguồn                       |

### 2. Mục tiêu (đối tượng cần chụp)

| Trường | Kiểu            | Ghi chú      |
| ------ | --------------- | ------------ |
| `id`   | Int (PK, auto)  |              |
| `ten`  | String (unique) | tên mục tiêu |

### 3. Nhu cầu ảnh (thực thể trung tâm)

| Trường                | Kiểu               | Ghi chú                                                                                                          |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `id`                  | Int (PK, auto)     |                                                                                                                  |
| `mucTieuId`           | Int (FK → MucTieu) |                                                                                                                  |
| `nguonId`             | Int (FK → Nguon)   |                                                                                                                  |
| `loaiNhuCau`          | Enum               | `CO_DINH` \| `DOT_XUAT`                                                                                          |
| `diaBan`              | String             | khu vực địa lý                                                                                                   |
| `loaiAnhChup`         | Enum               | `QUANG_HOC` \| `HONG_NGOAI` \| `SAR` \| `DA_PHO` \| `SIEU_PHO` \| `NHIET` \| `VIDEO`                             |
| `toaDoX`              | Float              | kinh độ / hoành độ                                                                                               |
| `toaDoY`              | Float              | vĩ độ / tung độ                                                                                                  |
| `thoiGianDat`         | DateTime           | thời điểm tạo nhu cầu (auto `now()`)                                                                             |
| `thoiGianChup`        | DateTime?          | bắt buộc khi `CO_DINH`, `undefined` khi `DOT_XUAT`                                                               |
| `thoiGianMongMuonTu`  | DateTime?          | bắt buộc khi `DOT_XUAT`, `undefined` khi `CO_DINH`                                                               |
| `thoiGianMongMuonDen` | DateTime?          | bắt buộc khi `DOT_XUAT`, `undefined` khi `CO_DINH`                                                               |
| `thoiGianTra`         | DateTime?          | thời điểm trả ảnh                                                                                                |
| `doPhanGiai`          | String             | ví dụ `"0.5m"`, `"1m"`                                                                                           |
| `trangThai`           | Enum               | `CHO_DUYET` \| `DA_DUYET` \| `DA_PHAN_CONG` \| `DANG_CHUP` \| `DA_CHUP` \| `DA_TRA_ANH` \| `TU_CHOI` \| `DA_HUY` |
| `moTa`                | String?            | mô tả tự do                                                                                                      |

### 4. Nhu cầu ảnh lịch sử (audit trail)

| Trường         | Kiểu                 | Ghi chú                           |
| -------------- | -------------------- | --------------------------------- |
| `id`           | Int (PK, auto)       |                                   |
| `nhuCauId`     | Int (FK → NhuCauAnh) |                                   |
| `trangThaiCu`  | Enum?                | `null` nếu là trạng thái đầu tiên |
| `trangThaiMoi` | Enum                 | trạng thái mới                    |
| `thoiGian`     | DateTime             | thời điểm chuyển                  |
| `ghiChu`       | String?              |                                   |

## Workflow trạng thái nhu cầu

```
CHO_DUYET ──(duyệt)──▶ DA_DUYET ──(phân công)──▶ DA_PHAN_CONG ──(bắt đầu chụp)──▶ DANG_CHUP ──(chụp xong)──▶ DA_CHUP ──(trả ảnh)──▶ DA_TRA_ANH
     │                                                                                                                  │
     └──(từ chối)──▶ TU_CHOI                                                                                       DA_HUY ◀──(hủy, từ DA_DUYET/DA_PHAN_CONG/DANG_CHUP)
```

Quy tắc: không cho quay lui trạng thái (trừ `DA_HUY` từ các trạng thái đang xử lý). Mỗi lần chuyển trạng thái, tạo bản ghi `NhuCauAnhLichSu` mới.

## Vai trò người dùng

- **1 admin** duy nhất, nhập/xem/quản lý tất cả. Không có authentication (web nội bộ tin cậy).

## Phạm vi MVP

1. CRUD Mục tiêu
2. CRUD Nguồn
3. CRUD Nhu cầu ảnh (form conditional theo `loaiNhuCau`)
4. List + filter Nhu cầu ảnh (theo trạng thái, nguồn, mục tiêu, loại)
5. Workflow cập nhật trạng thái (có lưu lịch sử)
6. Trang tổng quan: đếm nhu cầu theo trạng thái / theo nguồn
7. Search, pagination, export CSV

## Ngoài phạm vi (chưa làm trong MVP)

- Authentication / phân quyền
- Bản đồ hiển thị toạ độ
- Thanh toán
- Thông báo email/SMS
- Multi-tenant
