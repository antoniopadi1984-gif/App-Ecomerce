import { getDashboardKPIData, getRecentOrdersDashboard, getMarketingCampaignsDashboard } from "./actions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // Fetch data on the server
  const [kpi, orders, campaigns] = await Promise.all([
    getDashboardKPIData(),
    getRecentOrdersDashboard(),
    getMarketingCampaignsDashboard()
  ]);

  return (
    <DashboardClient
      initialKpi={kpi}
      initialOrders={orders}
      initialCampaigns={campaigns}
    />
  );
}
