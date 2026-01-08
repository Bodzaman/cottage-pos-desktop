import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { globalColors } from 'utils/QSAIDesign';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  maxLength,
  disabled = false 
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-500 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleSetLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .setLink({ href: linkUrl })
        .run();
    }
    setLinkUrl('');
    setLinkPopoverOpen(false);
  };

  const buttonStyle = (isActive: boolean) => ({
    background: isActive ? globalColors.purple.primary : 'transparent',
    color: isActive ? globalColors.text.primary : globalColors.text.secondary,
    borderColor: globalColors.border.medium,
  });

  return (
    <div
      className="rounded-lg border"
      style={{
        background: globalColors.background.secondary,
        borderColor: globalColors.border.medium,
      }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 p-2 border-b"
        style={{ borderColor: globalColors.border.medium }}
      >
        {/* Headings */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={buttonStyle(editor.isActive('heading', { level: 1 }))}
          disabled={disabled}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={buttonStyle(editor.isActive('heading', { level: 2 }))}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={buttonStyle(editor.isActive('heading', { level: 3 }))}
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Text formatting */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={buttonStyle(editor.isActive('bold'))}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={buttonStyle(editor.isActive('italic'))}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={buttonStyle(editor.isActive('bulletList'))}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={buttonStyle(editor.isActive('orderedList'))}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Link */}
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={buttonStyle(editor.isActive('link'))}
              disabled={disabled}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            style={{
              background: globalColors.background.panel,
              borderColor: globalColors.border.medium,
            }}
          >
            <div className="space-y-2">
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSetLink();
                  }
                }}
                style={{
                  background: globalColors.background.secondary,
                  borderColor: globalColors.border.medium,
                  color: globalColors.text.primary,
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSetLink}
                  style={{
                    background: globalColors.purple.primary,
                    color: globalColors.text.primary,
                  }}
                >
                  Set Link
                </Button>
                {editor.isActive('link') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkPopoverOpen(false);
                    }}
                    style={{
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.secondary,
                    }}
                  >
                    Remove Link
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Character count */}
        {maxLength && (
          <span
            className="ml-auto text-xs font-mono"
            style={{
              color:
                editor.storage.characterCount.characters() > maxLength * 0.9
                  ? '#DC2626'
                  : globalColors.text.muted,
            }}
          >
            {editor.storage.characterCount.characters()} / {maxLength}
          </span>
        )}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none p-4 min-h-[200px] focus:outline-none"
        style={{
          color: globalColors.text.primary,
        }}
      />
    </div>
  );
}
