
# 🐳 Docker Multi-Environment Deployment Guide

A comprehensive guide for optimizing Docker builds to deploy the same image across multiple environments without rebuilding.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Understanding Build-time vs Runtime Variables](#understanding-build-time-vs-runtime-variables)
3. [Step-by-Step Analysis Process](#step-by-step-analysis-process)
4. [Implementation Guide](#implementation-guide)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Examples](#examples)
8. [Real-World Implementation](#real-world-implementation)
9. [Entrypoint Scripts](#entrypoint-scripts)

## 🎯 Overview

This guide helps you identify which environment variables must be set at build-time vs runtime, allowing you to:
- Build a single Docker image once
- Deploy it across multiple environments (dev, staging, prod)
- Change environment-specific configurations without rebuilding
- Reduce CI/CD pipeline complexity and build times

## 🔍 Understanding Build-time vs Runtime Variables

### Build-time Variables (Must be embedded in the bundle)
- **Client-side accessible variables** (e.g., `NEXT_PUBLIC_*`, `REACT_APP_*`, `VITE_*`)
- **Framework configuration variables** used during build process
- **Static URLs and domains** that are baked into the application bundle
- **Build-specific configurations** that affect the compiled output

### Runtime Variables (Can be changed when container starts)
- **Server-side only variables** (database URLs, API keys, secrets)
- **OAuth provider credentials** (client IDs, secrets, endpoints)
- **Service configurations** (email settings, external service URLs)
- **Environment-specific settings** (logging levels, feature flags)

## 📝 Step-by-Step Analysis Process

### Step 1: Identify All Environment Variables

```bash
# Search for environment variable usage in your codebase
grep -r "process\.env\." . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.json"
```

### Step 2: Categorize Variables by Framework

#### For Next.js Applications:
```bash
# Find NEXT_PUBLIC_ variables (client-side accessible)
grep -r "NEXT_PUBLIC_" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"

# Find variables used in next.config.js
grep -r "process\.env\." next.config.js
```

#### For React Applications:
```bash
# Find REACT_APP_ variables (client-side accessible)
grep -r "REACT_APP_" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

#### For Vue Applications:
```bash
# Find VITE_ variables (client-side accessible)
grep -r "VITE_" . --include="*.js" --include="*.ts" --include="*.vue"
```

### Step 3: Analyze Variable Usage Patterns

Create a spreadsheet or document to track:

| Variable Name | Used In | Client/Server | Build-time Required | Runtime Safe |
|---------------|---------|--------------|-------------------|--------------|
| `API_URL` | Server components | Server | ❌ | ✅ |
| `NEXT_PUBLIC_API_URL` | Client components | Client | ✅ | ❌ |
| `DATABASE_URL` | Server only | Server | ❌ | ✅ |
| `NEXTAUTH_URL` | next.config.js | Build | ✅ | ❌ |

### Step 4: Test Variable Classification

For each variable, ask these questions:

1. **Is it used in client-side code?** → Build-time
2. **Is it used in framework configuration files?** → Build-time
3. **Is it only used in server-side code?** → Runtime
4. **Does it contain sensitive information?** → Runtime
5. **Is it environment-specific (URLs, domains)?** → Depends on usage

## 🛠️ Implementation Guide

### Step 1: Update Dockerfile

#### Before (All variables as build-time):
```dockerfile
# ❌ BAD: All variables as build-time ARGs
ARG API_URL
ARG DATABASE_URL
ARG SECRET_KEY
ARG NEXT_PUBLIC_API_URL

ENV API_URL=$API_URL \
    DATABASE_URL=$DATABASE_URL \
    SECRET_KEY=$SECRET_KEY \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build
```

#### After (Optimized for multi-environment):
```dockerfile
# ✅ GOOD: Only build-time variables as ARGs
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_DOMAIN

# Set only build-time environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN

RUN npm run build

# Runtime variables will be set via docker run or docker-compose
```

### Step 2: Create Environment-Specific Configuration

#### Development Environment:
```bash
# Build command
docker build \
  --build-arg NEXT_PUBLIC_API_URL="http://localhost:3000" \
  --build-arg NEXTAUTH_URL="http://localhost:3000" \
  --build-arg NEXT_PUBLIC_DOMAIN="localhost" \
  -t myapp:latest .

# Run command
docker run -d \
  -e DATABASE_URL="mongodb://localhost:27017/dev" \
  -e SECRET_KEY="dev-secret-key" \
  -e GOOGLE_CLIENT_ID="dev-google-id" \
  -e GOOGLE_CLIENT_SECRET="dev-google-secret" \
  myapp:latest
```

#### Production Environment:
```bash
# Same image, different runtime variables
docker run -d \
  -e DATABASE_URL="mongodb://prod-cluster:27017/prod" \
  -e SECRET_KEY="prod-secret-key" \
  -e GOOGLE_CLIENT_ID="prod-google-id" \
  -e GOOGLE_CLIENT_SECRET="prod-google-secret" \
  myapp:latest
```

### Step 3: Update CI/CD Pipeline

#### GitHub Actions Example:
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker Image
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_API_URL="${{ secrets.PROD_API_URL }}" \
            --build-arg NEXTAUTH_URL="${{ secrets.PROD_NEXTAUTH_URL }}" \
            --build-arg NEXT_PUBLIC_DOMAIN="${{ secrets.PROD_DOMAIN }}" \
            -t myapp:latest .
            
      - name: Push to Registry
        run: |
          docker tag myapp:latest ${{ secrets.REGISTRY }}/myapp:latest
          docker push ${{ secrets.REGISTRY }}/myapp:latest

  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Dev
        run: |
          docker run -d \
            -e DATABASE_URL="${{ secrets.DEV_DATABASE_URL }}" \
            -e SECRET_KEY="${{ secrets.DEV_SECRET_KEY }}" \
            -e GOOGLE_CLIENT_ID="${{ secrets.DEV_GOOGLE_CLIENT_ID }}" \
            -e GOOGLE_CLIENT_SECRET="${{ secrets.DEV_GOOGLE_CLIENT_SECRET }}" \
            ${{ secrets.REGISTRY }}/myapp:latest

  deploy-prod:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Prod
        run: |
          docker run -d \
            -e DATABASE_URL="${{ secrets.PROD_DATABASE_URL }}" \
            -e SECRET_KEY="${{ secrets.PROD_SECRET_KEY }}" \
            -e GOOGLE_CLIENT_ID="${{ secrets.PROD_GOOGLE_CLIENT_ID }}" \
            -e GOOGLE_CLIENT_SECRET="${{ secrets.PROD_GOOGLE_CLIENT_SECRET }}" \
            ${{ secrets.REGISTRY }}/myapp:latest
```

## 🎯 Best Practices

### 1. Security Considerations
- **Never put secrets in build-time variables**
- **Use runtime variables for sensitive data**
- **Consider using secret management systems** (AWS Secrets Manager, Azure Key Vault, etc.)

### 2. Naming Conventions
- **Use clear prefixes** for client-side variables (`NEXT_PUBLIC_`, `REACT_APP_`, `VITE_`)
- **Group related variables** with consistent naming
- **Document variable purposes** in your README

### 3. Testing Strategy
```bash
# Test build-time variables
docker build --build-arg NEXT_PUBLIC_API_URL="test-url" -t test-build .

# Test runtime variables
docker run --rm -e DATABASE_URL="test-db" test-build npm test
```

### 4. Documentation
Create a comprehensive environment variables documentation:

```markdown
## Environment Variables

### Build-time Variables (Required during docker build)
- `NEXT_PUBLIC_API_URL`: API endpoint for client-side requests
- `NEXTAUTH_URL`: NextAuth.js base URL
- `NEXT_PUBLIC_DOMAIN`: Domain for client-side validation

### Runtime Variables (Set via docker run or docker-compose)
- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: Application secret key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Client-side variable not working
**Problem**: `NEXT_PUBLIC_*` variable is undefined in client code
**Solution**: Ensure the variable is set as a build-time ARG and ENV

#### Issue 2: Runtime variable not accessible
**Problem**: Server-side variable is undefined at runtime
**Solution**: Check if the variable is set in the container environment

#### Issue 3: Build fails with missing variables
**Problem**: Build-time ARG is not provided
**Solution**: Provide all required build-time arguments during docker build

### Debugging Commands

```bash
# Check environment variables in running container
docker exec <container-id> env

# Check build-time variables
docker build --build-arg NEXT_PUBLIC_API_URL="debug" -t debug .

# Inspect image layers
docker history <image-name>
```

## 📚 Examples

### Example 1: Next.js Application

#### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build-time variables only
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_DOMAIN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN

RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Build and Run:
```bash
# Build once
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://api.myapp.com" \
  --build-arg NEXTAUTH_URL="https://auth.myapp.com" \
  --build-arg NEXT_PUBLIC_DOMAIN="myapp.com" \
  -t myapp:latest .

# Deploy to different environments
docker run -d -e DATABASE_URL="mongodb://dev-db:27017/app" myapp:latest
docker run -d -e DATABASE_URL="mongodb://prod-db:27017/app" myapp:latest
```

### Example 2: React Application

#### Dockerfile:
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build-time variables
ARG REACT_APP_API_URL
ARG REACT_APP_DOMAIN

ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_DOMAIN=$REACT_APP_DOMAIN

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Example 3: Docker Compose

#### docker-compose.yml:
```yaml
version: '3.8'

services:
  app:
    image: myapp:latest
    environment:
      - DATABASE_URL=mongodb://mongo:27017/app
      - SECRET_KEY=my-secret-key
      - GOOGLE_CLIENT_ID=my-google-id
      - GOOGLE_CLIENT_SECRET=my-google-secret
    ports:
      - "3000:3000"
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    environment:
      - MONGO_INITDB_DATABASE=app
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🚀 Real-World Implementation

### multi-build-poc Repository

The [**multi-build-poc repository**](https://github.com/TechoAbhishekCS3459/multi-build-poc) provides a complete working example of Docker multi-environment deployment with advanced features:

#### Key Features
- **Complete Next.js Application**: Full-stack application demonstrating multi-environment deployment
- **Entrypoint Scripts**: Dynamic runtime configuration using `entrypoint.sh`
- **CI/CD Integration**: GitHub Actions workflows for automated deployment
- **Environment Detection**: Automatic environment-specific configuration
- **Production Ready**: Includes proper error handling, logging, and validation

#### Repository Structure
```
multi-build-poc/
├── .github/workflows/     # CI/CD pipeline examples
├── app/                   # Next.js application
├── public/                # Static assets
├── .dockerignore          # Docker ignore file
├── .gitignore             # Git ignore file
├── Dockerfile             # Optimized Dockerfile
├── README.md              # Project documentation
├── docker-compose.yaml    # Docker Compose configuration
├── entrypoint.sh          # Runtime configuration script
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

#### Getting Started with multi-build-poc

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/TechoAbhishekCS3459/multi-build-poc.git
   cd multi-build-poc
   ```

2. **Build the Image**:
   ```bash
   docker build -t multi-build-poc:latest .
   ```

3. **Deploy to Different Environments**:
   ```bash
   # Development environment
   docker run -d \
     -e ENVIRONMENT=development \
     -e DATABASE_URL="mongodb://dev-db:27017/app" \
     -e API_SECRET="dev-secret" \
     -p 3000:3000 \
     multi-build-poc:latest

   # Production environment
   docker run -d \
     -e ENVIRONMENT=production \
     -e DATABASE_URL="mongodb://prod-cluster:27017/app" \
     -e API_SECRET="prod-secret" \
     -p 3000:3000 \
     multi-build-poc:latest
   ```

#### Learning from the Implementation

- **Study the Dockerfile**: See how build-time variables are minimized
- **Examine the entrypoint.sh**: Understand dynamic runtime configuration
- **Review CI/CD workflows**: Learn automated deployment patterns
- **Check environment handling**: See how different environments are managed

## 🚀 Entrypoint Scripts

### What are Entrypoint Scripts?

Entrypoint scripts provide the ultimate flexibility for Docker multi-environment deployments by allowing dynamic configuration at container startup. They complement the build-time vs runtime variable optimization by adding intelligent runtime configuration management.

### Benefits of Entrypoint Scripts

1. **Dynamic Environment Detection**: Automatically configure based on environment
2. **Runtime Validation**: Validate configuration before application startup
3. **Flexible Configuration**: Support complex configuration scenarios
4. **Error Handling**: Graceful handling of configuration errors
5. **Logging**: Comprehensive logging for debugging and monitoring

### Entrypoint Script Example

```bash
#!/bin/bash
set -e

# Set default environment
ENVIRONMENT=${ENVIRONMENT:-development}

# Log startup information
echo "=========================================="
echo "Starting application in $ENVIRONMENT environment"
echo "=========================================="

# Environment-specific configuration
configure_environment() {
  case $ENVIRONMENT in
    development)
      export LOG_LEVEL=debug
      export CACHE_TTL=300
      export DEBUG=true
      echo "✓ Development configuration applied"
      ;;
    staging)
      export LOG_LEVEL=info
      export CACHE_TTL=600
      export DEBUG=false
      echo "✓ Staging configuration applied"
      ;;
    production)
      export LOG_LEVEL=error
      export CACHE_TTL=3600
      export DEBUG=false
      echo "✓ Production configuration applied"
      ;;
    *)
      echo "❌ Unknown environment: $ENVIRONMENT"
      echo "Supported environments: development, staging, production"
      exit 1
      ;;
  esac
}

# Validate required environment variables
validate_environment() {
  local required_vars=("DATABASE_URL" "API_SECRET")
  local missing_vars=()

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done

  if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '  - %s\n' "${missing_vars[@]}"
    exit 1
  fi

  echo "✓ All required environment variables are set"
}

# Main execution
main() {
  configure_environment
  validate_environment
  
  echo "=========================================="
  echo "Configuration complete. Starting application..."
  echo "=========================================="
  
  # Execute the main command
  exec "$@"
}

# Run main function
main "$@"
```

### Dockerfile Integration

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install bash for entrypoint script
RUN apk add --no-cache bash

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Copy and setup entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Build the application
RUN npm run build

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "start"]
```

### Advanced Entrypoint Patterns

#### 1. Configuration File Generation
```bash
# Generate configuration file based on environment
generate_config() {
  cat > /app/config.json << EOF
{
  "environment": "$ENVIRONMENT",
  "database": {
    "url": "$DATABASE_URL",
    "poolSize": ${DB_POOL_SIZE:-10}
  },
  "logging": {
    "level": "$LOG_LEVEL",
    "file": "/app/logs/app.log"
  },
  "cache": {
    "ttl": $CACHE_TTL
  }
}
EOF
  echo "✓ Configuration file generated"
}
```

#### 2. Health Check Integration
```bash
# Setup health check
setup_health_check() {
  cat > /app/healthcheck.sh << 'EOF'
#!/bin/bash
curl -f http://localhost:3000/health || exit 1
EOF
  chmod +x /app/healthcheck.sh
  echo "✓ Health check configured"
}
```

#### 3. Database Migration
```bash
# Run database migrations
run_migrations() {
  if [ "$ENVIRONMENT" = "production" ]; then
    echo "Running database migrations..."
    npm run migrate:prod
  else
    echo "Skipping migrations in $ENVIRONMENT"
  fi
}
```

### Best Practices for Entrypoint Scripts

1. **Error Handling**: Use `set -e` for immediate exit on error
2. **Logging**: Provide clear, consistent logging
3. **Validation**: Always validate required environment variables
4. **Security**: Don't log sensitive information
5. **Documentation**: Document all environment variables and their purposes

## 🚀 Migration Checklist

When applying this approach to an existing repository:

- [ ] **Audit all environment variables** in the codebase
- [ ] **Categorize variables** as build-time vs runtime
- [ ] **Update Dockerfile** to only include build-time ARGs
- [ ] **Test build process** with minimal build-time variables
- [ ] **Update deployment scripts** to use runtime variables
- [ ] **Update CI/CD pipelines** to separate build and deploy steps
- [ ] **Document all variables** and their purposes
- [ ] **Test deployment** in multiple environments
- [ ] **Update team documentation** and runbooks
- [ ] **Consider entrypoint scripts** for advanced configuration needs

## 📖 Additional Resources

### Practical Implementation Examples
- **[multi-build-poc Repository](https://github.com/TechoAbhishekCS3459/multi-build-poc)**: Complete working example with entrypoint scripts
- **[Entrypoint Script Guide](./ENTRYPOINT_SCRIPT_GUIDE.md)**: Advanced configuration using entrypoint scripts

### Community Examples
- [Docker Multi-Stage Builds: Optimize Your Container Images](https://dev.to/hello_monir/docker-multi-stage-builds-optimize-your-container-images-2o8m)
- [Multi Stage Docker Builds](https://nabeelvalley.co.za/docs/containers-and-microservices/docker-multi-stage/)
- [Docker build for Python](https://medium.com/@kosala.atapattu/docker-build-for-python-abd7f91d4896)

### Official Documentation
- [Docker Build Arguments Documentation](https://docs.docker.com/engine/reference/builder/#arg)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Vue Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 🎉 Success Stories

If you've successfully implemented this approach in your project, consider:
- **Sharing your experience** in the [multi-build-poc repository](https://github.com/TechoAbhishekCS3459/multi-build-poc) discussions
- **Contributing examples** to help the community
- **Documenting your specific use case** for others to learn from

---

**Remember**: The goal is to minimize build-time variables to only those absolutely necessary, allowing maximum flexibility for runtime configuration across different environments. Entrypoint scripts provide the ultimate flexibility for complex deployment scenarios.

---

*This guide is part of a comprehensive Docker optimization strategy. For advanced configurations and real-world examples, check out the practical implementations linked above.*
EOF
