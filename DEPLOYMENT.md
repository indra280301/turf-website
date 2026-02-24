# Dhaval Plaza Turf - Oracle Cloud Deployment Guide

I have reviewed your Oracle Cloud Ingress Rules! Your current website is taking up **Port 80** (React Frontend) and **Port 5001** (Node.js Backend).

To host **both** websites on the exact same server without breaking the first one, we have configured this Turf app to run on completely separate alternate ports:
- **Turf Frontend (The Live Website):** `http://129.154.252.11:3000`
- **Turf Backend (The Database API):** `http://129.154.252.11:5005`

### ⚠️ Crucial First Step: Update Oracle Firewall
Before copying the code, go back to that exact Oracle Cloud screen you took a screenshot of and click **Add Ingress Rules** twice:
1. **Rule 1:** Source CIDR `0.0.0.0/0`, Protocol `TCP`, Destination Port Range `3000`. Description: "Turf Frontend"
2. **Rule 2:** Source CIDR `0.0.0.0/0`, Protocol `TCP`, Destination Port Range `5005`. Description: "Turf Backend"

---

## Step 1: Compress the Codebase (Run this on your Mac)
Open your Mac Terminal and run this command inside the project folder:
```bash
cd /Users/indrajeetmane/.gemini/antigravity/playground/outer-coronal
tar -czvf turf-booking-app.tar.gz backend/ frontend/ docker-compose.yml
```

## Step 2: Upload to Oracle Cloud (Run this on your Mac)
Use your SSH key (assuming it is called `ssh-key.pem` in your Downloads folder) to securely copy the zipped folder over to the cloud. Replace `ubuntu` with `opc` if that is your Oracle username.
```bash
scp -i ~/Downloads/ssh-key.pem turf-booking-app.tar.gz ubuntu@129.154.252.11:~
```

## Step 3: Login to the Server
```bash
ssh -i ~/Downloads/ssh-key.pem ubuntu@129.154.252.11
```

## Step 4: Extract and Start the Docker Cluster (Run this on Oracle Server)
Once you are logged into the Oracle server terminal:
```bash
# 1. Unzip the file
tar -xzvf turf-booking-app.tar.gz

# 2. Enter the directory
cd turf-booking-app

# 3. Create your production environment secrets!
# (Paste in your Razorpay, Twilio, and Database URL here and save)
nano backend/.env

# 4. Boot up the servers in the background!
sudo docker compose up -d --build
```

You are done! You can now access your new app at **http://129.154.252.11:3000**.
