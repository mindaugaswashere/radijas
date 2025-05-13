const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.on("ready", () => {
  // Dynamically set the icon based on the platform
  const iconPath = getPlatformIcon();

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: iconPath, // Dynamically set the platform-specific icon
  });

  mainWindow.loadURL("file://" + path.join(__dirname, "dist", "index.html")); // Adjust to your build path
});

// Function to return the correct icon based on the platform
function getPlatformIcon() {
  const platform = process.platform; // 'win32', 'darwin', 'linux'
  if (platform === "win32") {
    return path.join(__dirname, "radio.ico"); // Use .ico for Windows
  } else if (platform === "darwin") {
    return path.join(__dirname, "radio.icns"); // Use .icns for macOS
  } else {
    return path.join(__dirname, "radio.png"); // Use .png for Linux
  }
}
