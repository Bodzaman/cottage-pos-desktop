import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from 'app';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Type,
  FileText,
  Heading as HeadingIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { globalColors, panelStyle } from 'utils/QSAIDesign';
import { toast } from 'sonner';
import RichTextEditor from 'components/RichTextEditor';

interface ContentItem {
  id: string;
  content_key: string;
  page: string;
  section: string;
  content_type: 'text' | 'rich_text' | 'heading';
  display_order: number;
  label: string | null;
  draft_value: string | null;
  published_value: string | null;
  has_unpublished_changes: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentTextManagerProps {
  page: string;
  section: string;
  onContentChange?: () => void;
}

type ContentType = 'text' | 'rich_text' | 'heading';

const CONTENT_TYPE_CONFIG = {
  text: {
    icon: Type,
    label: 'Text Block',
    placeholder: 'Enter text content...',
    maxLength: 5000,
  },
  rich_text: {
    icon: FileText,
    label: 'Rich Text',
    placeholder: 'Enter rich text content with formatting...',
    maxLength: 10000,
  },
  heading: {
    icon: HeadingIcon,
    label: 'Heading',
    placeholder: 'Enter heading text...',
    maxLength: 200,
  },
};

export default function ContentTextManager({ page, section, onContentChange }: ContentTextManagerProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<ContentItem | null>(null);
  const [newBlockType, setNewBlockType] = useState<ContentType>('text');
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());

  // Capitalize first letter for display
  const displayPage = page.charAt(0).toUpperCase() + page.slice(1);
  const displaySection = section;

  // Debounced save timers
  const saveTimers = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch text content for this page/section
  useEffect(() => {
    fetchTextContent();
  }, [page, section]);

  const fetchTextContent = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get_all_draft_content({ page, section });
      const data = await response.json();
      
