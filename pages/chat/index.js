import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
import { useRouter } from "next/router";
import { nanoid } from "nanoid";

function Chat() {
  const { data: session } = useSession();
  const router = useRouter();
  const [liveUsersCount, setLiveUsersCount] = useState(0);

  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session]);

  const userEmail = session?.user?.email;
  const userImage = session?.user?.image;
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(process.env.SOCKET_URL);
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("liveUsersCount", (count) => {
        setLiveUsersCount(count);
      });
      socket.on("message", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });
    }
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      const newMessage = {
        message,
        email: userEmail,
        senderImage: userImage,
        image: userImage,
        imageType: "text",
      };
      socket.emit("message", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
      setImage(null);
      setVideo(null);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImage(selectedImage);
  };

  const handleVideoChange = (e) => {
    const selectedVideo = e.target.files[0];
    setVideo(selectedVideo);
  };

  const handleSendImage = async () => {
    if (image) {
      const id = nanoid(); // Generate a unique ID for the message
      const newMessage = {
        type: "image", // Specify the type as "image"
        image: URL.createObjectURL(image), // Display the selected image in chat
        email: userEmail,
        senderImage: userImage,
        messageId: id, // Attach the message ID
        uploading: true, // Indicates that the file is uploading
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setImage(null);

      try {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("messageId", id); // Attach the message ID to the form data

        const response = await fetch(
          `${process.env.SOCKET_URL}/api/upload-image`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (response.ok) {
          // Update the message to indicate successful upload
          const uploadedData = await response.json();
          const updatedMessage = {
            ...newMessage,
            uploading: false,
            image: uploadedData.image,
          };
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.messageId === id ? updatedMessage : msg
            )
          );

          // Emit a new message event with the uploaded image data
          socket.emit("message", updatedMessage);
        } else {
          // Update the message to indicate an error
          const updatedMessage = {
            ...newMessage,
            uploading: false,
            error: true,
          };
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.messageId === id ? updatedMessage : msg
            )
          );
          console.error("Error uploading image.");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  const handleSendVideo = async () => {
    if (video) {
      const id = nanoid(); // Generate a unique ID for the message
      const newMessage = {
        type: "video", // Specify the type as "video"
        video: URL.createObjectURL(video), // Display the selected video in chat
        email: userEmail,
        senderImage: userImage,
        messageId: id, // Attach the message ID
        uploading: true, // Indicates that the file is uploading
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setVideo(null);

      try {
        const formData = new FormData();
        formData.append("video", video);
        formData.append("messageId", id);

        const response = await fetch(
          `${process.env.SOCKET_URL}/api/upload-video`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (response.ok) {
          // Update the message to indicate successful upload
          const uploadedData = await response.json();
          const updatedMessage = {
            ...newMessage,
            uploading: false,
            video: uploadedData.video,
          };
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.messageId === id ? updatedMessage : msg
            )
          );

          // Emit a new message event with the uploaded video data
          socket.emit("message", updatedMessage);
        } else {
          // Update the message to indicate an error
          const updatedMessage = {
            ...newMessage,
            uploading: false,
            error: true,
          };
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.messageId === id ? updatedMessage : msg
            )
          );
          console.error("Error uploading video.");
        }
      } catch (error) {
        console.error("Error uploading video:", error);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="p-4 bg-blue-500 text-white text-center">
        <h1 className="text-4xl font-semibold mb-2">Chathub</h1>
        <p className="text-lg">Chat with the world</p>
        <p className="text-lg">Live users: {liveUsersCount}</p>
      </div>
      <div className="flex-grow bg-gray-200 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.type === "image" || msg.type === "video"
                ? msg.email === userEmail
                  ? "flex justify-end"
                  : "flex justify-start"
                : msg.email === userEmail
                ? "flex justify-end items-center"
                : "flex justify-start items-center"
            } mb-2`}
          >
            {msg.email !== userEmail && (
              <img
                src={msg.senderImage}
                alt={msg.email}
                className="w-8 h-8 rounded-full mr-2"
              />
            )}
            {msg.type === "image" ? (
              <img
                src={msg.image}
                alt={msg.email}
                className="w-24 h-24 object-cover rounded"
              />
            ) : msg.type === "video" ? (
              <video
                src={msg.video}
                alt={msg.email}
                controls
                className="w-40 h-32 rounded"
              />
            ) : (
              <div
                className={`${
                  msg.email === userEmail
                    ? "bg-blue-500 text-white rounded-tr-xl rounded-bl-xl"
                    : "bg-gray-300 text-gray-800 rounded-tl-xl rounded-br-xl"
                } p-2 max-w-md word-wrap break-all`}
              >
                {msg.message}
              </div>
            )}
            {msg.email === userEmail && (
              <img
                src={userImage}
                alt={msg.email}
                className="w-8 h-8 rounded-full ml-2"
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            className="flex-grow border rounded p-2"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
        <div className="mt-2">
          <label className="text-blue-500 font-semibold">Send Image:</label>
          <input
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleImageChange}
          />
          {image && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-2"
              onClick={handleSendImage}
            >
              Send Image
            </button>
          )}
        </div>
        <div className="mt-2">
          <label className="text-blue-500 font-semibold">Send Video:</label>
          <input
            type="file"
            accept="video/*"
            className="mt-2"
            onChange={handleVideoChange}
          />
          {video && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-2"
              onClick={handleSendVideo}
            >
              Send Video
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
