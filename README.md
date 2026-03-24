# 🎓 Campus-Help Desk

Campus-Help Desk is a modern web-based campus issue management system that allows students and staff to report campus problems and enables administrators to manage, track, approve, and resolve them efficiently through a centralized dashboard.

This system improves campus maintenance, transparency, and communication between students, staff, and administration.

---

## 🚀 Key Features

### 👤 Role-Based Access Control

The system supports three user roles:

**🎓 Student**
- Register and login securely
- Report campus issues
- Upload issue images
- Track issue status in real time

**👔 Staff**
- Login securely
- Report campus issues
- Track reported issues

**🛡️ Admin**
- Full system control
- Manage students and staff
- Add / delete users
- Activate / deactivate accounts
- Approve or reject issues
- View analytics and statistics
- Track all system activity

---

## 📋 Campus Issue Management

Users can report various campus issues such as:

- Classroom Issues
- Hostel Issues
- Laboratory Issues
- IT Support Problems
- Library Issues
- Internet / WiFi Issues
- Electrical Problems
- Cleanliness Issues
- Infrastructure Issues
- Other Campus Problems

Each issue contains:

- Unique Issue ID
- Category
- Description
- Department
- Location (Building and Room)
- Priority Level
- Image Upload Support
- Status Tracking
- Timestamp Information

---

## 🔄 Issue Workflow
Submitted → Pending Approval → Approved → In Progress → Resolved → Closed


Admin controls approval, assignment, and resolution.

---

## 📊 Admin Dashboard Features

Admin dashboard provides:

- Total Issues
- Pending Issues
- In Progress Issues
- Resolved Issues
- Total Students
- Total Staff

Analytics include:

- Pie Charts (User Distribution)
- Bar Charts (Issue Statistics)
- Category-wise Issue Analysis

---

## 👥 User Management

Admin can fully manage users:

- View all students and staff
- Register new students or staff
- Delete users
- Activate / deactivate accounts
- Track user registrations
- Monitor account activity

---

## 🛠️ Technology Stack

### Frontend
- React.js
- CSS3
- Axios
- React Router
- Context API
- Recharts

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcrypt Password Hashing
- JSON-based Storage

---

## 📂 Project Structure



## 📂 Project Structure

```
complaint-system/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── Footer.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── CreateComplaintPage.js
│   │   │   ├── ComplaintDetailPage.js
│   │   │   ├── AdminDashboardPage.js
│   │   │   ├── ProfilePage.js
│   │   │   └── NotFoundPage.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── complaintController.js
│   │   └── notificationController.js
│   ├── models/
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── complaintRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── authorization.js
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── services/
│   │   ├── userService.js
│   │   ├── complaintService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── jwtToken.js
│   │   ├── passwordHash.js
│   │   ├── idGenerator.js
│   │   └── validators.js
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── database/
│   └── schema.sql
│
└── docs/
    ├── API.md
    ├── SETUP.md
    └── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   cd complaint-system/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - Database credentials
   - JWT secret
   - Email configuration
   - Port settings

4. **Setup database**
   ```bash
   psql -U postgres -d postgres -f ../database/schema.sql
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```
   
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd complaint-system/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the React application**
   ```bash
   npm start
   ```
   
   App runs on `http://localhost:3000`

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🔐 Security

The application implements multiple security layers:

1. **Authentication**: JWT-based token system with 7-day expiration
2. **Password Security**: Bcrypt hashing with salt rounds
3. **Input Validation**: Server-side validation of all inputs
4. **XSS Protection**: Sanitization of user inputs
5. **CSRF Protection**: Token-based validation
6. **SQL Injection Prevention**: Parameterized queries with pg library
7. **Rate Limiting**: Brute force protection on auth endpoints
8. **CORS**: Configured for frontend-backend communication
9. **Security Headers**: Helmet.js middleware
10. **RBAC**: Role-based access control on all protected routes



## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Create a new branch for your feature
2. Write clean, commented code
3. Test thoroughly before submitting
4. Create a pull request with detailed description

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For issues, questions, or suggestions:
- Email: support@civiccomplaints.com
- Phone: +1-800-COMPLAINT
- GitHub Issues: [Create an issue]

## 👥 Team

- **DevOps Engineer**: Harshal Chikhale
