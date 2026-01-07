import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, Upload, Search, X, ImageIcon, FileVideo, FileIcon, Play, Film, Info, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMediaLibrary, MediaItem, uploadMedia, getMediaDisplayName, isImageFile, isVideoFile, formatFileSize, formatDate, cleanTags } from '../utils/mediaLibraryUtils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
  mediaType?: 'image' | 'video' | 'all';
  aspectRatio?: 'square' | 'widescreen' | 'any';
  title?: string;
  showUploadTab?: boolean;
  uploadUsage?: string;
  tags?: string[];
}

const MediaSelector = ({ isOpen, onClose, onSelectMedia, mediaType = 'all', aspectRatio = 'square', title = 'Select Media', showUploadTab = true, uploadUsage = '', tags = [] }: MediaSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [isLoading, setIsLoading] = useState(true);
  
  // 🆕 PHASE 3.3.4: Store the element that triggered the dialog for focus restoration
  const triggerElementRef = useRef<HTMLElement | null>(null);
  
  // Stabilize tags array reference to prevent infinite re-renders
  const stableTags = useMemo(() => tags || [], [tags?.join(',')]);
  
  // 🆕 PHASE 3.3: Capture trigger element when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element when dialog opens
      triggerElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);
  
  // 🆕 PHASE 3.3: Restore focus when dialog closes
  const handleClose = () => {
    onClose();
    
    // Restore focus to the element that opened the dialog
    setTimeout(() => {
      if (triggerElementRef.current && triggerElementRef.current.focus) {
        try {
          triggerElementRef.current.focus();
        } catch (e) {
          console.warn('Could not restore focus:', e);
        }
      }
    }, 100);
  };
  
  // Function to load media items
  const loadMediaItems = async () => {
    setIsLoading(true);
    try {
      console.log('MediaSelector: Loading media with filters:', {
        mediaType,
        aspectRatio,
        tags: stableTags
      });
      
      const filterOptions = {
        type: mediaType === 'all' ? undefined : mediaType,
        // Include aspect ratio filtering if specified
        aspectRatio: aspectRatio === 'any' ? undefined : aspectRatio,
        // Include tags filtering if specified
        tags: stableTags.length > 0 ? stableTags : undefined
      };
      
      console.log('MediaSelector: Calling fetchMediaLibrary with:', filterOptions);
      
      const items = await fetchMediaLibrary(filterOptions);
      
      console.log(`MediaSelector: Loaded ${items.length} media items:`, items);
      setMediaItems(items);
      setFilteredItems(items);
    } catch (error: any) {
      console.error('MediaSelector: Error loading media:', error);
      toast.error('Failed to load media items');
    } finally {
      setIsLoading(false);
    }
  };
    
  // Load media when the component is opened
  useEffect(() => {
    if (isOpen) {
      loadMediaItems();
    }
  }, [isOpen, mediaType, aspectRatio, stableTags]);

  // Filter media items based on search query
  useEffect(() => {
    if (!mediaItems.length) return;
    
    let filtered = [...mediaItems];
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        return (
          item.name?.toLowerCase().includes(query) || 
          getMediaDisplayName(item)?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
    
    console.log('MediaSelector: Frontend filtering result:', {
      originalCount: mediaItems.length,
      filteredCount: filtered.length,
      searchQuery,
      mediaType,
      aspectRatio
    });
    
    setFilteredItems(filtered);
  }, [mediaItems, searchQuery, mediaType, aspectRatio]);

  // Handle file selection for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (mediaType === 'image' && !file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPEG, PNG, WebP)');
        return;
      }
      
      if (mediaType === 'video' && !file.type.startsWith('video/')) {
        toast.error('Please select a video file (MP4, WebM, MOV)');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Provide quick feedback
      toast.info(`Selected ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      setUploadFile(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    const isImage = uploadFile.type.startsWith('image/');
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Show optimization message for images
      if (isImage) {
        toast.info(`🎨 Optimizing ${uploadFile.name}...`, { duration: 2000 });
      }
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 10;
          return next >= 90 ? 90 : next; // Cap at 90% until complete
        });
      }, 300);
      
      // Use uploadMedia directly
      const uploadedItem = await uploadMedia(uploadFile, {
        friendlyName: uploadFile.name,
        description: `${uploadFile.name} for ${uploadUsage || 'general use'}`,
        tags: [...(tags || []), aspectRatio !== 'any' ? aspectRatio : 'image'],
        usage: uploadUsage || '',
        aspectRatio: aspectRatio !== 'any' ? aspectRatio : undefined
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (isImage) {
        toast.success(`✨ ${uploadFile.name} optimized & uploaded!`, { duration: 2000 });
      } else {
        toast.success('Upload successful');
      }
      
      // Refresh media list
      const updatedMedia = await fetchMediaLibrary({
        type: mediaType === 'all' ? undefined : mediaType,
        aspectRatio: aspectRatio === 'any' ? undefined : aspectRatio,
        tags: tags.length > 0 ? tags : undefined
      });
      
      setMediaItems(updatedMedia);
      setFilteredItems(updatedMedia);
      
      // Select the uploaded item
      onSelectMedia(uploadedItem);
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };

  // Render upload interface
  const renderUploadTab = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0A0A0A]">
        {!uploadFile ? (
          <div 
            className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-12 w-full flex flex-col items-center justify-center cursor-pointer hover:border-[#5B21B6] hover:bg-[#1A0A1A]/30 transition-all duration-300 group"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[#5B21B6]/10 flex items-center justify-center mb-6 group-hover:bg-[#5B21B6]/20 transition-colors">
              <Upload className="h-8 w-8 text-[#5B21B6] group-hover:text-[#7C3AED]" />
            </div>
            <p className="text-xl font-semibold text-[#F0F0F5] mb-2">Drop files to upload</p>
            <p className="text-sm text-[#B0B0B8] mb-4 text-center max-w-md">
              {mediaType === 'image' ? 'Upload high-quality images in JPG, PNG, or WebP format' : 
               mediaType === 'video' ? 'Upload videos in MP4, WebM, or MOV format' : 
               'Upload your media files (images or videos)'}
            </p>
            <p className="text-xs text-[#707080]">
              Maximum file size: 10MB
            </p>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
              accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'image/*,video/*'}
            />
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div className="p-6 border border-[#2A2A2A] rounded-xl mb-6 bg-[#141414]">
              <div className="flex items-center mb-4">
                <div className="flex-1 flex items-center">
                  {uploadFile.type.startsWith('image/') ? (
                    <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center mr-4">
                      <ImageIcon className="h-5 w-5 text-[#16A34A]" />
                    </div>
                  ) : uploadFile.type.startsWith('video/') ? (
                    <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center mr-4">
                      <FileVideo className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#6B7280]/10 flex items-center justify-center mr-4">
                      <FileIcon className="h-5 w-5 text-[#6B7280]" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-[#F0F0F5] truncate">{uploadFile.name}</p>
                    <p className="text-sm text-[#B0B0B8]">
                      {uploadFile.type} • {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadFile(null)}
                  className="h-8 w-8 p-0 text-[#B0B0B8] hover:text-[#F0F0F5] hover:bg-[#2A2A2A]/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {uploadFile.type.startsWith('image/') && (
                <div className="mt-4 border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#0A0A0A]">
                  <img 
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                    className="max-h-[200px] w-full object-contain"
                  />
                </div>
              )}
              
              {uploadFile.type.startsWith('video/') && (
                <div className="mt-4 border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#0A0A0A]">
                  <video
                    src={URL.createObjectURL(uploadFile)}
                    controls
                    className="max-h-[200px] w-full object-contain"
                  />
                </div>
              )}
            </div>
            
            {isUploading && (
              <div className="mb-6 space-y-3">
                {/* Optimization Status Indicator */}
                {uploadFile.type.startsWith('image/') && uploadProgress < 100 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Optimizing Image</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Converting to WebP & generating variants...</p>
                    </div>
                  </div>
                )}
                
                {/* Success Badge */}
                {uploadProgress === 100 && uploadFile.type.startsWith('image/') && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Optimized</span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium border border-blue-500/20">
                        WebP
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-[#B0B0B8]">
                    {uploadProgress < 100 ? (uploadFile.type.startsWith('image/') ? 'Optimizing...' : 'Uploading...') : 'Complete!'}
                  </p>
                  <p className="text-sm font-medium text-[#F0F0F5]">{uploadProgress}%</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setUploadFile(null)}
                className="border-[#2A2A2A] bg-transparent hover:bg-[#2A2A2A]/50 text-[#F0F0F5] hover:text-[#F0F0F5]"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:from-[#4C1D95] hover:to-[#6D28D9] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Media'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-[#0A0A0A] text-[#F0F0F5] border-[#2A2A2A] max-w-5xl max-h-[90vh] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 border-b border-[#2A2A2A] bg-[#141414]">
          <DialogTitle className="text-2xl font-bold text-[#F0F0F5] flex items-center">
            <div className="w-8 h-8 rounded-lg bg-[#5B21B6]/10 flex items-center justify-center mr-3">
              <ImageIcon className="h-5 w-5 text-[#5B21B6]" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab as any}>
          <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A] bg-[#0F0F0F]">
            <TabsList className="bg-[#1A1A1A] border border-[#2A2A2A] p-1 rounded-lg">
              <TabsTrigger 
                value="browse" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5B21B6] data-[state=active]:to-[#7C3AED] data-[state=active]:text-white text-[#B0B0B8] hover:text-[#F0F0F5] transition-all duration-200 px-6 py-2 rounded-md font-medium"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Browse Media
              </TabsTrigger>
              {showUploadTab && (
                <TabsTrigger 
                  value="upload" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5B21B6] data-[state=active]:to-[#7C3AED] data-[state=active]:text-white text-[#B0B0B8] hover:text-[#F0F0F5] transition-all duration-200 px-6 py-2 rounded-md font-medium"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </TabsTrigger>
              )}
            </TabsList>
            
            {activeTab === 'browse' && (
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#707080]" />
                <Input
                  type="text"
                  placeholder="Search media by name, tags, or description..."
                  className="pl-10 pr-10 bg-[#1A1A1A] border-[#2A2A2A] text-[#F0F0F5] placeholder:text-[#707080] focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 rounded-lg h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#707080] hover:text-[#F0F0F5] transition-colors"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Render media grid */}
          <TabsContent value="browse" className="h-[600px] m-0 bg-[#0A0A0A]">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20">
                  <div className="w-12 h-12 rounded-full border-4 border-[#2A2A2A] border-t-[#5B21B6] animate-spin mb-4" />
                  <p className="text-[#B0B0B8] font-medium">Loading media library...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center p-20">
                  <div className="w-20 h-20 rounded-full bg-[#2A2A2A]/30 flex items-center justify-center mx-auto mb-6">
                    <ImageIcon className="h-10 w-10 text-[#707080]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#F0F0F5] mb-3">
                    {searchQuery ? 'No results found' : 'No media files available'}
                  </h3>
                  <p className="text-[#B0B0B8] mb-6 max-w-md mx-auto">
                    {searchQuery 
                      ? 'Try adjusting your search terms or browse all media' 
                      : aspectRatio !== 'any'
                        ? `No ${aspectRatio} ${mediaType === 'video' ? 'videos' : mediaType === 'image' ? 'images' : 'media'} found. Try switching to 'any' aspect ratio or upload new media.`
                        : `No ${mediaType === 'video' ? 'videos' : mediaType === 'image' ? 'images' : 'media'} found.`}
                  </p>
                  {showUploadTab && (
                    <Button 
                      onClick={() => setActiveTab('upload')}
                      className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:from-[#4C1D95] hover:to-[#6D28D9] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New {mediaType === 'video' ? 'Video' : mediaType === 'image' ? 'Image' : 'Media'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
                  {filteredItems.map(item => {
                    // Determine if item is a video or image
                    const isVideo = item.type.includes('video');
                    
                    // Get the file extension
                    const fileExtension = item.name ? item.name.split('.').pop()?.toLowerCase() : '';
                    
                    // Format date nicely
                    const formattedDate = item.updatedAt ? 
                      format(new Date(item.updatedAt), 'MMM d, yyyy') : 'Unknown date';
                      
                    // Format file size
                    const formatFileSize = (bytes: number): string => {
                      if (!bytes) return 'Unknown';
                      if (bytes < 1024) return bytes + ' B';
                      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                    };
                    
                    return (
                      <TooltipProvider key={item.id}>
                        <div 
                          className="relative group border border-[#2A2A2A] rounded-xl overflow-hidden cursor-pointer hover:border-[#5B21B6] hover:shadow-lg hover:shadow-[#5B21B6]/20 transition-all duration-300 bg-[#141414] hover:bg-[#1A1A1A]"
                          onClick={() => {
                            onSelectMedia(item);
                            onClose();
                          }}
                        >
                          {/* Badge showing media type */}
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className={`${isVideo ? 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30' : 'bg-[#16A34A]/20 text-[#4ADE80] border-[#16A34A]/30'} px-2 py-1 text-xs font-medium flex items-center backdrop-blur-sm`}>
                              {isVideo ? (
                                <>
                                  <Film className="w-3 h-3 mr-1" />
                                  {fileExtension ? fileExtension.toUpperCase() : 'VIDEO'}
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  {fileExtension ? fileExtension.toUpperCase() : 'IMAGE'}
                                </>
                              )}
                            </Badge>
                          </div>
                          
                          <div className="aspect-square relative overflow-hidden bg-[#0A0A0A]">
                            {isVideo ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="absolute z-10 bg-black/60 rounded-full p-3 opacity-80 group-hover:opacity-100 group-hover:bg-[#5B21B6]/80 transition-all duration-300">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                                <img 
                                  src={item.url} 
                                  alt={getMediaDisplayName(item)} 
                                  className="w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="relative h-full">
                                <img 
                                  src={item.url} 
                                  alt={getMediaDisplayName(item)} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Error';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 border-t border-[#2A2A2A] bg-[#141414] group-hover:bg-[#1A1A1A] transition-colors">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate text-sm font-medium text-[#F0F0F5] mb-2">{getMediaDisplayName(item)}</div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="bg-[#1A1A1A] border-[#2A2A2A] text-[#F0F0F5] p-4 max-w-[320px] shadow-xl">
                                <div className="space-y-3">
                                  <p className="font-semibold text-[#F0F0F5]">{getMediaDisplayName(item)}</p>
                                  {item.description && <p className="text-sm text-[#B0B0B8]">{item.description}</p>}
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#B0B0B8]">
                                    <div className="flex items-center"><FileIcon className="h-3 w-3 mr-1.5 text-[#707080]" /> {item.name}</div>
                                    <div className="flex items-center"><Info className="h-3 w-3 mr-1.5 text-[#707080]" /> {formatFileSize(item.size)}</div>
                                    {item.aspectRatio && (
                                      <div className="flex items-center"><ImageIcon className="h-3 w-3 mr-1.5 text-[#707080]" /> {item.aspectRatio}</div>
                                    )}
                                    {item.type && (
                                      <div className="flex items-center">
                                        {isVideo ? <Film className="h-3 w-3 mr-1.5 text-[#707080]" /> : <ImageIcon className="h-3 w-3 mr-1.5 text-[#707080]" />}
                                        {item.type.split('/')[1]?.toUpperCase() || item.type}
                                      </div>
                                    )}
                                  </div>
                                  {cleanTags(item.tags).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 text-xs mt-2">
                                      {cleanTags(item.tags).map((tag, i) => (
                                        <Badge key={i} variant="outline" className="text-xs py-0.5 px-2 bg-[#2A2A2A]/50 border-[#3A3A3A] text-[#B0B0B8] flex items-center gap-1">
                                          <Tag className="h-2 w-2" />
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center">
                                {isVideo ? (
                                  <div className="w-4 h-4 rounded bg-[#3B82F6]/20 flex items-center justify-center mr-2">
                                    <FileVideo className="h-2.5 w-2.5 text-[#60A5FA]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded bg-[#16A34A]/20 flex items-center justify-center mr-2">
                                    <ImageIcon className="h-2.5 w-2.5 text-[#4ADE80]" />
                                  </div>
                                )}
                                <span className="text-xs text-[#B0B0B8] font-medium">
                                  {formattedDate}
                                </span>
                              </div>
                              {item.size && (
                                <div className="text-xs text-[#707080] font-medium">
                                  {formatFileSize(item.size)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TooltipProvider>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {showUploadTab && (
            <TabsContent value="upload" className="h-[600px] m-0">
              {renderUploadTab()}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;
