# Civic Complaint Management System

A comprehensive web-based civic complaint management system that enables citizens to report municipal issues and track their resolution through a centralized platform.


# To Run The Project
git clone <your-repo-url>
cd complaint-system/backend
npm install
node server.js

cd ../frontend
npm install
npm start

## 🎯 Features

### User Authentication & Authorization
- User registration and login with JWT tokens
- Role-based access control (Citizen, Admin, Department Officer)
- Secure password hashing with bcrypt
- Session management

### Complaint Management
- Register complaints with:
  - Category (Garbage, Road, Water, Electricity, Drainage, Public Safety, Other)
  - Detailed description
  - Image upload capability
  - Geographic location (latitude & longitude)
  - Auto-generated complaint ID
- Complaint lifecycle: Submitted → Assigned → In Progress → Resolved → Closed
- Real-time status tracking
- Complaint history and updates

### Admin & Department Dashboard
- View all complaints with advanced filtering
- Filter by: Status, Category, Department, Date, Priority
- Assign complaints to departments
- Update resolution status
- View statistics and analytics

### Notifications
- Email notifications on complaint submission
- Status update notifications
- Resolution confirmation emails
- In-app notification system

### Security Features
- Input validation and sanitization
- Protection against SQL Injection, XSS, CSRF
- Rate limiting on authentication endpoints
- Helmet.js for security headers
- CORS configuration

## 🛠️ Technical Stack

### Frontend
- **Framework**: React.js (v18)
- **Styling**: CSS3 with responsive design
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Notifications**: React-Toastify

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

### Database
- PostgreSQL with connection pooling
- Automated timestamp management
- Optimized indexes for performance

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

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Complaints
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints` - Get all complaints (with filters)
- `GET /api/complaints/:id` - Get complaint details
- `GET /api/complaints/:id/history` - Get complaint history
- `PUT /api/complaints/:id/status` - Update complaint status (Admin/Officer)
- `POST /api/complaints/:id/updates` - Add complaint update
- `GET /api/complaints/stats/overview` - Get statistics

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

## 📊 Database Schema

### Users Table
- Stores user information with roles (citizen, admin, department_officer)
- Password hashing for security
- Profile tracking

### Complaints Table
- Main complaint records with auto-generated ID
- Category, priority, and status tracking
- Location data (lat/long)
- Assignment to departments

### Complaint_Updates Table
- Tracks all status changes and updates
- Maintains complaint history
- User and timestamp audit trail

### Notifications Table
- Stores notifications for users
- Read/unread status
- Tracks email sending

### Departments Table
- Lists all departments
- Contact information

## 🧪 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@example.com | Password123! |
| Admin | admin@example.com | Admin123! |

## 📈 Future Enhancements

- AI-based complaint categorization
- Predictive analytics for resolution times
- Chatbot integration for instant support
- Mobile app version (iOS/Android)
- Multilingual support
- Advanced mapping with heat maps
- SMS notifications
- Payment integration for premium services
- Document upload capabilities
- Integration with external APIs (weather, traffic, etc.)

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


---

**Last Updated**: January 18, 2026
