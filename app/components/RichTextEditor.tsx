"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  image: string;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write something...",
}: RichTextEditorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (searchQuery) {
      fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then(setUsers)
        .catch(console.error);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:text-blue-800 underline",
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          items: ({ query }) => {
            setSearchQuery(query);
            return users.map((user) => ({
              id: user.id,
              name: user.name,
            }));
          },
          render: () => {
            let popup: HTMLElement | null = null;
            let component: any = null;

            return {
              onStart: (props: any) => {
                component = {
                  update: (props: any) => {
                    if (!popup) {
                      popup = document.createElement("div");
                      popup.className =
                        "mention-popup bg-white shadow-lg rounded-lg border border-gray-200 p-2";
                      document.body.appendChild(popup);
                    }

                    const { items: mentionItems, command } = props;
                    if (!mentionItems.length) {
                      popup.style.display = "none";
                      return;
                    }

                    popup.style.display = "block";
                    popup.innerHTML = mentionItems
                      .map(
                        (item: any, index: number) => `
                          <div class="mention-item ${
                            index === selectedIndex
                              ? "bg-blue-100"
                              : "hover:bg-gray-100"
                          } px-2 py-1 rounded cursor-pointer flex items-center gap-2">
                            <img src="${
                              users.find((u) => u.id === item.id)?.image
                            }" class="w-6 h-6 rounded-full" />
                            <span>${item.name}</span>
                          </div>
                        `
                      )
                      .join("");

                    const mentionElements = popup.querySelectorAll(".mention-item");
                    mentionElements.forEach((item: Element, index: number) => {
                      item.addEventListener("click", () => {
                        command(mentionItems[index]);
                        popup?.remove();
                        popup = null;
                      });
                    });
                  },
                  onKeyDown: (props: any) => {
                    const { event } = props;
                    if (event.key === "ArrowDown") {
                      setSelectedIndex((prev) =>
                        Math.min(prev + 1, users.length - 1)
                      );
                      return true;
                    }
                    if (event.key === "ArrowUp") {
                      setSelectedIndex((prev) => Math.max(prev - 1, 0));
                      return true;
                    }
                    if (event.key === "Enter") {
                      props.command(users[selectedIndex]);
                      popup?.remove();
                      popup = null;
                      return true;
                    }
                    if (event.key === "Escape") {
                      popup?.remove();
                      popup = null;
                      return true;
                    }
                    return false;
                  },
                  onExit: () => {
                    popup?.remove();
                    popup = null;
                    setSelectedIndex(0);
                  },
                };
              },
              onUpdate: (props: any) => {
                component?.update(props);
              },
              onKeyDown: (props: any) => {
                return component?.onKeyDown(props);
              },
              onExit: () => {
                component?.onExit();
              },
            };
          },
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  const addLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-button ${
            editor.isActive("bold") ? "is-active" : ""
          }`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-button ${
            editor.isActive("italic") ? "is-active" : ""
          }`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-button ${
            editor.isActive("bulletList") ? "is-active" : ""
          }`}
        >
          Bullet List
        </button>
        <button onClick={addLink} className="toolbar-button">
          Link
        </button>
        <button
          onClick={() => editor.chain().focus().insertContent("@").run()}
          className="toolbar-button"
        >
          Mention
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
} 