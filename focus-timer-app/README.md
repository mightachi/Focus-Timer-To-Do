# Step 1: Create Project from Scratch

```bash
# Navigate to where you want to create the project
cd ~/Desktop  # or wherever you prefer

# Create new React app with Vite
npm create vite@latest focus-timer-app -- --template react

# Navigate into the project
cd focus-timer-app

# Install dependencies
npm install
```

# Step 2: Install Required Packages

```bash
# Install UI and functionality packages
npm install lucide-react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Install Capacitor for mobile
npm install @capacitor/core @capacitor/cli @capacitor/android

# Install Capacitor plugins
npm install @capacitor/app @capacitor/haptics @capacitor/local-notifications @capacitor/status-bar

# Install testing libraries
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @babel/preset-env @babel/preset-react babel-jest
```

# Step 3: Configure Tailwind CSS

Edit tailwind.config.js:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Replace src/index.css with:

```CSS
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

# Step 4: Create Project Structure

```bash
# Create all necessary directories
mkdir -p src/components
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/tests/unit
mkdir -p src/tests/integration
```

# Step 5: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

# Step 7: Run the App

```bash
# Start development server
npm run dev
```

You should see output like:

```bash
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

# 🎯 Next Steps (After App Works in Browser)

## 1. Initialize Capacitor (for Android APK)

```bash
# Initialize Capacitor
npx cap init

# When prompted:
# App name: Focus Timer
# App ID: com.focustimer.app
# Web directory: dist

# Add Android platform
npx cap add android

# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## 2. Build APK in Android Studio

    1. Wait for Gradle sync to complete
    2. Go to: Build → Build Bundle(s) / APK(s) → Build APK(s)
    3. Find your APK at: android/app/build/outputs/apk/debug/app-debug.apk

# 🐛 Troubleshooting

If you still get errors:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try running again
npm run dev
```

If Vite command not found:

```bash
# Install Vite globally
npm install -g vite

# Or run with npx
npx vite
```