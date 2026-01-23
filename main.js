const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const chalk = require("chalk");
const figlet = require("figlet");
const readline = require("readline");
const PremoBug = require("./PremoBug");

async function askPairCode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question("Enter your PAIR CODE: ", code => {
            rl.close();
            resolve(code.trim());
        });
    });
}

async function startBot() {
    console.log(chalk.green(figlet.textSync("PREMO BOT")));

    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    const pairCode = await askPairCode();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        mobile: false
    });

    await sock.requestPairingCode(pairCode);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || "";

        if (text.toLowerCase() === "bug") {
            await PremoBug.sendBug(sock, from, "default");
        }
    });
}

startBot();
