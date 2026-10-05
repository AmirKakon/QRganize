import React from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { QrCodeTab, ContainersTab } from "./Tabs";
import { useItems, useContainers, useAreas } from "../../utilities/queries";

// Open tab kept in the URL so Back from a container returns to it.
const TAB_KEYS = ["containers", "scanner"];

const QrCodeTabs = ({ isSmallScreen }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: containers } = useContainers();
  const { data: items } = useItems();
  const { data: areas } = useAreas();

  const tabIndex = Math.max(0, TAB_KEYS.indexOf(searchParams.get("tab")));

  const handleTabChange = (event, newValue) =>
    setSearchParams({ tab: TAB_KEYS[newValue] }, { replace: true });

  // Define tab configurations. "View Containers" leads so the page opens on the
  // container list rather than a live camera; scanning is a deliberate tab.
  const tabs = [
    {
      label: "View Containers",
      component: (
        <ContainersTab
          isSmallScreen={isSmallScreen}
          containers={containers}
          items={items}
          areas={areas}
        />
      ),
    },
    {
      label: "QrCode Scanner",
      component: <QrCodeTab isSmallScreen={isSmallScreen} />,
    },
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
