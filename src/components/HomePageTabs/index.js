import React, { useState, useEffect } from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { BarcodeTab, ItemsTab } from "./Tabs";
import { getAllItems } from "../../utilities/api";

const HomePageTabs = ({ isSmallScreen }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [items, setItems] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    getAllItems()
      .then((res) => setItems(res))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Define tab configurations
  const tabs = [
    {
      label: "Barcode Scanner",
      component: <BarcodeTab isSmallScreen={isSmallScreen} />,
    },
    {
      label: "View Items",
      component: <ItemsTab isSmallScreen={isSmallScreen} items={items} />,
    },
    {
      label: "Shopping List",
      component: <ItemsTab isSmallScreen={isSmallScreen} items={items.filter((a) => a.shoppingList)} />,
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

export default HomePageTabs;
