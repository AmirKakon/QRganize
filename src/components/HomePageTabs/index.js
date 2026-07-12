import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { BarcodeTab, ItemsTab, ExpiringTab, ShoppingListTab } from "./Tabs";
import { getAllItems, getAllContainers } from "../../utilities/api";

const HomePageTabs = ({ isSmallScreen }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [containers, setContainers] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const loadItems = useCallback(() => {
    return getAllItems()
      .then((res) => setItems(res || []))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    loadItems();
    getAllContainers()
      .then((res) => setContainers(res || []))
      .catch((error) => console.error("Error fetching containers:", error));
  }, [loadItems]);

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
      component: <ShoppingListTab items={items.filter((a) => a.shoppingList ?? false)} onListChanged={loadItems} />,
    },
    {
      label: "Expiring Soon",
      component: <ExpiringTab items={items} containers={containers} onChanged={loadItems} />,
    },
  ];

  return (
    <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab.label} />
        ))}
      </Tabs>
      {tabs[tabIndex]?.component}
    </Paper>
  );
};

export default HomePageTabs;
