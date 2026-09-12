import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import ChatList from '../components/chat/ChatList.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import Loader from '../components/layout/Loader.jsx';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations(),
  });

  useEffect(() => {
    if (!socket) return;
    const onNew = () => qc.invalidateQueries({ queryKey: ['conversations'] });
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, qc]);

  return (
    <div className="mx-auto max-w-6xl px-0 sm:px-4 py-0 sm:py-4 h-[calc(100vh-3.5rem-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full card overflow-hidden">
        <aside className="border-r border-slate-200 overflow-y-auto bg-white">
          <div className="p-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Messages</h2>
          </div>
          {list.isLoading ? <Loader /> :
            <ChatList items={list.data?.items || []} activeId={conversationId} currentUserId={user?.id} />}
        </aside>
        <section className="hidden md:block">
          {conversationId
            ? <ChatWindow conversationId={Number(conversationId)} />
            : <div className="h-full grid place-items-center text-slate-400 text-sm">Pick a conversation to start chatting.</div>}
        </section>
        <section className="md:hidden">
          {conversationId && <ChatWindow conversationId={Number(conversationId)} />}
        </section>
      </div>
    </div>
  );
}
