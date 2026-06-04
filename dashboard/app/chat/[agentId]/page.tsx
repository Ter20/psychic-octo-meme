"use client";
import { useParams } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : (params.agentId ?? "claude");
  return <ChatWindow agentId={agentId} />;
}
