import React from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { BarcodeTab, ItemsTab, ExpiringTab, ShoppingListTab } from "./Tabs";
import HomeDashboard from "../HomeDashboard";
import QuickUse from "../QuickUse";
import { useItems, useContainers, useAreas, useRefreshInventory } from "../../utilities/queries";

// The open tab lives in the URL (?tab=items) so Back from an item returns to
// the same tab instead of resetting to Overview.
const TAB_KEYS = ["overview", "items", "use", "scanner", "shopping", "expiring"];

const HomePageTabs = ({ isSmallScreen }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: items } = useItems();
  const { data: containers } = useContainers();
  const { data: areas } = useAreas();
  const refreshInventory = useRefreshInventory();

  const tabIndex = Math.max(0, TAB_KEYS.indexOf(searchParams.get("tab")));

  const goToTab = (key) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", key);
        return next;
      },
      { replace: true }
    );

  const handleTabChange = (event, newValue) => goToTab(TAB_KEYS[newValue]);

  // "Overview" leads so the app opens on an at-a-glance dashboard rather than
  // a live camera; scanning is a deliberate tab. (Order must match TAB_KEYS.)
  const tabs = [
    {
      label: "Overview",
      component: (
        <HomeDashboard items={items} containers={containers} onGoTo={goToTab} />
      ),
    },
    {
      label: "View Items",
      component: (
        <ItemsTab
          isSmallScreen={isSmallScreen}
          items={items}
          containers={containers}
          areas={areas}
          onItemsChanged={refreshInventory}
        />
      ),
    },
    {
      label: "Quick Use",
      component: <QuickUse items={items} onChanged={refreshInventory} />,
    },
    {
      label: "Barcode Scanner",
      component: <BarcodeTab isSmallScreen={isSmallScreen} />,
    },
    {
      label: "Shopping List",
      component: <ShoppingListTab items={items.filter((a) => a.shoppingList ?? false)} onListChanged={refreshInventory} />,
    },
    {
      label: "Expiring Soon",
      component: <ExpiringTab items={items} containers={containers} onChanged={refreshInventory} />,
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
