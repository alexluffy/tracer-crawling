import { db } from "../src/lib/db";
import { wallets, walletTags } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkOTCData() {
  try {
    console.log("🔍 Kiểm tra dữ liệu OTC đã import...");

    // Đếm tổng số ví có tag OTC
    const otcWallets = await db
      .select({
        address: wallets.address,
        ownerName: wallets.ownerName,
        chain: wallets.chain,
        tagType: walletTags.tagType,
      })
      .from(wallets)
      .innerJoin(walletTags, eq(wallets.address, walletTags.walletAddress))
      .where(eq(walletTags.tagType, "otc"));

    console.log(`\n📊 Tổng số ví OTC: ${otcWallets.length}`);

    // Thống kê theo chain
    const chainStats = otcWallets.reduce((acc, wallet) => {
      acc[wallet.chain] = (acc[wallet.chain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n🔗 Thống kê theo chain:");
    Object.entries(chainStats).forEach(([chain, count]) => {
      console.log(`  ${chain}: ${count} ví`);
    });

    // Thống kê theo platform (owner name)
    const platformStats = otcWallets.reduce((acc, wallet) => {
      const platform = wallet.ownerName || "Unknown";
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n🏢 Thống kê theo platform:");
    Object.entries(platformStats).forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count} ví`);
    });

    // Hiển thị một số ví mẫu
    console.log("\n📝 Một số ví OTC mẫu:");
    otcWallets.slice(0, 5).forEach((wallet, index) => {
      console.log(`  ${index + 1}. ${wallet.address}`);
      console.log(`     Platform: ${wallet.ownerName}`);
      console.log(`     Chain: ${wallet.chain}`);
      console.log("");
    });

    console.log("✅ Kiểm tra hoàn tất!");

  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra dữ liệu:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  checkOTCData()
    .then(() => {
      console.log("✨ Script hoàn tất");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script thất bại:", error);
      process.exit(1);
    });
}

export { checkOTCData };