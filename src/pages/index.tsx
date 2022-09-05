import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { trpc } from "../utils/trpc";

const Messages = () => {
    const { data: messages, isLoading } = trpc.useQuery(["guestbookgetAll"]);

    if (isLoading) return <div>Fetching messages...</div>;

    return (
        <div className="flex flex-col gap-4">
            {messages?.map((msg, index) => {
                return (
                    <div key={index}>
                        <p>{msg.message}</p>
                        <span>- {msg.name}</span>
                    </div>
                );
            })}
        </div>
    );
};

const Home = () => {
    const { data: session, status } = useSession();
    const [message, setMessage] = useState("");
    
    const ctx = trpc.useContext()
    const postMessage = trpc.useMutation("guestbookpostMessage", {
        onMutate: () => {
            ctx.cancelQuery(["guestbookgetAll"])

            const optimisticUpdate = ctx.getQueryData(["guestbookgetAll"])
            if (optimisticUpdate) {
                ctx.setQueryData(["guestbookgetAll"], optimisticUpdate)
            }
        },
        onSettled: () => {
            ctx.invalidateQueries(["guestbookgetAll"])
        }
    });

    if (status === "loading") {
        return (
            <main className="flex flex-col items-center pt-4">Loading...</main>
        );
    }

    return (
        <main className="flex flex-col items-center">
            <h1 className="text-3xl pt-4">Guestbook</h1>
            <p>
                Tutorial for <code>create-t3-app</code>
            </p>

            {session ? (
                <div>
                    <p>hi {session.user?.name}</p>

                    <button onClick={() => signOut()}>Logout</button>

                    <div className="pt-6">
                        <form
                            className="flex gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();

                                postMessage.mutate({
                                    name: session.user?.name as string,
                                    message,
                                });

                                setMessage("");
                            }}
                        >
                            <input
                                type="text"
                                value={message}
                                placeholder="Your message..."
                                maxLength={100}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                className="px-4 py-2 rounded-md border-2 border-zinc-800 bg-neutral-900"
                            />
                            <button
                                type="submit"
                                className="p-2 rounded-md border-2 border-zinc-800 focus:outline-none"
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                    <div className="pt-10">
                        <Messages />
                    </div>
                </div>
            ) : (
                <>
                    <button onClick={() => signIn("discord")}>
                        Login with Discord
                    </button>
                    <div className="pt-10" />
                    <Messages />
                </>
            )}
        </main>
    );
};

export default Home;
