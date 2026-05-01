import "dotenv/config";

import { Server } from "@hocuspocus/server";
import { createClient } from "@supabase/supabase-js";
import * as Y from "yjs";
import { TiptapTransformer } from "@hocuspocus/transformer";

// minimal schema extensions (must match client)
import { StarterKit } from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document"
import Text from "@tiptap/extension-text"
import Paragraph from "@tiptap/extension-paragraph";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const server = new Server({
    port: 1234,

    async onLoadDocument({ documentName }) {
        console.log("Loading doc:", documentName);

        const { data } = await supabase
            .from("notes")
            .select("note")
            .eq("id", documentName)
            .single();

        const ydoc = new Y.Doc();

        if (!data?.note?.content) return ydoc;

        try {
            const json = {
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: data.note.content.replace(/<[^>]*>/g, ""), // simple strip (safe fallback)
                            },
                        ],
                    },
                ],
            }

            console.log("Seeding from Supabase:", json);

            return TiptapTransformer.toYdoc(
                json,
                "default",
                [Document, Paragraph, Text] as any
            );
        } catch (e) {
            console.log("⚠️ fallback empty doc", e)
            return ydoc
        }
    }
});

server.listen();
console.log("Hocuspocus server running on ws://localhost:1234");
