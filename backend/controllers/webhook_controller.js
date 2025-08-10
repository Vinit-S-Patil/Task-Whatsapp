
// // controller/webhookController.js
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import Message from '../models/Message.js';

// // Setup __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const processPayload = async (req, res) => {
//     try {
//         const payloadDir = path.join(__dirname, '..', 'payloads');
//         const files = fs.readdirSync(payloadDir);

//         for (const file of files) {
//             const filePath = path.join(payloadDir, file);
//             const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

//             const entry = data.metaData?.entry?.[0];
//             const changes = entry?.changes?.[0];
//             const value = changes?.value;

//             // 💬 1. Handle messages
//             const messages = value?.messages || [];
//             const contacts = value?.contacts || [];

//             for (const msg of messages) {
//                 const exists = await Message.findOne({ meta_msg_id: msg.id });
//                 if (!exists) {
//                     const newMsg = new Message({
//                         wa_id: contacts?.[0]?.wa_id || '',
//                         user_name: contacts?.[0]?.profile?.name || '',
//                         message: msg.text?.body || '',
//                         timestamp: new Date(Number(msg.timestamp) * 1000),
//                         status: 'sent',
//                         meta_msg_id: msg.id,
//                     });

//                     await newMsg.save();
//                 }
//             }

//             // 🔄 2. Handle status updates
//             const statuses = value?.statuses || [];
//             for (const statusObj of statuses) {
//                 const msgId = statusObj.meta_msg_id || statusObj.id;
//                 const newStatus = statusObj.status;

//                 await Message.findOneAndUpdate(
//                     { meta_msg_id: msgId },
//                     { status: newStatus },
//                     { new: true }
//                 );
//             }
//         }

//         res.status(200).json({ message: 'All payloads processed successfully (messages + statuses).' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Error processing payloads' });
//     }
// };




// // backend/controllers/webhookController.js
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import Message from '../models/Message.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const processPayload = async (req, res) => {
//     try {
//         const BOT_NUMBER = process.env.BOT_NUMBER || '918329446654';
//         const payloadDir = path.join(__dirname, '..', 'payloads');
//         const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));

//         for (const file of files) {
//             const filePath = path.join(payloadDir, file);
//             const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
//             const entry = data.metaData?.entry?.[0];
//             const changes = entry?.changes?.[0];
//             const value = changes?.value || {};

//             // Handle incoming/outgoing messages
//             if (Array.isArray(value.messages) && value.messages.length > 0) {
//                 const contacts = value.contacts || [];

//                 for (const msg of value.messages) {
//                     const exists = await Message.findOne({ meta_msg_id: msg.id });
//                     if (!exists) {
//                         const fromUser = msg.from !== BOT_NUMBER; // true if contact sent it
//                         const newMsg = new Message({
//                             wa_id: contacts?.[0]?.wa_id || '',
//                             user_name: contacts?.[0]?.profile?.name || '',
//                             message: msg.text?.body || '',
//                             timestamp: new Date(Number(msg.timestamp) * 1000),
//                             status: 'sent', // default until updated
//                             meta_msg_id: msg.id,
//                             from: msg.from, // store actual sender number
//                             direction: fromUser ? 'received' : 'sent' // for frontend bubble position
//                         });
//                         await newMsg.save();
//                     }
//                 }
//             }

//             // Handle status updates
//             if (Array.isArray(value.statuses) && value.statuses.length > 0) {
//                 for (const statusObj of value.statuses) {
//                     const msgId = statusObj.meta_msg_id || statusObj.id;
//                     if (!msgId) continue;

//                     await Message.findOneAndUpdate(
//                         { meta_msg_id: msgId },
//                         { status: statusObj.status },
//                         { new: true }
//                     );
//                 }
//             }
//         }

//         res.status(200).json({ message: 'All payloads processed and stored successfully' });
//     } catch (err) {
//         console.error('Error processing payloads:', err);
//         res.status(500).json({ error: 'Error processing payloads' });
//     }
// };

// // backend/controllers/webhookController.js
// export const incomingMessageHandler = async (req, res) => {
//     try {
//         const { wa_id, text, from } = extractWhatsAppData(req.body); // tumhara parsing logic

//         await Message.create({
//             wa_id,
//             user_name: resolveUserName(wa_id),
//             message: text,
//             status: 'delivered',
//             timestamp: new Date(),
//             from: from || wa_id, // ✅ hamesha sender ka number store karein
//             direction: 'inbound'
//         });

