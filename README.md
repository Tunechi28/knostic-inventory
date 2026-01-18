# Inventory Management System

A full-stack TypeScript inventory management system built with NestJS backend and React frontend.

## Quick Start

```bash
# Start the entire system
docker compose up --build

# Backend API will be available at: http://localhost:4000
# Frontend will be available at: http://localhost:3000
```

## System Overview

This application provides a complete inventory management solution with stores, products, and stock tracking.

## API Overview

### Core Resources

**Stores**
- `GET /api/stores` - List all stores (paginated, searchable)
- `POST /api/stores` - Create new store
- `GET /api/stores/:id` - Get store details
- `PATCH /api/stores/:id` - Update store
- `GET /api/stores/:id/inventory-value` - Calculate total inventory value
- `GET /api/stores/:id/products` - Get store products (filtered, paginated)

**Products**
- `GET /api/products` - List all products (filtered, paginated)
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/stock` - Update stock levels
- `GET /api/products/:id/history` - Get stock movement history

**Authentication**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - New user registration

### Key Features

1. **Inventory Aggregation**: Real-time calculation of total inventory value per store with category breakdown
2. **Stock Management**: Track stock movements with transaction history
3. **Advanced Filtering**: Search products by name, category, store, or low stock status
4. **Pagination**: All list endpoints support pagination for performance
5. **Input Validation**: Comprehensive DTO validation with proper error responses
6. **Seed Data**: Automatic database seeding with sample stores and products

## Project Structure

```
├── apps/
│   ├── api/                 # NestJS backend application
│   ├── consumer/           # Background task processor
│   └── frontend/           # React frontend application
├── libs/
│   ├── inventory/          # Core inventory business logic
│   ├── persistance/        # Database entities and repositories
│   ├── auth/              # Authentication module
│   └── common/            # Shared utilities and services
```

## Technology Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Validation**: Class-validator & class-transformer
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Caching**: Redis
- **Message Queue**: Apache Kafka

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Styling**: CSS modules with responsive design
- **State Management**: React hooks (no external store needed)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: NX monorepo with hot reload
- **Database**: PostgreSQL 16

## Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Local Deployment

```bash
# Clone repository
git clone <repository>
cd inventory-app

# Start infrastructure services
docker compose up --build -d
```

### Run Tests
```bash
npm install
npm run test
```

### Demo Credentials

On the frontend you can click on any demo account and the credential will be populated on the login page

```
Email: store1@example.com | Password: password123
Email: store2@example.com | Password: password123
Email: store3@example.com | Password: password123
```

## Key Decisions & Trade-offs

### 1. NX Monorepo Architecture
**Decision**: Using NX as the build system and monorepo management tool
**Rationale**:
- **Code Sharing**: Enables seamless sharing of TypeScript types, utilities, and business logic between frontend, backend, and consumer apps without publishing packages
- **Affected Commands**: NX intelligently determines which projects are affected by changes, reducing CI/CD build times
- **Dependency Graph**: Visualizes project dependencies, making architecture decisions transparent
- **Consistent Tooling**: Unified configuration for linting, testing, and building across all projects
- **Caching**: Local and remote caching of build artifacts speeds up development and CI

**Trade-offs**:
- **Learning Curve**: Developers unfamiliar with NX need time to understand project structure and commands
- **Configuration Complexity**: Initial setup requires understanding NX's project.json and workspace configuration
- **Tooling Lock-in**: Migrating away from NX would require significant restructuring

**Alternatives Considered**:
- **Turborepo**: Similar features but less mature NestJS/Node support
- **Lerna**: Older tool, less feature-rich for build optimization
- **Separate Repos**: Would require package publishing and versioning overhead

### 2. Layered Architecture
**Decision**: Maintained a layered architecture (controllers → services → repositories)
**Rationale**: Clean separation of concerns and testability
**Trade-off**: Additional boilerplate but better maintainability

### 3. Database Schema
**Decision**: Relational schema with User → Store → Products hierarchy
**Rationale**: Clear ownership model for inventory items
**Trade-off**: Join-heavy queries but maintains data integrity

### 4. Frontend Technology Choice
**Decision**: React with TypeScript over server-side rendering
**Rationale**: Provides rich interactivity for inventory management workflows
**Trade-off**: Additional client-side complexity but better user experience

### 5. Seed Data Strategy
**Decision**: Automatic seeding on application startup
**Rationale**: Immediate demonstration value without manual setup
**Trade-off**: Not production-ready (should be environment-controlled)

### 6. Authentication Approach
**Decision**: JWT authentication system
**Rationale**: Proven implementation with proper security patterns
**Trade-off**: More complex than basic auth but production-ready

## Testing Approach

### Current Implementation
- **Unit Tests**: Core business logic in services
- **Integration Tests**: API endpoints with test database
- **Component Tests**: React components with React Testing Library

### Testing Strategy
```bash
# Run all tests
npm run test

# Run specific library tests
npm run test:inventory
npm run test:auth
```

### Test Coverage Focus
1. **Business Logic**: Inventory calculations, stock movements
2. **Validation**: DTO validation rules and error handling
3. **Authorization**: User access control for stores/products
4. **Database Operations**: Entity relationships and constraints

## Production Considerations

### Security
- JWT tokens with proper expiration
- Input validation and sanitization
- Database connection pooling
- CORS configuration for API access

### Performance
- Database indexing on frequently queried fields
- Pagination for all list endpoints
- Connection pooling and query optimization
- Frontend code splitting and lazy loading

### Monitoring & Observability
- Structured logging with context
- Health check endpoints
- Error tracking and alerting
- Performance metrics collection

## If I Had More Time

### 1. Enhanced Testing Coverage
- **End-to-end tests** with Playwright/Cypress
- **Performance testing** for high-volume inventory operations
- **API contract testing** with tools like Pact
- **Load testing** for concurrent inventory updates

### 2. Advanced Features
- **Real-time updates** with WebSockets for live inventory tracking
- **Advanced analytics** with charts and trend analysis
- **Bulk operations** for importing/exporting product data
- **Inventory alerts** for low stock notifications

### 3. Production Readiness
- **Comprehensive monitoring** with Prometheus/Grafana
- **CI/CD pipeline** with automated testing and deployment
- **Database migrations** management and rollback strategy
- **Configuration management** with environment-specific settings
- **API rate limiting** and abuse prevention
- **Backup and disaster recovery** procedures

## API Documentation

When running locally, visit `http://localhost:4000/open-api-specs` for interactive Swagger documentation.

## License

MIT License
