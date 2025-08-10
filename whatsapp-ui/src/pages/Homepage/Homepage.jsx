import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import ChatBox from "../../components/ChatBox/ChatBox";
import { getAllContacts, getMessagesByWaId, sendMessage, sendMessageWithAttachment } from "../../api/index";
import socket from "../../socket";
import "./Homepage.css";

const BOT_NUMBER = (import.meta.env.VITE_BOT_NUMBER || "918329446654").toString();


const filenameFromUrl = (url) => {
  if (!url) return null;
  const seg = url.split("/").pop().split("?")[0];
  try { return decodeURIComponent(seg); } catch { return seg; }
};

const stripTimestampPrefix = (rawName) => {
  if (!rawName) return rawName || "";
  const name = rawName.split("/").pop().split("?")[0];
  const m = name.match(/^(?:(?:\d{6,})[_\-\s\.]*)+(.+)$/);
  if (m && m[1]) return m[1];
  const m2 = name.match(/^v\d+\/(.+)$/);
  if (m2 && m2[1]) return m2[1];
  return name;
};

const humanize = (raw) => {
  if (!raw) return raw || "";
  const withoutExt = raw.replace(/\.[^.]+$/, "");
  return withoutExt.replace(/[_\-\s]+/g, " ").replace(/\s+/g, " ").trim();
};

const normalizeAttachmentsOnMessage = (msg) => {
  if (!msg) return msg;

  if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
    const attachments = msg.attachments.map((att) => {
      if (!att) return att;

      if (typeof att === "string") {
        const url = att;
        const filename = filenameFromUrl(url);
        const raw = filename;
        const stripped = stripTimestampPrefix(raw);
        const displayName = humanize(stripped);
        return { url, filename, originalName: null, displayName };
      }

      const url = att.url || att.fileUrl || att.path || att.downloadUrl || null;
      const filename = att.originalName || att.filename || (url ? filenameFromUrl(url) : null);
      const raw = att.originalName || filename || "";
      const stripped = stripTimestampPrefix(raw);
      const displayName = humanize(att.displayName || stripped);
      return {
        ...att,
        url,
        filename,
        originalName: att.originalName || att.originalname || null,
        displayName,
      };
    });

    return { ...msg, attachments };
  }

  const possibleUrl = msg.attachmentUrl || msg.fileUrl || msg.url || msg.path || null;
  if (possibleUrl) {
    const url = possibleUrl;
    const filename = msg.originalFileName || msg.filename || filenameFromUrl(url);
    const raw = msg.originalFileName || filename || "";
    const stripped = stripTimestampPrefix(raw);
    const displayName = humanize(stripped);
    const attachmentObj = {
      url,
      filename,
      originalName: msg.originalFileName || msg.originalname || null,
      displayName,
    };
    return { ...msg, attachments: [attachmentObj] };
  }

  return msg;
};