//         return res.sendStatus(200);
//     } catch (err) {
//         console.error("❌ Webhook Error:", err);
//         res.sendStatus(500);
//     }
// };





// // controller/webhookController.js
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import Message from '../models/Message.js';

// // Setup __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const processPayload = async (req, res) => {
//     try {
//         const payloadDir = path.join(__dirname, '..', 'payloads');
//         const files = fs.readdirSync(payloadDir);

//         for (const file of files) {
//             const filePath = path.join(payloadDir, file);
//             const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

//             const entry = data.metaData?.entry?.[0];
//             const changes = entry?.changes?.[0];
//             const value = changes?.value;

//             // 💬 1. Handle messages
//             const messages = value?.messages || [];
//             const contacts = value?.contacts || [];

//             for (const msg of messages) {
//                 const exists = await Message.findOne({ meta_msg_id: msg.id });
//                 if (!exists) {
//                     const newMsg = new Message({
//                         wa_id: contacts?.[0]?.wa_id || '',
//                         user_name: contacts?.[0]?.profile?.name || '',
//                         message: msg.text?.body || '',
//                         timestamp: new Date(Number(msg.timestamp) * 1000),
//                         status: 'sent',
//                         meta_msg_id: msg.id,
//                     });

//                     await newMsg.save();
//                 }
//             }

//             // 🔄 2. Handle status updates
//             const statuses = value?.statuses || [];
//             for (const statusObj of statuses) {
//                 const msgId = statusObj.meta_msg_id || statusObj.id;
//                 const newStatus = statusObj.status;

//                 await Message.findOneAndUpdate(
//                     { meta_msg_id: msgId },
//                     { status: newStatus },
//                     { new: true }
//                 );
//             }
//         }

//         res.status(200).json({ message: 'All payloads processed successfully (messages + statuses).' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Error processing payloads' });
//     }
// };


// // backend/controllers/webhookController.js
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import Message from '../models/Message.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const processPayload = async (req, res) => {
//     try {
//         const BOT_NUMBER = process.env.BOT_NUMBER || '918329446654';
//         const payloadDir = path.join(__dirname, '..', 'payloads');
//         const files = fs.readdirSync(payloadDir);

//         for (const file of files) {
//             const filePath = path.join(payloadDir, file);
//             const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

//             const entry = data.metaData?.entry?.[0];
//             const changes = entry?.changes?.[0];
//             const value = changes?.value;

//             const messages = value?.messages || [];
//             const contacts = value?.contacts || [];

//             for (const msg of messages) {
//                 const exists = await Message.findOne({ meta_msg_id: msg.id });
//                 if (!exists) {
//                     const newMsg = new Message({
//                         wa_id: contacts?.[0]?.wa_id || '',
//                         user_name: contacts?.[0]?.profile?.name || '',
//                         message: msg.text?.body || '',
//                         timestamp: new Date(Number(msg.timestamp) * 1000),
//                         status: 'sent',
//                         meta_msg_id: msg.id,
//                         from: contacts?.[0]?.wa_id || '', // ✅ incoming from contact
//                     });
//                     await newMsg.save();
//                 }
//             }

//             const statuses = value?.statuses || [];
//             for (const statusObj of statuses) {
//                 const msgId = statusObj.meta_msg_id || statusObj.id;
//                 const newStatus = statusObj.status;

//                 await Message.findOneAndUpdate(
//                     { meta_msg_id: msgId },
//                     { status: newStatus },
//                     { new: true }
//                 );
//             }
//         }

//         res.status(200).json({ message: 'All payloads processed successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Error processing payloads' });
//     }
// };


// // backend/controllers/webhookController.js
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import Message from '../models/Message.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const processPayload = async (req, res) => {
//     try {
//         const BOT_NUMBER = process.env.BOT_NUMBER || '918329446654';
//         const payloadDir = path.join(__dirname, '..', 'payloads');
//         const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));

//         for (const file of files) {
//             const filePath = path.join(payloadDir, file);
//             const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
//             const entry = data.metaData?.entry?.[0];
//             const changes = entry?.changes?.[0];
//             const value = changes?.value || {};

//             // Handle incoming/outgoing messages
//             if (Array.isArray(value.messages) && value.messages.length > 0) {
//                 const contacts = value.contacts || [];

