import "dotenv/config";
import { app } from "./app.ts";
import { prisma } from "./db/prisma.ts";

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, () => {
  console.log(`MLBB Shop API berjalan di http://localhost:${port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\nMenerima ${signal}, menutup server...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
