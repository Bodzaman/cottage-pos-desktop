import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiClient } from 'app';
import {
  fetchMediaLibrary,
  fetchMetadata as fetchMediaMetadata,
  saveMetadata,
  uploadMedia,
  deleteMedia,
  formatFileSize,
  formatDate,
  MediaItem,
  MediaFilterOptions,
  isImageFile,
  isVideoFile,
  updateMediaAsset,
  getRecentAssets,
  bulkDeleteAssets,
  bulkUpdateTags,
  calculateAspectRatio,
  getMediaDisplayName,
  cleanTags,
  cleanUsage,
  ImageOptimizationOptions
} from '../utils/mediaLibraryUtils';
import { SmartDeleteDialog } from 'components/SmartDeleteDialog';
import {
  ImageIcon,
  SearchIcon,
  UploadIcon,
  RefreshCwIcon,
  Trash2Icon,
  PencilIcon,
  CopyIcon,
  InfoIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  PlayIcon,
  VideoIcon,
  XIcon,
  ExternalLinkIcon,
  TagIcon,
  EyeIcon,
  DownloadIcon,
  FileIcon,
  Loader2Icon,
  CheckIcon,
  SortAscIcon,
  SortDescIcon,
  CalendarIcon,
  SizeIcon,
  FolderIcon,
  DatabaseIcon
} from 'lucide-react';
import { colors, cardStyle, gridBackgroundStyle } from '../utils/designSystem';
import { styles } from '../utils/QSAIDesign';

// Define available media types
type MediaType = 'all' | 'image' | 'video';

// Sort options
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';

// Aspect ratio options
type AspectRatioOption = 'all' | '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | 'other';

interface AdminPortalMediaProps {
  // No props needed as this is integrated into AdminPortal
}