//                 for (const msg of value.messages) {
//                     const exists = await Message.findOne({ meta_msg_id: msg.id });
//                     if (!exists) {
//                         const fromUser = msg.from !== BOT_NUMBER; // true if contact sent it
//                         const newMsg = new Message({
//                             wa_id: contacts?.[0]?.wa_id || '',
//                             user_name: contacts?.[0]?.profile?.name || '',
//                             message: msg.text?.body || '',
//                             timestamp: new Date(Number(msg.timestamp) * 1000),
//                             status: 'sent', // default until updated
//                             meta_msg_id: msg.id,
//                             from: msg.from, // store actual sender number
//                             direction: fromUser ? 'received' : 'sent' // for frontend bubble position
//                         });
//                         await newMsg.save();
//                     }
//                 }
//             }

//             // Handle status updates
//             if (Array.isArray(value.statuses) && value.statuses.length > 0) {
//                 for (const statusObj of value.statuses) {
//                     const msgId = statusObj.meta_msg_id || statusObj.id;
//                     if (!msgId) continue;

//                     await Message.findOneAndUpdate(
//                         { meta_msg_id: msgId },
//                         { status: statusObj.status },
//                         { new: true }
//                     );
//                 }
//             }
//         }

//         res.status(200).json({ message: 'All payloads processed and stored successfully' });
//     } catch (err) {
//         console.error('Error processing payloads:', err);
//         res.status(500).json({ error: 'Error processing payloads' });
//     }
// };

// // backend/controllers/webhookController.js
// export const incomingMessageHandler = async (req, res) => {
//     try {
//         const { wa_id, text, from } = extractWhatsAppData(req.body); // tumhara parsing logic

//         await Message.create({
//             wa_id,
//             user_name: resolveUserName(wa_id),
//             message: text,
//             status: 'delivered',
//             timestamp: new Date(),
//             from: from || wa_id, // ✅ hamesha sender ka number store karein
//             direction: 'inbound'
//         });

//         return res.sendStatus(200);
//     } catch (err) {
//         console.error("❌ Webhook Error:", err);
//         res.sendStatus(500);
//     }
// };


// controller/webhookController.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Message from '../models/Message.js';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processPayload = async (req, res) => {
    try {
        const payloadDir = path.join(__dirname, '..', 'payloads');
        const files = fs.readdirSync(payloadDir);

        for (const file of files) {
            const filePath = path.join(payloadDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            const entry = data.metaData?.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // 1) Handle messages
            const messages = value?.messages || [];
            const contacts = value?.contacts || [];

            for (const msg of messages) {
                // build a minimal query for idempotency
                const metaId = msg.id;
                if (!metaId) continue;

                const exists = await Message.findOne({ meta_msg_id: metaId }).lean();
                if (exists) continue; // already stored

                // Build doc with only the fields we want
                const doc = {
                    wa_id: contacts?.[0]?.wa_id || '',            // recipient/user's phone (or '' if missing)
                    user_name: contacts?.[0]?.profile?.name || '',
                    message: msg.text?.body || '',
                    timestamp: new Date(Number(msg.timestamp) * 1000), // convert seconds -> ms
                    status: 'sent',                                 // default until status update
                    meta_msg_id: metaId,
                };

                // set 'from' preferentially from the message (msg.from). If not present, fallback to contact wa_id
                if (msg.from) {
                    doc.from = msg.from;
                } else if (contacts?.[0]?.wa_id) {
                    doc.from = contacts[0].wa_id;
                }

                // Only keys included in doc will be stored. Schema defaults for keys not present won't be forced here.
                await Message.create(doc);
            }

            // 2) Handle statuses
            const statuses = value?.statuses || [];
            for (const statusObj of statuses) {
                const msgId = statusObj.meta_msg_id || statusObj.id;
                if (!msgId) continue;

                const newStatus = statusObj.status;
                const ts = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1000) : undefined;

                // update status and optionally update timestamp when status timestamp exists
                const update = { status: newStatus };
                if (ts) update.timestamp = ts;

                await Message.findOneAndUpdate(
                    { meta_msg_id: msgId },
                    { $set: update },
                    { new: true }
                );
            }
        } // files loop

        res.status(200).json({ message: 'All payloads processed successfully (messages + statuses).' });
    } catch (err) {
        console.error('processPayload error:', err);
        res.status(500).json({ error: 'Error processing payloads' });
    }
};
