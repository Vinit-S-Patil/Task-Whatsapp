import express from "express";
import {
    getAllMessagesByWaId,
    getUniqueContacts,
    sendMessage
} from "../controllers/message_controller.js";

const router = express.Router();

router.get("/messages/:wa_id", getAllMessagesByWaId);
router.get("/contacts", getUniqueContacts);
router.post("/send", sendMessage);

export default router;
