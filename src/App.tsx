import React, { useState } from "react";
import { Card, CardContent, Button, Slider, Typography } from "@mui/material";
import { PlayArrow, Pause, Label } from "@mui/icons-material";
import data from "./data/stations.json";

type Station = {
  name: string;
  url: string;
};

export default function RadioPlayer() {
  let stations: Station[] = [];
  const [display, setDisplay] = useState(0);
  const [currentStation, setCurrentStation] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const audioRef = React.useRef<any>(null);

  const togglePlay = (station: { name: string; url: string }) => {
    if (currentStation?.url === station.url && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = station.url;
        audioRef.current.play();
        audioRef.current.volume = volume / 100; // Set volume
        setCurrentStation(station);
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (_: any, newValue: any) => {
    setVolume(newValue);
    if (audioRef.current) {
      audioRef.current.volume = newValue / 100; // Set volume when changed
    }
  };
  if (display === 0) {
    stations = data.lt;
  }
  if (display === 1) {
    stations = data.furiaga;
  }

  if (display === 2) {
    stations = data.usa;
  }

  return (
    <div style={{ backgroundColor: "#1A1A1A", minHeight: "100vh" }}>
      <Label>Change display: </Label>
      <Button
        style={{
          backgroundColor: "#4caf50",
          color: "white",
          fontWeight: "bold",
          marginTop: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        }}
        onClick={() => setDisplay(0)}
      >
        Lietuviskos
      </Button>
      <Button
        style={{
          marginLeft: 20,
          backgroundColor: "#4caf50",
          color: "white",
          fontWeight: "bold",
          marginTop: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        }}
        onClick={() => setDisplay(1)}
      >
        EuroTruck
      </Button>
      <Button
        style={{
          marginLeft: 20,
          backgroundColor: "#4caf50",
          color: "white",
          fontWeight: "bold",
          marginTop: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        }}
        onClick={() => setDisplay(2)}
      >
        USA
      </Button>
      {/* Radio Station Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "16px",
          padding: "16px",
        }}
      >
        {stations.map((station, idx) => (
          <Card
            key={idx}
            style={{
              backgroundColor: "#2c2c2c",
              color: "gold",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseEnter={(e: any) =>
              (e.target.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e: any) => (e.target.style.transform = "scale(1)")}
          >
            <CardContent style={{ textAlign: "center", width: "100%" }}>
              <Typography
                variant="h6"
                style={{ fontWeight: "bold", color: "gold" }}
              >
                {station.name}
              </Typography>
              <Button
                variant="contained"
                style={{
                  backgroundColor:
                    isPlaying && currentStation?.url === station.url
                      ? "#FFB300"
                      : "#4caf50",
                  color: "white",
                  fontWeight: "bold",
                  marginTop: "8px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                }}
                onClick={() => togglePlay(station)}
                startIcon={
                  isPlaying && currentStation?.url === station.url ? (
                    <Pause />
                  ) : (
                    <PlayArrow />
                  )
                }
              >
                {isPlaying && currentStation?.url === station.url
                  ? "Pause"
                  : "Play"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hidden Audio */}
      <audio ref={audioRef} hidden />

      {/* Bottom Player */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px",
          backgroundColor: "#333",
          color: "gold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
          borderTop: "2px solid gold",
          borderRadius: "10px 10px 0 0",
        }}
      >
        <Typography
          variant="body1"
          style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}
        >
          {currentStation?.name || "No Station Playing"}
        </Typography>

        <Button
          variant="contained"
          style={{
            backgroundColor: isPlaying ? "#FFB300" : "#4caf50",
            color: "white",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
          }}
          onClick={() => togglePlay(currentStation)}
          startIcon={isPlaying ? <Pause /> : <PlayArrow />}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Slider
          value={volume}
          onChange={handleVolumeChange}
          aria-labelledby="volume-slider"
          valueLabelDisplay="auto"
          min={0}
          max={100}
          style={{ width: "150px", color: "gold" }}
        />
      </div>
    </div>
  );
}
