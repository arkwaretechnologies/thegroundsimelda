import net from "node:net";

const PORT = Number(process.env.PORT) || 3000;

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "127.0.0.1");
  });
}

const busy = await portInUse(PORT);
if (busy) {
  console.error(
    `\nPort ${PORT} is already in use. Stop the other Next.js dev server first ` +
      `(only one \`npm run dev\` per project — shared .next causes _buildManifest ENOENT).\n`
  );
  process.exit(1);
}
