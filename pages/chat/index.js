import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
import { useRouter } from "next/router";

function Chat() {
  const { data: session } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session]);

  const userEmail = session?.user?.email;
  const userImage = session?.user?.image;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(
      process.env.SOCKET_URL
    );
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("message", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });
    }
  }, [socket]);

  useEffect(() => {
    // Scroll to the end of the chat messages when a new message is added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      const newMessage = { message, email: userEmail, image: userImage };
      socket.emit("message", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow bg-gray-200 p-4 overflow-y-auto">
        {messages.map((msg, index) => {
          const isSentByCurrentUser = msg.email === userEmail;
          return (
            <div
              key={index}
              className={`flex ${
                isSentByCurrentUser ? "justify-end" : "justify-start"
              } mb-2`}
            >
              <img
                src={msg.image}
                alt={msg.email}
                className="w-8 h-8 rounded-full mr-2"
              />
              <div
                className={`${
                  isSentByCurrentUser
                    ? "bg-blue-500 text-white rounded-tr-xl rounded-bl-xl"
                    : "bg-gray-300 text-gray-800 rounded-tl-xl rounded-br-xl"
                } p-2 max-w-md word-wrap break-all`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="p-4 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-grow border rounded p-2"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
