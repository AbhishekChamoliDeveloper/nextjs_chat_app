import React, { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";

function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-semibold mb-4">Welcome to ChatHub</h1>
        <p className="text-gray-600 mb-4">
          Connect with friends and start chatting!
        </p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
        >
          Sign In with Google
        </button>
      </div>
    </div>
  );
}

export default Home;
