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

import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import FontSize from "@tiptap/extension-font-size";
import { FontFamily } from "@tiptap/extension-text-style";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import { ListItemWithStyle } from "./ListItemWithStyle";
import { Markdown } from "@tiptap/markdown";

import { generateHTML, generateJSON } from "@tiptap/html/server";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const extensions = [
    StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        bulletList: false,
        orderedList: false,
        undoRedo: false,
        listItem: false,
        codeBlock: false,
    }),
    Markdown,
    Bold,
    Italic,
    Strike,
    TextStyle,
    Color.configure({ types: ["textStyle"] }),
    FontSize.configure({ types: ["textStyle"] }),
    FontFamily,
    Highlight,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    BulletList,
    OrderedList,
    ListItemWithStyle,
    Image.configure({
        resize: {
            enabled: true,
            alwaysPreserveAspectRatio: true,
        },
    }),
    CodeBlockLowlight
];

const server = new Server({
    port: 1234,

    async onLoadDocument({ documentName, document }) {
        const { data, error } = await supabase
            .from("notes")
            .select("note")
            .eq("id", documentName)
            .maybeSingle();

        if (error) {
            console.error("Failed to load note", {
                documentName,
                message: error.message,
            });
        }

        const ydoc = new Y.Doc();

        if (!data?.note?.content) return ydoc;

        try {
            const json = generateJSON(data.note.content, extensions as any);

            // console.log("Seeding from Supabase:", JSON.stringify(json, null, 2));

            return TiptapTransformer.toYdoc(json, "default", extensions as any);
        } catch (e) {
            console.error("Failed to transform note", {
                documentName,
                error: e instanceof Error ? e.message : String(e),
            });
            return document;
        }
    },

    // Save back to Supabase when document changes
    // async onStoreDocument({ documentName, document }) {
    //     try {
    //         const json = TiptapTransformer.fromYdoc(document, "default");
    //         const html = generateHTML(json, extensions as any);

    //         await supabase
    //             .from("notes")
    //             .update({ note: { content: html } })  // adjust to match your schema shape
    //             .eq("id", documentName);

    //         console.log("✅ Saved to Supabase:", documentName);
    //     } catch (e) {
    //         console.error("⚠️ Failed to save", e);
    //     }
    // },
});

server.listen();
console.info("Hocuspocus server started", {
  port: 1234,
});
