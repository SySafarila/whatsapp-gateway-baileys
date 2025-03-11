import { Boom } from '@hapi/boom';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import axios, { AxiosError } from 'axios';
import fs from 'node:fs/promises';
import QRCode from 'qrcode';

let whatsApp: ReturnType<typeof makeWASocket> | null = null;
let whatsAppQr: string | null = null;

function isLoggedIn(): boolean {
  return whatsApp !== null && whatsApp.user !== undefined;
}

async function logoutAndRestartWhatsApp(sock: ReturnType<typeof makeWASocket>) {
  if (!whatsApp) {
    return;
  }

  console.log('Logging out...');

  try {
    await sock.logout(); // Logout dari WhatsApp
  } catch (error) {
    console.error('Logout failed:', error);
  }

  try {
    await fs.rm('auth_info_baileys', { recursive: true, force: true });
    console.log('Auth info deleted.');
  } catch (error) {
    console.error('Failed to delete auth folder:', error);
  }

  console.log('Restarting connection...');
  connectToWhatsApp(); // Restart koneksi untuk menampilkan QR kembali
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  whatsApp = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      QRCode.toDataURL(qr, (err, url) => {
        whatsAppQr = url;
      });

      const qrUrl = process.env.RECEIVE_QR_URL;
      if (qrUrl) {
        try {
          await axios.post(
            qrUrl,
            { whatsAppQr },
            {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            },
          );
          console.log(`QR Sent to ${qrUrl}`);
        } catch (error) {
          console.error(`Fail to send QR to ${qrUrl}`);
          if (error instanceof AxiosError) {
            console.error(
              'Message:',
              error.response?.statusText ?? 'No response',
            );
          }
        }
      } else {
        console.error(
          'QR not sent anywhere because RECEIVE_QR_URL is undefined',
        );
      }
    }

    if (connection === 'close') {
      console.info('CONNECTION CLOSE');
      whatsAppQr = null;
      const lastError = lastDisconnect?.error as Boom | undefined;
      const statusCode = lastError?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('User logged out, removing auth and restarting...');
        await logoutAndRestartWhatsApp(sock);
      } else {
        console.error('TRY RECONNECT');
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      whatsAppQr = null;
      console.info('CONNECTED.');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (!m.messages[0].key.fromMe) {
      console.log({
        message: m.messages[0].message?.conversation,
        from: m.messages[0].key.remoteJid,
      });

      await sock.sendMessage(m.messages[0].key.remoteJid!, {
        react: {
          text: '👌',
          key: m.messages[0].key,
        },
      });
    }
  });
}

// Jalankan koneksi
// connectToWhatsApp();

export {
  connectToWhatsApp,
  isLoggedIn,
  logoutAndRestartWhatsApp,
  whatsApp,
  whatsAppQr,
};
