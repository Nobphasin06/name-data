# 📘 Name Data API Specification
เอกสารนี้จัดทำขึ้นเพื่อให้ฝั่ง Frontend ทราบถึงวิธีการเรียกใช้งาน API ทั้งหมดของระบบ Name Data
ระบบพัฒนาด้วย Node.js (Express) + SQLite

---

## 📌 Base URL
สำหรับทดสอบรันบนเครื่องตัวเอง (Local):
`http://localhost:3000/api/names`

---

## 1. ดึงข้อมูลรายชื่อทั้งหมด (Read All)
- **Method:** `GET`
- **Endpoint:** `/api/names`
- **รายละเอียด:** ดึงข้อมูลทั้งหมดในฐานข้อมูล (เรียงจากวันที่สร้างล่าสุดไปเก่าสุด)
- **Response (200 OK):**
```json
[
  {
    "id": "1679021430000",
    "name": "สมชาย ใจดี",
    "description": "ลูกค้า VIP",
    "phone": "081-234-5678",
    "address": "กรุงเทพมหานคร",
    "createdAt": "2023-03-17T02:50:30.000Z",
    "updatedAt": "2023-03-17T02:50:30.000Z"
  }
]
```

---

## 2. เพิ่มรายชื่อใหม่ (Create)
- **Method:** `POST`
- **Endpoint:** `/api/names`
- **Request Body (JSON):**
```json
{
  "name": "สมศรี เรียนดี",
  "description": "ลูกค้าใหม่",
  "phone": "089-987-6543",
  "address": "เชียงใหม่",
  "createdAt": "2023-03-17T03:00:00.000Z" // (Optional) หากไม่ส่ง ระบบจะใช้วันที่ปัจจุบัน
}
```
- **Response (201 Created):** คืนค่าข้อมูลรายการที่เพิ่งสร้างเสร็จ (พร้อม `id` ที่ระบบสร้างให้)

---

## 3. แก้ไขข้อมูลรายชื่อ (Update)
- **Method:** `PUT`
- **Endpoint:** `/api/names/:id` *(นำ id ของรายการนั้นๆ มาต่อท้าย)*
- **Request Body (JSON):** 
*(สามารถส่งเฉพาะฟิลด์ที่ต้องการแก้ไขได้ หรือส่งมาทั้งหมดก็ได้)*
```json
{
  "name": "สมศรี เรียนดี (แก้ไขชื่อ)",
  "phone": "089-111-2222"
}
```
- **Response (200 OK):** คืนค่าข้อมูลรายการที่แก้ไขเสร็จแล้ว
- **Response (404 Not Found):** `{"message": "Name not found"}` (กรณีหา id ไม่เจอ)

---

## 4. ลบข้อมูลรายชื่อ (Delete)
- **Method:** `DELETE`
- **Endpoint:** `/api/names/:id`
- **Response (200 OK):**
```json
{
  "message": "Deleted successfully"
}
```
- **Response (404 Not Found):** `{"message": "Name not found"}`

---

## ⚠️ หมายเหตุสำหรับ Frontend
1. **CORS:** ทาง Backend ได้เปิดใช้งาน CORS ไว้แล้ว สามารถใช้ `fetch()` หรือ `axios` ยิง API จาก `localhost` หรือโดเมนอื่นได้เลยโดยไม่ติด Error
2. **รูปแบบข้อมูล:** ฟิลด์ทั้งหมดเป็นแบบ String 
3. **การจัดการวันที่:** ฟิลด์ `createdAt` และ `updatedAt` ส่งกลับเป็น ISO String (เช่น `2023-03-17T02:50:30.000Z`) แนะนำให้ Frontend นำไปแปลง format ให้สวยงามก่อนแสดงผล
