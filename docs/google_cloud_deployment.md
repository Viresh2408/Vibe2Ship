# Google Cloud Deployment — The Last-Minute Life Saver

## Production Deployment Guide

---

## Prerequisites

1. Google Cloud project with billing enabled
2. Firebase project linked to GCP project
3. `gcloud` CLI installed and authenticated
4. `firebase` CLI installed
5. Docker Desktop (for local testing)

---

## 1. Initial Setup

### Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com
```

### Create Firestore Database
```bash
gcloud firestore databases create --location=us-central1
```

### Create Secret Manager Secret for Private Key
```bash
# Store Firebase Admin private key securely
echo '{"type":"service_account",...}' | \
  gcloud secrets create firebase-admin-private-key \
  --data-file=- \
  --replication-policy=automatic
```

---

## 2. Cloud Run Deployment

### Manual Deployment (First Time)
```bash
# Build and push Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/last-minute-life-saver:latest \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=your_key \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your.domain \
  # ... other build args

docker push gcr.io/YOUR_PROJECT_ID/last-minute-life-saver:latest

# Deploy to Cloud Run
gcloud run deploy last-minute-life-saver \
  --image gcr.io/YOUR_PROJECT_ID/last-minute-life-saver:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "GEMINI_API_KEY=your_key" \
  --set-env-vars "FIREBASE_ADMIN_PROJECT_ID=your_project" \
  --set-env-vars "FIREBASE_ADMIN_CLIENT_EMAIL=your_email" \
  --set-secrets "FIREBASE_ADMIN_PRIVATE_KEY=firebase-admin-private-key:latest"
```

### Automated CI/CD (Recommended)
```bash
# Connect Cloud Build to GitHub repo
gcloud builds triggers create github \
  --repo-name=last-minute-life-saver \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions="_REGION=us-central1,_GEMINI_API_KEY=$$GEMINI_API_KEY"
```

---

## 3. Cloud Function Deployment

### Deploy interventionCron
```bash
cd src/functions

gcloud functions deploy interventionCron \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --memory 512MB \
  --timeout 300s \
  --max-instances 5 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=your_project_id"
```

### Set Up Cloud Scheduler
```bash
# Create scheduled job (every 15 minutes)
gcloud scheduler jobs create http intervention-cron-15min \
  --schedule "*/15 * * * *" \
  --uri "https://us-central1-YOUR_PROJECT.cloudfunctions.net/interventionCron" \
  --http-method GET \
  --location us-central1 \
  --attempt-deadline 30s \
  --description "Sends deadline intervention push notifications every 15 minutes"
```

---

## 4. Firebase Configuration

### Deploy Security Rules
```bash
# Create firestore.rules file with content from firebase_architecture.md
firebase deploy --only firestore:rules
```

### Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### Configure Firebase Hosting (Optional)
```bash
# For custom domain on Cloud Run
firebase hosting:channel:deploy preview
```

---

## 5. Environment Variables Reference

### Cloud Run Environment Variables
| Variable | Source | Required |
|----------|--------|----------|
| `GEMINI_API_KEY` | Google AI Studio | ✅ |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Console | ✅ |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service Account | ✅ |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Secret Manager | ✅ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Build arg | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Build arg | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Build arg | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Build arg | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Build arg | ✅ |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase Console | ✅ |

---

## 6. Monitoring & Observability

### Cloud Logging
```bash
# View Cloud Run logs
gcloud run logs read last-minute-life-saver --region us-central1 --limit 50

# View Cloud Function logs
gcloud functions logs read interventionCron --region us-central1 --limit 50
```

### Cloud Monitoring Alerts
```bash
# Create alert for high error rate on Cloud Run
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring-policy.yaml
```

### Key Metrics to Monitor
- `run.googleapis.com/request_count` — Request volume
- `run.googleapis.com/request_latencies` — Response times
- `run.googleapis.com/container/memory/utilizations` — Memory pressure
- Gemini API quota usage in AI Studio dashboard
- FCM delivery rates in Firebase Console

---

## 7. Cost Estimation

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Cloud Run | 2M req/month free | ~$0 for hackathon |
| Cloud Functions | 2M invocations/month free | ~$0 |
| Cloud Scheduler | 3 jobs free | ~$0 |
| Firestore | 1 GiB storage, 50K reads/day free | ~$0 |
| Firebase Auth | Free | $0 |
| FCM | Free | $0 |
| Gemini API | $0.075/1M input tokens (Flash) | ~$1-5 for demo |
