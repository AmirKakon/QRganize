import React, { useState, useEffect } from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { QrCodeTab, ContainersTab } from "./Tabs";
import { getAllContainers } from "../../utilities/api";

const QrCodeTabs = ({ isSmallScreen }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [containers, setContainers] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    getAllContainers()
      .then((res) => setContainers(res))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Define tab configurations
  const tabs = [
    {
      label: "QrCode Scanner",
      component: <QrCodeTab isSmallScreen={isSmallScreen} />,
    },
    {
      label: "View Containers",
      component: <ContainersTab isSmallScreen={isSmallScreen} containers={containers} />,
    }
  ];

  return (
    <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
      <Tabs value={tabIndex} onChange={handleTabChange} centered>
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab.label} />
        ))}
      </Tabs>
      {tabs[tabIndex]?.component}
    </Paper>
  );
};

export default QrCodeTabs;
