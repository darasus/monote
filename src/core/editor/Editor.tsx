"use client"

import {useEffect, useRef, useState} from "react"
import {useEditor, EditorContent, Extension} from "@tiptap/react"
import {defaultEditorProps} from "./props"
import {defaultExtensions} from "./extensions/defaultExtensions"
import {useDebouncedCallback} from "use-debounce"
import {useCompletion} from "ai/react"
import {toast} from "sonner"
import va from "@vercel/analytics"
import {EditorBubbleMenu} from "./components/EditorBubbleMenu/EditorBubbleMenu"
import {ImageResizer} from "./extensions/ImageResizer"
import {EditorProps} from "@tiptap/pm/view"
import {Editor as EditorClass} from "@tiptap/core"
import {textFont} from "../fonts"
import {getPrevText} from "../utils"
import {useContent} from "../../hooks/useContent"
import {defaultEditorContent} from "./defaultEditorContent"
import {useSaved} from "../../hooks/useSaved"
import {Card} from "@/components/ui/card"

export function Editor({
  completionApi = "/api/generate",
  extensions = [],
  editorProps = {},
  onUpdate = () => {},
  onDebouncedUpdate = () => {},
}: {
  /**
   * The API route to use for the OpenAI completion API.
   * Defaults to "/api/generate".
   */
  completionApi?: string
  /**
   * A list of extensions to use for the editor, in addition to the default Novel extensions.
   * Defaults to [].
   */
  extensions?: Extension[]
  /**
   * Props to pass to the underlying Tiptap editor, in addition to the default Novel editor props.
   * Defaults to {}.
   */
  editorProps?: EditorProps
  /**
   * A callback function that is called whenever the editor is updated.
   * Defaults to () => {}.
   */
  // eslint-disable-next-line no-unused-vars
  onUpdate?: (editor?: EditorClass) => void | Promise<void>
  /**
   * A callback function that is called whenever the editor is updated, but only after the defined debounce duration.
   * Defaults to () => {}.
   */
  // eslint-disable-next-line no-unused-vars
  onDebouncedUpdate?: (editor?: EditorClass) => void | Promise<void>
}) {
  const {setSaved, setSaving, setUnsaved} = useSaved()
  const {content: jsonContent, updateContent} = useContent()
  const content = jsonContent ? JSON.parse(jsonContent) : defaultEditorContent

  const [hydrated, setHydrated] = useState(false)

  const debouncedUpdates = useDebouncedCallback(async ({editor}) => {
    const json = editor.getJSON()
    updateContent(JSON.stringify(json))
    onDebouncedUpdate(editor)
    setSaving()
    // Simulate a delay in saving.
    setTimeout(() => {
      setSaved()
    }, 500)
  }, 750)

  const editor = useEditor({
    extensions: [...defaultExtensions, ...extensions],
    editorProps: {
      ...defaultEditorProps,
      ...editorProps,
    },
    onUpdate: (e) => {
      const selection = e.editor.state.selection
      const lastTwo = getPrevText(e.editor, {
        chars: 2,
      })
      if (lastTwo === "++" && !isLoading) {
        e.editor.commands.deleteRange({
          from: selection.from - 2,
          to: selection.from,
        })
        complete(
          getPrevText(e.editor, {
            chars: 5000,
          })
        )
        // complete(e.editor.storage.markdown.getMarkdown());
        va.track("Autocomplete Shortcut Used")
      } else {
        onUpdate(e.editor)
        setUnsaved()
        debouncedUpdates(e)
      }
    },
    autofocus: "end",
  })

  const {complete, completion, isLoading, stop} = useCompletion({
    id: "novel",
    api: completionApi,
    onFinish: (_prompt, completion) => {
      editor?.commands.setTextSelection({
        from: editor.state.selection.from - completion.length,
        to: editor.state.selection.from,
      })
    },
    onError: (err) => {
      toast.error(err.message)
      if (err.message === "You have reached your request limit for the day.") {
        va.track("Rate Limit Reached")
      }
    },
  })

  const prev = useRef("")

  // Insert chunks of the generated text
  useEffect(() => {
    const diff = completion.slice(prev.current.length)
    prev.current = completion
    editor?.commands.insertContent(diff)
  }, [isLoading, editor, completion])

  useEffect(() => {
    // if user presses escape or cmd + z and it's loading,
    // stop the request, delete the completion, and insert back the "++"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.metaKey && e.key === "z")) {
        stop()
        if (e.key === "Escape") {
          editor?.commands.deleteRange({
            from: editor.state.selection.from - completion.length,
            to: editor.state.selection.from,
          })
        }
        editor?.commands.insertContent("++")
      }
    }
    const mousedownHandler = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      stop()
      if (window.confirm("AI writing paused. Continue?")) {
        complete(editor?.getText() || "")
      }
    }
    if (isLoading) {
      document.addEventListener("keydown", onKeyDown)
      window.addEventListener("mousedown", mousedownHandler)
    } else {
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousedown", mousedownHandler)
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousedown", mousedownHandler)
    }
  }, [stop, isLoading, editor, complete, completion.length])

  // Hydrate the editor with the content from localStorage.
  useEffect(() => {
    if (editor && content && !hydrated) {
      editor.commands.setContent(content)
      setHydrated(true)
    }
  }, [editor, content, hydrated])

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-4">
        <div className="sticky top-0 left-0 right-0 z-10 border-b bg-background rounded-t-lg">
          {editor && <EditorBubbleMenu editor={editor} />}
        </div>
        <div
          onClick={() => {
            editor?.chain().focus().run()
          }}
          className={`relative min-h-[500px] w-full px-4 ${textFont.className}`}
        >
          {editor?.isActive("image") && <ImageResizer editor={editor} />}
          <EditorContent editor={editor} />
        </div>
      </div>
    </Card>
  )
}
