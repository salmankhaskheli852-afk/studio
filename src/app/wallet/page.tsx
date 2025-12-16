import { WalletClient } from "./WalletClient";
import { transactions, adminWallets } from "@/lib/data";

export default function WalletPage() {
  return <WalletClient transactions={transactions} adminWallets={adminWallets} />;
}
