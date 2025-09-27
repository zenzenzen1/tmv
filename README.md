# FVC Management System (FVMS)

A comprehensive management system consisting of a Spring Boot backend API and a React TypeScript frontend application.

## 🏗️ Project Structure

```
fvcms/
├── fvc-api/          # Spring Boot Backend API
│   ├── src/
│   │   ├── main/java/sep490g65/fvcapi/
│   │   │   ├── constants/     # API constants and messages
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── enums/         # Enumerations
│   │   │   ├── exception/     # Exception handling
│   │   │   └── utils/         # Utility classes
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
└── fvc-frontend/     # React TypeScript Frontend
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── config/        # Configuration files
    │   ├── hooks/         # Custom React hooks
    │   ├── services/      # API services
    │   ├── stores/        # Zustand state management
    │   ├── types/         # TypeScript type definitions
    │   └── utils/         # Utility functions
    ├── package.json
    └── vite.config.ts
```

## 🚀 Tech Stack

### Backend (fvc-api)
- **Java 17+**
- **Spring Boot 3.x**
- **Spring Data JPA**
- **Spring Security**
- **Maven**
- **H2/PostgreSQL** (Database)

### Frontend (fvc-frontend)
- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Material-UI (MUI)**
- **Zustand** (State Management)
- **Axios** (HTTP Client)

## 🛠️ Getting Started

### Prerequisites

- **Java 17+**
- **Node.js 18+**
- **Maven 3.6+**
- **npm or yarn**

### Backend Setup

```bash
# Navigate to backend directory
cd fvc-api

# Install dependencies
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend API will be available at: `http://localhost:8080`

### Frontend Setup

```bash
# Navigate to frontend directory
cd fvc-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend application will be available at: `http://localhost:3000`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Health Check
- `GET /api/health` - Application health status
- `GET /api/version` - Application version

## 🔧 Configuration

### Backend Configuration

Create `application.properties` in `fvc-api/src/main/resources/`:

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/api

# Database Configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA Configuration
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# H2 Console (Development only)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Logging
logging.level.sep490g65.fvcapi=DEBUG
```

### Frontend Configuration

Create `.env` file in `fvc-frontend/`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start Backend:**
   ```bash
   cd fvc-api
   mvn spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   cd fvc-frontend
   npm run dev
   ```

3. **Access Applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api
   - H2 Console: http://localhost:8080/h2-console

### Production Build

1. **Build Backend:**
   ```bash
   cd fvc-api
   mvn clean package
   java -jar target/fvc-api-*.jar
   ```

2. **Build Frontend:**
   ```bash
   cd fvc-frontend
   npm run build
   npm run preview
   ```

## 🧪 Testing

### Backend Tests
```bash
cd fvc-api
mvn test
```

### Frontend Tests
```bash
cd fvc-frontend
npm test
```

## 📦 Deployment

### Docker Deployment

1. **Backend Dockerfile:**
   ```dockerfile
   FROM openjdk:17-jdk-slim
   COPY target/fvc-api-*.jar app.jar
   EXPOSE 8080
   ENTRYPOINT ["java", "-jar", "/app.jar"]
   ```

2. **Frontend Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   EXPOSE 80
   ```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./fvc-api
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker

  frontend:
    build: ./fvc-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

## 🔒 Security

- **JWT Authentication** for API access
- **CORS Configuration** for cross-origin requests
- **Input Validation** on all endpoints
- **Error Handling** with proper HTTP status codes

## 📚 Documentation

- **Backend API Documentation:** Available at `/api/docs` (Swagger/OpenAPI)
- **Frontend Documentation:** See `fvc-frontend/README.md`
- **Database Schema:** Available in `fvc-api/src/main/resources/schema.sql`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the established code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Kill process on port 8080
   lsof -ti:8080 | xargs kill -9
   ```

2. **Node Modules Issues:**
   ```bash
   cd fvc-frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Maven Build Issues:**
   ```bash
   cd fvc-api
   mvn clean install -U
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Development:** Spring Boot Team
- **Frontend Development:** React TypeScript Team
- **DevOps:** Infrastructure Team

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in each sub-project

---

**Happy Coding! 🚀**
