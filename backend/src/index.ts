import "dotenv/config";
import app from "./app";
import { startScheduler } from "./lib/scheduler";

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`HalalChain API running on http://localhost:${PORT}`);
  startScheduler();
});