const AdminPortalMedia: React.FC<AdminPortalMediaProps> = () => {
  // State for media items and filtering
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [recentAssets, setRecentAssets] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioOption>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedUsage, setSelectedUsage] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  
  // Modal states
  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSmartDeleteOpen, setIsSmartDeleteOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkTagOpen, setIsBulkTagOpen] = useState(false);
  
  // Form states
  const [newFriendlyName, setNewFriendlyName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUsage, setNewUsage] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Upload states
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [optimizeImages, setOptimizeImages] = useState(true);
  const [optimizationOptions, setOptimizationOptions] = useState<ImageOptimizationOptions>({
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 80,
    format: 'webp'
  });
  
  // Multi-select states
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Aggregated metadata
  const [availableTags, setAvailableTags] = useState<Set<string>>(new Set());
  const [availableUsages, setAvailableUsages] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize database schema and fetch media on component mount
  useEffect(() => {
    const initializeLibrary = async () => {
      let loadingToast: string | number = '';
      try {
        loadingToast = toast.loading('Initializing media library...');
        
        // Check if schema exists
        const schemaCheckResponse = await apiClient.get_storage_status();
        const schemaCheckData = await schemaCheckResponse.json();
        
        // If schema doesn't exist, set it up
        if (!schemaCheckData.exists) {
          console.log('Media assets schema does not exist, setting up...');
          const schemaSetupResponse = await apiClient.setup_unified_media_schema();
          const schemaSetupData = await schemaSetupResponse.json();
          
          if (!schemaSetupData.success) {
            const errorDetails = schemaSetupData.error || '';
            console.log('Schema setup response:', schemaSetupData);
            
            if (errorDetails.includes('SQL executed successfully') || 
                errorDetails.includes('already exists')) {
              console.log('Schema exists or was created successfully despite error code, proceeding...');
              toast.success('Media library database ready');
            } else {
              console.error('Schema setup failed:', errorDetails);
              toast.error('Failed to initialize media library schema');
              throw new Error('Schema setup failed: ' + errorDetails);
            }
          } else {
            toast.success('Media library database initialized');
          }
        } else {
          console.log('Media assets schema already exists');
        }
      } catch (error: any) {
        console.error('Error initializing media library:', error);
        toast.error('Failed to initialize media library schema. Attempting to load existing assets.');
      } finally {
        toast.dismiss(loadingToast);
        try {
          await fetchAllMedia();
          await fetchRecentAssets();
        } catch (error: any) {
          console.error('Error fetching media assets:', error);
        }
      }
    };
    
    initializeLibrary();
  }, []);

  // Fetch all media assets
  const fetchAllMedia = async () => {
    setIsLoading(true);
    try {
      const items = await fetchMediaLibrary();
      setMediaItems(items);
      setFilteredItems(items);
      
      // Build available tags and usages
      const tags = new Set<string>();
      const usages = new Set<string>();
      
      items.forEach(item => {
        if (item.tags) {
          cleanTags(item.tags).forEach(tag => tags.add(tag));
        }
        if (cleanUsage(item.usage)) {
          usages.add(cleanUsage(item.usage)!);
        }
      });
      
      setAvailableTags(tags);
      setAvailableUsages(usages);
    } catch (error: any) {
      console.error('Error fetching media:', error.message);
      toast.error('Failed to load media assets');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent assets
  const fetchRecentAssets = async () => {
    try {
      const items = await getRecentAssets(6);
      setRecentAssets(items);
    } catch (error: any) {
      console.error('Error fetching recent assets:', error.message);
    }
  };

  // Helper functions
  const copyToClipboard = (url: string, name: string) => {
    navigator.clipboard.writeText(url)
      .then(() => toast.success(`URL for ${name} copied to clipboard`))
      .catch(() => toast.error('Failed to copy URL'));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    if (!newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
    }
    
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setNewTags(newTags.filter(t => t !== tag));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(e.dataTransfer.files);
      setIsUploadOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={styles.purpleGradientText}>
            Media Library
          </h2>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            Manage images, videos, and media assets for your restaurant
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAllMedia()}
            style={{ borderColor: colors.border.light }}
            className="hover:border-purple-500"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="text-white"
            style={{ backgroundColor: colors.brand.purple }}
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card style={{ ...cardStyle, borderColor: colors.border.light }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DatabaseIcon className="h-5 w-5 mr-2" style={{ color: colors.brand.purple }} />
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Total Assets</p>
                <p className="text-lg font-semibold">{mediaItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card style={{ ...cardStyle, borderColor: colors.border.light }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" style={{ color: colors.brand.gold }} />
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Images</p>
                <p className="text-lg font-semibold">{mediaItems.filter(item => item.type === 'image').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card style={{ ...cardStyle, borderColor: colors.border.light }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <VideoIcon className="h-5 w-5 mr-2" style={{ color: colors.brand.turquoise }} />
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Videos</p>
                <p className="text-lg font-semibold">{mediaItems.filter(item => item.type === 'video').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card style={{ ...cardStyle, borderColor: colors.border.light }}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TagIcon className="h-5 w-5 mr-2" style={{ color: colors.text.tertiary }} />
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Tags</p>
                <p className="text-lg font-semibold">{availableTags.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card style={{ ...cardStyle, borderColor: colors.border.light }}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.text.tertiary }} />
                <Input
                  placeholder="Search media files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={mediaType} onValueChange={(value) => setMediaType(value as MediaType)}>
                <SelectTrigger className="w-32" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedAspectRatio} onValueChange={(value) => setSelectedAspectRatio(value as AspectRatioOption)}>
                <SelectTrigger className="w-32" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                  <SelectItem value="all">All Ratios</SelectItem>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                  <SelectItem value="4:3">Standard (4:3)</SelectItem>
                  <SelectItem value="3:2">Photo (3:2)</SelectItem>
                  <SelectItem value="2:3">Portrait (2:3)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} style={{ ...cardStyle, borderColor: colors.border.light }}>
              <CardContent className="p-4">
                <Skeleton className="h-40 w-full mb-2" style={{ backgroundColor: colors.background.tertiary }} />
                <Skeleton className="h-4 w-3/4 mb-1" style={{ backgroundColor: colors.background.tertiary }} />
                <Skeleton className="h-3 w-1/2" style={{ backgroundColor: colors.background.tertiary }} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Media Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:border-purple-500 transition-colors"
              style={{ ...cardStyle, borderColor: colors.border.light }}
              onClick={() => {
                setSelectedAsset(item);
                setIsPreviewOpen(true);
              }}
            >
              <CardContent className="p-0">
                <div className="relative">
                  {item.type === 'video' ? (
                    <div 
                      className="w-full h-40 flex items-center justify-center rounded-t-lg"
                      style={{ backgroundColor: colors.background.dark }}
                    >
                      <VideoIcon className="h-12 w-12" style={{ color: colors.text.tertiary }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayIcon className="h-8 w-8" style={{ color: colors.brand.purple }} />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt={getMediaDisplayName(item)} 
                      className="w-full h-40 object-cover rounded-t-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200/1f2937/fafafa?text=Image';
                      }}
                    />
                  )}
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium truncate text-sm">{getMediaDisplayName(item)}</h3>
                  <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                    {formatFileSize(item.size)} • {formatDate(item.updatedAt)}
                  </p>
                  
                  {cleanTags(item.tags).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cleanTags(item.tags).slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs py-0 h-4">
                          {tag}
                        </Badge>
                      ))}
                      {cleanTags(item.tags).length > 2 && (
                        <Badge variant="outline" className="text-xs py-0 h-4">
                          +{cleanTags(item.tags).length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Empty State */}
          {filteredItems.length === 0 && !isLoading && (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-16 w-16 mb-4" style={{ color: colors.text.tertiary }} />
              <h3 className="text-lg font-medium mb-2">No media files found</h3>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                Upload some images or videos to get started
              </p>
              <Button
                onClick={() => setIsUploadOpen(true)}
                className="text-white"
                style={{ backgroundColor: colors.brand.purple }}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog - Simplified version for AdminPortal integration */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light, color: colors.text.primary }}>
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center">
              <UploadIcon className="mr-2 h-5 w-5" style={{ color: colors.brand.purple }} />
              Upload Media
            </DialogTitle>
            <DialogDescription className="text-sm opacity-70">
              Upload images and videos to your media library
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all"
              style={{
                borderColor: isDragging ? colors.brand.purple : colors.border.light,
                backgroundColor: isDragging ? `${colors.brand.purple}10` : 'transparent'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadIcon className="h-12 w-12 mb-3" style={{ color: colors.text.tertiary }} />
              <p style={{ color: colors.text.secondary }} className="text-center mb-4">
                Drag and drop media files here or click to browse
              </p>
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setUploadFiles(e.target.files)}
              />
              <Button
                variant="outline"
                style={{ borderColor: colors.border.light }}
                className="hover:border-purple-500"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
            
            {uploadFiles && uploadFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected Files:</h4>
                <ScrollArea className="h-32" style={{ backgroundColor: colors.background.tertiary, borderRadius: '0.375rem' }}>
                  {Array.from(uploadFiles).map((file, index) => (
                    <div key={index} className="flex items-center py-2 border-b last:border-0" style={{ borderColor: colors.border.light }}>
                      <div className="flex-1 truncate px-3">{file.name}</div>
                      <div className="px-2">
                        <Badge variant="outline" className="text-xs">
                          {file.type.startsWith('image/') ? 'Image' : 'Video'}
                        </Badge>
                      </div>
                      <div className="text-sm px-3" style={{ color: colors.text.secondary }}>{formatFileSize(file.size)}</div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              style={{ borderColor: colors.border.light }}
              className="hover:border-purple-500"
              onClick={() => {
                setIsUploadOpen(false);
                setUploadFiles(null);
              }}
            >
              Cancel
            </Button>
            
            <Button
              className="text-white"
              style={{ backgroundColor: colors.brand.purple }}
              disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
              onClick={async () => {
                if (!uploadFiles || uploadFiles.length === 0) return;
                
                setIsUploading(true);
                try {
                  const imageFiles = Array.from(uploadFiles).filter(f => f.type.startsWith('image/'));
                  const totalFiles = uploadFiles.length;
                  
                  // Show initial toast for image optimization
                  if (imageFiles.length > 0) {
                    toast.info(`🎨 Optimizing ${imageFiles.length} image(s) to WebP...`, { duration: 2000 });
                  }
                  
                  let uploadedCount = 0;
                  for (const file of Array.from(uploadFiles)) {
                    await uploadMedia(file, {
                      tags: newTags,
                      usage: newUsage || undefined,
                      optimize: optimizeImages ? optimizationOptions : undefined
                    });
                    uploadedCount++;
                    
                    // Show progress for batch uploads
                    if (totalFiles > 1) {
                      toast.info(`✨ Uploaded ${uploadedCount}/${totalFiles} files...`, { duration: 1000 });
                    }
                  }
                  
                  toast.success(
                    imageFiles.length > 0 
                      ? `✅ ${totalFiles} file(s) uploaded! ${imageFiles.length} optimized to WebP` 
                      : `✅ ${totalFiles} file(s) uploaded successfully`
                  );
                  setIsUploadOpen(false);
                  setUploadFiles(null);
                  setNewTags([]);
                  setNewUsage('');
                  await fetchAllMedia();
                } catch (error: any) {
                  console.error('Upload error:', error);
                  toast.error('Failed to upload files: ' + error.message);
                } finally {
                  setIsUploading(false);
                }
              }}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  <span>Optimizing & Uploading...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  <span>Upload {uploadFiles?.length || 0} Files</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - Simplified version */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light, color: colors.text.primary }}>
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center">
              <EyeIcon className="mr-2 h-5 w-5" style={{ color: colors.brand.purple }} />
              {selectedAsset ? getMediaDisplayName(selectedAsset) : 'Media Preview'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="mt-4">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Media Preview */}
                <div className="flex-1">
                  {selectedAsset.type === 'video' ? (
                    <div className="aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: colors.background.dark }}>
                      <video 
                        src={selectedAsset.url} 
                        controls 
                        className="w-full h-full"
                        onError={(e) => {
                          console.error('Video load error:', e);
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={selectedAsset.url} 
                        alt={getMediaDisplayName(selectedAsset)} 
                        className="w-full h-full object-contain"
                        style={{ backgroundColor: colors.background.dark }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400/1f2937/fafafa?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Media Info */}
                <div className="lg:w-80 space-y-4">
                  <div>
                    <p style={{ color: colors.text.secondary }}>File Size</p>
                    <p className="font-medium">{formatFileSize(selectedAsset.size)}</p>
                  </div>
                  
                  <div>
                    <p style={{ color: colors.text.secondary }}>Last Updated</p>
                    <p className="font-medium">{formatDate(selectedAsset.updatedAt)}</p>
                  </div>
                  
                  {selectedAsset.width && selectedAsset.height && (
                    <div>
                      <p style={{ color: colors.text.secondary }}>Dimensions</p>
                      <p className="font-medium">{selectedAsset.width} × {selectedAsset.height}</p>
                    </div>
                  )}
                  
                  <div>
                    <p style={{ color: colors.text.secondary }}>Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cleanTags(selectedAsset.tags).length > 0 ? (
                        cleanTags(selectedAsset.tags).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs py-0 h-5">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span style={{ color: colors.text.tertiary }}>No tags</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p style={{ color: colors.text.secondary }}>Public URL</p>
                    <div className="flex items-center mt-1">
                      <Input 
                        readOnly 
                        value={selectedAsset.url} 
                        style={{ backgroundColor: colors.background.tertiary }} 
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 shrink-0"
                        onClick={() => copyToClipboard(selectedAsset.url, getMediaDisplayName(selectedAsset))}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedAsset.description && (
                    <div>
                      <p style={{ color: colors.text.secondary }}>Description</p>
                      <p className="mt-1" style={{ color: colors.text.primary }}>{selectedAsset.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between mt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                style={{ borderColor: colors.border.light, color: colors.text.secondary }}
                className="hover:text-white hover:border-purple-500"
                onClick={() => {
                  if (selectedAsset) {
                    // For now, just show a toast - full edit functionality can be added later
                    toast.info('Edit functionality coming soon');
                  }
                }}
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedAsset) {
                    setIsPreviewOpen(false);
                    setIsSmartDeleteOpen(true);
                  }
                }}
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
            
            <Button
              className="hover:opacity-90 text-white"
              style={{ backgroundColor: colors.brand.purple }}
              onClick={() => {
                if (selectedAsset) {
                  copyToClipboard(selectedAsset.url, getMediaDisplayName(selectedAsset));
                }
              }}
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smart Delete Dialog */}
      <SmartDeleteDialog
        isOpen={isSmartDeleteOpen}
        onClose={() => {
          setIsSmartDeleteOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        onConfirmDelete={async (asset: MediaItem, replacementAssetId?: string) => {
          try {
            toast.loading(`Processing deletion of ${getMediaDisplayName(asset)}...`);
            
            if (replacementAssetId) {
              // Replace asset references first
              const replaceResponse = await apiClient.replace_asset_in_menu_items({
                old_asset_id: asset.id,
                new_asset_id: replacementAssetId
              });
              
              const replaceData = await replaceResponse.json();
              if (!replaceData.success) {
                throw new Error(replaceData.message || 'Failed to replace asset references');
              }
            } else {
              // Remove references
              const removeResponse = await apiClient.remove_asset_references({
                assetId: asset.id
              });
              
              const removeData = await removeResponse.json();
              if (!removeData.success) {
                console.warn('Warning: Failed to remove some asset references:', removeData.message);
              }
            }
            
            // Delete the asset
            await deleteMedia(asset);
            
            // Update local state
            setMediaItems(prev => prev.filter(item => item.id !== asset.id));
            setFilteredItems(prev => prev.filter(item => item.id !== asset.id));
            
            toast.dismiss();
            toast.success(`Successfully deleted ${getMediaDisplayName(asset)}`);
            
            setIsSmartDeleteOpen(false);
            setSelectedAsset(null);
          } catch (error: any) {
            console.error('Delete error:', error);
            toast.dismiss();
            toast.error(`Failed to delete asset: ${error.message}`);
          }
        }}
        availableAssets={mediaItems}
      />
    </div>
  );
};

export default AdminPortalMedia;
