
# version_settings() enforces a minimum Tilt version
version_settings(constraint='>=0.22.2')

# Backend Docker build
docker_build(
    'hr-app-backend',
    context='./apps/server',
    dockerfile='./apps/server/Dockerfile',
    live_update=[
        sync('./apps/server/src/', '/app/src/'),
        sync('./apps/server/package.json', '/app/package.json'),
        run('npm install', trigger=['./apps/server/package.json'])
    ]
)

# Frontend Docker build
docker_build(
    'hr-app-frontend',
    context='./apps/frontend',
    dockerfile='./apps/frontend/Dockerfile',
    build_args={'VITE_BASE_URL': 'http://localhost:8080'},
    live_update=[
        sync('./apps/frontend/src/', '/app/src/'),
        sync('./apps/frontend/package.json', '/app/package.json'),
        run('npm install', trigger=['./apps/frontend/package.json'])
    ]
)

# MongoDB deployment
k8s_yaml(blob("""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:latest
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "password"
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
  type: ClusterIP
"""))

# Deploy using Helm chart with local image overrides
k8s_yaml(helm(
    './helm-chart/hr-app',
    values=[
        './helm-chart/hr-app/values.yaml'
    ],
    set=[
        'frontend.image.repository=hr-app-frontend',
        'frontend.image.tag=latest',
        'frontend.env.VITE_BASE_URL=http://localhost:8080',
        'backend.image.repository=hr-app-backend',
        'backend.image.tag=latest',
        'backend.env.MONGO_URI=mongodb://admin:password@mongodb:27017/mydatabase?authSource=admin',
        'backend.env.RUN_MIGRATIONS=true'
    ]
))

# Configure resources with port forwarding
k8s_resource(
    'chart-hr-app-backend',
    port_forwards='8080:3001',
    labels=['backend']
)

k8s_resource(
    'chart-hr-app-frontend',
    port_forwards='3000:80',
    labels=['frontend']
)

k8s_resource(
    'mongodb',
    port_forwards='27017:27017',
    labels=['database']
)

if config.tilt_subcommand == 'up':
    print("""
    \033[32mHR App running with Tilt!\033[0m
    
    Frontend: http://localhost:3000
    Backend: http://localhost:8080
    
    Changes to source files will automatically trigger rebuilds and redeployments.
    """)