# Google Drive API Setup Guide

To automatically import hundreds of videos from your Google Drive folder, you need to set up Google Drive API credentials.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it (e.g., "Streaming App")
4. Click "Create"

## Step 2: Enable Google Drive API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name it (e.g., "streaming-app-service")
4. Click "Create and Continue"
5. Skip optional steps, click "Done"

## Step 4: Create and Download Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. **Save the downloaded JSON file** as `google-credentials.json` in your project root

## Step 5: Share Folder with Service Account

1. Open the downloaded JSON file
2. Copy the `client_email` value (looks like: `streaming-app-service@project-id.iam.gserviceaccount.com`)
3. Go to your Google Drive folder: https://drive.google.com/drive/folders/14TTnhncpbUaG6qltCUi_NqUMLi-yG5VG
4. Right-click → "Share"
5. Paste the service account email
6. Give it "Viewer" permission
7. Click "Send"

## Step 6: Update Application Configuration

Add to `application.properties`:
```properties
# Google Drive Configuration
google.drive.credentials.path=google-credentials.json
google.drive.folder.id=14TTnhncpbUaG6qltCUi_NqUMLi-yG5VG
```

## You're Done!

Once you complete these steps, the application will be able to automatically list and import all videos from your folder.
