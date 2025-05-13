const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Optional
    },
  });

  // Load the Vite build output
  mainWindow.loadFile(path.join(__dirname, "../dist/index.html")); // Adjust if needed
});
