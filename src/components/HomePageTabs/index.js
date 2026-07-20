import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { BarcodeTab, ItemsTab, ExpiringTab, ShoppingListTab } from "./Tabs";
import HomeDashboard from "../HomeDashboard";
import { getAllItems, getAllContainers } from "../../utilities/api";

const HomePageTabs = ({ isSmallScreen }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [containers, setContainers] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Let the dashboard jump to a sibling tab by name.
  const tabIndexByKey = { items: 1, scanner: 2, shopping: 3, expiring: 4 };
  const goToTab = (key) => setTabIndex(tabIndexByKey[key] ?? 0);

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

  // Define tab configurations. "Overview" leads so the app opens on an
  // at-a-glance dashboard rather than a live camera; scanning is a deliberate
  // tab. (Keys in tabIndexByKey above must match this order.)
  const tabs = [
    {
      label: "Overview",
      component: (
        <HomeDashboard items={items} containers={containers} onGoTo={goToTab} />
      ),
    },
    {
      label: "View Items",
      component: <ItemsTab isSmallScreen={isSmallScreen} items={items} />,
    },
    {
      label: "Barcode Scanner",
      component: <BarcodeTab isSmallScreen={isSmallScreen} />,
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