function Homepage() {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const justSentMessages = useRef([]);

  useEffect(() => {
    (async () => {
      const list = await getAllContacts();
      setContacts(list || []);
    })();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const onNewMessage = (incoming) => {
      if (!incoming || !incoming.wa_id) return;

      const msg = normalizeAttachmentsOnMessage(incoming);

      console.log("🔍 Socket received message:", msg);

      setMessages((prev) => {
        const currentMessages = prev[msg.wa_id] || [];
        const existsById = currentMessages.some((m) => String(m._id) === String(msg._id));
        if (existsById) return prev;

        const matchedTempIndex = justSentMessages.current.findIndex((j) => {
          if (j.wa_id !== msg.wa_id) return false;

          if ((j.message || "") && (msg.message || "")) {
            const jTime = new Date(j.timestampISO).getTime();
            const msgTime = new Date(msg.timestamp).getTime();
            if ((j.message || "") !== (msg.message || "")) return false;
            return Math.abs(jTime - msgTime) <= 5000;
          }

          if (j.originalFileName && msg.attachments && msg.attachments.length) {
            const serverName = (msg.attachments[0].displayName || msg.attachments[0].originalName || msg.attachments[0].filename || "").toString();
            if (serverName && serverName === j.originalFileName) {
              const jTime = new Date(j.timestampISO).getTime();
              const msgTime = new Date(msg.timestamp).getTime();
              return Math.abs(jTime - msgTime) <= 5000;
            }
          }

          const jTime = new Date(j.timestampISO).getTime();
          const msgTime = new Date(msg.timestamp).getTime();
          return Math.abs(jTime - msgTime) <= 3000;
        });

        if (matchedTempIndex !== -1) {
          justSentMessages.current.splice(matchedTempIndex, 1);
          const filtered = currentMessages.filter(
            (m) =>
              !(
                String(m._id).startsWith("temp-") &&
                Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) <= 5000
              )
          );
          return { ...prev, [msg.wa_id]: filtered };
        }

        return { ...prev, [msg.wa_id]: [...currentMessages, msg] };
      });

      if (msg.direction === "inbound") {
        setContacts((prev) =>
          prev.map((c) =>
            c.wa_id === msg.wa_id
              ? {
                ...c,
                lastMessage: msg.message || "📎 Attachment",
                lastMessageTime: msg.timestamp,
                unreadCount: selectedContact?.wa_id === msg.wa_id ? c.unreadCount : (c.unreadCount || 0) + 1,
              }
              : c
          )
        );
      }
    };

    socket.on("new_message", onNewMessage);
    return () => socket.off("new_message", onNewMessage);
  }, [selectedContact]);

  const handleContactSelect = async (contact) => {
    setSelectedContact(contact);
    if (isMobile) setShowSidebar(false);

    const historyRaw = await getMessagesByWaId(contact.wa_id);
    const history = (historyRaw || []).map((m) => normalizeAttachmentsOnMessage(m));
    setMessages((prev) => ({ ...prev, [contact.wa_id]: history }));

    setContacts((prev) => prev.map((c) => (c.wa_id === contact.wa_id ? { ...c, unreadCount: 0 } : c)));
  };

  const setMessagesForContact = (newMsgs) => {
    if (!selectedContact) return;
    setMessages((prev) => ({ ...prev, [selectedContact.wa_id]: newMsgs }));
  };

  const handleSendMessage = async (newMessage, file = null) => {
    if (!newMessage?.wa_id) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestampISO = new Date().toISOString();

    const optimisticAttachments = file
      ? [
        {
          url: URL.createObjectURL(file),
          filename: file.name,
          originalName: file.name,
          displayName: humanize(stripTimestampPrefix(file.name || "")),
          mimeType: file.type,
          size: file.size,
          type: file.type?.startsWith?.("image/") ? "image" : file.type?.startsWith?.("video/") ? "video" : file.type?.startsWith?.("audio/") ? "audio" : "document",
        },
      ]
      : [];

    const tempMsg = {
      ...newMessage,
      _id: tempId,
      from: BOT_NUMBER,
      direction: "outbound",
      timestamp: timestampISO,
      status: "sending",
      attachments: optimisticAttachments,
      attachmentUrl: file ? optimisticAttachments[0].url : null,
    };

    justSentMessages.current.push({
      id: tempId,
      wa_id: newMessage.wa_id,
      message: newMessage.message || "",
      timestampISO,
      originalFileName: file?.name || null,
    });

    const oneMinuteAgo = Date.now() - 60000;
    justSentMessages.current = justSentMessages.current.filter((j) => {
      const t = new Date(j.timestampISO).getTime();
      return t > oneMinuteAgo;
    });

    setMessages((prev) => {
      const arr = prev[newMessage.wa_id] || [];
      return { ...prev, [newMessage.wa_id]: [...arr, tempMsg] };
    });

    setContacts((prev) =>
      prev.map((c) => (c.wa_id === newMessage.wa_id ? { ...c, lastMessage: newMessage.message || (file ? `📎 ${file.name}` : ""), lastMessageTime: timestampISO } : c))
    );

    try {
      let serverMsg = null;
      if (file) {
        serverMsg = await sendMessageWithAttachment(newMessage.wa_id, newMessage.message || "", newMessage.user_name, file);
      } else {
        serverMsg = await sendMessage(newMessage.wa_id, newMessage.message || "", newMessage.user_name);
      }

      if (serverMsg?.data) serverMsg = serverMsg.data;
      if (serverMsg?.success && serverMsg.data) serverMsg = serverMsg.data;

      if (serverMsg) {
        serverMsg = normalizeAttachmentsOnMessage(serverMsg);

        setMessages((prev) => {
          const arr = prev[newMessage.wa_id] || [];
          return { ...prev, [newMessage.wa_id]: arr.map((m) => (String(m._id) === String(tempId) ? { ...m, status: "sent" } : m)) };
        });

        setTimeout(() => {
          setMessages((prev) => {
            const arr = prev[newMessage.wa_id] || [];
            const serverExists = arr.some((m) => String(m._id) === String(serverMsg._id));
            const tempIndex = arr.findIndex((m) => String(m._id) === String(tempId));

            if (serverExists) {
              const newArr = arr.filter((m) => String(m._id) !== String(tempId));
              justSentMessages.current = justSentMessages.current.filter((j) => j.id !== tempId);
              return { ...prev, [newMessage.wa_id]: newArr };
            }

            if (tempIndex !== -1) {
              const newArr = [...arr];
              newArr[tempIndex] = { ...serverMsg, attachments: serverMsg.attachments || tempMsg.attachments };
              justSentMessages.current = justSentMessages.current.filter((j) => j.id !== tempId);
              return { ...prev, [newMessage.wa_id]: newArr };
            } else {
              return { ...prev, [newMessage.wa_id]: [...arr, serverMsg] };
            }
          });
        }, 100);
      } else {
        setMessages((prev) => {
          const arr = prev[newMessage.wa_id] || [];
          return { ...prev, [newMessage.wa_id]: arr.map((m) => (m._id === tempId ? { ...m, status: "failed" } : m)) };
        });
      }
    } catch (err) {
      console.error("Send/upload failed:", err);
      setMessages((prev) => {
        const arr = prev[newMessage.wa_id] || [];
        return { ...prev, [newMessage.wa_id]: arr.map((m) => (m._id === tempId ? { ...m, status: "failed", error: err.message } : m)) };
      });
    }
  };

  const handleBack = () => {
    setShowSidebar(true);
    if (isMobile) setSelectedContact(null);
  };

  return (
    <div className="homepage-container">
      <div className="top-bar" />
      <div className="main-container">
        <div className="whatsapp-container">
          {(!isMobile || showSidebar) && (
            <Sidebar contacts={contacts} selectedContact={selectedContact} onSelect={handleContactSelect} isMobile={isMobile} onClose={() => setShowSidebar(false)} />
          )}
          {(!isMobile || !showSidebar) && (
            <ChatBox
              contact={selectedContact}
              messages={messages[selectedContact?.wa_id] || []}
              setMessagesForContact={setMessagesForContact}
              isMobile={isMobile}
              onBackClick={handleBack}
              onSendMessage={handleSendMessage}
              contacts={contacts}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
