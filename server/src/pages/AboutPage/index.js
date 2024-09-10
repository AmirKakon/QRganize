import React, { useEffect, useState, Suspense, lazy } from "react";
import { getTimeline, getCertificates } from "../../utilities/api";
import Loading from "../../components/Loading";
import { Box } from "@mui/material";
const Timeline = lazy(() => import("../../components/Timeline"));
const AboutMe = lazy(() => import("../../components/AboutMe"));
const ImageSlider = lazy(() => import("../../components/ImageSlider"));

const AboutPage = ({ isSmallScreen }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    getTimeline()
      .then((data) => {
        setTimelineData(data);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
    getCertificates()
      .then((data) => setCertificates(data))
      .catch((error) => console.error(error));
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} sx={{ backgroundColor: "#e2e2e2", padding: 1 }}>
      <Suspense fallback={<Loading />}>
        <AboutMe isSmallScreen={isSmallScreen} />
        <Timeline isSmallScreen={isSmallScreen} data={timelineData} />
        <ImageSlider isSmallScreen={isSmallScreen} images={certificates} />
      </Suspense>
    </Box>
  );
};

export default AboutPage;
