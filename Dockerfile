FROM node:20-alpine

# กำหนด working directory เป็น /app
WORKDIR /app

# คัดลอก package.json ของ backend เข้ามาก่อนเพื่อ install dependencies (ช่วยเรื่อง Caching)
COPY backend/package*.json ./backend/

# เข้าไปที่โฟลเดอร์ backend และรัน npm install (ติดตั้งเฉพาะ dependencies สำหรับ production)
WORKDIR /app/backend
RUN npm install --omit=dev

# กลับมาที่ /app และคัดลอกไฟล์ทั้งหมดของทั้ง frontend และ backend เข้ามาใน container
WORKDIR /app
COPY frontend ./frontend
COPY backend ./backend

# สลับกลับไปที่ backend เพื่อรัน server
WORKDIR /app/backend

# เปิดพอร์ต 3000
EXPOSE 3000

# คำสั่งเริ่มต้นรันเซิร์ฟเวอร์
CMD ["npm", "start"]
