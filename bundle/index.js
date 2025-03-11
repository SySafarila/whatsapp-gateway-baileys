"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// dist/whatsApp.js
var require_whatsApp = __commonJS({
  "dist/whatsApp.js"(exports2) {
    "use strict";
    var __createBinding2 = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault2 = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar2 = exports2 && exports2.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding2(result, mod, k[i]);
        }
        __setModuleDefault2(result, mod);
        return result;
      };
    }();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.whatsAppQr = exports2.whatsApp = void 0;
    exports2.connectToWhatsApp = connectToWhatsApp;
    exports2.isLoggedIn = isLoggedIn;
    exports2.logoutAndRestartWhatsApp = logoutAndRestartWhatsApp;
    var baileys_1 = __importStar2(require("@whiskeysockets/baileys"));
    var axios_1 = __importStar2(require("axios"));
    var promises_1 = __importDefault(require("node:fs/promises"));
    var qrcode_1 = __importDefault(require("qrcode"));
    var whatsApp = null;
    exports2.whatsApp = whatsApp;
    var whatsAppQr = null;
    exports2.whatsAppQr = whatsAppQr;
    function isLoggedIn() {
      return whatsApp !== null && whatsApp.user !== void 0;
    }
    async function logoutAndRestartWhatsApp(sock) {
      if (!whatsApp) {
        return;
      }
      console.log("Logging out...");
      try {
        await sock.logout();
      } catch (error) {
        console.error("Logout failed:", error);
      }
      try {
        await promises_1.default.rm("auth_info_baileys", { recursive: true, force: true });
        console.log("Auth info deleted.");
      } catch (error) {
        console.error("Failed to delete auth folder:", error);
      }
      console.log("Restarting connection...");
      connectToWhatsApp();
    }
    async function connectToWhatsApp() {
      const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)("auth_info_baileys");
      const sock = (0, baileys_1.default)({
        printQRInTerminal: true,
        auth: state
      });
      exports2.whatsApp = whatsApp = sock;
      sock.ev.on("creds.update", saveCreds);
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          qrcode_1.default.toDataURL(qr, (err, url) => {
            exports2.whatsAppQr = whatsAppQr = url;
          });
          const qrUrl = process.env.RECEIVE_QR_URL;
          if (qrUrl) {
            try {
              await axios_1.default.post(qrUrl, { whatsAppQr }, {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json"
                }
              });
              console.log(`QR Sent to ${qrUrl}`);
            } catch (error) {
              console.error(`Fail to send QR to ${qrUrl}`);
              if (error instanceof axios_1.AxiosError) {
                console.error("Message:", error.response?.statusText ?? "No response");
              }
            }
          } else {
            console.error("QR not sent anywhere because RECEIVE_QR_URL is undefined");
          }
        }
        if (connection === "close") {
          console.info("CONNECTION CLOSE");
          exports2.whatsAppQr = whatsAppQr = null;
          const lastError = lastDisconnect?.error;
          const statusCode = lastError?.output?.statusCode;
          if (statusCode === baileys_1.DisconnectReason.loggedOut) {
            console.log("User logged out, removing auth and restarting...");
            await logoutAndRestartWhatsApp(sock);
          } else {
            console.error("TRY RECONNECT");
            connectToWhatsApp();
          }
        } else if (connection === "open") {
          exports2.whatsAppQr = whatsAppQr = null;
          console.info("CONNECTED.");
        }
      });
      sock.ev.on("messages.upsert", async (m) => {
        if (!m.messages[0].key.fromMe) {
          console.log({
            message: m.messages[0].message?.conversation,
            from: m.messages[0].key.remoteJid
          });
          await sock.sendMessage(m.messages[0].key.remoteJid, {
            react: {
              text: "\u{1F44C}",
              key: m.messages[0].key
            }
          });
        }
      });
    }
  }
});

// dist/controllers/WhatsappController.js
var require_WhatsappController = __commonJS({
  "dist/controllers/WhatsappController.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var whatsApp_12 = require_whatsApp();
    var WhatsappController = class {
    };
    WhatsappController.getStatus = (_req, res) => {
      res.json({
        logged_in: (0, whatsApp_12.isLoggedIn)()
      });
    };
    WhatsappController.getQR = (_req, res) => {
      res.json({
        qr: whatsApp_12.whatsAppQr
      });
    };
    WhatsappController.logout = (_req, res) => {
      if (!whatsApp_12.whatsApp?.user) {
        res.status(401).json({
          message: "WhatsApp not logged in"
        });
      } else {
        (0, whatsApp_12.logoutAndRestartWhatsApp)(whatsApp_12.whatsApp);
        res.json({
          message: "Logout success"
        });
      }
    };
    WhatsappController.sendMessage = (req, res) => {
      const { message, phone_number } = req.body;
      if (!message || !phone_number) {
        res.status(400).json({
          message: "message or number are required"
        });
      }
      if (whatsApp_12.whatsApp && whatsApp_12.whatsApp.user) {
        whatsApp_12.whatsApp.sendMessage(String(phone_number + "@s.whatsapp.net"), {
          text: message
        }).then(() => {
          res.json({
            message: "success"
          });
        }).catch(() => {
          res.status(500).json({
            message: "failed"
          });
        });
      } else {
        res.status(401).json({
          message: "whatsapp client not started"
        });
      }
    };
    exports2.default = WhatsappController;
  }
});

// dist/express.js
var require_express = __commonJS({
  "dist/express.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.expressPort = void 0;
    var express_12 = __importDefault(require("express"));
    var WhatsappController_1 = __importDefault(require_WhatsappController());
    var app = (0, express_12.default)();
    var expressPort = process.env.APP_PORT || 3e3;
    exports2.expressPort = expressPort;
    app.use(express_12.default.json());
    app.get("/", (_req, res) => {
      res.json({
        message: "Hello world"
      });
    });
    app.get("/status", WhatsappController_1.default.getStatus);
    app.get("/qr", WhatsappController_1.default.getQR);
    app.post("/logout", WhatsappController_1.default.logout);
    app.post("/send-message", WhatsappController_1.default.sendMessage);
    exports2.default = app;
  }
});

// dist/index.js
var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: function() {
      return m[k];
    } };
  }
  Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
} : function(o, v) {
  o["default"] = v;
});
var __importStar = exports && exports.__importStar || /* @__PURE__ */ function() {
  var ownKeys = function(o) {
    ownKeys = Object.getOwnPropertyNames || function(o2) {
      var ar = [];
      for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
      for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    }
    __setModuleDefault(result, mod);
    return result;
  };
}();
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importStar(require_express());
var whatsApp_1 = require_whatsApp();
(0, whatsApp_1.connectToWhatsApp)().then(() => {
  express_1.default.listen(express_1.expressPort, () => {
    console.info(`Express server running on port ${express_1.expressPort}`);
  });
}).catch((er) => {
  console.error(er);
  process.exit(1);
});
