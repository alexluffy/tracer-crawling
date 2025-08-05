import { db } from "../src/lib/db";
import { wallets, walletTags } from "../src/lib/db/schema";
import { readFileSync } from "fs";
import { join } from "path";

interface OTCWallet {
  source: string;
  currency: string;
  platform: string;
  description: string;
  walletType: string;
  address: string;
}

interface OTCData {
  otcWallets: OTCWallet[];
}

// Hàm để xác định chain từ currency và address
function getChainFromCurrency(currency: string, address: string): string {
  if (currency === "BTC") {
    return "bitcoin";
  } else if (currency === "ETH" && address.startsWith("0x")) {
    return "ethereum";
  }
  // Mặc định là ethereum nếu không xác định được
  return "ethereum";
}

// Hàm để tạo owner name từ platform
function generateOwnerName(platform: string): string {
  if (platform.includes("x.com") || platform.includes("twitter.com")) {
    // Lấy username từ URL Twitter/X
    const match = platform.match(/(?:x\.com|twitter\.com)\/([^/?]+)/);
    return match ? `@${match[1]}` : "OTC Provider";
  } else if (platform === "Remitano") {
    return "Remitano OTC";
  }
  return "OTC Provider";
}

async function importOTCWallets() {
  try {
    console.log("🚀 Bắt đầu import dữ liệu OTC wallets...");

    // Đọc file JSON
    const filePath = join(__dirname, "../src/mock/mock-otc-address/otc-address.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const otcData: OTCData = JSON.parse(fileContent);

    console.log(`📊 Tìm thấy ${otcData.otcWallets.length} ví OTC để import`);

    let successCount = 0;
    let errorCount = 0;

    for (const otcWallet of otcData.otcWallets) {
      try {
        const { address, currency, platform } = otcWallet;
        
        // Chuẩn hóa địa chỉ ví
        const normalizedAddress = address.toLowerCase();
        const chain = getChainFromCurrency(currency, address);
        const ownerName = generateOwnerName(platform);

        // Kiểm tra xem ví đã tồn tại chưa
        const existingWallet = await db
          .select()
          .from(wallets)
          .where(eq(wallets.address, normalizedAddress))
          .limit(1);

        let walletAddress = normalizedAddress;

        if (existingWallet.length === 0) {
          // Tạo wallet mới nếu chưa tồn tại
          await db.insert(wallets).values({
            address: normalizedAddress,
            ownerName,
            chain,
            searchCount: 0,
          });
          console.log(`✅ Đã tạo wallet mới: ${normalizedAddress}`);
        } else {
          // Cập nhật thông tin nếu cần
          await db
            .update(wallets)
            .set({
              ownerName,
              chain,
              updatedAt: new Date(),
            })
            .where(eq(wallets.address, normalizedAddress));
          console.log(`🔄 Đã cập nhật wallet: ${normalizedAddress}`);
        }

        // Kiểm tra xem tag OTC đã tồn tại chưa
        const existingTag = await db
          .select()
          .from(walletTags)
          .where(
            and(
              eq(walletTags.walletAddress, normalizedAddress),
              eq(walletTags.tagType, "otc")
            )
          )
          .limit(1);

        if (existingTag.length === 0) {
          // Thêm tag OTC
          await db.insert(walletTags).values({
            walletAddress: normalizedAddress,
            tagType: "otc",
            addedBy: null, // System import
          });
          console.log(`🏷️  Đã thêm tag OTC cho: ${normalizedAddress}`);
        } else {
          console.log(`⚠️  Tag OTC đã tồn tại cho: ${normalizedAddress}`);
        }

        successCount++;
      } catch (error) {
        console.error(`❌ Lỗi khi import ví ${otcWallet.address}:`, error);
        errorCount++;
      }
    }

    console.log("\n📈 Kết quả import:");
    console.log(`✅ Thành công: ${successCount} ví`);
    console.log(`❌ Lỗi: ${errorCount} ví`);
    console.log(`📊 Tổng cộng: ${otcData.otcWallets.length} ví`);

    if (errorCount === 0) {
      console.log("\n🎉 Import hoàn tất thành công!");
    } else {
      console.log(`\n⚠️  Import hoàn tất với ${errorCount} lỗi`);
    }

  } catch (error) {
    console.error("💥 Lỗi khi import dữ liệu:", error);
    process.exit(1);
  }
}

// Import missing functions
import { eq, and } from "drizzle-orm";

// Chạy script
if (require.main === module) {
  importOTCWallets()
    .then(() => {
      console.log("✨ Script hoàn tất");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script thất bại:", error);
      process.exit(1);
    });
}

export { importOTCWallets };