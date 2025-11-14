import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "Menu",
    items: [
      {
        title: "Welcome",
        url: "/",
        icon: Icons.WelcomeIcon,          // Good for general menu
        moduleNumber: 1001,
        items: [],
      },

      {
        title: "Daily Sales Report",
        url: "/DashboardSales",
        icon: Icons.RupeeIcon,           // ✔ Proper Sales / Revenue Icon
        moduleNumber: 1002,
        items: [],
      },

      {
        title: "Category Reports",
        icon: Icons.BarChartIcon,        // ✔ Multi-report / Charts icon
        moduleNumber: 1003,
        items: [
          {
            title: "Margin Report",
            url: "/MarginReport",
            icon: Icons.GrowthUpIcon,    // ✔ Profit / Margin icon
            moduleNumber: 10031,
          },
          {
            title: "Category Report",
            url: "/CategoryClassificationReport",
            icon: Icons.CategoryIcon,    // ✔ Category grid icon
            moduleNumber: 10032,
          },
        ],
      },
    ],
  },
];
