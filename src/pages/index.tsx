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
                    <div className="flex flex-col px-8" key={index}>
                        <p>{msg.message}</p>
                        <span className="">- {msg.name}</span>
                    </div>
                );
            })}
        </div>
    );
};

const Home = () => {
    const { data: session, status } = useSession();
    const [message, setMessage] = useState("");

    const ctx = trpc.useContext();
    const postMessage = trpc.useMutation("guestbookpostMessage", {
        onMutate: () => {
            ctx.cancelQuery(["guestbookgetAll"]);

            const optimisticUpdate = ctx.getQueryData(["guestbookgetAll"]);
            if (optimisticUpdate) {
                ctx.setQueryData(["guestbookgetAll"], optimisticUpdate);
            }
        },
        onSettled: () => {
            ctx.invalidateQueries(["guestbookgetAll"]);
        },
    });

    if (status === "loading") {
        return (
            <main className="flex flex-col items-center pt-4">Loading...</main>
        );
    }

    return (
        <main className="flex flex-col items-center">
            <h1 className="font-extrabold text-transparent text-3xl pt-4 bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Guestbook</h1>
            <p>
                Tutorial for <code>create-t3-app</code>
            </p>
            <p className="pt-3 pb-2">
                Made with ❤ by <a className="text-transparent bg-clip-text transform bg-gradient-to-r from-purple-400 to bg-pink-600" target="__blank" href="https://dericksonloss.tech">dericksonloss.tech</a>
            </p>

            {session ? (
                <div className="">
                    <div className="flex flex-row flex-wrap justify-evenly">
                        <p className="mt-4">Hi {session.user?.name}!</p>

                        <button
                            className="p-2 mt-2 rounded-md border-2 border-zinc-800 bg-red-600 focus:outline-none focus:bg-red-400 hover:bg-red-500 focus:ring-4 shadow-lg transform active:scale-75 transition-transform" 
                            onClick={() => signOut()}
                        >
                            Logout
                        </button>
                    </div>

                    <div className="pt-6 flex flex-row flex-wrap justify-evenly">
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
                                minLength={1}                                
                                required
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                className="px-4 py-2 rounded-md border-2 border-zinc-800 bg-neutral-900"
                            />
                            <button
                                type="submit"
                                className="p-2 rounded-md border-2 text-black bg-gray-100 hover:bg-white focus:bg-slate-100 border-zinc-800 focus:outline-none focus:ring-4 shadow-lg transform active:scale-75 transition-transform"
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
                    <button className="p-2 mt-2 rounded-md border-2 border-zinc-800 bg-green-600 focus:outline-none focus:bg-green-400 hover:bg-green-500 focus:ring-4 shadow-lg transform active:scale-75 transition-transform" onClick={() => signIn("discord")}>
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