      if (data.success) {
        // Filter for text content types and sort by display_order
        const textItems = data.items
          .filter((item: ContentItem) => 
            ['text', 'rich_text', 'heading'].includes(item.content_type)
          )
          .sort((a: ContentItem, b: ContentItem) => a.display_order - b.display_order);
        setItems(textItems);
      }
    } catch (error) {
      console.error('Failed to fetch text content:', error);
      toast.error('Failed to load text content');
    } finally {
      setLoading(false);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback((item: ContentItem, value: string) => {
    // Clear existing timer for this item
    const existingTimer = saveTimers.current.get(item.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        setSavingItems(prev => new Set(prev).add(item.id));
        
        const response = await apiClient.update_text_content({
          content_key: item.content_key,
          draft_value: value,
        });

        const data = await response.json();

        if (data.success) {
          // Update local state
          setItems(prev =>
            prev.map(it =>
              it.id === item.id
                ? { ...it, draft_value: value, has_unpublished_changes: true }
                : it
            )
          );
          onContentChange?.();
        }
      } catch (error) {
        console.error('Failed to save content:', error);
        toast.error('Failed to save changes');
      } finally {
        setSavingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
        saveTimers.current.delete(item.id);
      }
    }, 500); // 500ms debounce

    saveTimers.current.set(item.id, timer);
  }, [onContentChange]);

  // Handle content change
  const handleContentChange = (item: ContentItem, value: string) => {
    // Update local state immediately for responsive UI
    setItems(prev =>
      prev.map(it =>
        it.id === item.id ? { ...it, draft_value: value } : it
      )
    );
    
    // Debounced save
    debouncedSave(item, value);
  };

  // Add new content block
  const handleAddBlock = async () => {
    try {
      toast.info('Creating new block...');

      const label = `${CONTENT_TYPE_CONFIG[newBlockType].label} ${items.length + 1}`;
      const formData = new FormData();
      formData.append('page', page);
      formData.append('section', section);
      formData.append('content_type', newBlockType);
      formData.append('label', label);
      formData.append('display_order', String(items.length));
      formData.append('draft_value', '');

      const response = await fetch(
        apiClient.getBaseUrl() + '/routes/website-content/create-text-block',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page,
            section,
            content_type: newBlockType,
            label,
            display_order: items.length,
            draft_value: '',
          }),
        }
      );

      if (response.ok) {
        toast.success('Block created');
        await fetchTextContent();
        onContentChange?.();
      } else {
        toast.error('Failed to create block');
      }
    } catch (error) {
      console.error('Failed to create block:', error);
      toast.error('Failed to create block');
    }
  };

  // Delete content block
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await apiClient.delete_content({ contentKey: itemToDelete.content_key });
      const data = await response.json();

      if (data.success) {
        toast.success('Block deleted');
        await fetchTextContent();
        onContentChange?.();
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
      toast.error('Failed to delete block');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Drag and drop reordering
  const handleDragStart = (item: ContentItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, targetItem: ContentItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = items.findIndex(it => it.id === draggedItem.id);
    const targetIndex = items.findIndex(it => it.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update display_order
    const updatedItems = newItems.map((it, index) => ({
      ...it,
      display_order: index,
    }));

    setItems(updatedItems);
  };

  const handleDragEnd = async () => {
    if (!draggedItem) return;

    try {
      // Send updated order to backend
      const orderData = items.map(it => ({
        content_key: it.content_key,
        display_order: it.display_order,
      }));

      const response = await apiClient.update_display_order({ items: orderData });
      const data = await response.json();

      if (data.success) {
        toast.success('Order updated');
        onContentChange?.();
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
      // Revert on error
      await fetchTextContent();
    } finally {
      setDraggedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p style={{ color: globalColors.text.muted }}>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Context Banner */}
      <div
        className="p-4 rounded-lg border flex items-center justify-between"
        style={{
          background: `${globalColors.purple.primary}15`,
          borderColor: globalColors.purple.primary,
        }}
      >
        <div className="flex items-center gap-3">
          <Type className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
          <div>
            <p className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Currently Managing: <span style={{ color: globalColors.purple.primary }}>{displayPage} → {displaySection}</span>
            </p>
            <p className="text-xs" style={{ color: globalColors.text.muted }}>
              {items.length} {items.length === 1 ? 'block' : 'blocks'} in this section
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={newBlockType} onValueChange={(v) => setNewBlockType(v as ContentType)}>
            <SelectTrigger
              className="w-32 h-9"
              style={{
                background: globalColors.background.secondary,
                borderColor: globalColors.border.medium,
                color: globalColors.text.primary,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              style={{
                background: globalColors.background.panel,
                borderColor: globalColors.border.medium,
              }}
            >
              <SelectItem value="text" style={{ color: globalColors.text.primary }}>
                Text
              </SelectItem>
              <SelectItem value="rich_text" style={{ color: globalColors.text.primary }}>
                Rich Text
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="gap-2"
            style={{
              background: globalColors.purple.primary,
              color: globalColors.text.primary,
            }}
            onClick={handleAddBlock}
          >
            <Plus className="h-4 w-4" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Content Blocks */}
      {items.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center border-2 border-dashed"
          style={{
            borderColor: globalColors.border.medium,
            color: globalColors.text.muted,
          }}
        >
          <div className="text-6xl mb-4">T</div>
          <p className="text-lg font-medium mb-2">No text blocks in {displaySection} yet</p>
          <p className="text-sm">Click "Add Block" to create text content for this section</p>
          <p className="text-xs mt-2" style={{ color: globalColors.purple.primary }}>
            Text content will appear in the preview panel →
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const config = CONTENT_TYPE_CONFIG[item.content_type];
            const Icon = config.icon;
            const isSaving = savingItems.has(item.id);

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDragEnd={handleDragEnd}
                className="rounded-lg p-4 cursor-move transition-all"
                style={{
                  ...panelStyle,
                  borderColor: item.has_unpublished_changes
                    ? globalColors.purple.primary
                    : globalColors.border.medium,
                  opacity: draggedItem?.id === item.id ? 0.5 : 1,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4" style={{ color: globalColors.text.muted }} />
                    <Icon className="h-4 w-4" style={{ color: globalColors.text.muted }} />
                    <span className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                      {item.label}
                    </span>
                    <span className="text-xs font-mono" style={{ color: globalColors.text.muted }}>
                      #{item.display_order + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          background: globalColors.background.secondary,
                          color: globalColors.text.muted,
                        }}
                      >
                        Saving...
                      </Badge>
                    )}
                    {item.has_unpublished_changes && (
                      <Badge
                        className="text-xs"
                        style={{
                          background: globalColors.purple.primary,
                          color: globalColors.text.primary,
                        }}
                      >
                        Unpublished
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setItemToDelete(item);
                        setDeleteDialogOpen(true);
                      }}
                      style={{
                        borderColor: globalColors.border.medium,
                        color: globalColors.text.secondary,
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Content Editor */}
                {item.content_type === 'heading' && (
                  <Input
                    value={item.draft_value || ''}
                    onChange={(e) => handleContentChange(item, e.target.value)}
                    placeholder={config.placeholder}
                    maxLength={config.maxLength}
                    className="text-2xl font-bold"
                    style={{
                      background: globalColors.background.secondary,
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.primary,
                    }}
                  />
                )}

                {item.content_type === 'text' && (
                  <div>
                    <Textarea
                      value={item.draft_value || ''}
                      onChange={(e) => handleContentChange(item, e.target.value)}
                      placeholder={config.placeholder}
                      maxLength={config.maxLength}
                      rows={6}
                      style={{
                        background: globalColors.background.secondary,
                        borderColor: globalColors.border.medium,
                        color: globalColors.text.primary,
                      }}
                    />
                    <div className="flex justify-end mt-1">
                      <span
                        className="text-xs font-mono"
                        style={{
                          color:
                            (item.draft_value?.length || 0) > config.maxLength * 0.9
                              ? '#DC2626'
                              : globalColors.text.muted,
                        }}
                      >
                        {item.draft_value?.length || 0} / {config.maxLength}
                      </span>
                    </div>
                  </div>
                )}

                {item.content_type === 'rich_text' && (
                  <RichTextEditor
                    content={item.draft_value || ''}
                    onChange={(html) => handleContentChange(item, html)}
                    placeholder={config.placeholder}
                    maxLength={config.maxLength}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          style={{
            background: globalColors.background.panel,
            borderColor: globalColors.border.medium,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: globalColors.text.primary }}>
              Delete Content Block
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: globalColors.text.muted }}>
              Are you sure you want to delete "{itemToDelete?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                borderColor: globalColors.border.medium,
                color: globalColors.text.secondary,
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{
                background: '#DC2626',
                color: 'white',
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
