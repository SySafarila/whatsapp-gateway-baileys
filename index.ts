import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({
    // can provide additional config here
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect!.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect!.error,
        ", reconnecting ",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    // if message is not from me
    if (!m.messages[0].key.fromMe) {
      console.log({
        message: m.messages[0].message?.conversation,
        from: m.messages[0].key.remoteJid,
      });

      // send message
      //   await sock.sendMessage(m.messages[0].key.remoteJid!, {
      //     text: "Helo",
      //   });

      // react message
      await sock.sendMessage(m.messages[0].key.remoteJid!, {
        react: {
          text: "👌",
          key: m.messages[0].key,
        },
      });
    }
  });
}
// run in main file
connectToWhatsApp();
