import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { Box } from "@mui/material";

const TestPage = ({ isSmallScreen }) => {
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlobs, setAudioBlobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getMicrophoneInput = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setAudioStream(stream);
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const blobs = [];
      console.log("test1");
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          blobs.push(event.data);
          console.log("start1")
        }
        console.log("start2")
      };
      recorder.onstop = () => {
        setAudioBlobs([blobs[blobs.length - 1]]);
        console.log("stop1", blobs.length, URL.createObjectURL(blobs[blobs.length - 1]))
      };
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const b = audioBlobs.map((blob, index) => (
    <audio key={index} controls>
      <source src={URL.createObjectURL(blob)} type="audio/webm" />
      Your browser does not support the audio element.
    </audio>
  ))

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    getMicrophoneInput();

    return () => {
      // Cleanup: Stop the microphone stream and media recorder when component unmounts
      if (audioStream) {
        audioStream.getTracks().forEach((track) => {
          track.stop();
          console.log("stop3")
        });
      }
      if (mediaRecorder) {
        mediaRecorder.stop();
        console.log("stop4")
      }
    };
  }, []);

  useEffect(() => {
    setLoading(false);
    
  }, []);

  const startRecording = () => {
    if (mediaRecorder && audioStream) {
      mediaRecorder.start();
      console.log("start3")
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && audioStream) {
      mediaRecorder.stop();
      console.log("stop2")
    }
  };

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} sx={{ backgroundColor: "#e2e2e2", padding: 1 }}>
      <h3>Test Page</h3>
      <div>
        {audioStream && (
          <div>
            <button onClick={startRecording}>Start Recording</button>
            <button onClick={stopRecording}>Stop Recording</button>
          </div>
        )}
        {b}
        <p>Count: {audioBlobs.length || -1}</p>
      </div>
    </Box>
  );
};

export default TestPage;
