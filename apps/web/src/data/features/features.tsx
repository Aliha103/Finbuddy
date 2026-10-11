// Export icon names instead of components to avoid huge imports,
// or import them if we decide to render in the component.
// Better approach for maintenance: Import icons here so we can swap them easily.
import {
  FaHandHoldingUsd,
  FaChartPie,
  FaChartLine,
  FaBrain,
  FaBolt,
  FaBullseye,
  FaBell
} from "react-icons/fa";
import { IconType } from "react-icons";

export interface FeatureItem {
  icon: IconType;
  title: string;
  description: string;
  color: string;
}

const features: FeatureItem[] = [
  {
    icon: FaHandHoldingUsd,
    title: "Split Your Expense",
    description: "Easily split bills with friends, roommates, or group trips.",
    color: "#4ECDC4"
  },
  {
    icon: FaChartPie,
    title: "Track Your Budget",
    description: "Stay on top of your spending with categorized tracking.",
    color: "#FF6B6B"
  },
  {
    icon: FaChartLine,
    title: "Visualize Your Finances",
    description: "See clear charts for income, spending, and growth.",
    color: "#FFE66D"
  },
  {
    icon: FaBrain,
    title: "Forecast Spending",
    description: "Use AI to project your upcoming expenses.",
    color: "#1A535C"
  },
  {
    icon: FaBolt,
    title: "Log Expenses Fast",
    description: "Quick entry tools make daily tracking a breeze.",
    color: "#F7FFF7"
  },
  {
    icon: FaBullseye,
    title: "Plan Financial Goals",
    description: "Create saving goals and monitor progress.",
    color: "#FF9F1C"
  },
  {
    icon: FaBell,
    title: "Never Miss a Bill",
    description: "Get automatic reminders before bills are due.",
    color: "#2EC4B6"
  },
];

export default features;
