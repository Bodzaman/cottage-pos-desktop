import {
  AIContentSuggestionRequest,
  AIVoiceSettingsUpdate,
  AbbreviateTextData,
  AbbreviateTextError,
  AbbreviationRequest,
  ActivateCorpusVersionData,
  ActivateCorpusVersionError,
  ActivateCorpusVersionParams,
  AddCartAiColumnsData,
  AddCustomerReferenceFieldData,
  AddFavoriteData,
  AddFavoriteError,
  AddFavoriteRequest,
  AddFavoriteToListData,
  AddFavoriteToListError,
  AddGenderFieldData,
  AddHierarchicalColumnsData,
  AddHierarchicalColumnsError,
  AddHierarchicalColumnsParams,
  AddIsAvailableColumnData,
  AddItemRequest,
  AddItemToCartData,
  AddItemToCartError,
  AddItemsToCustomerTabData,
  AddItemsToCustomerTabError,
  AddItemsToCustomerTabParams,
  AddItemsToCustomerTabPayload,
  AddItemsToTableData,
  AddItemsToTableError,
  AddItemsToTableParams,
  AddItemsToTablePayload,
  AddLinkingColumnsData,
  AddMenuAiRlsData,
  AddOptimizationColumnsData,
  AddOptimizationColumnsError,
  AddOptimizationColumnsParams,
  AddOrderTimingFieldsData,
  AddTerminalPaymentColumnsData,
  AddToListRequest,
  AddVariantNameColumnData,
  AdminCountsData,
  AgentProfileInput,
  AgentProfilesHealthData,
  AgentSelection,
  AiCustomizationsHealthCheckData,
  AiRecommendationsHealthData,
  AnalyzeCategoryMigrationData,
  AnalyzeDatabaseTablesData,
  AnalyzePosDependenciesData,
  AnalyzeSectionChangeImpactData,
  AnalyzeSectionChangeImpactError,
  AnalyzeTableItemsData,
  AnalyzeTableItemsError,
  AnalyzeTableItemsParams,
  AppApisAdminAuthRevokeDeviceRequest,
  AppApisBulkMenuOperationsBulkDeleteRequest,
  AppApisPosSupabaseAuthRevokeDeviceRequest,
  AppApisPrintJobsPrintJobRequest,
  AppApisPrintQueuePrintJobRequest,
  AppApisThermalTestTestPrintRequest,
  AppApisUnifiedMenuOperationsBulkDeleteRequest,
  AppApisUnifiedTestPrintTestPrintRequest,
  ApplyCategoryTemplateData,
  ApplyCategoryTemplateError,
  ApplyPromoCodeData,
  ApplyPromoCodeError,
  AuditReportData,
  AuthSyncHealthCheckData,
  AutoConfirmEmailData,
  AutoConfirmEmailError,
  AutoConfirmEmailRequest,
  AutoLinkUnusedMediaData,
  AutoLinkUnusedMediaError,
  AutoLinkUnusedMediaParams,
  AutoProcessPrintQueueData,
  AutoProcessPrintQueueError,
  AutoProcessPrintQueueParams,
  AutoSyncConfig,
  AutoSyncOnSetMealChangeData,
  AutoSyncOnSetMealChangeError,
  AutoSyncOnSetMealChangeParams,
  BackfillAiAvatarsData,
  BackfillAiAvatarsError,
  BackfillAiAvatarsParams,
  BackfillCustomersData,
  BackfillExistingVariantsData,
  BackfillLegacyData,
  BackfillMenuImagesData,
  BackfillMenuImagesError,
  BackfillMenuImagesParams,
  BatchAnalyzeMenuItemsData,
  BatchCodeGenerationRequest,
  BatchGenerateVariantsData,
  BatchGenerateVariantsError,
  BatchGenerateVariantsParams,
  BatchPricingRequest,
  BatchSchemaRequest,
  BatchUpdatePricingData,
  BatchUpdatePricingError,
  BodyUploadAvatar,
  BodyUploadGeneralFile,
  BodyUploadMenuImage,
  BodyUploadMenuItemImage,
  BodyUploadOptimizedMenuImage,
  BodyUploadPrimaryAgentAvatar,
  BodyUploadProfileImage,
  BulkDeleteItemsData,
  BulkDeleteItemsError,
  BulkDeleteItemsSafeData,
  BulkDeleteItemsSafeError,
  BulkTestRequest,
  BulkToggleActiveData,
  BulkToggleActiveError,
  BulkToggleRequest,
  BulkTrackingUpdate,
  BulkUpdateMediaTagsData,
  BulkUpdateMediaTagsError,
  BulkUpdateOrderTrackingData,
  BulkUpdateOrderTrackingError,
  CalculateDeliveryData,
  CalculateDeliveryError,
  CalculateDeliveryParams,
  CalculateDeliveryRouteData,
  CalculateDeliveryRouteError,
  CalculateEnhancedDeliveryRouteData,
  CalculateEnhancedDeliveryRouteError,
  CalculateOrderFeesData,
  CalculateOrderFeesError,
  CartContextRequest,
  CartEventRequest,
  CartRemoveData,
  CartRemoveError,
  CartRemoveRequest,
  CashPaymentRequest,
  CategoryDeleteRequest,
  CategoryWithIsProteinType,
  ChatCartContextHealthData,
  ChatRequest,
  ChatStreamData,
  ChatStreamError,
  ChatbotPromptCreate,
  ChatbotPromptUpdate,
  ChatbotPromptsHealthData,
  CheckAllSchemasStatusData,
  CheckAllServicesData,
  CheckAnalyticsHealthData,
  CheckAndFixStoragePermissionsData,
  CheckAuthTriggersData,
  CheckCartAnalyticsTableData,
  CheckCategoriesPrintFieldsData,
  CheckCategoryDeleteData,
  CheckCategoryDeleteError,
  CheckCategoryDeleteParams,
  CheckChatAnalyticsSchemaData,
  CheckChatbotPromptsSchemaData,
  CheckChatbotTableData,
  CheckCorpusHealthData,
  CheckCustomerTabsSchemaData,
  CheckDatabaseConnectionData,
  CheckDatabaseSchemaData,
  CheckDeviceTrustData,
  CheckDeviceTrustError,
  CheckDeviceTrustRequest,
  CheckFavoriteListsSchemaData,
  CheckFavoriteStatusData,
  CheckFavoriteStatusError,
  CheckFavoriteStatusParams,
  CheckHealthData,
  CheckHealthResult,
  CheckIsAvailableColumnData,
  CheckKdsSchemaData,
  CheckLatestReleaseData,
  CheckMediaAssetUsageData,
  CheckMediaAssetUsageError,
  CheckMediaAssetUsageParams,
  CheckMenuAiFieldsExist2Data,
  CheckMenuAiFieldsExistData,
  CheckMenuCustomizationsTableData,
  CheckMenuImagesSchemaV2Data,
  CheckMenuStructureSchemaStatusData,
  CheckMenuSystemHealthData,
  CheckMissingVariantsData,
  CheckOptimizationColumnsData,
  CheckOrderItemsSchemaData,
  CheckOrderTimingFieldsData,
  CheckOrderTrackingSchemaData,
  CheckPOSAccessRequest,
  CheckPaymentLinkStatusData,
  CheckPaymentLinkStatusError,
  CheckPosAccessData,
  CheckPosAccessError,
  CheckPosAuthSetupData,
  CheckPosTablesSchemaData,
  CheckPrinterHealthData,
  CheckProfilesConstraintsData,
  CheckSchemaMigrationsData,
  CheckSchemaStatusData,
  CheckServiceHealthData,
  CheckSpecificServiceData,
  CheckSpecificServiceError,
  CheckSpecificServiceParams,
  CheckStatusData,
  CheckStreamingHealthData,
  CheckStructuredStreamingHealthData,
  CheckTableExistsData,
  CheckTableExistsError,
  CheckTableExistsParams,
  CheckTableOrdersSchemaData,
  CheckTablesStatusData,
  CheckTrustRequest,
  CheckUserRolesTableExistsData,
  CheckUserTrustedDeviceData,
  CheckUserTrustedDeviceError,
  CheckVariantFoodDetailsSchemaData,
  CheckVariantNamePatternSchemaData,
  CheckVariantNameStatusData,
  CheckVoiceMenuMatchingHealthData,
  CleanDuplicateCategoriesData,
  CleanupOrphanedMediaData,
  CleanupSafeTablesData,
  CleanupTableTestItemsData,
  CleanupTableTestItemsError,
  ClearAllFavoritesData,
  ClearAllFavoritesError,
  ClearAllFavoritesParams,
  ClearAllPendingChangesData,
  ClearCacheData,
  ClearCartData,
  ClearCartError,
  ClearCartRequest,
  ClearHealthCacheData,
  ClearImageCacheData,
  ClearImageCacheError,
  ClearImageCacheParams,
  ClearPerformanceMetricsData,
  CloseCustomerTabData,
  CloseCustomerTabError,
  CloseCustomerTabParams,
  CodeGenerationRequest,
  CompleteTableOrderData,
  CompleteTableOrderError,
  CompleteTableOrderParams,
  ConfirmPaymentData,
  ConfirmPaymentError,
  ConfirmPaymentRequest,
  CreateAddressRequest,
  CreateAgentData,
  CreateAgentError,
  CreateBaseCacheData,
  CreateBaseCacheError,
  CreateCacheRequest,
  CreateCartTableData,
  CreateChatbotPromptData,
  CreateChatbotPromptError,
  CreateCustomerAddressData,
  CreateCustomerAddressError,
  CreateCustomerTabData,
  CreateCustomerTabError,
  CreateCustomerTabRequest,
  CreateCustomizationData,
  CreateCustomizationError,
  CreateCustomizationRequest,
  CreateElectronRepositoryData,
  CreateElectronRepositoryError,
  CreateExecuteSqlRpcData,
  CreateFavoriteListData,
  CreateFavoriteListError,
  CreateFileData,
  CreateFileError,
  CreateFileRequest,
  CreateGeminiVoiceSessionData,
  CreateGeminiVoiceSessionError,
  CreateListRequest,
  CreateMenuCustomizationsTableData,
  CreateMenuItemData,
  CreateMenuItemError,
  CreateMenuUnifiedViewData,
  CreateMenuVariantsRpcData,
  CreateOnlineOrderData,
  CreateOnlineOrderError,
  CreateOnlineOrderRequest,
  CreateOptimizedFunctionData,
  CreatePaymentIntentData,
  CreatePaymentIntentError,
  CreatePaymentIntentRequest,
  CreatePosOrderData,
  CreatePosOrderError,
  CreatePosTableData,
  CreatePosTableError,
  CreatePrintJobData,
  CreatePrintJobError,
  CreatePrintQueueJobData,
  CreatePrintQueueJobError,
  CreatePrintTemplateData,
  CreatePrintTemplateError,
  CreatePrinterReleaseData,
  CreatePrinterReleaseError,
  CreatePromoCodeData,
  CreatePromoCodeError,
  CreatePromoCodeRequest,
  CreateProteinTypeData,
  CreateProteinTypeError,
  CreateReceiptTemplateData,
  CreateReceiptTemplateError,
  CreateReleaseData,
  CreateReleaseError,
  CreateReleaseRequest,
  CreateRepoRequest,
  CreateRepositoryData,
  CreateRepositoryError,
  CreateRepositoryFileData,
  CreateRepositoryFileError,
  CreateRepositoryFileParams,
  CreateRepositoryRequest,
  CreateSectionParentRecordsData,
  CreateSetMealData,
  CreateSetMealError,
  CreateSmsPaymentLinkData,
  CreateSmsPaymentLinkError,
  CreateTableOrderData,
  CreateTableOrderError,
  CreateTableOrderRequest,
  CreateTableRequest,
  CreateV8EposSdkReleaseData,
  CreateVariantNameTriggerData,
  CustomerContextHealthCheckData,
  CustomerContextRequest,
  CustomerLookupRequest,
  CustomerProfileHealthData,
  CustomerReceiptRequest,
  CustomizationTestRequest,
  DebugMenuCustomizationsData,
  DeleteCacheData,
  DeleteCacheError,
  DeleteCacheParams,
  DeleteChatbotPromptData,
  DeleteChatbotPromptError,
  DeleteChatbotPromptParams,
  DeleteCustomerAddressData,
  DeleteCustomerAddressError,
  DeleteCustomerAddressParams,
  DeleteCustomizationData,
  DeleteCustomizationError,
  DeleteCustomizationParams,
  DeleteFavoriteListData,
  DeleteFavoriteListError,
  DeleteItemRequest,
  DeleteListRequest,
  DeleteMediaAssetData,
  DeleteMediaAssetError,
  DeleteMediaAssetParams,
  DeleteMenuItemData,
  DeleteMenuItemError,
  DeleteMenuItemParams,
  DeletePosTableData,
  DeletePosTableError,
  DeletePosTableParams,
  DeletePrintJobData,
  DeletePrintJobError,
  DeletePrintJobParams,
  DeletePrintQueueJobData,
  DeletePrintQueueJobError,
  DeletePrintQueueJobParams,
  DeletePrinterReleaseData,
  DeletePrinterReleaseError,
  DeletePrinterReleaseParams,
  DeleteProfileImageData,
  DeleteProfileImageError,
  DeleteProfileImageParams,
  DeletePromoCodeData,
  DeletePromoCodeError,
  DeletePromoCodeParams,
  DeleteProteinTypeData,
  DeleteProteinTypeError,
  DeleteProteinTypeParams,
  DeleteReceiptTemplateData,
  DeleteReceiptTemplateError,
  DeleteReceiptTemplateParams,
  DeleteReleaseData,
  DeleteReleaseError,
  DeleteReleaseParams,
  DeleteSetMealData,
  DeleteSetMealError,
  DeleteSetMealParams,
  DeleteSingleItemData,
  DeleteSingleItemError,
  DeleteTemplatePreviewData,
  DeleteTemplatePreviewError,
  DeleteTemplatePreviewParams,
  DeliveryRequest,
  DeliveryValidationRequest,
  DiagnoseCustomersFkData,
  DiagnoseMenuItemsData,
  DiagnoseSignupErrorData,
  DirectInitializeTablesData,
  DiscoverEpsonPrintersData,
  DownloadCottageIconData,
  DownloadPrinterServicePackageData,
  DropCartUniqueConstraintData,
  DropLoyaltyTokenConstraintData,
  DropMenuUnifiedViewData,
  DropMenuVariantsRpcData,
  DropOldTablesData,
  DropOptimizedFunctionData,
  EmailReceiptData,
  EmailReceiptError,
  EmailReceiptRequest,
  EmitEventEndpointData,
  EmitEventEndpointError,
  EmitEventRequest,
  EnableRlsAndPoliciesData,
  EpsonPrintRequest,
  ExecuteCategoryMigrationData,
  ExecuteMigrationData,
  ExecuteSimpleMigrationData,
  ExecuteSqlEndpointData,
  ExecuteSqlEndpointError,
  ExecuteSqlSafeData,
  ExecuteSqlSafeError,
  ExportOrdersData,
  ExportOrdersError,
  ExportOrdersParams,
  ExtendCacheData,
  ExtendCacheError,
  ExtendCacheRequest,
  FavoriteListsHealthData,
  FeeCalculationRequest,
  FileContent,
  FinalizeCutoverData,
  FinalizeCutoverError,
  FinalizeCutoverRequest,
  FixCustomerFavoritesSchemaData,
  FixCustomersFkData,
  FixCustomersRlsPoliciesData,
  FixDatabaseForeignKeysData,
  FixDuplicateVariantNamesData,
  FixForeignKeyData,
  FixMenuCustomizationsErrorData,
  FixMenuCustomizationsSchemaData,
  FixOrderItemsSchemaData,
  FixParentIdColumnData,
  FixSchemaColumnMismatchData,
  ForceRefreshMenuData,
  FullRunData,
  FullRunError,
  FullRunRequest,
  FullSetupData,
  GeminiCacheHealthCheckData,
  GenerateAiContentSuggestion2Data,
  GenerateAiContentSuggestion2Error,
  GenerateAiContentSuggestionData,
  GenerateAiContentSuggestionError,
  GenerateAiRecommendationsData,
  GenerateAiRecommendationsError,
  GenerateAllCodesData,
  GenerateAllCodesError,
  GenerateAuditReportData,
  GenerateItemCodeData,
  GenerateItemCodeError,
  GenerateMenuItemCodeData,
  GenerateMenuItemCodeError,
  GenerateOrderNumberData,
  GenerateOrderNumberError,
  GenerateOrderNumberRequest,
  GenerateReceiptData,
  GenerateReceiptError,
  GenerateReceiptHtmlData,
  GenerateReceiptHtmlError,
  GenerateReceiptRequest,
  GenerateReferenceNumbersForExistingCustomersData,
  GenerateStaticMapData,
  GenerateStaticMapError,
  GenerateStructuredResponseData,
  GenerateStructuredResponseError,
  GenerateSystemPromptData,
  GenerateSystemPromptError,
  GenerateSystemPromptParams,
  GenerateTemplatePreviewData,
  GenerateTemplatePreviewError,
  GenerateTemplatePreviewParams,
  GenerateVariantCodeData,
  GenerateVariantCodeError,
  GeocodeData,
  GeocodeError,
  GeocodingRequest,
  GetAbbreviationDictionaryData,
  GetActiveCorpusData,
  GetActiveCorpusError,
  GetActiveCorpusParams,
  GetActivePromptData,
  GetAdminLockStatusData,
  GetAdminLockStatusError,
  GetAgentByIdData,
  GetAgentByIdError,
  GetAgentByIdParams,
  GetAgentProfilesEndpointData,
  GetAiSettingsStatusData,
  GetAiVoiceSettingsData,
  GetAllAgentsData,
  GetAllOrderSamplesData,
  GetAssetUsageData,
  GetAssetUsageError,
  GetAssetUsageParams,
  GetAutoSyncConfigEndpointData,
  GetAvailableModelsData,
  GetAvailableVariablesEndpointData,
  GetAvailableVariablesEndpointError,
  GetBusinessDataEndpointData,
  GetCacheStatsData,
  GetCartData,
  GetCartError,
  GetCartMetricsData,
  GetCartMetricsError,
  GetCartMetricsParams,
  GetCartParams,
  GetCartSuggestionsData,
  GetCartSuggestionsError,
  GetCartSummaryData,
  GetCartSummaryError,
  GetCartSummaryTextData,
  GetCartSummaryTextError,
  GetCartSummaryTextParams,
  GetCartTableStatusData,
  GetCategoriesData,
  GetCategoryDiagnosticsData,
  GetCategoryItemsData,
  GetCategoryItemsError,
  GetCategoryItemsParams,
  GetCategorySectionMappingsData,
  GetChatCartContextData,
  GetChatCartContextError,
  GetChatConfigData,
  GetChatbotPromptData,
  GetChatbotPromptError,
  GetChatbotPromptParams,
  GetCodeStandardsData,
  GetContextSummaryData,
  GetConversationAnalyticsData,
  GetConversationAnalyticsError,
  GetConversationAnalyticsParams,
  GetCorpusVersionsData,
  GetCorpusVersionsError,
  GetCorpusVersionsParams,
  GetCurrentBusinessRulesData,
  GetCurrentPasswordData,
  GetCustomerAddressesData,
  GetCustomerAddressesError,
  GetCustomerAddressesParams,
  GetCustomerContextSummaryData,
  GetCustomerContextSummaryError,
  GetCustomerCountData,
  GetCustomerListsData,
  GetCustomerListsError,
  GetCustomerListsParams,
  GetCustomerPreferencesData,
  GetCustomerPreferencesError,
  GetCustomerPreferencesParams,
  GetCustomerProfileData,
  GetCustomerProfileError,
  GetCustomerProfileParams,
  GetCustomerProfilePostData,
  GetCustomerProfilePostError,
  GetCustomerReferenceData,
  GetCustomerReferenceError,
  GetCustomerReferenceParams,
  GetCustomerTabData,
  GetCustomerTabError,
  GetCustomerTabParams,
  GetCustomizationsData,
  GetCustomizationsForItemData,
  GetCustomizationsForItemError,
  GetCustomizationsForItemParams,
  GetDeliveryConfigData,
  GetDeliveryZonesEndpointData,
  GetEmailVerificationStatusData,
  GetEmailVerificationStatusError,
  GetEmailVerificationStatusParams,
  GetEnhancedMediaLibraryData,
  GetEnhancedMediaLibraryError,
  GetEnhancedMediaLibraryParams,
  GetEnrichedFavoritesData,
  GetEnrichedFavoritesError,
  GetEnrichedFavoritesParams,
  GetFileShaData,
  GetFileShaError,
  GetFileShaParams,
  GetFullMenuContextData,
  GetFullMenuContextError,
  GetFullMenuContextParams,
  GetFullSpecificationData,
  GetGalleryMenuItemsData,
  GetGithubUserData,
  GetGoogleLiveVoiceSettingsData,
  GetHealthCheckTemplateData,
  GetHealthHistoryData,
  GetHealthHistoryError,
  GetHealthHistoryParams,
  GetHealthStatusData,
  GetHierarchicalMediaData,
  GetHierarchicalStatsData,
  GetIconInfoData,
  GetInstallationBundleData,
  GetInstallerFilesStatusData,
  GetItemDetailsData,
  GetItemDetailsError,
  GetItemDetailsParams,
  GetItemSectionOrderData,
  GetItemSectionOrderError,
  GetItemSectionOrderParams,
  GetJobLogsData,
  GetJobLogsError,
  GetJobLogsParams,
  GetLatestCombinedInstallerData,
  GetLatestFailedRunLogsData,
  GetLatestFailedRunLogsError,
  GetLatestFailedRunLogsParams,
  GetLatestPosReleaseData,
  GetLatestPrinterReleaseData,
  GetLatestReleaseData,
  GetLiveCallsData,
  GetLockStatusData,
  GetLockStatusError,
  GetLockStatusParams,
  GetMapImageProxyData,
  GetMapImageProxyError,
  GetMapImageProxyParams,
  GetMapsConfigData,
  GetMasterSwitchStatusData,
  GetMasterToggleData,
  GetMediaAssetData,
  GetMediaAssetError,
  GetMediaAssetParams,
  GetMediaLibraryData,
  GetMediaLibraryError,
  GetMediaLibraryParams,
  GetMediaUsageSummaryData,
  GetMenuCacheStatsData,
  GetMenuContextData,
  GetMenuCorpusData,
  GetMenuCorpusDebugData,
  GetMenuCorpusError,
  GetMenuCorpusHealthData,
  GetMenuCorpusHealthError,
  GetMenuDataStatusData,
  GetMenuDataSummaryData,
  GetMenuDeltaSyncData,
  GetMenuDeltaSyncError,
  GetMenuDeltaSyncParams,
  GetMenuForVoiceAgentData,
  GetMenuForVoiceAgentHtmlData,
  GetMenuForVoiceAgentTextData,
  GetMenuItemsData,
  GetMenuPrintSettingsData,
  GetMenuStatusData,
  GetMenuTextForRagData,
  GetMenuWithOrderingData,
  GetMigrationHistoryEndpointData,
  GetMigrationHistoryEndpointError,
  GetMigrationHistoryEndpointParams,
  GetNextDisplayOrderData,
  GetNextDisplayOrderError,
  GetNextItemDisplayOrderData,
  GetNextItemDisplayOrderError,
  GetOfflineSyncStatusData,
  GetOfflineSyncStatusError,
  GetOfflineSyncStatusParams,
  GetOnboardingStatusData,
  GetOnboardingStatusError,
  GetOnboardingStatusParams,
  GetOnlineOrdersData,
  GetOnlineOrdersError,
  GetOnlineOrdersParams,
  GetOptimizedImageData,
  GetOptimizedImageError,
  GetOptimizedImageParams,
  GetOptimizedMenuData,
  GetOptimizedMenuError,
  GetOptimizedMenuParams,
  GetOrderByIdData,
  GetOrderByIdError,
  GetOrderByIdParams,
  GetOrderHistoryData,
  GetOrderHistoryError,
  GetOrderHistoryParams,
  GetOrderItemsData,
  GetOrderItemsError,
  GetOrderItemsParams,
  GetOrderSampleData,
  GetOrderSampleError,
  GetOrderTrackingDetailsData,
  GetOrderTrackingDetailsError,
  GetOrderTrackingDetailsParams,
  GetOrdersByStatusData,
  GetOrdersByStatusError,
  GetOrdersByStatusParams,
  GetOrdersData,
  GetOrdersError,
  GetOrdersParams,
  GetPackageInfoData,
  GetPasswordStatusData,
  GetPaymentNotificationsMainData,
  GetPaymentNotificationsMainError,
  GetPaymentNotificationsMainParams,
  GetPendingChangesData,
  GetPerformanceReportData,
  GetPersonalizationSettingsData,
  GetPersonalizationSettingsError,
  GetPersonalizationSettingsParams,
  GetPosBundleData,
  GetPosDesktopVersionData,
  GetPosSettingsData,
  GetPowershellInstallScriptData,
  GetPowershellUninstallScriptData,
  GetPrintJobData,
  GetPrintJobError,
  GetPrintJobParams,
  GetPrintJobStatsData,
  GetPrintJobsData,
  GetPrintJobsError,
  GetPrintJobsParams,
  GetPrintQueueJobData,
  GetPrintQueueJobError,
  GetPrintQueueJobParams,
  GetPrintQueueJobStatsData,
  GetPrintQueueJobsData,
  GetPrintQueueJobsError,
  GetPrintQueueJobsParams,
  GetPrintRequestTemplatesData,
  GetPrinterCapabilitiesData,
  GetPrinterStatusData,
  GetPrintingSystemStatusData,
  GetProfileImageData,
  GetProfileImageError,
  GetProfileImageParams,
  GetProteinTypeData,
  GetProteinTypeError,
  GetProteinTypeParams,
  GetProteinTypesData,
  GetPublicRestaurantInfoData,
  GetPublicRestaurantTextData,
  GetQueueStatusData,
  GetRawPerformanceMetricsData,
  GetRealMenuDataData,
  GetRealMenuDataEnhancedData,
  GetRealTimeStatsData,
  GetRealTimeSyncStatusData,
  GetRealtimeNotificationStatsData,
  GetRealtimeNotificationStatsError,
  GetRealtimeNotificationStatsParams,
  GetRealtimeNotificationsData,
  GetRealtimeNotificationsError,
  GetRealtimeNotificationsParams,
  GetReceiptData,
  GetReceiptError,
  GetReceiptParams,
  GetReceiptTemplateData,
  GetReceiptTemplateError,
  GetReceiptTemplateParams,
  GetRecentMediaAssetsData,
  GetRecentMediaAssetsError,
  GetRecentMediaAssetsParams,
  GetRecentPrintJobsData,
  GetRecentPrintJobsError,
  GetRecentPrintJobsParams,
  GetReconciliationSummaryData,
  GetReconciliationSummaryError,
  GetReconciliationSummaryParams,
  GetRepositoryInfoData,
  GetRestaurantConfigData,
  GetRestaurantDetailsForVoiceAgentData,
  GetRestaurantInfoTextForRagData,
  GetRestaurantProfileForVoiceAgentData,
  GetRestaurantProfileForVoiceAgentHtmlData,
  GetRestaurantProfileForVoiceAgentTextData,
  GetRestaurantSettingsData,
  GetSampleOrderDataEndpointData,
  GetSampleOrderDataEndpointError,
  GetSchemaHealthData,
  GetSequenceStatusData,
  GetServiceChargeConfigEndpointData,
  GetServiceSpecificationData,
  GetSessionMetricsData,
  GetSessionMetricsError,
  GetSessionMetricsParams,
  GetSetMealData,
  GetSetMealError,
  GetSetMealParams,
  GetSharedFavoriteListData,
  GetSharedFavoriteListError,
  GetSharedFavoriteListParams,
  GetSignatureDishesData,
  GetSignatureDishesError,
  GetSignatureDishesParams,
  GetSourceFileData,
  GetSourceFileError,
  GetSourceFileParams,
  GetSpecificationData,
  GetStaticMapsConfigData,
  GetStatusOptionsData,
  GetStorageStatusData,
  GetStripePublishableKeyData,
  GetSummaryRequest,
  GetSupabaseConfigData,
  GetSyncStatusEndpointData,
  GetTableOrderData,
  GetTableOrderError,
  GetTableOrderParams,
  GetTableSessionStatusData,
  GetTableSessionStatusError,
  GetTableSessionStatusParams,
  GetTablesConfigData,
  GetTablesData,
  GetTemplateAssignmentData,
  GetTemplateAssignmentError,
  GetTemplateAssignmentParams,
  GetTemplateAssignmentsData,
  GetTemplatePreviewData,
  GetTemplatePreviewError,
  GetTemplatePreviewParams,
  GetTemplateStatusData,
  GetTestInfoData,
  GetTestStatusData,
  GetUnifiedAgentConfigData,
  GetUserFavoritesData,
  GetUserFavoritesError,
  GetUserFavoritesParams,
  GetUserOrdersData,
  GetUserOrdersError,
  GetUserOrdersParams,
  GetVoiceAgentCustomizationsData,
  GetVoiceAgentDataData,
  GetVoiceAgentStatusData,
  GetWorkflowRunJobsData,
  GetWorkflowRunJobsError,
  GetWorkflowRunJobsParams,
  GoogleLiveVoiceStatusData,
  HealthCheckData,
  ImportAvatarsFromStorageData,
  InitClientsAndCoreTablesData,
  InitPosSettingsData,
  InitSimpleChatbotTableData,
  InitializeAiVoiceSettingsData,
  InitializeDefaultAssignmentsData,
  InitializeDefaultPromosData,
  InitializeFeeConfigsData,
  InitializeGoogleLiveVoiceSettingsData,
  InitializeOnboardingData,
  InitializeOnboardingError,
  InitializeOnboardingRequest,
  InitializeSchemaMigrationsData,
  InitializeUnifiedAgentConfigData,
  InvalidateMenuCacheData,
  InvalidateMenuCacheError,
  InvalidateMenuCacheParams,
  InvalidateOfflineCacheData,
  InvestigateMenuSchemaData,
  ItemCodeRequest,
  KitchenAndCustomerRequest,
  KitchenPrintRequest,
  KitchenTicketRequest,
  LinkMediaToMenuIntegrationData,
  LinkMediaToMenuIntegrationError,
  LinkMediaToMenuIntegrationParams,
  LinkMediaToMenuIntegrationPayload,
  LinkMediaToMenuItemData,
  LinkMediaToMenuItemError,
  LinkMenuItemMediaData,
  LinkMenuItemMediaError,
  LinkMenuItemMediaParams,
  ListAllTablesData,
  ListAvailableModelsData,
  ListCachesData,
  ListChatbotPromptsData,
  ListChatbotPromptsError,
  ListChatbotPromptsParams,
  ListCustomerTabsForTableData,
  ListCustomerTabsForTableError,
  ListCustomerTabsForTableParams,
  ListPendingPaymentsData,
  ListPrintTemplatesData,
  ListPromoCodesData,
  ListProteinTypesData,
  ListReceiptTemplatesData,
  ListReceiptTemplatesError,
  ListReceiptTemplatesParams,
  ListRecentEventsData,
  ListRecentEventsError,
  ListRecentEventsParams,
  ListReleasesData,
  ListReleasesError,
  ListReleasesParams,
  ListRlsPoliciesData,
  ListSetMealsData,
  ListSetMealsError,
  ListSetMealsParams,
  ListSupportedFunctionsData,
  ListTableOrdersData,
  ListTrustedDevicesData,
  ListWorkflowRunsData,
  ListWorkflowRunsError,
  ListWorkflowRunsParams,
  LockLegacyAndViewsData,
  LogEscalationData,
  LogEscalationError,
  LogEscalationPayload,
  LogMessageData,
  LogMessageError,
  LogMessagePayload,
  LogSessionEndData,
  LogSessionEndError,
  LogSessionEndPayload,
  LogSessionStartData,
  LogSessionStartError,
  LogSessionStartPayload,
  LookupCustomerData,
  LookupCustomerError,
  LookupMenuItemByCodeData,
  LookupMenuItemByCodeError,
  LookupPostcodeSchemaData,
  LookupPostcodeSchemaError,
  LookupPostcodeSchemaParams,
  MakeLoyaltyTokenNullableData,
  MarkNotificationsProcessedMainData,
  MarkNotificationsProcessedMainError,
  MarkNotificationsProcessedMainPayload,
  MarkPaymentAsPaidData,
  MarkPaymentAsPaidError,
  MarkPaymentAsPaidParams,
  MarkRealtimeNotificationsData,
  MarkRealtimeNotificationsError,
  MarkTourCompleteData,
  MarkTourCompleteError,
  MarkTourCompleteRequest,
  MarkWizardCompleteData,
  MarkWizardCompleteError,
  MarkWizardCompleteRequest,
  MasterSwitchRequest,
  MediaBulkUpdateRequest,
  MediaIntegrationCleanupOrphanedData,
  MediaIntegrationUpdateTrackingData,
  MediaIntegrationVerifyRelationshipsData,
  MediaLinkRequest,
  MenuChangeEvent,
  MenuContextRequest,
  MenuImageUploadHealthData,
  MenuItemBase,
  MenuItemCodeRequest,
  MenuItemUpdate,
  MenuMediaCoreCleanupOrphanedData,
  MenuMediaCoreLinkToItemData,
  MenuMediaCoreLinkToItemError,
  MenuMediaCoreLinkToItemParams,
  MenuMediaCoreLinkToItemPayload,
  MenuMediaCoreUpdateTrackingData,
  MenuMediaCoreVerifyRelationshipsData,
  MenuMediaOptimizerHealthCheckData,
  MenuValidationRequest,
  MergeTabsData,
  MergeTabsError,
  MergeTabsRequest,
  MigrateFixTableStatusesData,
  MigrateProfilesToCustomersData,
  MigrateTablesNowData,
  MigrateVariantNamesToTitleCaseData,
  MoveCategorySectionData,
  MoveCategorySectionError,
  MoveCategorySectionRequest,
  MoveItemsBetweenTabsData,
  MoveItemsBetweenTabsError,
  MoveItemsRequest,
  NaturalLanguageSearchData,
  NaturalLanguageSearchError,
  NaturalLanguageSearchRequest,
  NextOrderRequest,
  NotificationMarkRequest,
  NotificationPreferences,
  NotificationRequest,
  OpeningHoursValidationRequest,
  OrderConfirmationRequest,
  OrderModel,
  OrderSampleRequest,
  OrderTrackingUpdate,
  OrderValidationRequest,
  POSLoginRequest,
  POSOrderRequest,
  PasswordUpdateRequest,
  PasswordVerificationRequest,
  PaymentLinkStatusRequest,
  PersonalizationSettingsRequest,
  PopulateCategoryPrefixesData,
  PopulateMissingVariantsData,
  PopulateSampleMenuDataEndpointData,
  PopulateSampleMenuDataV2Data,
  PosSettingsDiagnosticsData,
  PosTableConfig,
  PreflightCheckData,
  PreviewGenerationRequest,
  PreviewMigrationData,
  PreviewPromptData,
  PreviewPromptError,
  PreviewPromptRequest,
  PriceBreakdownRequest,
  PrintCustomerReceiptData,
  PrintCustomerReceiptError,
  PrintEpsonData,
  PrintEpsonError,
  PrintJobUpdateRequest,
  PrintKitchenAndCustomerData,
  PrintKitchenAndCustomerError,
  PrintKitchenThermalData,
  PrintKitchenThermalError,
  PrintKitchenTicketData,
  PrintKitchenTicketError,
  PrintReceiptThermalData,
  PrintReceiptThermalError,
  PrintRichTemplateData,
  PrintRichTemplateError,
  PrintTemplate,
  PrintTemplateRequest,
  PrintTestReceiptData,
  PrintWithTemplateData,
  PrintWithTemplateError,
  PrintWithTemplateParams,
  PrintWithTemplatePayload,
  PrinterReleaseRequest,
  ProcessCashPaymentData,
  ProcessCashPaymentError,
  ProcessFailedPrintJobsData,
  ProcessFailedPrintJobsError,
  ProcessFailedPrintJobsParams,
  ProcessFinalBillForTableData,
  ProcessFinalBillForTableError,
  ProcessFinalBillForTableParams,
  ProcessPrintQueueData,
  ProcessPrintQueueJobsData,
  ProcessPrintQueueJobsError,
  ProcessQueueRequest,
  ProcessTemplateVariablesData,
  ProcessTemplateVariablesError,
  ProcessTemplateWithSampleData,
  ProcessTemplateWithSampleError,
  PromoCodeRequest,
  PromptGeneratorHealthData,
  ProteinTypeCreate,
  ProteinTypeUpdate,
  PublishCorpusData,
  PublishCorpusError,
  PublishCorpusRequest,
  PublishMenuData,
  PublishPromptData,
  PublishPromptError,
  PublishPromptParams,
  PublishVoiceSettingsData,
  PublishWizardConfigData,
  PublishWizardConfigError,
  PublishWizardConfigRequest,
  PushPrinterServiceToGithubEndpointData,
  PushPrinterServiceToGithubEndpointError,
  PushPrinterServiceToGithubEndpointParams,
  RealTimeSyncHealthCheckData,
  ReceiptData,
  ReceiptGeneratorHealthCheckData,
  ReceiptPrintRequest,
  RecommendationRequest,
  RecordMenuChangeData,
  RecordMenuChangeError,
  RefreshSchemaCacheData,
  RegenerateAllVariantNamesData,
  RemoveAssetReferencesData,
  RemoveAssetReferencesError,
  RemoveAssetReferencesParams,
  RemoveFavoriteData,
  RemoveFavoriteError,
  RemoveFavoriteFromListData,
  RemoveFavoriteFromListError,
  RemoveFavoriteRequest,
  RemoveFromListRequest,
  RemoveItemFromCartData,
  RemoveItemFromCartError,
  RemoveItemRequest,
  RenameCustomerTabData,
  RenameCustomerTabError,
  RenameCustomerTabParams,
  RenameFavoriteListData,
  RenameFavoriteListError,
  RenameListRequest,
  ReorderRequest,
  ReorderSiblingsData,
  ReorderSiblingsError,
  ReplaceAssetInMenuItemsData,
  ReplaceAssetInMenuItemsError,
  ReplaceAssetRequest,
  ResetCodeSystemData,
  ResetMenuStructureData,
  ResetTableCompletelyData,
  ResetTableCompletelyError,
  ResetTableCompletelyParams,
  ResetTemplateAssignmentData,
  ResetTemplateAssignmentError,
  ResetTemplateAssignmentParams,
  RetryItemMigrationData,
  RevokeDeviceData,
  RevokeDeviceError,
  RevokeUserDeviceData,
  RevokeUserDeviceError,
  RollbackCategoryMigrationData,
  RollbackCategoryMigrationError,
  RollbackCategoryMigrationParams,
  RollbackData,
  RunBatchGenerationData,
  RunBatchGenerationError,
  RunBatchGenerationParams,
  RunCustomizationTestData,
  RunCustomizationTestError,
  RunFullMigrationData,
  RunFullMigrationError,
  RunFullMigrationParams,
  RunFullTestSuiteData,
  RunTableDiagnosticsData,
  SMSPaymentLinkRequest,
  SQLExecuteRequest,
  SQLQuery,
  SafeDeleteCategoryData,
  SafeDeleteCategoryError,
  SampleDataRequest,
  SaveCategoryData,
  SaveCategoryError,
  SaveMenuPrintSettingsData,
  SaveMenuPrintSettingsError,
  SaveMenuPrintSettingsPayload,
  SavePOSSettingsRequest,
  SavePosSettingsData,
  SavePosSettingsError,
  SaveRestaurantSettingsData,
  SaveRestaurantSettingsError,
  SaveSettingsRequest,
  SaveTablesConfigData,
  SaveTablesConfigError,
  SchemaMigrateMenuImagesV2Data,
  SearchMenuData,
  SearchMenuError,
  SearchMenuRequest,
  SectionChangeImpactRequest,
  SelectAgentData,
  SelectAgentError,
  SendOrderConfirmationEmailData,
  SendOrderConfirmationEmailError,
  SendRealtimeNotificationData,
  SendRealtimeNotificationError,
  SendVerificationEmailData,
  SendVerificationEmailError,
  SendVerificationEmailRequest,
  ServiceChargeConfig,
  SetActivePromptData,
  SetActivePromptError,
  SetActivePromptRequest,
  SetKdsPinData,
  SetKdsPinError,
  SetMasterSwitchData,
  SetMasterSwitchError,
  SetMealRequest,
  SetMealUpdateRequest,
  SetPINRequest,
  SetTemplateAssignmentData,
  SetTemplateAssignmentError,
  SetTemplateAssignmentRequest,
  SetupAllSchemasBatchData,
  SetupAllSchemasBatchError,
  SetupCartAnalyticsTableData,
  SetupChatAnalyticsSchemaData,
  SetupChatbotPromptsTableData,
  SetupCorpusSchemaData,
  SetupCustomerTabsSchemaData,
  SetupDatabaseProceduresData,
  SetupDeliverySchemaData,
  SetupFavoriteListsSchemaData,
  SetupKdsSchemaData,
  SetupKitchenDisplaySchemaData,
  SetupMenuCategoriesParentRelationshipData,
  SetupMenuDatabaseData,
  SetupMenuImagesSchemaV2Data,
  SetupMenuItemCodesData,
  SetupMenuStructureAlterTableFunctionData,
  SetupMenuTables2Data,
  SetupOnboardingDatabaseData,
  SetupOrderTrackingSchemaData,
  SetupPosAuthTablesData,
  SetupPosTablesSchemaData,
  SetupProfileImagesInfrastructureData,
  SetupPublishSchemaData,
  SetupRestaurantSchemaData,
  SetupSetMealsSchemaData,
  SetupSimplePaymentTrackingData,
  SetupSpecialInstructionsSchemaData,
  SetupTableOrdersSchemaData,
  SetupTriggerData,
  SetupTrustedDeviceTablesData,
  SetupUnifiedMediaSchemaData,
  SetupUserRolesRlsData,
  SetupVariantFoodDetailsSchemaData,
  SetupVariantNamePatternSchemaData,
  SetupVariantNameTriggerData,
  SetupVariantsFoodDetailsData,
  ShareFavoriteListData,
  ShareFavoriteListError,
  ShareListRequest,
  ShowMenuItemData,
  ShowMenuItemError,
  ShowMenuItemHealthData,
  ShowMenuItemParams,
  SortOrderItemsBySectionsData,
  SortOrderItemsBySectionsError,
  SortOrderItemsBySectionsPayload,
  SplitTabData,
  SplitTabError,
  SplitTabRequest,
  StaticMapRequest,
  StoreOrderData,
  StoreOrderError,
  StreamChatData,
  StreamChatError,
  StripeWebhookData,
  StructuredChatRequest,
  StructuredStreamingRequest,
  SuggestKitchenNamesData,
  SuggestKitchenNamesError,
  SuggestKitchenNamesParams,
  SupabaseManagerHealthCheckData,
  SupabasePosLoginData,
  SupabasePosLoginError,
  SyncCountersWithDatabaseData,
  SyncElectronBuilderConfigData,
  SyncGoogleProfileImageData,
  SyncGoogleProfileImageError,
  SyncGoogleProfileImageParams,
  SyncInstallerFilesData,
  SyncMenuChangesNowData,
  SyncMenuChangesNowError,
  SyncMenuChangesNowParams,
  SyncMenuCorpusData,
  SyncMenuCorpusError,
  SyncMenuCorpusParams,
  SyncPOSFilesRequest,
  SyncPosFilesData,
  SyncPosFilesError,
  SyncPrinterServiceData,
  SyncPrinterServiceError,
  SyncPrinterServiceRequest,
  SyncPrinterWorkflowFilesData,
  SyncSetMealsToMenuData,
  TableCleanupRequest,
  TemplateApplicationRequest,
  TemplateCreateRequest,
  TemplateDeleteRequest,
  TemplateUpdateRequest,
  TemplateVariablesRequest,
  TestAISettingsRequest,
  TestAiSettingsSyncData,
  TestAiSettingsSyncError,
  TestAiVoiceConnectionData,
  TestAllCartOperationsData,
  TestAllCartOperationsError,
  TestAllPrintersData,
  TestAllVoiceFunctionsData,
  TestAllVoiceFunctionsError,
  TestBatchVariantsDryRunData,
  TestBatchVariantsDryRunError,
  TestBatchVariantsDryRunParams,
  TestCategoryFilterData,
  TestCategoryFilterError,
  TestCategoryFilterParams,
  TestComprehensiveMenuSqlFunctionData,
  TestCustomizationsEndToEndData,
  TestCustomizationsEndToEndError,
  TestCustomizationsEndToEndParams,
  TestCustomizationsHealthCheckData,
  TestCustomizationsSchemaFixData,
  TestCustomizationsWithRealItemData,
  TestCustomizationsWithRealItemError,
  TestCustomizationsWithRealItemParams,
  TestGoogleLiveVoiceCallData,
  TestMenuCustomizationsQueryData,
  TestMenuUnifiedViewData,
  TestMenuVariantsRpcData,
  TestMenuVariantsRpcError,
  TestMenuVariantsRpcParams,
  TestModeAnyData,
  TestModeAnyError,
  TestModeAnyHealthCheckData,
  TestModeAnyMultiturnData,
  TestModeAnyMultiturnError,
  TestModeAnyMultiturnParams,
  TestModeAnyParams,
  TestOptimizedFunctionData,
  TestPrintData,
  TestPrintError,
  TestPrintSimpleDataData,
  TestPrintUnifiedData,
  TestPrintUnifiedError,
  TestRequest,
  TestSafetyValidationData,
  TestSqlFunctionMenuTablesData,
  TestTier1CrudData,
  TestTier2DdlData,
  TestTier3AdvancedData,
  TestVoiceExecutorData,
  TestVoiceExecutorError,
  ThermalTestPrintData,
  ToggleAiAssistantData,
  ToggleAiVoiceAssistantData,
  ToggleAiVoiceAssistantError,
  ToggleAiVoiceAssistantParams,
  TrackCartEventData,
  TrackCartEventError,
  TrustDeviceForUserData,
  TrustDeviceForUserError,
  TrustDeviceRequest,
  UnifiedAgentConfigStatusData,
  UnlinkMediaData,
  UnlinkMediaError,
  UnlinkMediaParams,
  UnpublishPromptData,
  UnpublishPromptError,
  UnpublishPromptParams,
  UpdateAbbreviationDictionaryData,
  UpdateAbbreviationDictionaryError,
  UpdateAbbreviationDictionaryPayload,
  UpdateAgentData,
  UpdateAgentError,
  UpdateAgentParams,
  UpdateAiVoiceSettingsData,
  UpdateAiVoiceSettingsError,
  UpdateAutoSyncConfigData,
  UpdateAutoSyncConfigError,
  UpdateCategoriesPrintFieldsData,
  UpdateChatbotPromptData,
  UpdateChatbotPromptError,
  UpdateChatbotPromptParams,
  UpdateCustomerPreferencesData,
  UpdateCustomerPreferencesError,
  UpdateCustomerPreferencesParams,
  UpdateCustomerTabData,
  UpdateCustomerTabError,
  UpdateCustomerTabParams,
  UpdateCustomerTabRequest,
  UpdateCustomizationData,
  UpdateCustomizationError,
  UpdateCustomizationParams,
  UpdateCustomizationRequest,
  UpdateCustomizationsRequest,
  UpdateDeliveryZonesData,
  UpdateDeliveryZonesError,
  UpdateDeliveryZonesPayload,
  UpdateEmailStepData,
  UpdateEmailStepError,
  UpdateEmailStepParams,
  UpdateExistingAgentsGenderData,
  UpdateFileMappingData,
  UpdateFileMappingError,
  UpdateFileMappingRequest,
  UpdateGoogleLiveVoiceSettingsData,
  UpdateGoogleLiveVoiceSettingsError,
  UpdateGoogleLiveVoiceSettingsRequest,
  UpdateItemCustomizationsData,
  UpdateItemCustomizationsError,
  UpdateItemQuantityData,
  UpdateItemQuantityError,
  UpdateMediaAssetData,
  UpdateMediaAssetError,
  UpdateMediaAssetParams,
  UpdateMediaAssetPayload,
  UpdateMenuItemData,
  UpdateMenuItemError,
  UpdateMenuItemParams,
  UpdateMenuItemsSchemaData,
  UpdateMenuItemsWithAiFields2Data,
  UpdateMenuItemsWithAiFieldsData,
  UpdateOrderTrackingStatusData,
  UpdateOrderTrackingStatusError,
  UpdatePOSDesktopRequest,
  UpdatePasswordData,
  UpdatePasswordError,
  UpdatePersonalizationSettingsData,
  UpdatePersonalizationSettingsError,
  UpdatePosDesktopData,
  UpdatePosDesktopError,
  UpdatePosTableData,
  UpdatePosTableError,
  UpdatePosTableParams,
  UpdatePosTableStatusData,
  UpdatePosTableStatusError,
  UpdatePosTableStatusParams,
  UpdatePrintJobStatusData,
  UpdatePrintJobStatusError,
  UpdatePrintJobStatusParams,
  UpdatePrintQueueJobStatusData,
  UpdatePrintQueueJobStatusError,
  UpdatePrintQueueJobStatusParams,
  UpdateProteinTypeData,
  UpdateProteinTypeError,
  UpdateProteinTypeParams,
  UpdateQuantityRequest,
  UpdateReceiptTemplateData,
  UpdateReceiptTemplateError,
  UpdateReceiptTemplateParams,
  UpdateServiceChargeConfigData,
  UpdateServiceChargeConfigError,
  UpdateSetMealData,
  UpdateSetMealError,
  UpdateSetMealParams,
  UpdateTableOrderData,
  UpdateTableOrderError,
  UpdateTableOrderParams,
  UpdateTableOrderRequest,
  UpdateTableRequest,
  UpdateUnifiedAgentConfigData,
  UpdateUnifiedAgentConfigError,
  UpdateUnifiedAgentConfigRequest,
  UpdateVariantPricingData,
  UpdateVariantPricingError,
  UploadAssetRequest,
  UploadAvatarData,
  UploadAvatarError,
  UploadGeneralFileData,
  UploadGeneralFileError,
  UploadMenuImageData,
  UploadMenuImageError,
  UploadMenuItemImageData,
  UploadMenuItemImageError,
  UploadOptimizedMenuImageData,
  UploadOptimizedMenuImageError,
  UploadPrimaryAgentAvatarData,
  UploadPrimaryAgentAvatarError,
  UploadProfileImageData,
  UploadProfileImageError,
  UploadReleaseAssetData,
  UploadReleaseAssetError,
  ValidateAssetsRequest,
  ValidateAvatarLimitData,
  ValidateCodeStandardData,
  ValidateCodeStandardError,
  ValidateCodeStandardParams,
  ValidateCodeUniqueData,
  ValidateCodeUniqueError,
  ValidateCodeUniqueParams,
  ValidateCustomizationData,
  ValidateCustomizationError,
  ValidateCustomizationRequest,
  ValidateDeliveryPostcodeData,
  ValidateDeliveryPostcodeError,
  ValidateMediaAssetsData,
  ValidateMediaAssetsError,
  ValidateMenuItemData,
  ValidateMenuItemError,
  ValidateOpeningHoursData,
  ValidateOpeningHoursError,
  ValidateOrderData,
  ValidateOrderError,
  ValidatePromoCodeData,
  ValidatePromoCodeError,
  ValidateReferenceSystemData,
  ValidateStructuredPromptsData,
  VariableListRequest,
  VariantCodeRequest,
  VerifyCartAiSchemaData,
  VerifyCategoryMigrationData,
  VerifyDatabaseProceduresData,
  VerifyExecuteSqlRpcData,
  VerifyKdsPinData,
  VerifyKdsPinError,
  VerifyMigrationData,
  VerifyPINRequest,
  VerifyPasswordData,
  VerifyPasswordError,
  VerifyPasswordWithDeviceData,
  VerifyPasswordWithDeviceError,
  VerifyPasswordWithDeviceRequest,
  VerifySchemaData,
  VerifySimpleMigrationData,
  VerifyTerminalPaymentSchemaData,
  VerifyTriggerSetupData,
  VerifyVariantNamesData,
  ViewMenuItemsWithVariantsData,
  VoiceAgentCoreHealthData,
  VoiceSessionHealthData,
  VoiceSessionRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Link media assets to a menu item and update the relationship in the database. This endpoint maintains bidirectional relationships and updates tracking info.
   *
   * @tags dbtn/module:link_media_to_menu_item
   * @name link_menu_item_media
   * @summary Link Menu Item Media
   * @request POST:/routes/link-media-to-menu-item/{menu_item_id}
   */
  link_menu_item_media = ({ menuItemId, ...query }: LinkMenuItemMediaParams, params: RequestParams = {}) =>
    this.request<LinkMenuItemMediaData, LinkMenuItemMediaError>({
      path: `/routes/link-media-to-menu-item/${menuItemId}`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get all code standards and naming conventions This endpoint returns the complete list of code standards and naming conventions used in the project, with examples for each. Returns: StandardsResponse: List of code standards and naming conventions
   *
   * @tags dbtn/module:code_standards
   * @name get_code_standards
   * @summary Get Code Standards
   * @request GET:/routes/standards
   */
  get_code_standards = (params: RequestParams = {}) =>
    this.request<GetCodeStandardsData, any>({
      path: `/routes/standards`,
      method: "GET",
      ...params,
    });

  /**
   * @description Validate if a given standard is implemented correctly This endpoint checks if a specific code standard is being followed correctly in the codebase. Args: standard_id: The ID of the standard to validate Returns: Dict[str, Any]: Validation results with compliance metrics
   *
   * @tags dbtn/module:code_standards
   * @name validate_code_standard
   * @summary Validate Code Standard
   * @request POST:/routes/standards/validate
   */
  validate_code_standard = (query: ValidateCodeStandardParams, params: RequestParams = {}) =>
    this.request<ValidateCodeStandardData, ValidateCodeStandardError>({
      path: `/routes/standards/validate`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get all signature dishes - role_level determines access level
   *
   * @tags dbtn/module:signature_dishes
   * @name get_signature_dishes
   * @summary Get Signature Dishes
   * @request GET:/routes/signature-dishes
   */
  get_signature_dishes = (query: GetSignatureDishesParams, params: RequestParams = {}) =>
    this.request<GetSignatureDishesData, GetSignatureDishesError>({
      path: `/routes/signature-dishes`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Provides the correct Supabase configuration to the frontend. Only returns the URL and anon key that are safe for frontend use.
   *
   * @tags dbtn/module:supabase_config
   * @name get_supabase_config
   * @summary Get Supabase Config
   * @request GET:/routes/get-supabase-config
   */
  get_supabase_config = (params: RequestParams = {}) =>
    this.request<GetSupabaseConfigData, any>({
      path: `/routes/get-supabase-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Safely bulk delete categories or protein types. This version provides better error handling and user guidance.
   *
   * @tags dbtn/module:bulk_menu_operations
   * @name bulk_delete_items_safe
   * @summary Bulk Delete Items Safe
   * @request POST:/routes/bulk-delete-safe
   */
  bulk_delete_items_safe = (data: AppApisBulkMenuOperationsBulkDeleteRequest, params: RequestParams = {}) =>
    this.request<BulkDeleteItemsSafeData, BulkDeleteItemsSafeError>({
      path: `/routes/bulk-delete-safe`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Checks and automatically fixes Supabase storage bucket permissions for menu media uploads. This endpoint is designed to be called before media uploads to ensure proper permissions are set. It will: 1. Check if the client-menu-images bucket exists 2. Create it if it doesn't exist 3. Verify and fix RLS policies for the bucket Returns: StoragePermissionsResponse: Object with success status and details
   *
   * @tags dbtn/module:storage_permissions
   * @name check_and_fix_storage_permissions
   * @summary Check And Fix Storage Permissions
   * @request GET:/routes/check-and-fix-storage-permissions
   */
  check_and_fix_storage_permissions = (params: RequestParams = {}) =>
    this.request<CheckAndFixStoragePermissionsData, any>({
      path: `/routes/check-and-fix-storage-permissions`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add RLS policies to the menu_items_ai_metadata table
   *
   * @tags dbtn/module:menu_rls
   * @name add_menu_ai_rls
   * @summary Add Menu Ai Rls
   * @request POST:/routes/add-menu-ai-rls
   */
  add_menu_ai_rls = (params: RequestParams = {}) =>
    this.request<AddMenuAiRlsData, any>({
      path: `/routes/add-menu-ai-rls`,
      method: "POST",
      ...params,
    });

  /**
   * @description Update the categories table to add print_order and print_to_kitchen columns
   *
   * @tags dbtn/module:menu_print_settings
   * @name update_categories_print_fields
   * @summary Update Categories Print Fields
   * @request POST:/routes/update-categories-print-fields
   */
  update_categories_print_fields = (params: RequestParams = {}) =>
    this.request<UpdateCategoriesPrintFieldsData, any>({
      path: `/routes/update-categories-print-fields`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if the print_order and print_to_kitchen fields exist in the menu_categories table
   *
   * @tags dbtn/module:menu_print_settings
   * @name check_categories_print_fields
   * @summary Check Categories Print Fields
   * @request GET:/routes/check-categories-print-fields
   */
  check_categories_print_fields = (params: RequestParams = {}) =>
    this.request<CheckCategoriesPrintFieldsData, any>({
      path: `/routes/check-categories-print-fields`,
      method: "GET",
      ...params,
    });

  /**
   * @description Reset the menu structure to the default template categories
   *
   * @tags dbtn/module:menu_structure_reset
   * @name reset_menu_structure
   * @summary Reset Menu Structure
   * @request POST:/routes/reset-menu-structure
   */
  reset_menu_structure = (params: RequestParams = {}) =>
    this.request<ResetMenuStructureData, any>({
      path: `/routes/reset-menu-structure`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix the schema mismatch by renaming sort_order to display_order in menu_categories
   *
   * @tags dbtn/module:menu_schema_fix
   * @name fix_schema_column_mismatch
   * @summary Fix Schema Column Mismatch
   * @request POST:/routes/menu-schema-fix/fix-schema-column-mismatch
   */
  fix_schema_column_mismatch = (params: RequestParams = {}) =>
    this.request<FixSchemaColumnMismatchData, any>({
      path: `/routes/menu-schema-fix/fix-schema-column-mismatch`,
      method: "POST",
      ...params,
    });

  /**
   * @description Remove duplicate categories, keeping one of each category name
   *
   * @tags dbtn/module:menu_schema_fix
   * @name clean_duplicate_categories
   * @summary Clean Duplicate Categories
   * @request POST:/routes/menu-schema-fix/clean-duplicate-categories
   */
  clean_duplicate_categories = (params: RequestParams = {}) =>
    this.request<CleanDuplicateCategoriesData, any>({
      path: `/routes/menu-schema-fix/clean-duplicate-categories`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check the current schema status and data consistency
   *
   * @tags dbtn/module:menu_schema_fix
   * @name check_schema_status
   * @summary Check Schema Status
   * @request GET:/routes/menu-schema-fix/check-schema-status
   */
  check_schema_status = (params: RequestParams = {}) =>
    this.request<CheckSchemaStatusData, any>({
      path: `/routes/menu-schema-fix/check-schema-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Execute SQL query and return results
   *
   * @tags dbtn/module:sql_execution
   * @name execute_sql_endpoint
   * @summary Execute Sql Endpoint
   * @request POST:/routes/execute-sql
   */
  execute_sql_endpoint = (data: SQLQuery, params: RequestParams = {}) =>
    this.request<ExecuteSqlEndpointData, ExecuteSqlEndpointError>({
      path: `/routes/execute-sql`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Add timing fields to orders table for Collection and Delivery scheduling
   *
   * @tags dbtn/module:sql_execution
   * @name add_order_timing_fields
   * @summary Add Order Timing Fields
   * @request POST:/routes/add-order-timing-fields
   */
  add_order_timing_fields = (params: RequestParams = {}) =>
    this.request<AddOrderTimingFieldsData, any>({
      path: `/routes/add-order-timing-fields`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if timing fields exist in orders table
   *
   * @tags dbtn/module:sql_execution
   * @name check_order_timing_fields
   * @summary Check Order Timing Fields
   * @request GET:/routes/check-order-timing-fields
   */
  check_order_timing_fields = (params: RequestParams = {}) =>
    this.request<CheckOrderTimingFieldsData, any>({
      path: `/routes/check-order-timing-fields`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add is_linked_table and is_linked_primary columns to existing pos_tables table
   *
   * @tags dbtn/module:pos_tables_migration
   * @name add_linking_columns
   * @summary Add Linking Columns
   * @request POST:/routes/pos-tables-migration/add-linking-columns
   */
  add_linking_columns = (params: RequestParams = {}) =>
    this.request<AddLinkingColumnsData, any>({
      path: `/routes/pos-tables-migration/add-linking-columns`,
      method: "POST",
      ...params,
    });

  /**
   * @description Remove test items with invalid menu_item_ids and reset table status
   *
   * @tags dbtn/module:table_cleanup
   * @name cleanup_table_test_items
   * @summary Cleanup Table Test Items
   * @request POST:/routes/cleanup-table-test-items
   */
  cleanup_table_test_items = (data: TableCleanupRequest, params: RequestParams = {}) =>
    this.request<CleanupTableTestItemsData, CleanupTableTestItemsError>({
      path: `/routes/cleanup-table-test-items`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Completely reset a table by deleting its order record
   *
   * @tags dbtn/module:table_cleanup
   * @name reset_table_completely
   * @summary Reset Table Completely
   * @request DELETE:/routes/reset-table/{table_number}
   */
  reset_table_completely = ({ tableNumber, ...query }: ResetTableCompletelyParams, params: RequestParams = {}) =>
    this.request<ResetTableCompletelyData, ResetTableCompletelyError>({
      path: `/routes/reset-table/${tableNumber}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Analyze table items to identify test/invalid items
   *
   * @tags dbtn/module:table_cleanup
   * @name analyze_table_items
   * @summary Analyze Table Items
   * @request GET:/routes/analyze-table/{table_number}
   */
  analyze_table_items = ({ tableNumber, ...query }: AnalyzeTableItemsParams, params: RequestParams = {}) =>
    this.request<AnalyzeTableItemsData, AnalyzeTableItemsError>({
      path: `/routes/analyze-table/${tableNumber}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get sample order data for testing templates
   *
   * @tags dbtn/module:sample_data
   * @name get_order_sample
   * @summary Get Order Sample
   * @request POST:/routes/order-sample
   */
  get_order_sample = (data: OrderSampleRequest, params: RequestParams = {}) =>
    this.request<GetOrderSampleData, GetOrderSampleError>({
      path: `/routes/order-sample`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all sample order data for testing templates
   *
   * @tags dbtn/module:sample_data
   * @name get_all_order_samples
   * @summary Get All Order Samples
   * @request GET:/routes/all-order-samples
   */
  get_all_order_samples = (params: RequestParams = {}) =>
    this.request<GetAllOrderSamplesData, any>({
      path: `/routes/all-order-samples`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get business data for template processing
   *
   * @tags dbtn/module:sample_data
   * @name get_business_data_endpoint
   * @summary Get Business Data Endpoint
   * @request GET:/routes/business-data
   */
  get_business_data_endpoint = (params: RequestParams = {}) =>
    this.request<GetBusinessDataEndpointData, any>({
      path: `/routes/business-data`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sync all active set meals to menu items in SET MEALS category
   *
   * @tags dbtn/module:set_meal_sync
   * @name sync_set_meals_to_menu
   * @summary Sync Set Meals To Menu
   * @request POST:/routes/sync-set-meals-to-menu
   */
  sync_set_meals_to_menu = (params: RequestParams = {}) =>
    this.request<SyncSetMealsToMenuData, any>({
      path: `/routes/sync-set-meals-to-menu`,
      method: "POST",
      ...params,
    });

  /**
   * @description Auto-sync a specific set meal when it's created/updated in admin
   *
   * @tags dbtn/module:set_meal_sync
   * @name auto_sync_on_set_meal_change
   * @summary Auto Sync On Set Meal Change
   * @request POST:/routes/auto-sync-on-set-meal-change
   */
  auto_sync_on_set_meal_change = (query: AutoSyncOnSetMealChangeParams, params: RequestParams = {}) =>
    this.request<AutoSyncOnSetMealChangeData, AutoSyncOnSetMealChangeError>({
      path: `/routes/auto-sync-on-set-meal-change`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Verify and update relationships between menu items and media assets
   *
   * @tags dbtn/module:menu_media
   * @name menu_media_core_verify_relationships
   * @summary Menu Media Core Verify Relationships
   * @request POST:/routes/menu-media-core/verify-relationships
   */
  menu_media_core_verify_relationships = (params: RequestParams = {}) =>
    this.request<MenuMediaCoreVerifyRelationshipsData, any>({
      path: `/routes/menu-media-core/verify-relationships`,
      method: "POST",
      ...params,
    });

  /**
   * @description Update core media tracking
   *
   * @tags dbtn/module:menu_media
   * @name menu_media_core_update_tracking
   * @summary Menu Media Core Update Tracking
   * @request POST:/routes/menu-media-core/update-tracking
   */
  menu_media_core_update_tracking = (params: RequestParams = {}) =>
    this.request<MenuMediaCoreUpdateTrackingData, any>({
      path: `/routes/menu-media-core/update-tracking`,
      method: "POST",
      ...params,
    });

  /**
   * @description Link media to menu item using unified core system
   *
   * @tags dbtn/module:menu_media
   * @name menu_media_core_link_to_item
   * @summary Menu Media Core Link To Item
   * @request POST:/routes/menu-media-core/link-to-item/{menu_item_id}
   */
  menu_media_core_link_to_item = (
    { menuItemId, ...query }: MenuMediaCoreLinkToItemParams,
    data: MenuMediaCoreLinkToItemPayload,
    params: RequestParams = {},
  ) =>
    this.request<MenuMediaCoreLinkToItemData, MenuMediaCoreLinkToItemError>({
      path: `/routes/menu-media-core/link-to-item/${menuItemId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Clean up orphaned media assets using core system
   *
   * @tags dbtn/module:menu_media
   * @name menu_media_core_cleanup_orphaned
   * @summary Menu Media Core Cleanup Orphaned
   * @request POST:/routes/menu-media-core/cleanup-orphaned
   */
  menu_media_core_cleanup_orphaned = (params: RequestParams = {}) =>
    this.request<MenuMediaCoreCleanupOrphanedData, any>({
      path: `/routes/menu-media-core/cleanup-orphaned`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify relationships between menu items and their associated media assets
   *
   * @tags dbtn/module:menu_media_integration
   * @name media_integration_verify_relationships
   * @summary Media Integration Verify Relationships
   * @request GET:/routes/media-integration/verify-menu-relationships
   */
  media_integration_verify_relationships = (params: RequestParams = {}) =>
    this.request<MediaIntegrationVerifyRelationshipsData, any>({
      path: `/routes/media-integration/verify-menu-relationships`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update media tracking through integration system
   *
   * @tags dbtn/module:menu_media_integration
   * @name media_integration_update_tracking
   * @summary Media Integration Update Tracking
   * @request POST:/routes/media-integration/update-media-tracking
   */
  media_integration_update_tracking = (params: RequestParams = {}) =>
    this.request<MediaIntegrationUpdateTrackingData, any>({
      path: `/routes/media-integration/update-media-tracking`,
      method: "POST",
      ...params,
    });

  /**
   * @description Link media to menu integration using unified system
   *
   * @tags dbtn/module:menu_media_integration
   * @name link_media_to_menu_integration
   * @summary Link Media To Menu Integration
   * @request POST:/routes/menu-integration/link-media/{menu_item_id}
   */
  link_media_to_menu_integration = (
    { menuItemId, ...query }: LinkMediaToMenuIntegrationParams,
    data: LinkMediaToMenuIntegrationPayload,
    params: RequestParams = {},
  ) =>
    this.request<LinkMediaToMenuIntegrationData, LinkMediaToMenuIntegrationError>({
      path: `/routes/menu-integration/link-media/${menuItemId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Clean up orphaned media assets through integration system
   *
   * @tags dbtn/module:menu_media_integration
   * @name media_integration_cleanup_orphaned
   * @summary Media Integration Cleanup Orphaned
   * @request DELETE:/routes/media-integration/cleanup-orphaned-media
   */
  media_integration_cleanup_orphaned = (params: RequestParams = {}) =>
    this.request<MediaIntegrationCleanupOrphanedData, any>({
      path: `/routes/media-integration/cleanup-orphaned-media`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Generate FOH and Kitchen preview thumbnails for a template
   *
   * @tags dbtn/module:template_previews
   * @name generate_template_preview
   * @summary Generate Template Preview
   * @request POST:/routes/generate-preview/{template_id}
   */
  generate_template_preview = (
    { templateId, ...query }: GenerateTemplatePreviewParams,
    data: PreviewGenerationRequest,
    params: RequestParams = {},
  ) =>
    this.request<GenerateTemplatePreviewData, GenerateTemplatePreviewError>({
      path: `/routes/generate-preview/${templateId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get preview image data for a template variant
   *
   * @tags dbtn/module:template_previews
   * @name get_template_preview
   * @summary Get Template Preview
   * @request GET:/routes/get-preview/{template_id}/{variant}
   */
  get_template_preview = ({ templateId, variant, ...query }: GetTemplatePreviewParams, params: RequestParams = {}) =>
    this.request<GetTemplatePreviewData, GetTemplatePreviewError>({
      path: `/routes/get-preview/${templateId}/${variant}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete preview images for a template
   *
   * @tags dbtn/module:template_previews
   * @name delete_template_preview
   * @summary Delete Template Preview
   * @request DELETE:/routes/delete-preview/{template_id}
   */
  delete_template_preview = ({ templateId, ...query }: DeleteTemplatePreviewParams, params: RequestParams = {}) =>
    this.request<DeleteTemplatePreviewData, DeleteTemplatePreviewError>({
      path: `/routes/delete-preview/${templateId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Generate abbreviated version of text using smart abbreviation dictionary
   *
   * @tags dbtn/module:smart_abbreviation
   * @name abbreviate_text
   * @summary Abbreviate Text
   * @request POST:/routes/abbreviate-text
   */
  abbreviate_text = (data: AbbreviationRequest, params: RequestParams = {}) =>
    this.request<AbbreviateTextData, AbbreviateTextError>({
      path: `/routes/abbreviate-text`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate kitchen display name suggestions for menu items with proteins
   *
   * @tags dbtn/module:smart_abbreviation
   * @name suggest_kitchen_names
   * @summary Suggest Kitchen Names
   * @request POST:/routes/suggest-kitchen-names
   */
  suggest_kitchen_names = (query: SuggestKitchenNamesParams, params: RequestParams = {}) =>
    this.request<SuggestKitchenNamesData, SuggestKitchenNamesError>({
      path: `/routes/suggest-kitchen-names`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get the current abbreviation dictionary
   *
   * @tags dbtn/module:smart_abbreviation
   * @name get_abbreviation_dictionary
   * @summary Get Abbreviation Dictionary
   * @request GET:/routes/abbreviation-dictionary
   */
  get_abbreviation_dictionary = (params: RequestParams = {}) =>
    this.request<GetAbbreviationDictionaryData, any>({
      path: `/routes/abbreviation-dictionary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update the abbreviation dictionary with custom restaurant terms
   *
   * @tags dbtn/module:smart_abbreviation
   * @name update_abbreviation_dictionary
   * @summary Update Abbreviation Dictionary
   * @request POST:/routes/update-abbreviation-dictionary
   */
  update_abbreviation_dictionary = (data: UpdateAbbreviationDictionaryPayload, params: RequestParams = {}) =>
    this.request<UpdateAbbreviationDictionaryData, UpdateAbbreviationDictionaryError>({
      path: `/routes/update-abbreviation-dictionary`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Analyze all menu items and suggest kitchen display names for long items
   *
   * @tags dbtn/module:smart_abbreviation
   * @name batch_analyze_menu_items
   * @summary Batch Analyze Menu Items
   * @request POST:/routes/batch-analyze-menu-items
   */
  batch_analyze_menu_items = (params: RequestParams = {}) =>
    this.request<BatchAnalyzeMenuItemsData, any>({
      path: `/routes/batch-analyze-menu-items`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get recent payment notifications
   *
   * @tags dbtn/module:payment_notifications
   * @name get_payment_notifications_main
   * @summary Get Payment Notifications Main
   * @request GET:/routes/payment-notifications
   */
  get_payment_notifications_main = (query: GetPaymentNotificationsMainParams, params: RequestParams = {}) =>
    this.request<GetPaymentNotificationsMainData, GetPaymentNotificationsMainError>({
      path: `/routes/payment-notifications`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Mark notifications as processed
   *
   * @tags dbtn/module:payment_notifications
   * @name mark_notifications_processed_main
   * @summary Mark Notifications Processed Main
   * @request POST:/routes/payment-notifications/mark-processed
   */
  mark_notifications_processed_main = (data: MarkNotificationsProcessedMainPayload, params: RequestParams = {}) =>
    this.request<MarkNotificationsProcessedMainData, MarkNotificationsProcessedMainError>({
      path: `/routes/payment-notifications/mark-processed`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get notification preferences for a customer
   *
   * @tags dbtn/module:preferences
   * @name get_customer_preferences
   * @summary Get Customer Preferences
   * @request GET:/routes/preferences/{phone_number}
   */
  get_customer_preferences = ({ phoneNumber, ...query }: GetCustomerPreferencesParams, params: RequestParams = {}) =>
    this.request<GetCustomerPreferencesData, GetCustomerPreferencesError>({
      path: `/routes/preferences/${phoneNumber}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update notification preferences for a customer
   *
   * @tags dbtn/module:preferences
   * @name update_customer_preferences
   * @summary Update Customer Preferences
   * @request POST:/routes/preferences/{phone_number}
   */
  update_customer_preferences = (
    { phoneNumber, ...query }: UpdateCustomerPreferencesParams,
    data: NotificationPreferences,
    params: RequestParams = {},
  ) =>
    this.request<UpdateCustomerPreferencesData, UpdateCustomerPreferencesError>({
      path: `/routes/preferences/${phoneNumber}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get recent events with optional filtering
   *
   * @tags dbtn/module:events
   * @name list_recent_events
   * @summary List Recent Events
   * @request GET:/routes/events/recent-events
   */
  list_recent_events = (query: ListRecentEventsParams, params: RequestParams = {}) =>
    this.request<ListRecentEventsData, ListRecentEventsError>({
      path: `/routes/events/recent-events`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Emit a new event through the API
   *
   * @tags dbtn/module:events
   * @name emit_event_endpoint
   * @summary Emit Event Endpoint
   * @request POST:/routes/events/emit
   */
  emit_event_endpoint = (data: EmitEventRequest, params: RequestParams = {}) =>
    this.request<EmitEventEndpointData, EmitEventEndpointError>({
      path: `/routes/events/emit`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check database schema status and health
   *
   * @tags dbtn/module:unified_database_core
   * @name check_database_schema
   * @summary Check Database Schema
   * @request GET:/routes/unified-database/core/check-schema
   */
  check_database_schema = (params: RequestParams = {}) =>
    this.request<CheckDatabaseSchemaData, any>({
      path: `/routes/unified-database/core/check-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test database connection and performance
   *
   * @tags dbtn/module:unified_database_core
   * @name check_database_connection
   * @summary Check Database Connection
   * @request GET:/routes/unified-database/core/check-connection
   */
  check_database_connection = (params: RequestParams = {}) =>
    this.request<CheckDatabaseConnectionData, any>({
      path: `/routes/unified-database/core/check-connection`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix common foreign key constraint issues
   *
   * @tags dbtn/module:unified_database_core
   * @name fix_database_foreign_keys
   * @summary Fix Database Foreign Keys
   * @request POST:/routes/unified-database/core/fix-foreign-keys
   */
  fix_database_foreign_keys = (params: RequestParams = {}) =>
    this.request<FixDatabaseForeignKeysData, any>({
      path: `/routes/unified-database/core/fix-foreign-keys`,
      method: "POST",
      ...params,
    });

  /**
   * @description Comprehensive analysis of all database tables
   *
   * @tags dbtn/module:unified_database_core
   * @name analyze_database_tables
   * @summary Analyze Database Tables
   * @request GET:/routes/unified-database/audit/analyze-tables
   */
  analyze_database_tables = (params: RequestParams = {}) =>
    this.request<AnalyzeDatabaseTablesData, any>({
      path: `/routes/unified-database/audit/analyze-tables`,
      method: "GET",
      ...params,
    });

  /**
   * @description Cleanup tables that are safe to delete (placeholder - would need careful implementation)
   *
   * @tags dbtn/module:unified_database_core
   * @name cleanup_safe_tables
   * @summary Cleanup Safe Tables
   * @request POST:/routes/unified-database/audit/cleanup-safe-tables
   */
  cleanup_safe_tables = (params: RequestParams = {}) =>
    this.request<CleanupSafeTablesData, any>({
      path: `/routes/unified-database/audit/cleanup-safe-tables`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup user roles and Row Level Security
   *
   * @tags dbtn/module:unified_database_core
   * @name setup_user_roles_rls
   * @summary Setup User Roles Rls
   * @request POST:/routes/unified-database/setup/user-roles-rls
   */
  setup_user_roles_rls = (params: RequestParams = {}) =>
    this.request<SetupUserRolesRlsData, any>({
      path: `/routes/unified-database/setup/user-roles-rls`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if user_roles table exists
   *
   * @tags dbtn/module:unified_database_core
   * @name check_user_roles_table_exists
   * @summary Check User Roles Table Exists
   * @request GET:/routes/unified-database/setup/check-user-roles-table
   */
  check_user_roles_table_exists = (params: RequestParams = {}) =>
    this.request<CheckUserRolesTableExistsData, any>({
      path: `/routes/unified-database/setup/check-user-roles-table`,
      method: "GET",
      ...params,
    });

  /**
   * @description Setup essential database procedures and functions
   *
   * @tags dbtn/module:unified_database_core
   * @name setup_database_procedures
   * @summary Setup Database Procedures
   * @request POST:/routes/unified-database/procedures/setup
   */
  setup_database_procedures = (params: RequestParams = {}) =>
    this.request<SetupDatabaseProceduresData, any>({
      path: `/routes/unified-database/procedures/setup`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that essential database procedures exist and work
   *
   * @tags dbtn/module:unified_database_core
   * @name verify_database_procedures
   * @summary Verify Database Procedures
   * @request GET:/routes/unified-database/procedures/verify
   */
  verify_database_procedures = (params: RequestParams = {}) =>
    this.request<VerifyDatabaseProceduresData, any>({
      path: `/routes/unified-database/procedures/verify`,
      method: "GET",
      ...params,
    });

  /**
   * @description Populate the menu tables with sample data Endpoint to populate menu tables with sample data for testing Returns: MenuSystemResponse: Population status and details
   *
   * @tags dbtn/module:menu_system
   * @name populate_sample_menu_data_endpoint
   * @summary Populate Sample Menu Data Endpoint
   * @request POST:/routes/menu-system/populate-sample-data
   */
  populate_sample_menu_data_endpoint = (params: RequestParams = {}) =>
    this.request<PopulateSampleMenuDataEndpointData, any>({
      path: `/routes/menu-system/populate-sample-data`,
      method: "POST",
      ...params,
    });

  /**
   * @description Populate sample menu data in the database This function populates the database with sample menu data using SQL execution. It inserts categories, menu items, and variants if the tables exist but are empty. Returns: MenuSystemResponse: Result of the operation
   *
   * @tags dbtn/module:menu_system
   * @name populate_sample_menu_data_v2
   * @summary Populate Sample Menu Data V2
   * @request POST:/routes/menu-system/populate-sample-data-v2
   */
  populate_sample_menu_data_v2 = (params: RequestParams = {}) =>
    this.request<PopulateSampleMenuDataV2Data, any>({
      path: `/routes/menu-system/populate-sample-data-v2`,
      method: "POST",
      ...params,
    });

  /**
   * @description Comprehensive test of SQL function, menu tables, and menu corpus data extraction This endpoint runs a series of tests to verify that all components needed for menu corpus extraction are working correctly, and provides detailed diagnostics about what might be failing. Returns: Dict[str, Any]: Comprehensive test results
   *
   * @tags dbtn/module:menu_system
   * @name test_comprehensive_menu_sql_function
   * @summary Test Comprehensive Menu Sql Function
   * @request POST:/routes/menu-system/test-comprehensive-menu-sql
   */
  test_comprehensive_menu_sql_function = (params: RequestParams = {}) =>
    this.request<TestComprehensiveMenuSqlFunctionData, any>({
      path: `/routes/menu-system/test-comprehensive-menu-sql`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check the health of the menu system This function verifies SQL connectivity and menu tables existence. Returns: Dict[str, Any]: Health status information
   *
   * @tags dbtn/module:menu_system
   * @name check_menu_system_health
   * @summary Check Menu System Health
   * @request GET:/routes/menu-system/health
   */
  check_menu_system_health = (params: RequestParams = {}) =>
    this.request<CheckMenuSystemHealthData, any>({
      path: `/routes/menu-system/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check the current schema of order_items table
   *
   * @tags dbtn/module:order_items_schema_fix
   * @name check_order_items_schema
   * @summary Check Order Items Schema
   * @request GET:/routes/check-order-items-schema
   */
  check_order_items_schema = (params: RequestParams = {}) =>
    this.request<CheckOrderItemsSchemaData, any>({
      path: `/routes/check-order-items-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add missing columns to order_items table to match data structure
   *
   * @tags dbtn/module:order_items_schema_fix
   * @name fix_order_items_schema
   * @summary Fix Order Items Schema
   * @request POST:/routes/fix-order-items-schema
   */
  fix_order_items_schema = (params: RequestParams = {}) =>
    this.request<FixOrderItemsSchemaData, any>({
      path: `/routes/fix-order-items-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Retry migrating order items for successfully migrated orders
   *
   * @tags dbtn/module:order_items_schema_fix
   * @name retry_item_migration
   * @summary Retry Item Migration
   * @request POST:/routes/retry-item-migration
   */
  retry_item_migration = (params: RequestParams = {}) =>
    this.request<RetryItemMigrationData, any>({
      path: `/routes/retry-item-migration`,
      method: "POST",
      ...params,
    });

  /**
   * @description Unified test print endpoint that replaces all duplicate test_print functions. Sends test print requests to the helper app on localhost:3001.
   *
   * @tags dbtn/module:unified_test_print
   * @name test_print_unified
   * @summary Test Print Unified
   * @request POST:/routes/test-print
   */
  test_print_unified = (data: AppApisUnifiedTestPrintTestPrintRequest, params: RequestParams = {}) =>
    this.request<TestPrintUnifiedData, TestPrintUnifiedError>({
      path: `/routes/test-print`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Returns sample print data format for testing (replaces windows_printer_helper version)
   *
   * @tags dbtn/module:unified_test_print
   * @name test_print_simple_data
   * @summary Test Print Simple Data
   * @request GET:/routes/test-print-simple
   */
  test_print_simple_data = (params: RequestParams = {}) =>
    this.request<TestPrintSimpleDataData, any>({
      path: `/routes/test-print-simple`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get comprehensive performance report for voice endpoints
   *
   * @tags dbtn/module:voice_performance_monitor
   * @name get_performance_report
   * @summary Get Performance Report
   * @request GET:/routes/voice-performance/performance-report
   */
  get_performance_report = (params: RequestParams = {}) =>
    this.request<GetPerformanceReportData, any>({
      path: `/routes/voice-performance/performance-report`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get raw performance metrics for debugging
   *
   * @tags dbtn/module:voice_performance_monitor
   * @name get_raw_performance_metrics
   * @summary Get Raw Performance Metrics
   * @request GET:/routes/voice-performance/performance-metrics
   */
  get_raw_performance_metrics = (params: RequestParams = {}) =>
    this.request<GetRawPerformanceMetricsData, any>({
      path: `/routes/voice-performance/performance-metrics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Clear all performance metrics
   *
   * @tags dbtn/module:voice_performance_monitor
   * @name clear_performance_metrics
   * @summary Clear Performance Metrics
   * @request POST:/routes/voice-performance/clear-metrics
   */
  clear_performance_metrics = (params: RequestParams = {}) =>
    this.request<ClearPerformanceMetricsData, any>({
      path: `/routes/voice-performance/clear-metrics`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate a receipt for a completed payment
   *
   * @tags dbtn/module:receipt_generator
   * @name generate_receipt
   * @summary Generate Receipt
   * @request POST:/routes/receipt-generator/generate
   */
  generate_receipt = (data: GenerateReceiptRequest, params: RequestParams = {}) =>
    this.request<GenerateReceiptData, GenerateReceiptError>({
      path: `/routes/receipt-generator/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Send an existing receipt via email
   *
   * @tags dbtn/module:receipt_generator
   * @name email_receipt
   * @summary Email Receipt
   * @request POST:/routes/receipt-generator/email
   */
  email_receipt = (data: EmailReceiptRequest, params: RequestParams = {}) =>
    this.request<EmailReceiptData, EmailReceiptError>({
      path: `/routes/receipt-generator/email`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get receipt information by ID
   *
   * @tags dbtn/module:receipt_generator
   * @name get_receipt
   * @summary Get Receipt
   * @request GET:/routes/receipt-generator/receipt/{receipt_id}
   */
  get_receipt = ({ receiptId, ...query }: GetReceiptParams, params: RequestParams = {}) =>
    this.request<GetReceiptData, GetReceiptError>({
      path: `/routes/receipt-generator/receipt/${receiptId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if receipt generation service is working
   *
   * @tags dbtn/module:receipt_generator
   * @name receipt_generator_health_check
   * @summary Receipt Generator Health Check
   * @request GET:/routes/receipt-generator/receipt-health
   */
  receipt_generator_health_check = (params: RequestParams = {}) =>
    this.request<ReceiptGeneratorHealthCheckData, any>({
      path: `/routes/receipt-generator/receipt-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add gender field to voice_agent_profiles table
   *
   * @tags dbtn/module:agent_gender_migration
   * @name add_gender_field
   * @summary Add Gender Field
   * @request POST:/routes/add-gender-field
   */
  add_gender_field = (params: RequestParams = {}) =>
    this.request<AddGenderFieldData, any>({
      path: `/routes/add-gender-field`,
      method: "POST",
      ...params,
    });

  /**
   * @description Set default gender for existing agents
   *
   * @tags dbtn/module:agent_gender_migration
   * @name update_existing_agents_gender
   * @summary Update Existing Agents Gender
   * @request POST:/routes/update-existing-agents-gender
   */
  update_existing_agents_gender = (params: RequestParams = {}) =>
    this.request<UpdateExistingAgentsGenderData, any>({
      path: `/routes/update-existing-agents-gender`,
      method: "POST",
      ...params,
    });

  /**
   * @description Remove items from the cart for voice assistant ordering. This endpoint allows the voice assistant to remove specific items or quantities from a customer's cart during voice ordering sessions.
   *
   * @tags dbtn/module:cart_remove
   * @name cart_remove
   * @summary Cart Remove
   * @request POST:/routes/cart-remove
   */
  cart_remove = (data: CartRemoveRequest, params: RequestParams = {}) =>
    this.request<CartRemoveData, CartRemoveError>({
      path: `/routes/cart-remove`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all addresses for a customer
   *
   * @tags dbtn/module:customer_addresses
   * @name get_customer_addresses
   * @summary Get Customer Addresses
   * @request GET:/routes/customer-addresses/{customer_id}
   */
  get_customer_addresses = ({ customerId, ...query }: GetCustomerAddressesParams, params: RequestParams = {}) =>
    this.request<GetCustomerAddressesData, GetCustomerAddressesError>({
      path: `/routes/customer-addresses/${customerId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new customer address
   *
   * @tags dbtn/module:customer_addresses
   * @name create_customer_address
   * @summary Create Customer Address
   * @request POST:/routes/customer-addresses
   */
  create_customer_address = (data: CreateAddressRequest, params: RequestParams = {}) =>
    this.request<CreateCustomerAddressData, CreateCustomerAddressError>({
      path: `/routes/customer-addresses`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a customer address
   *
   * @tags dbtn/module:customer_addresses
   * @name delete_customer_address
   * @summary Delete Customer Address
   * @request DELETE:/routes/customer-addresses/{address_id}
   */
  delete_customer_address = ({ addressId, ...query }: DeleteCustomerAddressParams, params: RequestParams = {}) =>
    this.request<DeleteCustomerAddressData, DeleteCustomerAddressError>({
      path: `/routes/customer-addresses/${addressId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get menu items with images for the food gallery Returns only menu items that have associated images
   *
   * @tags dbtn/module:gallery_menu_items
   * @name get_gallery_menu_items
   * @summary Get Gallery Menu Items
   * @request GET:/routes/gallery-menu-items
   */
  get_gallery_menu_items = (params: RequestParams = {}) =>
    this.request<GetGalleryMenuItemsData, any>({
      path: `/routes/gallery-menu-items`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test thermal printer functionality
   *
   * @tags dbtn/module:thermal_test
   * @name test_print
   * @summary Test Print
   * @request POST:/routes/print
   */
  test_print = (data: AppApisThermalTestTestPrintRequest, params: RequestParams = {}) =>
    this.request<TestPrintData, TestPrintError>({
      path: `/routes/print`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get status of thermal printer test system
   *
   * @tags dbtn/module:thermal_test
   * @name get_test_status
   * @summary Get Test Status
   * @request GET:/routes/status
   */
  get_test_status = (params: RequestParams = {}) =>
    this.request<GetTestStatusData, any>({
      path: `/routes/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get information about the thermal printer test system
   *
   * @tags dbtn/module:thermal_test
   * @name get_test_info
   * @summary Get Test Info
   * @request GET:/routes/info
   */
  get_test_info = (params: RequestParams = {}) =>
    this.request<GetTestInfoData, any>({
      path: `/routes/info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Download the professional Cottage Tandoori Restaurant icon file
   *
   * @tags dbtn/module:download_icon
   * @name download_cottage_icon
   * @summary Download Cottage Icon
   * @request GET:/routes/download-cottage-icon
   */
  download_cottage_icon = (params: RequestParams = {}) =>
    this.request<DownloadCottageIconData, any>({
      path: `/routes/download-cottage-icon`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get information about the restaurant icon
   *
   * @tags dbtn/module:download_icon
   * @name get_icon_info
   * @summary Get Icon Info
   * @request GET:/routes/icon-info
   */
  get_icon_info = (params: RequestParams = {}) =>
    this.request<GetIconInfoData, any>({
      path: `/routes/icon-info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new GitHub repository for the Electron POS application
   *
   * @tags dbtn/module:github_electron_setup
   * @name create_electron_repository
   * @summary Create Electron Repository
   * @request POST:/routes/create-electron-repo
   */
  create_electron_repository = (data: CreateRepoRequest, params: RequestParams = {}) =>
    this.request<CreateElectronRepositoryData, CreateElectronRepositoryError>({
      path: `/routes/create-electron-repo`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a file in the specified GitHub repository
   *
   * @tags dbtn/module:github_electron_setup
   * @name create_repository_file
   * @summary Create Repository File
   * @request POST:/routes/create-file
   */
  create_repository_file = (query: CreateRepositoryFileParams, data: FileContent, params: RequestParams = {}) =>
    this.request<CreateRepositoryFileData, CreateRepositoryFileError>({
      path: `/routes/create-file`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get authenticated GitHub user information
   *
   * @tags dbtn/module:github_electron_setup
   * @name get_github_user
   * @summary Get Github User
   * @request GET:/routes/get-user
   */
  get_github_user = (params: RequestParams = {}) =>
    this.request<GetGithubUserData, any>({
      path: `/routes/get-user`,
      method: "GET",
      ...params,
    });

  /**
   * @description Process the print queue - attempt to print all queued jobs
   *
   * @tags dbtn/module:print_queue_processor
   * @name process_print_queue_jobs
   * @summary Process Print Queue Jobs
   * @request POST:/routes/queue/process-print-queue
   */
  process_print_queue_jobs = (data: ProcessQueueRequest, params: RequestParams = {}) =>
    this.request<ProcessPrintQueueJobsData, ProcessPrintQueueJobsError>({
      path: `/routes/queue/process-print-queue`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get statistics about the print job queue
   *
   * @tags dbtn/module:print_queue_processor
   * @name get_print_queue_job_stats
   * @summary Get Print Queue Job Stats
   * @request GET:/routes/queue/print-job-stats
   */
  get_print_queue_job_stats = (params: RequestParams = {}) =>
    this.request<GetPrintQueueJobStatsData, any>({
      path: `/routes/queue/print-job-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new print job and add it to the queue Jobs are persisted to SQLite-like storage for offline resilience
   *
   * @tags dbtn/module:print_queue
   * @name create_print_queue_job
   * @summary Create Print Queue Job
   * @request POST:/routes/queue/create-print-job
   */
  create_print_queue_job = (data: AppApisPrintQueuePrintJobRequest, params: RequestParams = {}) =>
    this.request<CreatePrintQueueJobData, CreatePrintQueueJobError>({
      path: `/routes/queue/create-print-job`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get print jobs from the queue with optional status filtering
   *
   * @tags dbtn/module:print_queue
   * @name get_print_queue_jobs
   * @summary Get Print Queue Jobs
   * @request GET:/routes/queue/print-jobs
   */
  get_print_queue_jobs = (query: GetPrintQueueJobsParams, params: RequestParams = {}) =>
    this.request<GetPrintQueueJobsData, GetPrintQueueJobsError>({
      path: `/routes/queue/print-jobs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific print job by ID
   *
   * @tags dbtn/module:print_queue
   * @name get_print_queue_job
   * @summary Get Print Queue Job
   * @request GET:/routes/queue/print-job/{job_id}
   */
  get_print_queue_job = ({ jobId, ...query }: GetPrintQueueJobParams, params: RequestParams = {}) =>
    this.request<GetPrintQueueJobData, GetPrintQueueJobError>({
      path: `/routes/queue/print-job/${jobId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a print job from the queue
   *
   * @tags dbtn/module:print_queue
   * @name delete_print_queue_job
   * @summary Delete Print Queue Job
   * @request DELETE:/routes/queue/print-job/{job_id}
   */
  delete_print_queue_job = ({ jobId, ...query }: DeletePrintQueueJobParams, params: RequestParams = {}) =>
    this.request<DeletePrintQueueJobData, DeletePrintQueueJobError>({
      path: `/routes/queue/print-job/${jobId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update the status of a print job
   *
   * @tags dbtn/module:print_queue
   * @name update_print_queue_job_status
   * @summary Update Print Queue Job Status
   * @request PATCH:/routes/queue/print-job/{job_id}/status
   */
  update_print_queue_job_status = ({ jobId, ...query }: UpdatePrintQueueJobStatusParams, params: RequestParams = {}) =>
    this.request<UpdatePrintQueueJobStatusData, UpdatePrintQueueJobStatusError>({
      path: `/routes/queue/print-job/${jobId}/status`,
      method: "PATCH",
      query: query,
      ...params,
    });

  /**
   * @description Process failed print jobs with retry logic Implements exponential backoff and maximum retry limits
   *
   * @tags dbtn/module:print_queue
   * @name process_failed_print_jobs
   * @summary Process Failed Print Jobs
   * @request POST:/routes/queue/process-failed-jobs
   */
  process_failed_print_jobs = (query: ProcessFailedPrintJobsParams, params: RequestParams = {}) =>
    this.request<ProcessFailedPrintJobsData, ProcessFailedPrintJobsError>({
      path: `/routes/queue/process-failed-jobs`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Automatically process queued print jobs when printer becomes available This is the main background processing function for offline capabilities
   *
   * @tags dbtn/module:print_queue
   * @name auto_process_print_queue
   * @summary Auto Process Print Queue
   * @request POST:/routes/queue/auto-process
   */
  auto_process_print_queue = (query: AutoProcessPrintQueueParams, params: RequestParams = {}) =>
    this.request<AutoProcessPrintQueueData, AutoProcessPrintQueueError>({
      path: `/routes/queue/auto-process`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get comprehensive status of the print queue and printer
   *
   * @tags dbtn/module:print_queue
   * @name get_queue_status
   * @summary Get Queue Status
   * @request GET:/routes/queue/status
   */
  get_queue_status = (params: RequestParams = {}) =>
    this.request<GetQueueStatusData, any>({
      path: `/routes/queue/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Debug the menu_customizations table to understand the 400 error
   *
   * @tags dbtn/module:debug_menu_customizations
   * @name debug_menu_customizations
   * @summary Debug Menu Customizations
   * @request GET:/routes/debug-menu-customizations
   */
  debug_menu_customizations = (params: RequestParams = {}) =>
    this.request<DebugMenuCustomizationsData, any>({
      path: `/routes/debug-menu-customizations`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create or fix the menu_customizations table schema
   *
   * @tags dbtn/module:debug_menu_customizations
   * @name fix_menu_customizations_schema
   * @summary Fix Menu Customizations Schema
   * @request POST:/routes/fix-menu-customizations-schema
   */
  fix_menu_customizations_schema = (params: RequestParams = {}) =>
    this.request<FixMenuCustomizationsSchemaData, any>({
      path: `/routes/fix-menu-customizations-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix the 400 Bad Request error for menu_customizations table
   *
   * @tags dbtn/module:fix_customizations_error
   * @name fix_menu_customizations_error
   * @summary Fix Menu Customizations Error
   * @request POST:/routes/fix-menu-customizations-400-error
   */
  fix_menu_customizations_error = (params: RequestParams = {}) =>
    this.request<FixMenuCustomizationsErrorData, any>({
      path: `/routes/fix-menu-customizations-400-error`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test the exact query that was failing with 400 error
   *
   * @tags dbtn/module:fix_customizations_error
   * @name test_menu_customizations_query
   * @summary Test Menu Customizations Query
   * @request GET:/routes/test-menu-customizations-query
   */
  test_menu_customizations_query = (params: RequestParams = {}) =>
    this.request<TestMenuCustomizationsQueryData, any>({
      path: `/routes/test-menu-customizations-query`,
      method: "GET",
      ...params,
    });

  /**
   * @description Safely execute SQL using Supabase REST API with service role key
   *
   * @tags dbtn/module:execute_sql_safe
   * @name execute_sql_safe
   * @summary Execute Sql Safe
   * @request POST:/routes/execute-sql-safe
   */
  execute_sql_safe = (data: SQLExecuteRequest, params: RequestParams = {}) =>
    this.request<ExecuteSqlSafeData, ExecuteSqlSafeError>({
      path: `/routes/execute-sql-safe`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if menu_customizations table exists and its structure
   *
   * @tags dbtn/module:execute_sql_safe
   * @name check_menu_customizations_table
   * @summary Check Menu Customizations Table
   * @request GET:/routes/check-menu-customizations-table
   */
  check_menu_customizations_table = (params: RequestParams = {}) =>
    this.request<CheckMenuCustomizationsTableData, any>({
      path: `/routes/check-menu-customizations-table`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create the menu_customizations table with proper schema
   *
   * @tags dbtn/module:execute_sql_safe
   * @name create_menu_customizations_table
   * @summary Create Menu Customizations Table
   * @request POST:/routes/create-menu-customizations-table
   */
  create_menu_customizations_table = (params: RequestParams = {}) =>
    this.request<CreateMenuCustomizationsTableData, any>({
      path: `/routes/create-menu-customizations-table`,
      method: "POST",
      ...params,
    });

  /**
   * @description Split a customer tab by moving selected items to a new tab
   *
   * @tags dbtn/module:customer_tabs
   * @name split_tab
   * @summary Split Tab
   * @request POST:/routes/customer-tabs/split
   */
  split_tab = (data: SplitTabRequest, params: RequestParams = {}) =>
    this.request<SplitTabData, SplitTabError>({
      path: `/routes/customer-tabs/split`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Merge two customer tabs by moving all items from source to target and closing source
   *
   * @tags dbtn/module:customer_tabs
   * @name merge_tabs
   * @summary Merge Tabs
   * @request POST:/routes/customer-tabs/merge
   */
  merge_tabs = (data: MergeTabsRequest, params: RequestParams = {}) =>
    this.request<MergeTabsData, MergeTabsError>({
      path: `/routes/customer-tabs/merge`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Move selected items from one customer tab to another
   *
   * @tags dbtn/module:customer_tabs
   * @name move_items_between_tabs
   * @summary Move Items Between Tabs
   * @request POST:/routes/customer-tabs/move-items
   */
  move_items_between_tabs = (data: MoveItemsRequest, params: RequestParams = {}) =>
    this.request<MoveItemsBetweenTabsData, MoveItemsBetweenTabsError>({
      path: `/routes/customer-tabs/move-items`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create the customer_tabs table and required indexes
   *
   * @tags dbtn/module:customer_tabs
   * @name setup_customer_tabs_schema
   * @summary Setup Customer Tabs Schema
   * @request POST:/routes/customer-tabs/setup-schema
   */
  setup_customer_tabs_schema = (params: RequestParams = {}) =>
    this.request<SetupCustomerTabsSchemaData, any>({
      path: `/routes/customer-tabs/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if customer_tabs schema exists
   *
   * @tags dbtn/module:customer_tabs
   * @name check_customer_tabs_schema
   * @summary Check Customer Tabs Schema
   * @request GET:/routes/customer-tabs/check-schema
   */
  check_customer_tabs_schema = (params: RequestParams = {}) =>
    this.request<CheckCustomerTabsSchemaData, any>({
      path: `/routes/customer-tabs/check-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new customer tab within a table
   *
   * @tags dbtn/module:customer_tabs
   * @name create_customer_tab
   * @summary Create Customer Tab
   * @request POST:/routes/customer-tabs/create
   */
  create_customer_tab = (data: CreateCustomerTabRequest, params: RequestParams = {}) =>
    this.request<CreateCustomerTabData, CreateCustomerTabError>({
      path: `/routes/customer-tabs/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all active customer tabs for a specific table
   *
   * @tags dbtn/module:customer_tabs
   * @name list_customer_tabs_for_table
   * @summary List Customer Tabs For Table
   * @request GET:/routes/customer-tabs/table/{table_number}
   */
  list_customer_tabs_for_table = (
    { tableNumber, ...query }: ListCustomerTabsForTableParams,
    params: RequestParams = {},
  ) =>
    this.request<ListCustomerTabsForTableData, ListCustomerTabsForTableError>({
      path: `/routes/customer-tabs/table/${tableNumber}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get specific customer tab by ID
   *
   * @tags dbtn/module:customer_tabs
   * @name get_customer_tab
   * @summary Get Customer Tab
   * @request GET:/routes/customer-tabs/tab/{tab_id}
   */
  get_customer_tab = ({ tabId, ...query }: GetCustomerTabParams, params: RequestParams = {}) =>
    this.request<GetCustomerTabData, GetCustomerTabError>({
      path: `/routes/customer-tabs/tab/${tabId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update customer tab details and order items
   *
   * @tags dbtn/module:customer_tabs
   * @name update_customer_tab
   * @summary Update Customer Tab
   * @request PUT:/routes/customer-tabs/tab/{tab_id}
   */
  update_customer_tab = (
    { tabId, ...query }: UpdateCustomerTabParams,
    data: UpdateCustomerTabRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateCustomerTabData, UpdateCustomerTabError>({
      path: `/routes/customer-tabs/tab/${tabId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Close customer tab (mark as paid)
   *
   * @tags dbtn/module:customer_tabs
   * @name close_customer_tab
   * @summary Close Customer Tab
   * @request DELETE:/routes/customer-tabs/tab/{tab_id}
   */
  close_customer_tab = ({ tabId, ...query }: CloseCustomerTabParams, params: RequestParams = {}) =>
    this.request<CloseCustomerTabData, CloseCustomerTabError>({
      path: `/routes/customer-tabs/tab/${tabId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Add new items to existing customer tab
   *
   * @tags dbtn/module:customer_tabs
   * @name add_items_to_customer_tab
   * @summary Add Items To Customer Tab
   * @request POST:/routes/customer-tabs/tab/{tab_id}/add-items
   */
  add_items_to_customer_tab = (
    { tabId, ...query }: AddItemsToCustomerTabParams,
    data: AddItemsToCustomerTabPayload,
    params: RequestParams = {},
  ) =>
    this.request<AddItemsToCustomerTabData, AddItemsToCustomerTabError>({
      path: `/routes/customer-tabs/tab/${tabId}/add-items`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Rename a customer tab
   *
   * @tags dbtn/module:customer_tabs
   * @name rename_customer_tab
   * @summary Rename Customer Tab
   * @request POST:/routes/customer-tabs/tab/{tab_id}/rename
   */
  rename_customer_tab = ({ tabId, ...query }: RenameCustomerTabParams, params: RequestParams = {}) =>
    this.request<RenameCustomerTabData, RenameCustomerTabError>({
      path: `/routes/customer-tabs/tab/${tabId}/rename`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get table session status and analytics for debugging
   *
   * @tags dbtn/module:customer_tabs
   * @name get_table_session_status
   * @summary Get Table Session Status
   * @request GET:/routes/customer-tabs/table/{table_number}/session-status
   */
  get_table_session_status = ({ tableNumber, ...query }: GetTableSessionStatusParams, params: RequestParams = {}) =>
    this.request<GetTableSessionStatusData, GetTableSessionStatusError>({
      path: `/routes/customer-tabs/table/${tableNumber}/session-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Process final bill for entire table and reset table status
   *
   * @tags dbtn/module:customer_tabs
   * @name process_final_bill_for_table
   * @summary Process Final Bill For Table
   * @request POST:/routes/customer-tabs/table/{table_number}/final-bill
   */
  process_final_bill_for_table = (
    { tableNumber, ...query }: ProcessFinalBillForTableParams,
    params: RequestParams = {},
  ) =>
    this.request<ProcessFinalBillForTableData, ProcessFinalBillForTableError>({
      path: `/routes/customer-tabs/table/${tableNumber}/final-bill`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migration endpoint to fix table statuses based on current order sessions
   *
   * @tags dbtn/module:customer_tabs
   * @name migrate_fix_table_statuses
   * @summary Migrate Fix Table Statuses
   * @request POST:/routes/customer-tabs/migrate/fix-table-statuses
   */
  migrate_fix_table_statuses = (params: RequestParams = {}) =>
    this.request<MigrateFixTableStatusesData, any>({
      path: `/routes/customer-tabs/migrate/fix-table-statuses`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if local cache needs updating for offline mode
   *
   * @tags dbtn/module:offline_sync
   * @name get_offline_sync_status
   * @summary Get Offline Sync Status
   * @request GET:/routes/offline-sync-status
   */
  get_offline_sync_status = (query: GetOfflineSyncStatusParams, params: RequestParams = {}) =>
    this.request<GetOfflineSyncStatusData, GetOfflineSyncStatusError>({
      path: `/routes/offline-sync-status`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get incremental menu changes since last sync for offline caching
   *
   * @tags dbtn/module:offline_sync
   * @name get_menu_delta_sync
   * @summary Get Menu Delta Sync
   * @request GET:/routes/menu-delta-sync
   */
  get_menu_delta_sync = (query: GetMenuDeltaSyncParams, params: RequestParams = {}) =>
    this.request<GetMenuDeltaSyncData, GetMenuDeltaSyncError>({
      path: `/routes/menu-delta-sync`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Force cache invalidation for all offline clients
   *
   * @tags dbtn/module:offline_sync
   * @name invalidate_offline_cache
   * @summary Invalidate Offline Cache
   * @request POST:/routes/invalidate-offline-cache
   */
  invalidate_offline_cache = (params: RequestParams = {}) =>
    this.request<InvalidateOfflineCacheData, any>({
      path: `/routes/invalidate-offline-cache`,
      method: "POST",
      ...params,
    });

  /**
   * @description Validate a promo code and calculate discount
   *
   * @tags dbtn/module:promo_codes
   * @name validate_promo_code
   * @summary Validate Promo Code
   * @request POST:/routes/validate-promo
   */
  validate_promo_code = (data: PromoCodeRequest, params: RequestParams = {}) =>
    this.request<ValidatePromoCodeData, ValidatePromoCodeError>({
      path: `/routes/validate-promo`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Apply a promo code and increment usage count
   *
   * @tags dbtn/module:promo_codes
   * @name apply_promo_code
   * @summary Apply Promo Code
   * @request POST:/routes/apply-promo
   */
  apply_promo_code = (data: PromoCodeRequest, params: RequestParams = {}) =>
    this.request<ApplyPromoCodeData, ApplyPromoCodeError>({
      path: `/routes/apply-promo`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a new promo code (admin only)
   *
   * @tags dbtn/module:promo_codes
   * @name create_promo_code
   * @summary Create Promo Code
   * @request POST:/routes/create-promo
   */
  create_promo_code = (data: CreatePromoCodeRequest, params: RequestParams = {}) =>
    this.request<CreatePromoCodeData, CreatePromoCodeError>({
      path: `/routes/create-promo`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all promo codes (admin only)
   *
   * @tags dbtn/module:promo_codes
   * @name list_promo_codes
   * @summary List Promo Codes
   * @request GET:/routes/list-promos
   */
  list_promo_codes = (params: RequestParams = {}) =>
    this.request<ListPromoCodesData, any>({
      path: `/routes/list-promos`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a promo code (admin only)
   *
   * @tags dbtn/module:promo_codes
   * @name delete_promo_code
   * @summary Delete Promo Code
   * @request DELETE:/routes/delete-promo/{code}
   */
  delete_promo_code = ({ code, ...query }: DeletePromoCodeParams, params: RequestParams = {}) =>
    this.request<DeletePromoCodeData, DeletePromoCodeError>({
      path: `/routes/delete-promo/${code}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Initialize system with some default promo codes for testing
   *
   * @tags dbtn/module:promo_codes
   * @name initialize_default_promos
   * @summary Initialize Default Promos
   * @request POST:/routes/initialize-default-promos
   */
  initialize_default_promos = (params: RequestParams = {}) =>
    this.request<InitializeDefaultPromosData, any>({
      path: `/routes/initialize-default-promos`,
      method: "POST",
      ...params,
    });

  /**
   * @description Calculate all applicable fees for an order
   *
   * @tags dbtn/module:fee_calculation
   * @name calculate_order_fees
   * @summary Calculate Order Fees
   * @request POST:/routes/calculate-fees
   */
  calculate_order_fees = (data: FeeCalculationRequest, params: RequestParams = {}) =>
    this.request<CalculateOrderFeesData, CalculateOrderFeesError>({
      path: `/routes/calculate-fees`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update service charge configuration (admin only)
   *
   * @tags dbtn/module:fee_calculation
   * @name update_service_charge_config
   * @summary Update Service Charge Config
   * @request POST:/routes/update-service-charge-config
   */
  update_service_charge_config = (data: ServiceChargeConfig, params: RequestParams = {}) =>
    this.request<UpdateServiceChargeConfigData, UpdateServiceChargeConfigError>({
      path: `/routes/update-service-charge-config`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current service charge configuration
   *
   * @tags dbtn/module:fee_calculation
   * @name get_service_charge_config_endpoint
   * @summary Get Service Charge Config Endpoint
   * @request GET:/routes/service-charge-config
   */
  get_service_charge_config_endpoint = (params: RequestParams = {}) =>
    this.request<GetServiceChargeConfigEndpointData, any>({
      path: `/routes/service-charge-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update delivery zones configuration (admin only)
   *
   * @tags dbtn/module:fee_calculation
   * @name update_delivery_zones
   * @summary Update Delivery Zones
   * @request POST:/routes/update-delivery-zones
   */
  update_delivery_zones = (data: UpdateDeliveryZonesPayload, params: RequestParams = {}) =>
    this.request<UpdateDeliveryZonesData, UpdateDeliveryZonesError>({
      path: `/routes/update-delivery-zones`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current delivery zones configuration
   *
   * @tags dbtn/module:fee_calculation
   * @name get_delivery_zones_endpoint
   * @summary Get Delivery Zones Endpoint
   * @request GET:/routes/delivery-zones
   */
  get_delivery_zones_endpoint = (params: RequestParams = {}) =>
    this.request<GetDeliveryZonesEndpointData, any>({
      path: `/routes/delivery-zones`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initialize default fee configurations
   *
   * @tags dbtn/module:fee_calculation
   * @name initialize_fee_configs
   * @summary Initialize Fee Configs
   * @request POST:/routes/initialize-fee-configs
   */
  initialize_fee_configs = (params: RequestParams = {}) =>
    this.request<InitializeFeeConfigsData, any>({
      path: `/routes/initialize-fee-configs`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create a new print job for event-driven printing
   *
   * @tags dbtn/module:print_jobs
   * @name create_print_job
   * @summary Create Print Job
   * @request POST:/routes/print-jobs
   */
  create_print_job = (data: AppApisPrintJobsPrintJobRequest, params: RequestParams = {}) =>
    this.request<CreatePrintJobData, CreatePrintJobError>({
      path: `/routes/print-jobs`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get print jobs with optional filtering
   *
   * @tags dbtn/module:print_jobs
   * @name get_print_jobs
   * @summary Get Print Jobs
   * @request GET:/routes/print-jobs
   */
  get_print_jobs = (query: GetPrintJobsParams, params: RequestParams = {}) =>
    this.request<GetPrintJobsData, GetPrintJobsError>({
      path: `/routes/print-jobs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific print job by ID
   *
   * @tags dbtn/module:print_jobs
   * @name get_print_job
   * @summary Get Print Job
   * @request GET:/routes/print-jobs/{job_id}
   */
  get_print_job = ({ jobId, ...query }: GetPrintJobParams, params: RequestParams = {}) =>
    this.request<GetPrintJobData, GetPrintJobError>({
      path: `/routes/print-jobs/${jobId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a print job
   *
   * @tags dbtn/module:print_jobs
   * @name delete_print_job
   * @summary Delete Print Job
   * @request DELETE:/routes/print-jobs/{job_id}
   */
  delete_print_job = ({ jobId, ...query }: DeletePrintJobParams, params: RequestParams = {}) =>
    this.request<DeletePrintJobData, DeletePrintJobError>({
      path: `/routes/print-jobs/${jobId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update print job status (used by helper apps to report progress)
   *
   * @tags dbtn/module:print_jobs
   * @name update_print_job_status
   * @summary Update Print Job Status
   * @request PUT:/routes/print-jobs/{job_id}/status
   */
  update_print_job_status = (
    { jobId, ...query }: UpdatePrintJobStatusParams,
    data: PrintJobUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdatePrintJobStatusData, UpdatePrintJobStatusError>({
      path: `/routes/print-jobs/${jobId}/status`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Process pending print jobs (used by helper apps to get work)
   *
   * @tags dbtn/module:print_jobs
   * @name process_print_queue
   * @summary Process Print Queue
   * @request POST:/routes/print-jobs/queue/process
   */
  process_print_queue = (params: RequestParams = {}) =>
    this.request<ProcessPrintQueueData, any>({
      path: `/routes/print-jobs/queue/process`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get print job statistics
   *
   * @tags dbtn/module:print_jobs
   * @name get_print_job_stats
   * @summary Get Print Job Stats
   * @request GET:/routes/print-jobs/stats
   */
  get_print_job_stats = (params: RequestParams = {}) =>
    this.request<GetPrintJobStatsData, any>({
      path: `/routes/print-jobs/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if the menu_items_ai_metadata table exists
   *
   * @tags dbtn/module:menu_ai_fields
   * @name check_menu_ai_fields_exist
   * @summary Check Menu Ai Fields Exist
   * @request GET:/routes/check-menu-ai-fields
   */
  check_menu_ai_fields_exist = (params: RequestParams = {}) =>
    this.request<CheckMenuAiFieldsExistData, any>({
      path: `/routes/check-menu-ai-fields`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create the menu_items_ai_metadata table if it doesn't exist
   *
   * @tags dbtn/module:menu_ai_fields
   * @name update_menu_items_with_ai_fields
   * @summary Update Menu Items With Ai Fields
   * @request POST:/routes/update-menu-items-with-ai-fields
   */
  update_menu_items_with_ai_fields = (params: RequestParams = {}) =>
    this.request<UpdateMenuItemsWithAiFieldsData, any>({
      path: `/routes/update-menu-items-with-ai-fields`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate AI content suggestions for a menu item using OpenAI
   *
   * @tags dbtn/module:menu_ai_fields
   * @name generate_ai_content_suggestion
   * @summary Generate Ai Content Suggestion
   * @request POST:/routes/generate-ai-content-suggestion
   */
  generate_ai_content_suggestion = (data: AIContentSuggestionRequest, params: RequestParams = {}) =>
    this.request<GenerateAiContentSuggestionData, GenerateAiContentSuggestionError>({
      path: `/routes/generate-ai-content-suggestion`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if the menu_items_ai_metadata table exists using sql_executor
   *
   * @tags dbtn/module:menu_ai_fields2
   * @name check_menu_ai_fields_exist2
   * @summary Check Menu Ai Fields Exist2
   * @request GET:/routes/check-menu-ai-fields2
   */
  check_menu_ai_fields_exist2 = (params: RequestParams = {}) =>
    this.request<CheckMenuAiFieldsExist2Data, any>({
      path: `/routes/check-menu-ai-fields2`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create the menu_items_ai_metadata table if it doesn't exist using sql_executor
   *
   * @tags dbtn/module:menu_ai_fields2
   * @name update_menu_items_with_ai_fields2
   * @summary Update Menu Items With Ai Fields2
   * @request POST:/routes/update-menu-items-with-ai-fields2
   */
  update_menu_items_with_ai_fields2 = (params: RequestParams = {}) =>
    this.request<UpdateMenuItemsWithAiFields2Data, any>({
      path: `/routes/update-menu-items-with-ai-fields2`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate AI content suggestions for a menu item using OpenAI
   *
   * @tags dbtn/module:menu_ai_fields2
   * @name generate_ai_content_suggestion2
   * @summary Generate Ai Content Suggestion2
   * @request POST:/routes/generate-ai-content-suggestion2
   */
  generate_ai_content_suggestion2 = (data: AIContentSuggestionRequest, params: RequestParams = {}) =>
    this.request<GenerateAiContentSuggestion2Data, GenerateAiContentSuggestion2Error>({
      path: `/routes/generate-ai-content-suggestion2`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate AI response with embedded structured elements
   *
   * @tags dbtn/module:structured_chat
   * @name generate_structured_response
   * @summary Generate Structured Response
   * @request POST:/routes/structured-chat
   */
  generate_structured_response = (data: StructuredChatRequest, params: RequestParams = {}) =>
    this.request<GenerateStructuredResponseData, GenerateStructuredResponseError>({
      path: `/routes/structured-chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Validate that structured prompts generate expected responses
   *
   * @tags dbtn/module:structured_chat
   * @name validate_structured_prompts
   * @summary Validate Structured Prompts
   * @request POST:/routes/validate-structured-prompts
   */
  validate_structured_prompts = (params: RequestParams = {}) =>
    this.request<ValidateStructuredPromptsData, any>({
      path: `/routes/validate-structured-prompts`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup the complete chat analytics schema with tables, policies, and triggers
   *
   * @tags dbtn/module:chat_analytics
   * @name setup_chat_analytics_schema
   * @summary Setup Chat Analytics Schema
   * @request POST:/routes/chat-analytics/setup-schema
   */
  setup_chat_analytics_schema = (params: RequestParams = {}) =>
    this.request<SetupChatAnalyticsSchemaData, any>({
      path: `/routes/chat-analytics/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if chat analytics tables exist and are properly configured
   *
   * @tags dbtn/module:chat_analytics
   * @name check_chat_analytics_schema
   * @summary Check Chat Analytics Schema
   * @request GET:/routes/chat-analytics/check-schema
   */
  check_chat_analytics_schema = (params: RequestParams = {}) =>
    this.request<CheckChatAnalyticsSchemaData, any>({
      path: `/routes/chat-analytics/check-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Log the start of a new chat session
   *
   * @tags dbtn/module:chat_analytics
   * @name log_session_start
   * @summary Log Session Start
   * @request POST:/routes/chat-analytics/log-session-start
   */
  log_session_start = (data: LogSessionStartPayload, params: RequestParams = {}) =>
    this.request<LogSessionStartData, LogSessionStartError>({
      path: `/routes/chat-analytics/log-session-start`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Log a chat message with metadata
   *
   * @tags dbtn/module:chat_analytics
   * @name log_message
   * @summary Log Message
   * @request POST:/routes/chat-analytics/log-message
   */
  log_message = (data: LogMessagePayload, params: RequestParams = {}) =>
    this.request<LogMessageData, LogMessageError>({
      path: `/routes/chat-analytics/log-message`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Log the end of a chat session with final metrics
   *
   * @tags dbtn/module:chat_analytics
   * @name log_session_end
   * @summary Log Session End
   * @request POST:/routes/chat-analytics/log-session-end
   */
  log_session_end = (data: LogSessionEndPayload, params: RequestParams = {}) =>
    this.request<LogSessionEndData, LogSessionEndError>({
      path: `/routes/chat-analytics/log-session-end`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Log a chat escalation to human staff
   *
   * @tags dbtn/module:chat_analytics
   * @name log_escalation
   * @summary Log Escalation
   * @request POST:/routes/chat-analytics/log-escalation
   */
  log_escalation = (data: LogEscalationPayload, params: RequestParams = {}) =>
    this.request<LogEscalationData, LogEscalationError>({
      path: `/routes/chat-analytics/log-escalation`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get chat session metrics for the specified number of days
   *
   * @tags dbtn/module:chat_analytics
   * @name get_session_metrics
   * @summary Get Session Metrics
   * @request GET:/routes/chat-analytics/session-metrics
   */
  get_session_metrics = (query: GetSessionMetricsParams, params: RequestParams = {}) =>
    this.request<GetSessionMetricsData, GetSessionMetricsError>({
      path: `/routes/chat-analytics/session-metrics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get detailed conversation analytics with optional model filtering
   *
   * @tags dbtn/module:chat_analytics
   * @name get_conversation_analytics
   * @summary Get Conversation Analytics
   * @request GET:/routes/chat-analytics/conversation-analytics
   */
  get_conversation_analytics = (query: GetConversationAnalyticsParams, params: RequestParams = {}) =>
    this.request<GetConversationAnalyticsData, GetConversationAnalyticsError>({
      path: `/routes/chat-analytics/conversation-analytics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get real-time chat system statistics
   *
   * @tags dbtn/module:chat_analytics
   * @name get_real_time_stats
   * @summary Get Real Time Stats
   * @request GET:/routes/chat-analytics/real-time-stats
   */
  get_real_time_stats = (params: RequestParams = {}) =>
    this.request<GetRealTimeStatsData, any>({
      path: `/routes/chat-analytics/real-time-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for chat analytics system
   *
   * @tags dbtn/module:chat_analytics
   * @name check_analytics_health
   * @summary Check Analytics Health
   * @request GET:/routes/chat-analytics/health
   */
  check_analytics_health = (params: RequestParams = {}) =>
    this.request<CheckAnalyticsHealthData, any>({
      path: `/routes/chat-analytics/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create and populate comprehensive Cottage Tandoori menu database
   *
   * @tags dbtn/module:menu_database_setup
   * @name setup_menu_database
   * @summary Setup Menu Database
   * @request POST:/routes/setup-menu-database
   */
  setup_menu_database = (params: RequestParams = {}) =>
    this.request<SetupMenuDatabaseData, any>({
      path: `/routes/setup-menu-database`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get summary of menu data for verification
   *
   * @tags dbtn/module:menu_database_setup
   * @name get_menu_data_summary
   * @summary Get Menu Data Summary
   * @request GET:/routes/menu-data-summary
   */
  get_menu_data_summary = (params: RequestParams = {}) =>
    this.request<GetMenuDataSummaryData, any>({
      path: `/routes/menu-data-summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Investigate the actual database schema for menu-related tables
   *
   * @tags dbtn/module:schema_investigation
   * @name investigate_menu_schema
   * @summary Investigate Menu Schema
   * @request GET:/routes/investigate-menu-schema
   */
  investigate_menu_schema = (params: RequestParams = {}) =>
    this.request<InvestigateMenuSchemaData, any>({
      path: `/routes/investigate-menu-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if a specific table exists and get its structure
   *
   * @tags dbtn/module:schema_investigation
   * @name check_table_exists
   * @summary Check Table Exists
   * @request GET:/routes/check-table-exists/{table_name}
   */
  check_table_exists = ({ tableName, ...query }: CheckTableExistsParams, params: RequestParams = {}) =>
    this.request<CheckTableExistsData, CheckTableExistsError>({
      path: `/routes/check-table-exists/${tableName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get complete real menu data from Supabase including sophisticated menu_item_variants Returns: RealMenuDataEnhanced: Complete menu data with categories, basic items AND sophisticated variants
   *
   * @tags dbtn/module:menu_data_real_enhanced
   * @name get_real_menu_data_enhanced
   * @summary Get Real Menu Data Enhanced
   * @request GET:/routes/real-menu-data-enhanced
   */
  get_real_menu_data_enhanced = (params: RequestParams = {}) =>
    this.request<GetRealMenuDataEnhancedData, any>({
      path: `/routes/real-menu-data-enhanced`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add parent_id column to menu_categories table
   *
   * @tags dbtn/module:fix_parent_id
   * @name fix_parent_id_column
   * @summary Fix Parent Id Column
   * @request POST:/routes/fix-parent-id-column
   */
  fix_parent_id_column = (params: RequestParams = {}) =>
    this.request<FixParentIdColumnData, any>({
      path: `/routes/fix-parent-id-column`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get category to section mappings for thermal receipt ordering
   *
   * @tags dbtn/module:category_section_ordering
   * @name get_category_section_mappings
   * @summary Get Category Section Mappings
   * @request GET:/routes/get-section-mappings
   */
  get_category_section_mappings = (params: RequestParams = {}) =>
    this.request<GetCategorySectionMappingsData, any>({
      path: `/routes/get-section-mappings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the section order for a specific menu item based on its category
   *
   * @tags dbtn/module:category_section_ordering
   * @name get_item_section_order
   * @summary Get Item Section Order
   * @request GET:/routes/get-item-section-order
   */
  get_item_section_order = (query: GetItemSectionOrderParams, params: RequestParams = {}) =>
    this.request<GetItemSectionOrderData, GetItemSectionOrderError>({
      path: `/routes/get-item-section-order`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Sort order items by their category sections (1-7) for thermal receipt display
   *
   * @tags dbtn/module:category_section_ordering
   * @name sort_order_items_by_sections
   * @summary Sort Order Items By Sections
   * @request POST:/routes/sort-order-items
   */
  sort_order_items_by_sections = (data: SortOrderItemsBySectionsPayload, params: RequestParams = {}) =>
    this.request<SortOrderItemsBySectionsData, SortOrderItemsBySectionsError>({
      path: `/routes/sort-order-items`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate a unique item code for a menu item
   *
   * @tags dbtn/module:item_code_generation
   * @name generate_item_code
   * @summary Generate Item Code
   * @request POST:/routes/item-code-generation/generate-item-code
   */
  generate_item_code = (data: ItemCodeRequest, params: RequestParams = {}) =>
    this.request<GenerateItemCodeData, GenerateItemCodeError>({
      path: `/routes/item-code-generation/generate-item-code`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate a variant code for a menu item variant
   *
   * @tags dbtn/module:item_code_generation
   * @name generate_variant_code
   * @summary Generate Variant Code
   * @request POST:/routes/item-code-generation/generate-variant-code
   */
  generate_variant_code = (data: VariantCodeRequest, params: RequestParams = {}) =>
    this.request<GenerateVariantCodeData, GenerateVariantCodeError>({
      path: `/routes/item-code-generation/generate-variant-code`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a code is unique across items and variants
   *
   * @tags dbtn/module:item_code_generation
   * @name validate_code_unique
   * @summary Validate Code Unique
   * @request GET:/routes/item-code-generation/validate-code-unique/{code}
   */
  validate_code_unique = ({ code, ...query }: ValidateCodeUniqueParams, params: RequestParams = {}) =>
    this.request<ValidateCodeUniqueData, ValidateCodeUniqueError>({
      path: `/routes/item-code-generation/validate-code-unique/${code}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate codes for all menu items and variants that don't have them
   *
   * @tags dbtn/module:item_code_generation
   * @name generate_all_codes
   * @summary Generate All Codes
   * @request POST:/routes/item-code-generation/generate-all-codes
   */
  generate_all_codes = (data: BatchCodeGenerationRequest, params: RequestParams = {}) =>
    this.request<GenerateAllCodesData, GenerateAllCodesError>({
      path: `/routes/item-code-generation/generate-all-codes`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Reset all item and variant codes and category prefixes
   *
   * @tags dbtn/module:item_code_generation
   * @name reset_code_system
   * @summary Reset Code System
   * @request POST:/routes/item-code-generation/reset-code-system
   */
  reset_code_system = (params: RequestParams = {}) =>
    this.request<ResetCodeSystemData, any>({
      path: `/routes/item-code-generation/reset-code-system`,
      method: "POST",
      ...params,
    });

  /**
   * @description Populate category prefixes based on category names
   *
   * @tags dbtn/module:item_code_generation
   * @name populate_category_prefixes
   * @summary Populate Category Prefixes
   * @request POST:/routes/item-code-generation/populate-category-prefixes
   */
  populate_category_prefixes = (params: RequestParams = {}) =>
    this.request<PopulateCategoryPrefixesData, any>({
      path: `/routes/item-code-generation/populate-category-prefixes`,
      method: "POST",
      ...params,
    });

  /**
   * @description Automatically link unused media assets to menu items by name matching. Args: dry_run: If True, only show what would be linked without making changes min_confidence: Minimum similarity score (0.0-1.0) for fuzzy matching Returns: AutoLinkResponse with results of linking operation
   *
   * @tags dbtn/module:auto_link_media
   * @name auto_link_unused_media
   * @summary Auto Link Unused Media
   * @request POST:/routes/auto-link-media
   */
  auto_link_unused_media = (query: AutoLinkUnusedMediaParams, params: RequestParams = {}) =>
    this.request<AutoLinkUnusedMediaData, AutoLinkUnusedMediaError>({
      path: `/routes/auto-link-media`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Pre-delete check: Get item count and details for a category before deletion. Returns: - category_id: The ID of the category - category_name: Name of the category - item_count: Number of menu items in this category - can_delete: Whether the category can be safely deleted - message: User-friendly message about the deletion - items: List of items that will be affected (sample, max 10)
   *
   * @tags dbtn/module:safe_category_delete
   * @name check_category_delete
   * @summary Check Category Delete
   * @request GET:/routes/check-category-delete/{category_id}
   */
  check_category_delete = ({ categoryId, ...query }: CheckCategoryDeleteParams, params: RequestParams = {}) =>
    this.request<CheckCategoryDeleteData, CheckCategoryDeleteError>({
      path: `/routes/check-category-delete/${categoryId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Safely delete a category with proper handling of associated menu items. Options: - action='reassign': Move all items to target_category_id before deleting category - action='delete_all': Delete category and all associated items Returns: - success: Whether the operation succeeded - message: User-friendly message - items_affected: Total number of items affected - items_reassigned: Number of items reassigned (if action='reassign') - items_deleted: Number of items deleted (if action='delete_all')
   *
   * @tags dbtn/module:safe_category_delete
   * @name safe_delete_category
   * @summary Safe Delete Category
   * @request POST:/routes/safe-delete-category
   */
  safe_delete_category = (data: CategoryDeleteRequest, params: RequestParams = {}) =>
    this.request<SafeDeleteCategoryData, SafeDeleteCategoryError>({
      path: `/routes/safe-delete-category`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all menu items that are using a specific media asset. This helps users understand what will be affected before deleting an asset.
   *
   * @tags dbtn/module:media_usage
   * @name get_asset_usage
   * @summary Get Asset Usage
   * @request GET:/routes/asset-usage/{asset_id}
   */
  get_asset_usage = ({ assetId, ...query }: GetAssetUsageParams, params: RequestParams = {}) =>
    this.request<GetAssetUsageData, GetAssetUsageError>({
      path: `/routes/asset-usage/${assetId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Replace all references of one asset with another asset in menu items. If menu_item_ids is provided, only update those specific items.
   *
   * @tags dbtn/module:media_usage
   * @name replace_asset_in_menu_items
   * @summary Replace Asset In Menu Items
   * @request POST:/routes/replace-asset
   */
  replace_asset_in_menu_items = (data: ReplaceAssetRequest, params: RequestParams = {}) =>
    this.request<ReplaceAssetInMenuItemsData, ReplaceAssetInMenuItemsError>({
      path: `/routes/replace-asset`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Remove all references to an asset from menu items (set to NULL). If menu_item_ids is provided (comma-separated), only update those specific items.
   *
   * @tags dbtn/module:media_usage
   * @name remove_asset_references
   * @summary Remove Asset References
   * @request DELETE:/routes/remove-asset-references/{asset_id}
   */
  remove_asset_references = ({ assetId, ...query }: RemoveAssetReferencesParams, params: RequestParams = {}) =>
    this.request<RemoveAssetReferencesData, RemoveAssetReferencesError>({
      path: `/routes/remove-asset-references/${assetId}`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Create a new set meal with auto-generated SM code
   *
   * @tags dbtn/module:set_meals
   * @name create_set_meal
   * @summary Create Set Meal
   * @request POST:/routes/set-meals/create
   */
  create_set_meal = (data: SetMealRequest, params: RequestParams = {}) =>
    this.request<CreateSetMealData, CreateSetMealError>({
      path: `/routes/set-meals/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all set meals with summary information
   *
   * @tags dbtn/module:set_meals
   * @name list_set_meals
   * @summary List Set Meals
   * @request GET:/routes/set-meals/list
   */
  list_set_meals = (query: ListSetMealsParams, params: RequestParams = {}) =>
    this.request<ListSetMealsData, ListSetMealsError>({
      path: `/routes/set-meals/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific set meal by ID
   *
   * @tags dbtn/module:set_meals
   * @name get_set_meal
   * @summary Get Set Meal
   * @request GET:/routes/set-meals/{set_meal_id}
   */
  get_set_meal = ({ setMealId, ...query }: GetSetMealParams, params: RequestParams = {}) =>
    this.request<GetSetMealData, GetSetMealError>({
      path: `/routes/set-meals/${setMealId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a set meal and cleanup related records
   *
   * @tags dbtn/module:set_meals
   * @name delete_set_meal
   * @summary Delete Set Meal
   * @request DELETE:/routes/set-meals/{set_meal_id}
   */
  delete_set_meal = ({ setMealId, ...query }: DeleteSetMealParams, params: RequestParams = {}) =>
    this.request<DeleteSetMealData, DeleteSetMealError>({
      path: `/routes/set-meals/${setMealId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update an existing set meal
   *
   * @tags dbtn/module:set_meals
   * @name update_set_meal
   * @summary Update Set Meal
   * @request PUT:/routes/set-meals/{set_meal_id}
   */
  update_set_meal = (
    { setMealId, ...query }: UpdateSetMealParams,
    data: SetMealUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateSetMealData, UpdateSetMealError>({
      path: `/routes/set-meals/${setMealId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get media library with enhanced context including menu item relationships. Provides smart naming that shows menu item names + filenames for better UX.
   *
   * @tags dbtn/module:enhanced_media_assets
   * @name get_enhanced_media_library
   * @summary Get Enhanced Media Library
   * @request GET:/routes/enhanced-media-library
   */
  get_enhanced_media_library = (query: GetEnhancedMediaLibraryParams, params: RequestParams = {}) =>
    this.request<GetEnhancedMediaLibraryData, GetEnhancedMediaLibraryError>({
      path: `/routes/enhanced-media-library`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Update the menu_items table with image_asset_id columns to link to media_assets and pricing columns for multi-channel pricing
   *
   * @tags dbtn/module:schema
   * @name update_menu_items_schema
   * @summary Update Menu Items Schema
   * @request POST:/routes/update-menu-items-schema
   */
  update_menu_items_schema = (params: RequestParams = {}) =>
    this.request<UpdateMenuItemsSchemaData, any>({
      path: `/routes/update-menu-items-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if the menu_items table has the required image_asset_id columns
   *
   * @tags dbtn/module:schema
   * @name check_menu_images_schema_v2
   * @summary Check Schema Status Menu Images V2
   * @request GET:/routes/check-status
   */
  check_menu_images_schema_v2 = (params: RequestParams = {}) =>
    this.request<CheckMenuImagesSchemaV2Data, any>({
      path: `/routes/check-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set up the required image_asset_id columns in the menu_items table
   *
   * @tags dbtn/module:schema
   * @name setup_menu_images_schema_v2
   * @summary Setup Schema Menu Images
   * @request POST:/routes/setup
   */
  setup_menu_images_schema_v2 = (params: RequestParams = {}) =>
    this.request<SetupMenuImagesSchemaV2Data, any>({
      path: `/routes/setup`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing menu item images to use the new naming pattern and link them with media_assets
   *
   * @tags dbtn/module:schema
   * @name schema_migrate_menu_images_v2
   * @summary Schema Migrate Menu Images V2
   * @request POST:/routes/schema-migrate-menu-images
   */
  schema_migrate_menu_images_v2 = (params: RequestParams = {}) =>
    this.request<SchemaMigrateMenuImagesV2Data, any>({
      path: `/routes/schema-migrate-menu-images`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get lightweight POS bundle with essential data only for fast startup
   *
   * @tags dbtn/module:pos_performance
   * @name get_pos_bundle
   * @summary Get Pos Bundle
   * @request GET:/routes/pos-bundle
   */
  get_pos_bundle = (params: RequestParams = {}) =>
    this.request<GetPosBundleData, any>({
      path: `/routes/pos-bundle`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get full item details including variants, customizations for on-demand loading
   *
   * @tags dbtn/module:pos_performance
   * @name get_item_details
   * @summary Get Item Details
   * @request GET:/routes/item-details/{item_id}
   */
  get_item_details = ({ itemId, ...query }: GetItemDetailsParams, params: RequestParams = {}) =>
    this.request<GetItemDetailsData, GetItemDetailsError>({
      path: `/routes/item-details/${itemId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get full item data for a specific category when category is opened
   *
   * @tags dbtn/module:pos_performance
   * @name get_category_items
   * @summary Get Category Items
   * @request GET:/routes/category-items/{category_id}
   */
  get_category_items = ({ categoryId, ...query }: GetCategoryItemsParams, params: RequestParams = {}) =>
    this.request<GetCategoryItemsData, GetCategoryItemsError>({
      path: `/routes/category-items/${categoryId}`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:menu_structure
   * @name check_menu_structure_schema_status
   * @summary Check Menu Schema Status
   * @request GET:/routes/check-menu-schema-status
   */
  check_menu_structure_schema_status = (params: RequestParams = {}) =>
    this.request<CheckMenuStructureSchemaStatusData, any>({
      path: `/routes/check-menu-schema-status`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:menu_structure
   * @name setup_menu_structure_alter_table_function
   * @summary Setup Menu Alter Table Function
   * @request POST:/routes/setup-menu-alter-table-function
   */
  setup_menu_structure_alter_table_function = (params: RequestParams = {}) =>
    this.request<SetupMenuStructureAlterTableFunctionData, any>({
      path: `/routes/setup-menu-alter-table-function`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:menu_structure
   * @name save_category
   * @summary Save Category
   * @request POST:/routes/save-category
   */
  save_category = (data: CategoryWithIsProteinType, params: RequestParams = {}) =>
    this.request<SaveCategoryData, SaveCategoryError>({
      path: `/routes/save-category`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Analyze the impact of moving a category to a different section. Returns count of affected items and subcategories.
   *
   * @tags dbtn/module:menu_structure
   * @name analyze_section_change_impact
   * @summary Analyze Section Change Impact
   * @request POST:/routes/analyze-section-change-impact
   */
  analyze_section_change_impact = (data: SectionChangeImpactRequest, params: RequestParams = {}) =>
    this.request<AnalyzeSectionChangeImpactData, AnalyzeSectionChangeImpactError>({
      path: `/routes/analyze-section-change-impact`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Move a category to a different section by updating its parent_category_id.
   *
   * @tags dbtn/module:menu_structure
   * @name move_category_section
   * @summary Move Category Section
   * @request POST:/routes/move-category-section
   */
  move_category_section = (data: MoveCategorySectionRequest, params: RequestParams = {}) =>
    this.request<MoveCategorySectionData, MoveCategorySectionError>({
      path: `/routes/move-category-section`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Comprehensive diagnostics for menu items and category structure. Checks: - Orphaned menu items (category_id points to non-existent category) - Categories without valid parent sections - Item counts per section/category - Active/inactive status distribution Returns: DiagnosticsResponse: Complete diagnostic report with issues and stats
   *
   * @tags dbtn/module:menu_items_diagnostics
   * @name diagnose_menu_items
   * @summary Diagnose Menu Items
   * @request GET:/routes/menu-items/diagnostics
   */
  diagnose_menu_items = (params: RequestParams = {}) =>
    this.request<DiagnoseMenuItemsData, any>({
      path: `/routes/menu-items/diagnostics`,
      method: "GET",
      ...params,
    });

  /**
   * @description DEPRECATED: AI recommendations have been retired. This endpoint is intentionally kept to preserve the API contract and avoid breaking generated clients or latent integrations. Behavior: Always returns a safe, no-op response with status "disabled" and an empty recommendations array. No external AI providers are called. TODO: Remove this endpoint after the deprecation window and when all consumers have been updated.
   *
   * @tags dbtn/module:ai_menu_recommendations
   * @name generate_ai_recommendations
   * @summary Generate Ai Recommendations
   * @request POST:/routes/generate-ai-recommendations
   */
  generate_ai_recommendations = (data: MenuContextRequest, params: RequestParams = {}) =>
    this.request<GenerateAiRecommendationsData, GenerateAiRecommendationsError>({
      path: `/routes/generate-ai-recommendations`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Print kitchen order to thermal printer
   *
   * @tags dbtn/module:unified_printing_system
   * @name print_kitchen_thermal
   * @summary Print Kitchen Thermal
   * @request POST:/routes/unified-printing/thermal/print-kitchen
   */
  print_kitchen_thermal = (data: KitchenPrintRequest, params: RequestParams = {}) =>
    this.request<PrintKitchenThermalData, PrintKitchenThermalError>({
      path: `/routes/unified-printing/thermal/print-kitchen`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Print customer receipt to thermal printer
   *
   * @tags dbtn/module:unified_printing_system
   * @name print_receipt_thermal
   * @summary Print Receipt Thermal
   * @request POST:/routes/unified-printing/thermal/print-receipt
   */
  print_receipt_thermal = (data: ReceiptPrintRequest, params: RequestParams = {}) =>
    this.request<PrintReceiptThermalData, PrintReceiptThermalError>({
      path: `/routes/unified-printing/thermal/print-receipt`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Print to Epson printer using ePOS SDK
   *
   * @tags dbtn/module:unified_printing_system
   * @name print_epson
   * @summary Print Epson
   * @request POST:/routes/unified-printing/epson/print
   */
  print_epson = (data: EpsonPrintRequest, params: RequestParams = {}) =>
    this.request<PrintEpsonData, PrintEpsonError>({
      path: `/routes/unified-printing/epson/print`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Discover available Epson printers
   *
   * @tags dbtn/module:unified_printing_system
   * @name discover_epson_printers
   * @summary Discover Epson Printers
   * @request GET:/routes/unified-printing/epson/discover
   */
  discover_epson_printers = (params: RequestParams = {}) =>
    this.request<DiscoverEpsonPrintersData, any>({
      path: `/routes/unified-printing/epson/discover`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all available print templates
   *
   * @tags dbtn/module:unified_printing_system
   * @name list_print_templates
   * @summary List Print Templates
   * @request GET:/routes/unified-printing/templates/list
   */
  list_print_templates = (params: RequestParams = {}) =>
    this.request<ListPrintTemplatesData, any>({
      path: `/routes/unified-printing/templates/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new print template
   *
   * @tags dbtn/module:unified_printing_system
   * @name create_print_template
   * @summary Create Print Template
   * @request POST:/routes/unified-printing/templates/create
   */
  create_print_template = (data: PrintTemplate, params: RequestParams = {}) =>
    this.request<CreatePrintTemplateData, CreatePrintTemplateError>({
      path: `/routes/unified-printing/templates/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Print using a saved template
   *
   * @tags dbtn/module:unified_printing_system
   * @name print_with_template
   * @summary Print With Template
   * @request POST:/routes/unified-printing/templates/{template_id}/print
   */
  print_with_template = (
    { templateId, ...query }: PrintWithTemplateParams,
    data: PrintWithTemplatePayload,
    params: RequestParams = {},
  ) =>
    this.request<PrintWithTemplateData, PrintWithTemplateError>({
      path: `/routes/unified-printing/templates/${templateId}/print`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get comprehensive printing system status
   *
   * @tags dbtn/module:unified_printing_system
   * @name get_printing_system_status
   * @summary Get Printing System Status
   * @request GET:/routes/unified-printing/status/system
   */
  get_printing_system_status = (params: RequestParams = {}) =>
    this.request<GetPrintingSystemStatusData, any>({
      path: `/routes/unified-printing/status/system`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get recent print jobs
   *
   * @tags dbtn/module:unified_printing_system
   * @name get_recent_print_jobs
   * @summary Get Recent Print Jobs
   * @request GET:/routes/unified-printing/jobs/recent
   */
  get_recent_print_jobs = (query: GetRecentPrintJobsParams, params: RequestParams = {}) =>
    this.request<GetRecentPrintJobsData, GetRecentPrintJobsError>({
      path: `/routes/unified-printing/jobs/recent`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Test print to all available printers
   *
   * @tags dbtn/module:unified_printing_system
   * @name test_all_printers
   * @summary Test All Printers
   * @request POST:/routes/unified-printing/test/all-printers
   */
  test_all_printers = (params: RequestParams = {}) =>
    this.request<TestAllPrintersData, any>({
      path: `/routes/unified-printing/test/all-printers`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get menu printing settings
   *
   * @tags dbtn/module:unified_printing_system
   * @name get_menu_print_settings
   * @summary Get Menu Print Settings
   * @request GET:/routes/unified-printing/settings/menu-print
   */
  get_menu_print_settings = (params: RequestParams = {}) =>
    this.request<GetMenuPrintSettingsData, any>({
      path: `/routes/unified-printing/settings/menu-print`,
      method: "GET",
      ...params,
    });

  /**
   * @description Save menu printing settings
   *
   * @tags dbtn/module:unified_printing_system
   * @name save_menu_print_settings
   * @summary Save Menu Print Settings
   * @request POST:/routes/unified-printing/settings/menu-print
   */
  save_menu_print_settings = (data: SaveMenuPrintSettingsPayload, params: RequestParams = {}) =>
    this.request<SaveMenuPrintSettingsData, SaveMenuPrintSettingsError>({
      path: `/routes/unified-printing/settings/menu-print`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Add variant_name column to menu_item_variants table with auto-generation trigger. This migration: 1. Adds variant_name TEXT column 2. Creates trigger function to auto-generate variant names 3. Backfills existing records Generated format: "[Protein Type Name] [Menu Item Name]" Example: "Chicken Tikka Masala"
   *
   * @tags dbtn/module:variant_name_migration
   * @name add_variant_name_column
   * @summary Add Variant Name Column
   * @request POST:/routes/add-variant-name-column
   */
  add_variant_name_column = (params: RequestParams = {}) =>
    this.request<AddVariantNameColumnData, any>({
      path: `/routes/add-variant-name-column`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if variant_name column exists and how many records have it populated.
   *
   * @tags dbtn/module:variant_name_migration
   * @name check_variant_name_status
   * @summary Check Variant Name Status
   * @request GET:/routes/check-variant-name-status
   */
  check_variant_name_status = (params: RequestParams = {}) =>
    this.request<CheckVariantNameStatusData, any>({
      path: `/routes/check-variant-name-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Force regeneration of all variant names. Useful for fixing data issues or after bulk updates.
   *
   * @tags dbtn/module:variant_name_migration
   * @name regenerate_all_variant_names
   * @summary Regenerate All Variant Names
   * @request POST:/routes/regenerate-all-variant-names
   */
  regenerate_all_variant_names = (params: RequestParams = {}) =>
    this.request<RegenerateAllVariantNamesData, any>({
      path: `/routes/regenerate-all-variant-names`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get complete real menu data from Supabase Returns: RealMenuData: Complete menu data with categories and items from database
   *
   * @tags dbtn/module:menu_data_real
   * @name get_real_menu_data
   * @summary Get Real Menu Data
   * @request GET:/routes/real-menu-data
   */
  get_real_menu_data = (params: RequestParams = {}) =>
    this.request<GetRealMenuDataData, any>({
      path: `/routes/real-menu-data`,
      method: "GET",
      ...params,
    });

  /**
   * @description Preview what the migration will do without making changes. Shows sample of variants that will be updated.
   *
   * @tags dbtn/module:migrate_variant_names
   * @name preview_migration
   * @summary Preview Migration
   * @request GET:/routes/migrate-variant-names/dry-run
   */
  preview_migration = (params: RequestParams = {}) =>
    this.request<PreviewMigrationData, any>({
      path: `/routes/migrate-variant-names/dry-run`,
      method: "GET",
      ...params,
    });

  /**
   * @description Execute the migration to populate generated_name for all variants. Uses PostgreSQL INITCAP for Title Case formatting.
   *
   * @tags dbtn/module:migrate_variant_names
   * @name execute_migration
   * @summary Execute Migration
   * @request POST:/routes/migrate-variant-names/execute
   */
  execute_migration = (params: RequestParams = {}) =>
    this.request<ExecuteMigrationData, any>({
      path: `/routes/migrate-variant-names/execute`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that all variants have properly formatted generated_name values. Returns statistics and samples for validation.
   *
   * @tags dbtn/module:migrate_variant_names
   * @name verify_migration
   * @summary Verify Migration
   * @request GET:/routes/migrate-variant-names/verify
   */
  verify_migration = (params: RequestParams = {}) =>
    this.request<VerifyMigrationData, any>({
      path: `/routes/migrate-variant-names/verify`,
      method: "GET",
      ...params,
    });

  /**
   * @description One-time migration to update all variant_name values to Title Case format. Also drops the generated_name column that was added by mistake. This migration: 1. Updates variant_name to Title Case using PostgreSQL's INITCAP function 2. Drops the generated_name column 3. Returns summary of changes
   *
   * @tags dbtn/module:migrate_variant_names
   * @name migrate_variant_names_to_title_case
   * @summary Migrate Variant Names To Title Case
   * @request POST:/routes/migrate-variant-names-to-title-case
   */
  migrate_variant_names_to_title_case = (params: RequestParams = {}) =>
    this.request<MigrateVariantNamesToTitleCaseData, any>({
      path: `/routes/migrate-variant-names-to-title-case`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that all variant names are in Title Case format. Returns statistics and sample variants.
   *
   * @tags dbtn/module:migrate_variant_names
   * @name verify_variant_names
   * @summary Verify Variant Names
   * @request GET:/routes/verify-variant-names
   */
  verify_variant_names = (params: RequestParams = {}) =>
    this.request<VerifyVariantNamesData, any>({
      path: `/routes/verify-variant-names`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all protein types
   *
   * @tags dbtn/module:menu_protein_types
   * @name list_protein_types
   * @summary List Protein Types
   * @request GET:/routes/menu-protein-types
   */
  list_protein_types = (params: RequestParams = {}) =>
    this.request<ListProteinTypesData, any>({
      path: `/routes/menu-protein-types`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new protein type
   *
   * @tags dbtn/module:menu_protein_types
   * @name create_protein_type
   * @summary Create Protein Type
   * @request POST:/routes/menu-protein-types
   */
  create_protein_type = (data: ProteinTypeCreate, params: RequestParams = {}) =>
    this.request<CreateProteinTypeData, CreateProteinTypeError>({
      path: `/routes/menu-protein-types`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a specific protein type by ID
   *
   * @tags dbtn/module:menu_protein_types
   * @name get_protein_type
   * @summary Get Protein Type
   * @request GET:/routes/menu-protein-types/{protein_id}
   */
  get_protein_type = ({ proteinId, ...query }: GetProteinTypeParams, params: RequestParams = {}) =>
    this.request<GetProteinTypeData, GetProteinTypeError>({
      path: `/routes/menu-protein-types/${proteinId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update an existing protein type
   *
   * @tags dbtn/module:menu_protein_types
   * @name update_protein_type
   * @summary Update Protein Type
   * @request PUT:/routes/menu-protein-types/{protein_id}
   */
  update_protein_type = (
    { proteinId, ...query }: UpdateProteinTypeParams,
    data: ProteinTypeUpdate,
    params: RequestParams = {},
  ) =>
    this.request<UpdateProteinTypeData, UpdateProteinTypeError>({
      path: `/routes/menu-protein-types/${proteinId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a protein type (with dependency check)
   *
   * @tags dbtn/module:menu_protein_types
   * @name delete_protein_type
   * @summary Delete Protein Type
   * @request DELETE:/routes/menu-protein-types/{protein_id}
   */
  delete_protein_type = ({ proteinId, ...query }: DeleteProteinTypeParams, params: RequestParams = {}) =>
    this.request<DeleteProteinTypeData, DeleteProteinTypeError>({
      path: `/routes/menu-protein-types/${proteinId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Securely fetch and summarize customer context for chat personalization. Uses service role to access all customer data while sanitizing output for logs.
   *
   * @tags dbtn/module:customer_context
   * @name get_customer_context_summary
   * @summary Get Customer Context Summary
   * @request POST:/routes/customer-context
   */
  get_customer_context_summary = (data: CustomerContextRequest, params: RequestParams = {}) =>
    this.request<GetCustomerContextSummaryData, GetCustomerContextSummaryError>({
      path: `/routes/customer-context`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for customer context service
   *
   * @tags dbtn/module:customer_context
   * @name customer_context_health_check
   * @summary Customer Context Health Check
   * @request GET:/routes/customer-context-health
   */
  customer_context_health_check = (params: RequestParams = {}) =>
    this.request<CustomerContextHealthCheckData, any>({
      path: `/routes/customer-context-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add customer_reference_number field to customers table
   *
   * @tags dbtn/module:customer_reference_system
   * @name add_customer_reference_field
   * @summary Add Customer Reference Field
   * @request POST:/routes/add-customer-reference-field
   */
  add_customer_reference_field = (params: RequestParams = {}) =>
    this.request<AddCustomerReferenceFieldData, any>({
      path: `/routes/add-customer-reference-field`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate customer reference numbers for existing customers who don't have them
   *
   * @tags dbtn/module:customer_reference_system
   * @name generate_reference_numbers_for_existing_customers
   * @summary Generate Reference Numbers For Existing Customers
   * @request POST:/routes/generate-reference-numbers
   */
  generate_reference_numbers_for_existing_customers = (params: RequestParams = {}) =>
    this.request<GenerateReferenceNumbersForExistingCustomersData, any>({
      path: `/routes/generate-reference-numbers`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get customer reference number by customer ID
   *
   * @tags dbtn/module:customer_reference_system
   * @name get_customer_reference
   * @summary Get Customer Reference
   * @request GET:/routes/check-customer-reference/{customer_id}
   */
  get_customer_reference = ({ customerId, ...query }: GetCustomerReferenceParams, params: RequestParams = {}) =>
    this.request<GetCustomerReferenceData, GetCustomerReferenceError>({
      path: `/routes/check-customer-reference/${customerId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Validate that the customer reference system is working correctly
   *
   * @tags dbtn/module:customer_reference_system
   * @name validate_reference_system
   * @summary Validate Reference System
   * @request GET:/routes/validate-reference-system
   */
  validate_reference_system = (params: RequestParams = {}) =>
    this.request<ValidateReferenceSystemData, any>({
      path: `/routes/validate-reference-system`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:identity_migration
   * @name init_clients_and_core_tables
   * @summary Init Clients And Core Tables
   * @request POST:/routes/identity-migration/init
   */
  init_clients_and_core_tables = (params: RequestParams = {}) =>
    this.request<InitClientsAndCoreTablesData, any>({
      path: `/routes/identity-migration/init`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:identity_migration
   * @name enable_rls_and_policies
   * @summary Enable Rls And Policies
   * @request POST:/routes/identity-migration/enable-rls
   */
  enable_rls_and_policies = (params: RequestParams = {}) =>
    this.request<EnableRlsAndPoliciesData, any>({
      path: `/routes/identity-migration/enable-rls`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:identity_migration
   * @name backfill_legacy
   * @summary Backfill Legacy
   * @request POST:/routes/identity-migration/backfill
   */
  backfill_legacy = (params: RequestParams = {}) =>
    this.request<BackfillLegacyData, any>({
      path: `/routes/identity-migration/backfill`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:identity_migration
   * @name lock_legacy_and_views
   * @summary Lock Legacy And Views
   * @request POST:/routes/identity-migration/lock-legacy-and-views
   */
  lock_legacy_and_views = (params: RequestParams = {}) =>
    this.request<LockLegacyAndViewsData, any>({
      path: `/routes/identity-migration/lock-legacy-and-views`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:identity_migration
   * @name audit_report
   * @summary Audit Report
   * @request GET:/routes/identity-migration/audit
   */
  audit_report = (params: RequestParams = {}) =>
    this.request<AuditReportData, any>({
      path: `/routes/identity-migration/audit`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:identity_migration
   * @name rollback
   * @summary Rollback
   * @request POST:/routes/identity-migration/rollback
   */
  rollback = (params: RequestParams = {}) =>
    this.request<RollbackData, any>({
      path: `/routes/identity-migration/rollback`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:identity_migration
   * @name full_run
   * @summary Full Run
   * @request POST:/routes/identity-migration/full-run
   */
  full_run = (data: FullRunRequest, params: RequestParams = {}) =>
    this.request<FullRunData, FullRunError>({
      path: `/routes/identity-migration/full-run`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Return concrete counts for legacy vs new tables and quick integrity checks. Tolerant to missing legacy tables/views post-cutover.
   *
   * @tags dbtn/module:identity_migration
   * @name admin_counts
   * @summary Admin Counts
   * @request GET:/routes/identity-migration/admin-counts
   */
  admin_counts = (params: RequestParams = {}) =>
    this.request<AdminCountsData, any>({
      path: `/routes/identity-migration/admin-counts`,
      method: "GET",
      ...params,
    });

  /**
   * @description List RLS policies for key tables to verify presence and definitions.
   *
   * @tags dbtn/module:identity_migration
   * @name list_rls_policies
   * @summary List Rls Policies
   * @request GET:/routes/identity-migration/list-rls-policies
   */
  list_rls_policies = (params: RequestParams = {}) =>
    this.request<ListRlsPoliciesData, any>({
      path: `/routes/identity-migration/list-rls-policies`,
      method: "GET",
      ...params,
    });

  /**
   * @description Safely finalize identity cutover by: - Dropping the read-only compatibility view if present - Revoking remaining grants on legacy tables (customer_profiles, user_profiles_legacy) This is idempotent and will no-op if artifacts are already gone.
   *
   * @tags dbtn/module:identity_migration
   * @name finalize_cutover
   * @summary Finalize Cutover
   * @request POST:/routes/identity-migration/finalize-cutover
   */
  finalize_cutover = (data: FinalizeCutoverRequest, params: RequestParams = {}) =>
    this.request<FinalizeCutoverData, FinalizeCutoverError>({
      path: `/routes/identity-migration/finalize-cutover`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Force Supabase PostgREST to reload its schema cache. This is necessary after DDL changes (ALTER TABLE, CREATE TABLE, etc.) to ensure PostgREST recognizes new columns/tables immediately. Uses service role key to execute NOTIFY pgrst, 'reload schema'.
   *
   * @tags dbtn/module:supabase_admin
   * @name refresh_schema_cache
   * @summary Refresh Schema Cache
   * @request POST:/routes/supabase-admin/refresh-schema-cache
   */
  refresh_schema_cache = (params: RequestParams = {}) =>
    this.request<RefreshSchemaCacheData, any>({
      path: `/routes/supabase-admin/refresh-schema-cache`,
      method: "POST",
      ...params,
    });

  /**
   * @description One-time migration: Create customers records for all profiles that have auth_user_id. Links profiles (admin/staff) to customers (diner) records via auth_user_id.
   *
   * @tags dbtn/module:cutover_migration
   * @name migrate_profiles_to_customers
   * @summary Migrate Profiles To Customers
   * @request POST:/routes/migrate-profiles-to-customers
   */
  migrate_profiles_to_customers = (params: RequestParams = {}) =>
    this.request<MigrateProfilesToCustomersData, any>({
      path: `/routes/migrate-profiles-to-customers`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if management password is set and whether it's still the default. Returns status information without exposing the actual password.
   *
   * @tags dbtn/module:admin_auth
   * @name get_password_status
   * @summary Get Password Status
   * @request GET:/routes/password-status
   */
  get_password_status = (params: RequestParams = {}) =>
    this.request<GetPasswordStatusData, any>({
      path: `/routes/password-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the current management password value. Returns 'admin123' if not set or is default, otherwise returns the custom password.
   *
   * @tags dbtn/module:admin_auth
   * @name get_current_password
   * @summary Get Current Password
   * @request GET:/routes/get-current-password
   */
  get_current_password = (params: RequestParams = {}) =>
    this.request<GetCurrentPasswordData, any>({
      path: `/routes/get-current-password`,
      method: "GET",
      ...params,
    });

  /**
   * @description Verify admin/management password for POSDesktop access. This endpoint validates passwords against known admin credentials: - admin123 (default password) - manager456 (manager password) - qsai2025 (system password)
   *
   * @tags dbtn/module:admin_auth
   * @name verify_password
   * @summary Verify Password
   * @request POST:/routes/verify-password
   */
  verify_password = (data: PasswordVerificationRequest, params: RequestParams = {}) =>
    this.request<VerifyPasswordData, VerifyPasswordError>({
      path: `/routes/verify-password`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update the admin/management password and save to Supabase database. This replaces the default password with a custom one.
   *
   * @tags dbtn/module:admin_auth
   * @name update_password
   * @summary Update Password
   * @request POST:/routes/update-password
   */
  update_password = (data: PasswordUpdateRequest, params: RequestParams = {}) =>
    this.request<UpdatePasswordData, UpdatePasswordError>({
      path: `/routes/update-password`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Initialize trusted device and audit tables (run once).
   *
   * @tags dbtn/module:admin_auth
   * @name setup_trusted_device_tables
   * @summary Setup Trusted Device Tables
   * @request POST:/routes/setup-trusted-device-tables
   */
  setup_trusted_device_tables = (params: RequestParams = {}) =>
    this.request<SetupTrustedDeviceTablesData, any>({
      path: `/routes/setup-trusted-device-tables`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify password with device trust and throttling support. - Checks password against stored value - Enforces 5-minute cooldown after 5 failed attempts - Optionally creates trusted device token - Logs all attempts to audit trail
   *
   * @tags dbtn/module:admin_auth
   * @name verify_password_with_device
   * @summary Verify Password With Device
   * @request POST:/routes/verify-password-with-device
   */
  verify_password_with_device = (data: VerifyPasswordWithDeviceRequest, params: RequestParams = {}) =>
    this.request<VerifyPasswordWithDeviceData, VerifyPasswordWithDeviceError>({
      path: `/routes/verify-password-with-device`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a device fingerprint is currently trusted.
   *
   * @tags dbtn/module:admin_auth
   * @name check_device_trust
   * @summary Check Device Trust
   * @request POST:/routes/check-device-trust
   */
  check_device_trust = (data: CheckTrustRequest, params: RequestParams = {}) =>
    this.request<CheckDeviceTrustData, CheckDeviceTrustError>({
      path: `/routes/check-device-trust`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all trusted devices (including revoked).
   *
   * @tags dbtn/module:admin_auth
   * @name list_trusted_devices
   * @summary List Trusted Devices
   * @request GET:/routes/trusted-devices
   */
  list_trusted_devices = (params: RequestParams = {}) =>
    this.request<ListTrustedDevicesData, any>({
      path: `/routes/trusted-devices`,
      method: "GET",
      ...params,
    });

  /**
   * @description Revoke a trusted device.
   *
   * @tags dbtn/module:admin_auth
   * @name revoke_device
   * @summary Revoke Device
   * @request POST:/routes/revoke-device
   */
  revoke_device = (data: AppApisAdminAuthRevokeDeviceRequest, params: RequestParams = {}) =>
    this.request<RevokeDeviceData, RevokeDeviceError>({
      path: `/routes/revoke-device`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a device is currently locked out due to failed attempts. Args: request: CheckTrustRequest with device_fingerprint Returns: LockStatusResponse with lock status, cooldown time, and failed attempts count
   *
   * @tags dbtn/module:admin_auth
   * @name get_admin_lock_status
   * @summary Get Admin Lock Status
   * @request POST:/routes/get-admin-lock-status
   */
  get_admin_lock_status = (data: CheckTrustRequest, params: RequestParams = {}) =>
    this.request<GetAdminLockStatusData, GetAdminLockStatusError>({
      path: `/routes/get-admin-lock-status`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if admin is currently locked due to failed attempts.
   *
   * @tags dbtn/module:admin_auth
   * @name get_lock_status
   * @summary Get Lock Status
   * @request GET:/routes/lock-status
   */
  get_lock_status = (query: GetLockStatusParams, params: RequestParams = {}) =>
    this.request<GetLockStatusData, GetLockStatusError>({
      path: `/routes/lock-status`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Authenticate user with Supabase Auth and verify POS access Flow: 1. Sign in with Supabase (email + password) 2. Check if user has POS role (admin/manager/staff) 3. Optionally trust device if requested 4. Return session + role info
   *
   * @tags dbtn/module:pos_supabase_auth
   * @name supabase_pos_login
   * @summary Supabase Pos Login
   * @request POST:/routes/supabase-pos-login
   */
  supabase_pos_login = (data: POSLoginRequest, params: RequestParams = {}) =>
    this.request<SupabasePosLoginData, SupabasePosLoginError>({
      path: `/routes/supabase-pos-login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a user has POS access based on their role
   *
   * @tags dbtn/module:pos_supabase_auth
   * @name check_pos_access
   * @summary Check Pos Access
   * @request POST:/routes/check-pos-access
   */
  check_pos_access = (data: CheckPOSAccessRequest, params: RequestParams = {}) =>
    this.request<CheckPosAccessData, CheckPosAccessError>({
      path: `/routes/check-pos-access`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Link a trusted device to a specific user
   *
   * @tags dbtn/module:pos_supabase_auth
   * @name trust_device_for_user
   * @summary Trust Device For User
   * @request POST:/routes/trust-device-for-user
   */
  trust_device_for_user = (data: TrustDeviceRequest, params: RequestParams = {}) =>
    this.request<TrustDeviceForUserData, TrustDeviceForUserError>({
      path: `/routes/trust-device-for-user`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a device is trusted for a specific user
   *
   * @tags dbtn/module:pos_supabase_auth
   * @name check_user_trusted_device
   * @summary Check User Trusted Device
   * @request POST:/routes/check-user-trusted-device
   */
  check_user_trusted_device = (data: CheckDeviceTrustRequest, params: RequestParams = {}) =>
    this.request<CheckUserTrustedDeviceData, CheckUserTrustedDeviceError>({
      path: `/routes/check-user-trusted-device`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Revoke device trust for a specific user
   *
   * @tags dbtn/module:pos_supabase_auth
   * @name revoke_user_device
   * @summary Revoke User Device
   * @request POST:/routes/revoke-user-device
   */
  revoke_user_device = (data: AppApisPosSupabaseAuthRevokeDeviceRequest, params: RequestParams = {}) =>
    this.request<RevokeUserDeviceData, RevokeUserDeviceError>({
      path: `/routes/revoke-user-device`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create Supabase tables for POS authentication: - pos_user_roles: map user_id to role (admin/manager/staff) - pos_trusted_devices_v2: per-user device trust - RLS policies - Initialize Boss's account with admin role
   *
   * @tags dbtn/module:pos_auth_migration
   * @name setup_pos_auth_tables
   * @summary Setup Pos Auth Tables
   * @request POST:/routes/setup-pos-auth-tables
   */
  setup_pos_auth_tables = (params: RequestParams = {}) =>
    this.request<SetupPosAuthTablesData, any>({
      path: `/routes/setup-pos-auth-tables`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if POS auth tables exist and are properly configured
   *
   * @tags dbtn/module:pos_auth_migration
   * @name check_pos_auth_setup
   * @summary Check Pos Auth Setup
   * @request GET:/routes/check-pos-auth-setup
   */
  check_pos_auth_setup = (params: RequestParams = {}) =>
    this.request<CheckPosAuthSetupData, any>({
      path: `/routes/check-pos-auth-setup`,
      method: "GET",
      ...params,
    });

  /**
   * @description Diagnostic endpoint to check category parent_category_id mappings. Shows which categories are under which sections.
   *
   * @tags dbtn/module:category_diagnostics
   * @name get_category_diagnostics
   * @summary Get Category Diagnostics
   * @request GET:/routes/category-diagnostics
   */
  get_category_diagnostics = (params: RequestParams = {}) =>
    this.request<GetCategoryDiagnosticsData, any>({
      path: `/routes/category-diagnostics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test the category filtering logic with actual database data. Simulates the frontend filtering logic to identify mismatches. Args: category_id: The category ID to filter by (optional - defaults to NON VEGETARIAN) Returns: Diagnostic information about filtering results
   *
   * @tags dbtn/module:menu_filter_diagnostic
   * @name test_category_filter
   * @summary Test Category Filter
   * @request GET:/routes/test-category-filter
   */
  test_category_filter = (query: TestCategoryFilterParams, params: RequestParams = {}) =>
    this.request<TestCategoryFilterData, TestCategoryFilterError>({
      path: `/routes/test-category-filter`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Send order confirmation email for online orders
   *
   * @tags dbtn/module:order_notifications
   * @name send_order_confirmation_email
   * @summary Send Order Confirmation Email
   * @request POST:/routes/order-notifications/send-order-confirmation
   */
  send_order_confirmation_email = (data: OrderConfirmationRequest, params: RequestParams = {}) =>
    this.request<SendOrderConfirmationEmailData, SendOrderConfirmationEmailError>({
      path: `/routes/order-notifications/send-order-confirmation`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Send a real-time notification for order events
   *
   * @tags dbtn/module:order_notifications
   * @name send_realtime_notification
   * @summary Send Realtime Notification
   * @request POST:/routes/order-notifications/send-realtime
   */
  send_realtime_notification = (data: NotificationRequest, params: RequestParams = {}) =>
    this.request<SendRealtimeNotificationData, SendRealtimeNotificationError>({
      path: `/routes/order-notifications/send-realtime`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get real-time notifications for dashboard
   *
   * @tags dbtn/module:order_notifications
   * @name get_realtime_notifications
   * @summary Get Realtime Notifications
   * @request GET:/routes/order-notifications/realtime/list
   */
  get_realtime_notifications = (query: GetRealtimeNotificationsParams, params: RequestParams = {}) =>
    this.request<GetRealtimeNotificationsData, GetRealtimeNotificationsError>({
      path: `/routes/order-notifications/realtime/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Mark notifications as read, acknowledged, or dismissed
   *
   * @tags dbtn/module:order_notifications
   * @name mark_realtime_notifications
   * @summary Mark Realtime Notifications
   * @request POST:/routes/order-notifications/realtime/mark
   */
  mark_realtime_notifications = (data: NotificationMarkRequest, params: RequestParams = {}) =>
    this.request<MarkRealtimeNotificationsData, MarkRealtimeNotificationsError>({
      path: `/routes/order-notifications/realtime/mark`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get notification statistics for dashboard
   *
   * @tags dbtn/module:order_notifications
   * @name get_realtime_notification_stats
   * @summary Get Realtime Notification Stats
   * @request GET:/routes/order-notifications/realtime/stats
   */
  get_realtime_notification_stats = (query: GetRealtimeNotificationStatsParams, params: RequestParams = {}) =>
    this.request<GetRealtimeNotificationStatsData, GetRealtimeNotificationStatsError>({
      path: `/routes/order-notifications/realtime/stats`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create an SMS payment link for delivery orders
   *
   * @tags dbtn/module:sms_payment_links
   * @name create_sms_payment_link
   * @summary Create Sms Payment Link
   * @request POST:/routes/sms-payment/create-payment-link
   */
  create_sms_payment_link = (data: SMSPaymentLinkRequest, params: RequestParams = {}) =>
    this.request<CreateSmsPaymentLinkData, CreateSmsPaymentLinkError>({
      path: `/routes/sms-payment/create-payment-link`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check the status of an SMS payment link
   *
   * @tags dbtn/module:sms_payment_links
   * @name check_payment_link_status
   * @summary Check Payment Link Status
   * @request POST:/routes/sms-payment/check-payment-status
   */
  check_payment_link_status = (data: PaymentLinkStatusRequest, params: RequestParams = {}) =>
    this.request<CheckPaymentLinkStatusData, CheckPaymentLinkStatusError>({
      path: `/routes/sms-payment/check-payment-status`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Mark an SMS payment link as paid (called by Stripe webhook)
   *
   * @tags dbtn/module:sms_payment_links
   * @name mark_payment_as_paid
   * @summary Mark Payment As Paid
   * @request POST:/routes/sms-payment/mark-as-paid
   */
  mark_payment_as_paid = (query: MarkPaymentAsPaidParams, params: RequestParams = {}) =>
    this.request<MarkPaymentAsPaidData, MarkPaymentAsPaidError>({
      path: `/routes/sms-payment/mark-as-paid`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description List all pending SMS payment links for delivery tracking
   *
   * @tags dbtn/module:sms_payment_links
   * @name list_pending_payments
   * @summary List Pending Payments
   * @request GET:/routes/sms-payment/list-pending-payments
   */
  list_pending_payments = (params: RequestParams = {}) =>
    this.request<ListPendingPaymentsData, any>({
      path: `/routes/sms-payment/list-pending-payments`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate HTML formatted receipt for system printer
   *
   * @tags dbtn/module:system_printer
   * @name generate_receipt_html
   * @summary Generate Receipt Html
   * @request POST:/routes/generate-receipt-html
   */
  generate_receipt_html = (data: ReceiptData, params: RequestParams = {}) =>
    this.request<GenerateReceiptHtmlData, GenerateReceiptHtmlError>({
      path: `/routes/generate-receipt-html`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate test receipt for printer setup verification
   *
   * @tags dbtn/module:system_printer
   * @name print_test_receipt
   * @summary Print Test Receipt
   * @request POST:/routes/print-test-receipt
   */
  print_test_receipt = (params: RequestParams = {}) =>
    this.request<PrintTestReceiptData, any>({
      path: `/routes/print-test-receipt`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create schema_migrations table for audit trail. Table structure: - migration_id (PK): Unique identifier (m_YYYYMMDD_HHMMSS_hash) - sql_hash: SHA256 hash of SQL for idempotency - description: Human-readable description - sql: Full DDL statement - dry_run: Whether this was a test run - warnings: Array of validation warnings - executed_at: Timestamp of execution
   *
   * @tags dbtn/module:supabase_setup
   * @name initialize_schema_migrations
   * @summary Initialize Schema Migrations
   * @request POST:/routes/supabase-setup/initialize-schema-migrations
   */
  initialize_schema_migrations = (params: RequestParams = {}) =>
    this.request<InitializeSchemaMigrationsData, any>({
      path: `/routes/supabase-setup/initialize-schema-migrations`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create execute_sql RPC function in Supabase. This function allows executing arbitrary SQL statements with service role permissions. It's required for DDL operations. SECURITY: Uses SECURITY DEFINER to run with elevated privileges. Only accessible to service role, not exposed to anon users.
   *
   * @tags dbtn/module:supabase_setup
   * @name create_execute_sql_rpc
   * @summary Create Execute Sql Rpc
   * @request POST:/routes/supabase-setup/create-execute-sql-rpc
   */
  create_execute_sql_rpc = (params: RequestParams = {}) =>
    this.request<CreateExecuteSqlRpcData, any>({
      path: `/routes/supabase-setup/create-execute-sql-rpc`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that execute_sql RPC function exists and works.
   *
   * @tags dbtn/module:supabase_setup
   * @name verify_execute_sql_rpc
   * @summary Verify Execute Sql Rpc
   * @request GET:/routes/supabase-setup/verify-execute-sql-rpc
   */
  verify_execute_sql_rpc = (params: RequestParams = {}) =>
    this.request<VerifyExecuteSqlRpcData, any>({
      path: `/routes/supabase-setup/verify-execute-sql-rpc`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if schema_migrations table exists and get its structure.
   *
   * @tags dbtn/module:supabase_setup
   * @name check_schema_migrations
   * @summary Check Schema Migrations
   * @request GET:/routes/supabase-setup/check-schema-migrations
   */
  check_schema_migrations = (params: RequestParams = {}) =>
    this.request<CheckSchemaMigrationsData, any>({
      path: `/routes/supabase-setup/check-schema-migrations`,
      method: "GET",
      ...params,
    });

  /**
   * @description Complete setup: verify execute_sql RPC and create schema_migrations table. This is the recommended endpoint to run first.
   *
   * @tags dbtn/module:supabase_setup
   * @name full_setup
   * @summary Full Setup
   * @request POST:/routes/supabase-setup/full-setup
   */
  full_setup = (params: RequestParams = {}) =>
    this.request<FullSetupData, any>({
      path: `/routes/supabase-setup/full-setup`,
      method: "POST",
      ...params,
    });

  /**
   * @description Simple health check
   *
   * @tags dbtn/module:supabase_manager_test
   * @name supabase_manager_health_check
   * @summary Supabase Manager Health Check
   * @request GET:/routes/supabase-manager-test/health
   */
  supabase_manager_health_check = (params: RequestParams = {}) =>
    this.request<SupabaseManagerHealthCheckData, any>({
      path: `/routes/supabase-manager-test/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test Tier 1: CRUD operations on a test table. Tests: 1. Create test table (via DDL) 2. INSERT data 3. SELECT data 4. UPDATE data 5. DELETE data 6. Cleanup (drop test table)
   *
   * @tags dbtn/module:supabase_manager_test
   * @name test_tier1_crud
   * @summary Test Tier1 Crud
   * @request POST:/routes/supabase-manager-test/tier1-crud
   */
  test_tier1_crud = (params: RequestParams = {}) =>
    this.request<TestTier1CrudData, any>({
      path: `/routes/supabase-manager-test/tier1-crud`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test Tier 2: DDL operations with validation and audit. Tests: 1. CREATE TABLE (allowed) 2. ALTER TABLE (allowed) 3. DROP TABLE (allowed with warning) 4. Blocked operation (DROP DATABASE) 5. Dry-run mode 6. Audit trail verification
   *
   * @tags dbtn/module:supabase_manager_test
   * @name test_tier2_ddl
   * @summary Test Tier2 Ddl
   * @request POST:/routes/supabase-manager-test/tier2-ddl
   */
  test_tier2_ddl = (params: RequestParams = {}) =>
    this.request<TestTier2DdlData, any>({
      path: `/routes/supabase-manager-test/tier2-ddl`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test Tier 3: Advanced management features. Tests: 1. List all tables 2. Get table schema 3. Create Postgres function 4. Call Postgres function 5. Migration history
   *
   * @tags dbtn/module:supabase_manager_test
   * @name test_tier3_advanced
   * @summary Test Tier3 Advanced
   * @request POST:/routes/supabase-manager-test/tier3-advanced
   */
  test_tier3_advanced = (params: RequestParams = {}) =>
    this.request<TestTier3AdvancedData, any>({
      path: `/routes/supabase-manager-test/tier3-advanced`,
      method: "POST",
      ...params,
    });

  /**
   * @description Run complete test suite for all three tiers. Returns comprehensive results showing what works and what doesn't.
   *
   * @tags dbtn/module:supabase_manager_test
   * @name run_full_test_suite
   * @summary Run Full Test Suite
   * @request POST:/routes/supabase-manager-test/run-full-suite
   */
  run_full_test_suite = (params: RequestParams = {}) =>
    this.request<RunFullTestSuiteData, any>({
      path: `/routes/supabase-manager-test/run-full-suite`,
      method: "POST",
      ...params,
    });

  /**
   * @description Demonstrate safety validation features. Shows what operations are blocked vs allowed.
   *
   * @tags dbtn/module:supabase_manager_test
   * @name test_safety_validation
   * @summary Test Safety Validation
   * @request GET:/routes/supabase-manager-test/safety-validation-demo
   */
  test_safety_validation = (params: RequestParams = {}) =>
    this.request<TestSafetyValidationData, any>({
      path: `/routes/supabase-manager-test/safety-validation-demo`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get recent migration history from audit trail.
   *
   * @tags dbtn/module:supabase_manager_test
   * @name get_migration_history_endpoint
   * @summary Get Migration History Endpoint
   * @request GET:/routes/supabase-manager-test/migration-history
   */
  get_migration_history_endpoint = (query: GetMigrationHistoryEndpointParams, params: RequestParams = {}) =>
    this.request<GetMigrationHistoryEndpointData, GetMigrationHistoryEndpointError>({
      path: `/routes/supabase-manager-test/migration-history`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Track cart analytics events (privacy-conscious). Event types: - cart_item_added - cart_item_removed - order_mode_switched - checkout_initiated - checkout_abandoned - cart_cleared
   *
   * @tags dbtn/module:cart_analytics
   * @name track_cart_event
   * @summary Track Cart Event
   * @request POST:/routes/track-event
   */
  track_cart_event = (data: CartEventRequest, params: RequestParams = {}) =>
    this.request<TrackCartEventData, TrackCartEventError>({
      path: `/routes/track-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get cart analytics metrics for admin dashboard. Metrics include: - Total events - Cart abandonment rate - Average cart value - Popular items - Order mode switches
   *
   * @tags dbtn/module:cart_analytics
   * @name get_cart_metrics
   * @summary Get Cart Metrics
   * @request GET:/routes/metrics
   */
  get_cart_metrics = (query: GetCartMetricsParams, params: RequestParams = {}) =>
    this.request<GetCartMetricsData, GetCartMetricsError>({
      path: `/routes/metrics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create the cottage-tandoori-kds GitHub repository. Returns repository details including URLs and metadata.
   *
   * @tags dbtn/module:github_kds_manager
   * @name create_repository
   * @summary Create Repository
   * @request POST:/routes/create-repository
   */
  create_repository = (data: CreateRepositoryRequest, params: RequestParams = {}) =>
    this.request<CreateRepositoryData, CreateRepositoryError>({
      path: `/routes/create-repository`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get information about the cottage-tandoori-kds repository. Returns repository metadata including stars, forks, topics, etc.
   *
   * @tags dbtn/module:github_kds_manager
   * @name get_repository_info
   * @summary Get Repository Info
   * @request GET:/routes/repository-info
   */
  get_repository_info = (params: RequestParams = {}) =>
    this.request<GetRepositoryInfoData, any>({
      path: `/routes/repository-info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create or update a file in the repository. Used to create README.md, LICENSE, .gitignore, etc.
   *
   * @tags dbtn/module:github_kds_manager
   * @name create_file
   * @summary Create File
   * @request POST:/routes/kds-create-file
   */
  create_file = (data: CreateFileRequest, params: RequestParams = {}) =>
    this.request<CreateFileData, CreateFileError>({
      path: `/routes/kds-create-file`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get SHA of existing file (needed for updates). Returns: {"sha": "...", "path": "..."}
   *
   * @tags dbtn/module:github_kds_manager
   * @name get_file_sha
   * @summary Get File Sha
   * @request GET:/routes/get-file-sha
   */
  get_file_sha = (query: GetFileShaParams, params: RequestParams = {}) =>
    this.request<GetFileShaData, GetFileShaError>({
      path: `/routes/get-file-sha`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new release with tag. Returns release ID and upload URL for attaching assets.
   *
   * @tags dbtn/module:github_kds_manager
   * @name create_release
   * @summary Create Release
   * @request POST:/routes/create-release
   */
  create_release = (data: CreateReleaseRequest, params: RequestParams = {}) =>
    this.request<CreateReleaseData, CreateReleaseError>({
      path: `/routes/create-release`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Upload build artifact to release. File content should be base64 encoded in request.
   *
   * @tags dbtn/module:github_kds_manager
   * @name upload_release_asset
   * @summary Upload Release Asset
   * @request POST:/routes/upload-release-asset
   */
  upload_release_asset = (data: UploadAssetRequest, params: RequestParams = {}) =>
    this.request<UploadReleaseAssetData, UploadReleaseAssetError>({
      path: `/routes/upload-release-asset`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get latest KDS release info. Used by UpdateKDS page to check for updates.
   *
   * @tags dbtn/module:github_kds_manager
   * @name get_latest_release
   * @summary Get Latest Release
   * @request GET:/routes/latest-release
   */
  get_latest_release = (params: RequestParams = {}) =>
    this.request<GetLatestReleaseData, any>({
      path: `/routes/latest-release`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all KDS releases with pagination. Filters by draft/prerelease status.
   *
   * @tags dbtn/module:github_kds_manager
   * @name list_releases
   * @summary List Releases
   * @request GET:/routes/list-releases
   */
  list_releases = (query: ListReleasesParams, params: RequestParams = {}) =>
    this.request<ListReleasesData, ListReleasesError>({
      path: `/routes/list-releases`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Delete a specific release. Useful for cleaning up test releases.
   *
   * @tags dbtn/module:github_kds_manager
   * @name delete_release
   * @summary Delete Release
   * @request DELETE:/routes/delete-release
   */
  delete_release = (query: DeleteReleaseParams, params: RequestParams = {}) =>
    this.request<DeleteReleaseData, DeleteReleaseError>({
      path: `/routes/delete-release`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Health check endpoint - verifies GitHub token and API connectivity.
   *
   * @tags dbtn/module:github_kds_manager
   * @name check_health
   * @summary Check Health
   * @request GET:/routes/kds-health
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthResult, any>({
      path: `/routes/kds-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add KDS-specific columns to pos_settings table - kds_pin_hash: Hashed 4-digit PIN - kds_auto_lock_minutes: Auto-lock timeout (default 30)
   *
   * @tags dbtn/module:kds_setup
   * @name setup_kds_schema
   * @summary Setup Kds Schema
   * @request POST:/routes/kds-setup/setup-schema
   */
  setup_kds_schema = (params: RequestParams = {}) =>
    this.request<SetupKdsSchemaData, any>({
      path: `/routes/kds-setup/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if KDS schema is set up and if PIN is configured
   *
   * @tags dbtn/module:kds_setup
   * @name check_kds_schema
   * @summary Check Kds Schema
   * @request GET:/routes/kds-setup/check-schema
   */
  check_kds_schema = (params: RequestParams = {}) =>
    this.request<CheckKdsSchemaData, any>({
      path: `/routes/kds-setup/check-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set or update KDS PIN (4-digit code)
   *
   * @tags dbtn/module:kds_setup
   * @name set_kds_pin
   * @summary Set Kds Pin
   * @request POST:/routes/kds-setup/set-pin
   */
  set_kds_pin = (data: SetPINRequest, params: RequestParams = {}) =>
    this.request<SetKdsPinData, SetKdsPinError>({
      path: `/routes/kds-setup/set-pin`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Verify KDS PIN
   *
   * @tags dbtn/module:kds_setup
   * @name verify_kds_pin
   * @summary Verify Kds Pin
   * @request POST:/routes/kds-setup/verify-pin
   */
  verify_kds_pin = (data: VerifyPINRequest, params: RequestParams = {}) =>
    this.request<VerifyKdsPinData, VerifyKdsPinError>({
      path: `/routes/kds-setup/verify-pin`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Look up a postcode to get coordinates
   *
   * @tags dbtn/module:delivery_schema
   * @name lookup_postcode_schema
   * @summary Lookup Postcode Schema
   * @request POST:/routes/lookup-postcode-schema
   */
  lookup_postcode_schema = (query: LookupPostcodeSchemaParams, params: RequestParams = {}) =>
    this.request<LookupPostcodeSchemaData, LookupPostcodeSchemaError>({
      path: `/routes/lookup-postcode-schema`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Calculate delivery eligibility, time and cost using unified restaurant_settings
   *
   * @tags dbtn/module:delivery_schema
   * @name calculate_delivery
   * @summary Calculate Delivery
   * @request POST:/routes/calculate-delivery
   */
  calculate_delivery = (query: CalculateDeliveryParams, params: RequestParams = {}) =>
    this.request<CalculateDeliveryData, CalculateDeliveryError>({
      path: `/routes/calculate-delivery`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Setup parent-child relationships for menu categories
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_menu_categories_parent_relationship
   * @summary Setup Menu Categories Parent Relationship
   * @request POST:/routes/unified-schema/menu/setup-categories-parent-relationship
   */
  setup_menu_categories_parent_relationship = (params: RequestParams = {}) =>
    this.request<SetupMenuCategoriesParentRelationshipData, any>({
      path: `/routes/unified-schema/menu/setup-categories-parent-relationship`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup item code system for menu items
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_menu_item_codes
   * @summary Setup Menu Item Codes
   * @request POST:/routes/unified-schema/menu/setup-item-codes
   */
  setup_menu_item_codes = (params: RequestParams = {}) =>
    this.request<SetupMenuItemCodesData, any>({
      path: `/routes/unified-schema/menu/setup-item-codes`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup food details for menu item variants
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_variants_food_details
   * @summary Setup Variants Food Details
   * @request POST:/routes/unified-schema/menu/setup-variants-food-details
   */
  setup_variants_food_details = (params: RequestParams = {}) =>
    this.request<SetupVariantsFoodDetailsData, any>({
      path: `/routes/unified-schema/menu/setup-variants-food-details`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup set meals schema
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_set_meals_schema
   * @summary Setup Set Meals Schema
   * @request POST:/routes/unified-schema/specialized/setup-set-meals
   */
  setup_set_meals_schema = (params: RequestParams = {}) =>
    this.request<SetupSetMealsSchemaData, any>({
      path: `/routes/unified-schema/specialized/setup-set-meals`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup special instructions columns
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_special_instructions_schema
   * @summary Setup Special Instructions Schema
   * @request POST:/routes/unified-schema/specialized/setup-special-instructions
   */
  setup_special_instructions_schema = (params: RequestParams = {}) =>
    this.request<SetupSpecialInstructionsSchemaData, any>({
      path: `/routes/unified-schema/specialized/setup-special-instructions`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup simple payment tracking schema
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_simple_payment_tracking
   * @summary Setup Simple Payment Tracking
   * @request POST:/routes/unified-schema/payment/setup-simple-payment-tracking
   */
  setup_simple_payment_tracking = (params: RequestParams = {}) =>
    this.request<SetupSimplePaymentTrackingData, any>({
      path: `/routes/unified-schema/payment/setup-simple-payment-tracking`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup delivery and logistics schema
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_delivery_schema
   * @summary Setup Delivery Schema
   * @request POST:/routes/unified-schema/operational/setup-delivery-schema
   */
  setup_delivery_schema = (params: RequestParams = {}) =>
    this.request<SetupDeliverySchemaData, any>({
      path: `/routes/unified-schema/operational/setup-delivery-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup kitchen display system schema
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_kitchen_display_schema
   * @summary Setup Kitchen Display Schema
   * @request POST:/routes/unified-schema/operational/setup-kitchen-display
   */
  setup_kitchen_display_schema = (params: RequestParams = {}) =>
    this.request<SetupKitchenDisplaySchemaData, any>({
      path: `/routes/unified-schema/operational/setup-kitchen-display`,
      method: "POST",
      ...params,
    });

  /**
   * @description Setup restaurant configuration schema
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_restaurant_schema
   * @summary Setup Restaurant Schema
   * @request POST:/routes/unified-schema/operational/setup-restaurant-schema
   */
  setup_restaurant_schema = (params: RequestParams = {}) =>
    this.request<SetupRestaurantSchemaData, any>({
      path: `/routes/unified-schema/operational/setup-restaurant-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Batch setup multiple schemas at once
   *
   * @tags dbtn/module:unified_schema_management
   * @name setup_all_schemas_batch
   * @summary Setup All Schemas Batch
   * @request POST:/routes/unified-schema/batch/setup-all-schemas
   */
  setup_all_schemas_batch = (data: BatchSchemaRequest, params: RequestParams = {}) =>
    this.request<SetupAllSchemasBatchData, SetupAllSchemasBatchError>({
      path: `/routes/unified-schema/batch/setup-all-schemas`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check status of all schema tables and columns
   *
   * @tags dbtn/module:unified_schema_management
   * @name check_all_schemas_status
   * @summary Check All Schemas Status
   * @request GET:/routes/unified-schema/status/check-all-schemas
   */
  check_all_schemas_status = (params: RequestParams = {}) =>
    this.request<CheckAllSchemasStatusData, any>({
      path: `/routes/unified-schema/status/check-all-schemas`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get overall schema health status
   *
   * @tags dbtn/module:unified_schema_management
   * @name get_schema_health
   * @summary Get Schema Health
   * @request GET:/routes/unified-schema/status/schema-health
   */
  get_schema_health = (params: RequestParams = {}) =>
    this.request<GetSchemaHealthData, any>({
      path: `/routes/unified-schema/status/schema-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get public restaurant information for voice agent (no auth required) This endpoint provides basic restaurant details that can be accessed by voice agents for voice agent responses. Returns real restaurant data in a voice-friendly format.
   *
   * @tags dbtn/module:public_restaurant_details
   * @name get_public_restaurant_info
   * @summary Get Public Restaurant Info
   * @request GET:/routes/public-restaurant-info
   */
  get_public_restaurant_info = (params: RequestParams = {}) =>
    this.request<GetPublicRestaurantInfoData, any>({
      path: `/routes/public-restaurant-info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get restaurant information as plain text for voice agent crawling Returns restaurant details in a narrative format that's optimized for voice agent responses and natural language processing.
   *
   * @tags dbtn/module:public_restaurant_details
   * @name get_public_restaurant_text
   * @summary Get Public Restaurant Text
   * @request GET:/routes/public-restaurant-text
   */
  get_public_restaurant_text = (params: RequestParams = {}) =>
    this.request<GetPublicRestaurantTextData, any>({
      path: `/routes/public-restaurant-text`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get restaurant data formatted specifically for voice agent responses Returns data in a format that's easy for voice agents to parse and use in natural conversation with customers.
   *
   * @tags dbtn/module:public_restaurant_details
   * @name get_voice_agent_data
   * @summary Get Voice Agent Data
   * @request GET:/routes/voice-agent-data
   */
  get_voice_agent_data = (params: RequestParams = {}) =>
    this.request<GetVoiceAgentDataData, any>({
      path: `/routes/voice-agent-data`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve restaurant details in format optimized for voice agent consumption This endpoint provides restaurant details in a natural language format that voice agents can access and index for voice responses. **PUBLIC ENDPOINT - NO AUTHENTICATION REQUIRED** Returns: JSON formatted restaurant details content for voice agent access
   *
   * @tags voice-agent, dbtn/module:restaurant_voice_agent_web
   * @name get_restaurant_details_for_voice_agent
   * @summary Get Restaurant Details For Voice Agent
   * @request GET:/routes/api/restaurant-details-for-voice-agent
   */
  get_restaurant_details_for_voice_agent = (params: RequestParams = {}) =>
    this.request<GetRestaurantDetailsForVoiceAgentData, any>({
      path: `/routes/api/restaurant-details-for-voice-agent`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get detailed status of AI voice agent system for dashboard
   *
   * @tags dbtn/module:voice_agent_status
   * @name get_voice_agent_status
   * @summary Get Voice Agent Status
   * @request GET:/routes/voice-agent-status
   */
  get_voice_agent_status = (params: RequestParams = {}) =>
    this.request<GetVoiceAgentStatusData, any>({
      path: `/routes/voice-agent-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Record a menu change event for real-time processing
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name record_menu_change
   * @summary Record Menu Change
   * @request POST:/routes/menu-change-event
   */
  record_menu_change = (data: MenuChangeEvent, params: RequestParams = {}) =>
    this.request<RecordMenuChangeData, RecordMenuChangeError>({
      path: `/routes/menu-change-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Manually trigger sync of all pending menu changes
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name sync_menu_changes_now
   * @summary Sync Menu Changes Now
   * @request POST:/routes/sync-now
   */
  sync_menu_changes_now = (query: SyncMenuChangesNowParams, params: RequestParams = {}) =>
    this.request<SyncMenuChangesNowData, SyncMenuChangesNowError>({
      path: `/routes/sync-now`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get current sync status and pending changes count
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name get_sync_status_endpoint
   * @summary Get Sync Status Endpoint
   * @request GET:/routes/sync-status
   */
  get_sync_status_endpoint = (params: RequestParams = {}) =>
    this.request<GetSyncStatusEndpointData, any>({
      path: `/routes/sync-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get auto-sync configuration
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name get_auto_sync_config_endpoint
   * @summary Get Auto Sync Config Endpoint
   * @request GET:/routes/auto-sync-config
   */
  get_auto_sync_config_endpoint = (params: RequestParams = {}) =>
    this.request<GetAutoSyncConfigEndpointData, any>({
      path: `/routes/auto-sync-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update auto-sync configuration
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name update_auto_sync_config
   * @summary Update Auto Sync Config
   * @request PUT:/routes/auto-sync-config
   */
  update_auto_sync_config = (data: AutoSyncConfig, params: RequestParams = {}) =>
    this.request<UpdateAutoSyncConfigData, UpdateAutoSyncConfigError>({
      path: `/routes/auto-sync-config`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of pending menu changes
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name get_pending_changes
   * @summary Get Pending Changes
   * @request GET:/routes/pending-changes
   */
  get_pending_changes = (params: RequestParams = {}) =>
    this.request<GetPendingChangesData, any>({
      path: `/routes/pending-changes`,
      method: "GET",
      ...params,
    });

  /**
   * @description Clear all pending changes (for testing/reset)
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name clear_all_pending_changes
   * @summary Clear All Pending Changes
   * @request DELETE:/routes/clear-pending-changes
   */
  clear_all_pending_changes = (params: RequestParams = {}) =>
    this.request<ClearAllPendingChangesData, any>({
      path: `/routes/clear-pending-changes`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Real-time menu sync health check
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name real_time_sync_health_check
   * @summary Real Time Sync Health Check
   * @request GET:/routes/sync-health
   */
  real_time_sync_health_check = (params: RequestParams = {}) =>
    this.request<RealTimeSyncHealthCheckData, any>({
      path: `/routes/sync-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get current sync status and pending changes count
   *
   * @tags dbtn/module:real_time_menu_sync
   * @name get_real_time_sync_status
   * @summary Get Real Time Sync Status
   * @request GET:/routes/real-time-sync-status
   */
  get_real_time_sync_status = (params: RequestParams = {}) =>
    this.request<GetRealTimeSyncStatusData, any>({
      path: `/routes/real-time-sync-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all agent profiles with passport card data for frontend selection Returns agent profiles from voice_agent_profiles table with all necessary fields for displaying passport cards and agent selection in the UI.
   *
   * @tags dbtn/module:agent_profiles_endpoint
   * @name get_agent_profiles_endpoint
   * @summary Get Agent Profiles Endpoint
   * @request GET:/routes/get-agent-profiles
   */
  get_agent_profiles_endpoint = (params: RequestParams = {}) =>
    this.request<GetAgentProfilesEndpointData, any>({
      path: `/routes/get-agent-profiles`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for agent profiles endpoint
   *
   * @tags dbtn/module:agent_profiles_endpoint
   * @name agent_profiles_health
   * @summary Agent Profiles Health
   * @request GET:/routes/agent-profiles-health
   */
  agent_profiles_health = (params: RequestParams = {}) =>
    this.request<AgentProfilesHealthData, any>({
      path: `/routes/agent-profiles-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all voice agent profiles
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name get_all_agents
   * @summary Get All Agents
   * @request GET:/routes/voice-agent-core/agents
   */
  get_all_agents = (params: RequestParams = {}) =>
    this.request<GetAllAgentsData, any>({
      path: `/routes/voice-agent-core/agents`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create new voice agent profile
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name create_agent
   * @summary Create Agent
   * @request POST:/routes/voice-agent-core/agents
   */
  create_agent = (data: AgentProfileInput, params: RequestParams = {}) =>
    this.request<CreateAgentData, CreateAgentError>({
      path: `/routes/voice-agent-core/agents`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get specific agent profile by ID
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name get_agent_by_id
   * @summary Get Agent By Id
   * @request GET:/routes/voice-agent-core/agents/{agent_id}
   */
  get_agent_by_id = ({ agentId, ...query }: GetAgentByIdParams, params: RequestParams = {}) =>
    this.request<GetAgentByIdData, GetAgentByIdError>({
      path: `/routes/voice-agent-core/agents/${agentId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update existing voice agent profile
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name update_agent
   * @summary Update Agent
   * @request PUT:/routes/voice-agent-core/agents/{agent_id}
   */
  update_agent = ({ agentId, ...query }: UpdateAgentParams, data: AgentProfileInput, params: RequestParams = {}) =>
    this.request<UpdateAgentData, UpdateAgentError>({
      path: `/routes/voice-agent-core/agents/${agentId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Select an agent for voice ordering
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name select_agent
   * @summary Select Agent
   * @request POST:/routes/voice-agent-core/select-agent
   */
  select_agent = (data: AgentSelection, params: RequestParams = {}) =>
    this.request<SelectAgentData, SelectAgentError>({
      path: `/routes/voice-agent-core/select-agent`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current master switch status
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name get_master_switch_status
   * @summary Get Master Switch Status
   * @request GET:/routes/voice-agent-core/master-switch
   */
  get_master_switch_status = (params: RequestParams = {}) =>
    this.request<GetMasterSwitchStatusData, any>({
      path: `/routes/voice-agent-core/master-switch`,
      method: "GET",
      ...params,
    });

  /**
   * @description Control the voice ordering master switch
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name set_master_switch
   * @summary Set Master Switch
   * @request POST:/routes/voice-agent-core/master-switch
   */
  set_master_switch = (data: MasterSwitchRequest, params: RequestParams = {}) =>
    this.request<SetMasterSwitchData, SetMasterSwitchError>({
      path: `/routes/voice-agent-core/master-switch`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for voice agent core API
   *
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name voice_agent_core_health
   * @summary Voice Agent Core Health
   * @request GET:/routes/voice-agent-core/health
   */
  voice_agent_core_health = (params: RequestParams = {}) =>
    this.request<VoiceAgentCoreHealthData, any>({
      path: `/routes/voice-agent-core/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve restaurant profile data in format optimized for voice agent crawling This endpoint provides restaurant profile data in a natural language format that voice agents can crawl and index for responses about the restaurant. Returns: HTML formatted restaurant profile content for web crawling
   *
   * @tags voice-agent, dbtn/module:restaurant_profile_voice_agent
   * @name get_restaurant_profile_for_voice_agent
   * @summary Get Restaurant Profile For Voice Agent
   * @request GET:/routes/api/restaurant-profile-for-voice-agent
   */
  get_restaurant_profile_for_voice_agent = (params: RequestParams = {}) =>
    this.request<GetRestaurantProfileForVoiceAgentData, any>({
      path: `/routes/api/restaurant-profile-for-voice-agent`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve restaurant profile data as plain text for voice agent crawling Alternative endpoint that returns pure text format for different crawling preferences.
   *
   * @tags voice-agent, dbtn/module:restaurant_profile_voice_agent
   * @name get_restaurant_profile_for_voice_agent_text
   * @summary Get Restaurant Profile For Voice Agent Text
   * @request GET:/routes/api/restaurant-profile-for-voice-agent/text
   */
  get_restaurant_profile_for_voice_agent_text = (params: RequestParams = {}) =>
    this.request<GetRestaurantProfileForVoiceAgentTextData, any>({
      path: `/routes/api/restaurant-profile-for-voice-agent/text`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve restaurant profile data as direct HTML for voice agent corpus crawling Returns HTML content directly (not wrapped in JSON) for better compatibility with voice agent web crawling.
   *
   * @tags voice-agent, dbtn/module:restaurant_profile_voice_agent
   * @name get_restaurant_profile_for_voice_agent_html
   * @summary Get Restaurant Profile For Voice Agent Html
   * @request GET:/routes/api/restaurant-profile-for-voice-agent/html
   */
  get_restaurant_profile_for_voice_agent_html = (params: RequestParams = {}) =>
    this.request<GetRestaurantProfileForVoiceAgentHtmlData, any>({
      path: `/routes/api/restaurant-profile-for-voice-agent/html`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the latest GitHub release information
   *
   * @tags dbtn/module:github_release_manager
   * @name check_latest_release
   * @summary Check Latest Release
   * @request GET:/routes/check-latest-release
   */
  check_latest_release = (params: RequestParams = {}) =>
    this.request<CheckLatestReleaseData, any>({
      path: `/routes/check-latest-release`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new v8.0.0 EPOS SDK GitHub release
   *
   * @tags dbtn/module:github_release_manager
   * @name create_v8_epos_sdk_release
   * @summary Create V8 Epos Sdk Release
   * @request POST:/routes/create-v8-epos-sdk-release
   */
  create_v8_epos_sdk_release = (params: RequestParams = {}) =>
    this.request<CreateV8EposSdkReleaseData, any>({
      path: `/routes/create-v8-epos-sdk-release`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get thermal printer status for Voice Staff Control Center
   *
   * @tags dbtn/module:github_release_manager
   * @name get_printer_status
   * @summary Get Printer Status
   * @request GET:/routes/printer-status
   */
  get_printer_status = (params: RequestParams = {}) =>
    this.request<GetPrinterStatusData, any>({
      path: `/routes/printer-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Show a menu item suggestion to the customer during voice conversation. This endpoint accepts parameters from multiple sources: - JSON body: {"menu_item_id": "...", "reason": "..."} - Query parameters: ?menu_item_id=... - Form data: menu_item_id=...
   *
   * @tags dbtn/module:show_menu_item
   * @name show_menu_item
   * @summary Show Menu Item
   * @request POST:/routes/show-menu-item
   */
  show_menu_item = (query: ShowMenuItemParams, params: RequestParams = {}) =>
    this.request<ShowMenuItemData, ShowMenuItemError>({
      path: `/routes/show-menu-item`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Health check endpoint for showMenuItem tool
   *
   * @tags dbtn/module:show_menu_item
   * @name show_menu_item_health
   * @summary Show Menu Item Health
   * @request GET:/routes/show-menu-item/health
   */
  show_menu_item_health = (params: RequestParams = {}) =>
    this.request<ShowMenuItemHealthData, any>({
      path: `/routes/show-menu-item/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get menu data formatted as structured text for optimal RAG ingestion by voice AI agents. Returns plain text instead of JSON for better crawling and indexing. Only shows published menu items (published_at IS NOT NULL).
   *
   * @tags dbtn/module:menu_text_rag
   * @name get_menu_text_for_rag
   * @summary Get Menu Text For Rag
   * @request GET:/routes/public/menu-text
   */
  get_menu_text_for_rag = (params: RequestParams = {}) =>
    this.request<GetMenuTextForRagData, any>({
      path: `/routes/public/menu-text`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get restaurant information formatted as structured text for RAG ingestion. Includes opening hours, contact details, and general information.
   *
   * @tags dbtn/module:menu_text_rag
   * @name get_restaurant_info_text_for_rag
   * @summary Get Restaurant Info Text For Rag
   * @request GET:/routes/public/restaurant-info-text
   */
  get_restaurant_info_text_for_rag = (params: RequestParams = {}) =>
    this.request<GetRestaurantInfoTextForRagData, any>({
      path: `/routes/public/restaurant-info-text`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test endpoint to verify cross-page synchronization of AI voice settings. This simulates changes to ai_voice_settings and triggers real-time updates.
   *
   * @tags dbtn/module:test_ai_sync
   * @name test_ai_settings_sync
   * @summary Test Ai Settings Sync
   * @request POST:/routes/test-ai-settings-sync
   */
  test_ai_settings_sync = (data: TestAISettingsRequest, params: RequestParams = {}) =>
    this.request<TestAiSettingsSyncData, TestAiSettingsSyncError>({
      path: `/routes/test-ai-settings-sync`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current AI voice settings status for testing.
   *
   * @tags dbtn/module:test_ai_sync
   * @name get_ai_settings_status
   * @summary Get Ai Settings Status
   * @request GET:/routes/get-ai-settings-status
   */
  get_ai_settings_status = (params: RequestParams = {}) =>
    this.request<GetAiSettingsStatusData, any>({
      path: `/routes/get-ai-settings-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Quick toggle for AI assistant enabled/disabled state to test real-time sync. Uses unified_agent_config for agent selection.
   *
   * @tags dbtn/module:test_ai_sync
   * @name toggle_ai_assistant
   * @summary Toggle Ai Assistant
   * @request POST:/routes/toggle-ai-assistant
   */
  toggle_ai_assistant = (params: RequestParams = {}) =>
    this.request<ToggleAiAssistantData, any>({
      path: `/routes/toggle-ai-assistant`,
      method: "POST",
      ...params,
    });

  /**
   * @description Update order status with tracking and validation
   *
   * @tags dbtn/module:order_tracking
   * @name update_order_tracking_status
   * @summary Update Order Tracking Status
   * @request POST:/routes/order-tracking/update-status
   */
  update_order_tracking_status = (data: OrderTrackingUpdate, params: RequestParams = {}) =>
    this.request<UpdateOrderTrackingStatusData, UpdateOrderTrackingStatusError>({
      path: `/routes/order-tracking/update-status`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get detailed order tracking information
   *
   * @tags dbtn/module:order_tracking
   * @name get_order_tracking_details
   * @summary Get Order Tracking Details
   * @request GET:/routes/order-tracking/order/{order_id}
   */
  get_order_tracking_details = ({ orderId, ...query }: GetOrderTrackingDetailsParams, params: RequestParams = {}) =>
    this.request<GetOrderTrackingDetailsData, GetOrderTrackingDetailsError>({
      path: `/routes/order-tracking/order/${orderId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Bulk update multiple order statuses
   *
   * @tags dbtn/module:order_tracking
   * @name bulk_update_order_tracking
   * @summary Bulk Update Order Tracking
   * @request POST:/routes/order-tracking/bulk-update
   */
  bulk_update_order_tracking = (data: BulkTrackingUpdate, params: RequestParams = {}) =>
    this.request<BulkUpdateOrderTrackingData, BulkUpdateOrderTrackingError>({
      path: `/routes/order-tracking/bulk-update`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get available order statuses and progression rules
   *
   * @tags dbtn/module:order_tracking
   * @name get_status_options
   * @summary Get Status Options
   * @request GET:/routes/order-tracking/status-options
   */
  get_status_options = (params: RequestParams = {}) =>
    this.request<GetStatusOptionsData, any>({
      path: `/routes/order-tracking/status-options`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all orders with a specific status
   *
   * @tags dbtn/module:order_tracking
   * @name get_orders_by_status
   * @summary Get Orders By Status
   * @request GET:/routes/order-tracking/orders-by-status/{status}
   */
  get_orders_by_status = ({ status, ...query }: GetOrdersByStatusParams, params: RequestParams = {}) =>
    this.request<GetOrdersByStatusData, GetOrdersByStatusError>({
      path: `/routes/order-tracking/orders-by-status/${status}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Set up the order tracking database schema
   *
   * @tags dbtn/module:order_tracking_setup
   * @name setup_order_tracking_schema
   * @summary Setup Order Tracking Schema
   * @request POST:/routes/order-tracking-setup/setup-schema
   */
  setup_order_tracking_schema = (params: RequestParams = {}) =>
    this.request<SetupOrderTrackingSchemaData, any>({
      path: `/routes/order-tracking-setup/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if order tracking schema is properly set up
   *
   * @tags dbtn/module:order_tracking_setup
   * @name check_order_tracking_schema
   * @summary Check Order Tracking Schema
   * @request GET:/routes/order-tracking-setup/check-schema
   */
  check_order_tracking_schema = (params: RequestParams = {}) =>
    this.request<CheckOrderTrackingSchemaData, any>({
      path: `/routes/order-tracking-setup/check-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all tables in the public schema
   *
   * @tags dbtn/module:database_audit
   * @name list_all_tables
   * @summary List All Tables
   * @request GET:/routes/database-audit/list-tables
   */
  list_all_tables = (params: RequestParams = {}) =>
    this.request<ListAllTablesData, any>({
      path: `/routes/database-audit/list-tables`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate comprehensive database audit report. Analyzes all tables in the public schema and categorizes them by: - Code usage (references in backend/frontend) - Data content (row counts) - Relationships (foreign keys) - Safety for cleanup (risk levels) Returns detailed report with recommendations for each table.
   *
   * @tags dbtn/module:database_audit
   * @name generate_audit_report
   * @summary Generate Audit Report
   * @request POST:/routes/database-audit/generate-report
   */
  generate_audit_report = (params: RequestParams = {}) =>
    this.request<GenerateAuditReportData, any>({
      path: `/routes/database-audit/generate-report`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create the ai_knowledge_corpus table with proper schema Creates: - ai_knowledge_corpus table - Indexes for performance - RLS policies - Auto-versioning trigger
   *
   * @tags dbtn/module:ai_knowledge_service
   * @name setup_corpus_schema
   * @summary Setup Corpus Schema
   * @request POST:/routes/ai-knowledge/setup-schema
   */
  setup_corpus_schema = (params: RequestParams = {}) =>
    this.request<SetupCorpusSchemaData, any>({
      path: `/routes/ai-knowledge/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Publish a new version of a corpus This creates a new corpus version and automatically: 1. Auto-increments the version number 2. Deactivates the previous active version 3. Activates the new version Args: request: Corpus data to publish Returns: CorpusResponse with the new corpus ID and version
   *
   * @tags dbtn/module:ai_knowledge_service
   * @name publish_corpus
   * @summary Publish Corpus
   * @request POST:/routes/ai-knowledge/publish-corpus
   */
  publish_corpus = (data: PublishCorpusRequest, params: RequestParams = {}) =>
    this.request<PublishCorpusData, PublishCorpusError>({
      path: `/routes/ai-knowledge/publish-corpus`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the currently active corpus for a given type Args: corpus_type: Type of corpus to retrieve Returns: ActiveCorpusResponse with full corpus data
   *
   * @tags dbtn/module:ai_knowledge_service
   * @name get_active_corpus
   * @summary Get Active Corpus
   * @request GET:/routes/ai-knowledge/get-active-corpus/{corpus_type}
   */
  get_active_corpus = ({ corpusType, ...query }: GetActiveCorpusParams, params: RequestParams = {}) =>
    this.request<GetActiveCorpusData, GetActiveCorpusError>({
      path: `/routes/ai-knowledge/get-active-corpus/${corpusType}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all versions of a corpus type Args: corpus_type: Type of corpus to get versions for Returns: List of all corpus versions with metadata
   *
   * @tags dbtn/module:ai_knowledge_service
   * @name get_corpus_versions
   * @summary Get Corpus Versions
   * @request GET:/routes/ai-knowledge/corpus-versions/{corpus_type}
   */
  get_corpus_versions = ({ corpusType, ...query }: GetCorpusVersionsParams, params: RequestParams = {}) =>
    this.request<GetCorpusVersionsData, GetCorpusVersionsError>({
      path: `/routes/ai-knowledge/corpus-versions/${corpusType}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Activate a specific corpus version (rollback capability) This deactivates the current active version and activates the specified version. Args: corpus_id: UUID of the corpus version to activate Returns: CorpusResponse with activation status
   *
   * @tags dbtn/module:ai_knowledge_service
   * @name activate_corpus_version
   * @summary Activate Corpus Version
   * @request POST:/routes/ai-knowledge/activate-version/{corpus_id}
   */
  activate_corpus_version = ({ corpusId, ...query }: ActivateCorpusVersionParams, params: RequestParams = {}) =>
    this.request<ActivateCorpusVersionData, ActivateCorpusVersionError>({
      path: `/routes/ai-knowledge/activate-version/${corpusId}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check health status of all corpus types Returns: Health status for each corpus type including active version info
   *
   * @tags dbtn/module:ai_knowledge_service
   * @name check_corpus_health
   * @summary Check Corpus Health
   * @request GET:/routes/ai-knowledge/corpus-health
   */
  check_corpus_health = (params: RequestParams = {}) =>
    this.request<CheckCorpusHealthData, any>({
      path: `/routes/ai-knowledge/corpus-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get delivery configuration from restaurant settings (applies to delivery mode only)
   *
   * @tags dbtn/module:delivery_config
   * @name get_delivery_config
   * @summary Get Delivery Config
   * @request GET:/routes/delivery-config/config
   */
  get_delivery_config = (params: RequestParams = {}) =>
    this.request<GetDeliveryConfigData, any>({
      path: `/routes/delivery-config/config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get restaurant configuration for checkout and order processing
   *
   * @tags dbtn/module:restaurant_config
   * @name get_restaurant_config
   * @summary Get Restaurant Config
   * @request GET:/routes/config
   */
  get_restaurant_config = (params: RequestParams = {}) =>
    this.request<GetRestaurantConfigData, any>({
      path: `/routes/config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate production-ready order number with daily auto-reset sequence. Uses 5 separate counters for each order type combination. Format: - Online Collection: OC-001 - Online Delivery: OD-002 - POS Collection: PC-003 - POS Delivery: PD-004 - POS Dine-In: DI-005 Features: - Atomic sequence increment (race-condition safe) - Auto-reset to 001 at midnight for ALL counters - Thread-safe for concurrent orders - Separate sequences per order type
   *
   * @tags dbtn/module:order_sequence
   * @name generate_order_number
   * @summary Generate Order Number
   * @request POST:/routes/order-sequence/generate
   */
  generate_order_number = (data: GenerateOrderNumberRequest, params: RequestParams = {}) =>
    this.request<GenerateOrderNumberData, GenerateOrderNumberError>({
      path: `/routes/order-sequence/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current sequence status for diagnostics. Returns all 5 counter values, last reset date, and preview of next IDs.
   *
   * @tags dbtn/module:order_sequence
   * @name get_sequence_status
   * @summary Get Sequence Status
   * @request GET:/routes/order-sequence/status
   */
  get_sequence_status = (params: RequestParams = {}) =>
    this.request<GetSequenceStatusData, any>({
      path: `/routes/order-sequence/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sync order sequence counters with actual max order numbers in database. This endpoint fixes counter drift by: 1. Querying max order number for each prefix (OC, OD, PC, PD, DI) 2. Extracting sequence number from order_number 3. Updating counters to match database reality Use this to: - Fix duplicate order number errors - Recover from counter resets - Initialize counters after migration Returns: dict: Sync results with before/after values for each counter
   *
   * @tags dbtn/module:order_sequence
   * @name sync_counters_with_database
   * @summary Sync Counters With Database
   * @request POST:/routes/order-sequence/sync-counters
   */
  sync_counters_with_database = (params: RequestParams = {}) =>
    this.request<SyncCountersWithDatabaseData, any>({
      path: `/routes/order-sequence/sync-counters`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create the table_orders table and required indexes
   *
   * @tags dbtn/module:table_orders
   * @name setup_table_orders_schema
   * @summary Setup Table Orders Schema
   * @request POST:/routes/table-orders/setup-schema
   */
  setup_table_orders_schema = (params: RequestParams = {}) =>
    this.request<SetupTableOrdersSchemaData, any>({
      path: `/routes/table-orders/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if table_orders schema exists
   *
   * @tags dbtn/module:table_orders
   * @name check_table_orders_schema
   * @summary Check Table Orders Schema
   * @request GET:/routes/table-orders/check-schema
   */
  check_table_orders_schema = (params: RequestParams = {}) =>
    this.request<CheckTableOrdersSchemaData, any>({
      path: `/routes/table-orders/check-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new table order (seat guests at table)
   *
   * @tags dbtn/module:table_orders
   * @name create_table_order
   * @summary Create Table Order
   * @request POST:/routes/table-orders/create
   */
  create_table_order = (data: CreateTableOrderRequest, params: RequestParams = {}) =>
    this.request<CreateTableOrderData, CreateTableOrderError>({
      path: `/routes/table-orders/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all active table orders
   *
   * @tags dbtn/module:table_orders
   * @name list_table_orders
   * @summary List Table Orders
   * @request GET:/routes/table-orders/list
   */
  list_table_orders = (params: RequestParams = {}) =>
    this.request<ListTableOrdersData, any>({
      path: `/routes/table-orders/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get order for specific table
   *
   * @tags dbtn/module:table_orders
   * @name get_table_order
   * @summary Get Table Order
   * @request GET:/routes/table-orders/table/{table_number}
   */
  get_table_order = ({ tableNumber, ...query }: GetTableOrderParams, params: RequestParams = {}) =>
    this.request<GetTableOrderData, GetTableOrderError>({
      path: `/routes/table-orders/table/${tableNumber}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update table order items and status
   *
   * @tags dbtn/module:table_orders
   * @name update_table_order
   * @summary Update Table Order
   * @request PUT:/routes/table-orders/table/{table_number}
   */
  update_table_order = (
    { tableNumber, ...query }: UpdateTableOrderParams,
    data: UpdateTableOrderRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateTableOrderData, UpdateTableOrderError>({
      path: `/routes/table-orders/table/${tableNumber}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Complete table order (final bill paid, table becomes available)
   *
   * @tags dbtn/module:table_orders
   * @name complete_table_order
   * @summary Complete Table Order
   * @request DELETE:/routes/table-orders/table/{table_number}
   */
  complete_table_order = ({ tableNumber, ...query }: CompleteTableOrderParams, params: RequestParams = {}) =>
    this.request<CompleteTableOrderData, CompleteTableOrderError>({
      path: `/routes/table-orders/table/${tableNumber}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Add new items to existing table order
   *
   * @tags dbtn/module:table_orders
   * @name add_items_to_table
   * @summary Add Items To Table
   * @request POST:/routes/table-orders/add-items/{table_number}
   */
  add_items_to_table = (
    { tableNumber, ...query }: AddItemsToTableParams,
    data: AddItemsToTablePayload,
    params: RequestParams = {},
  ) =>
    this.request<AddItemsToTableData, AddItemsToTableError>({
      path: `/routes/table-orders/add-items/${tableNumber}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Programmatically drop old tables and create new POS table schema without UI interaction
   *
   * @tags dbtn/module:pos_tables
   * @name migrate_tables_now
   * @summary Migrate Tables Now
   * @request POST:/routes/pos-tables/migrate-tables-now
   */
  migrate_tables_now = (params: RequestParams = {}) =>
    this.request<MigrateTablesNowData, any>({
      path: `/routes/pos-tables/migrate-tables-now`,
      method: "POST",
      ...params,
    });

  /**
   * @description Directly initialize the tables using pure REST API calls to Supabase This function creates tables using multiple fallback approaches: 1. First tries to create tables with the PostgreSQL API directly 2. Then falls back to direct Data API table creation if needed 3. Finally verifies table creation with direct API checks This bypasses the need for SQL functions like execute_sql which may not be available
   *
   * @tags dbtn/module:pos_tables
   * @name direct_initialize_tables
   * @summary Direct Initialize Tables
   * @request POST:/routes/pos-tables/direct-init
   */
  direct_initialize_tables = (params: RequestParams = {}) =>
    this.request<DirectInitializeTablesData, any>({
      path: `/routes/pos-tables/direct-init`,
      method: "POST",
      ...params,
    });

  /**
   * @description Drop legacy table management tables - no longer needed
   *
   * @tags dbtn/module:pos_tables
   * @name drop_old_tables
   * @summary Drop Old Tables
   * @request POST:/routes/pos-tables/drop-old-tables
   */
  drop_old_tables = (params: RequestParams = {}) =>
    this.request<DropOldTablesData, any>({
      path: `/routes/pos-tables/drop-old-tables`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if the POS tables schema exists in the database This function will try multiple methods to reliably detect if the tables exist: 1. First with standard SQL information_schema queries 2. Then with direct REST API calls to the tables 3. Finally checking for cached verification status This approach ensures even if SQL functions fail, we can still detect tables
   *
   * @tags dbtn/module:pos_tables
   * @name check_pos_tables_schema
   * @summary Check Pos Tables Schema
   * @request GET:/routes/pos-tables/check-schema
   */
  check_pos_tables_schema = (params: RequestParams = {}) =>
    this.request<CheckPosTablesSchemaData, any>({
      path: `/routes/pos-tables/check-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set up the POS tables schema This creates the pos_tables and pos_tables_config tables in the database.
   *
   * @tags dbtn/module:pos_tables
   * @name setup_pos_tables_schema
   * @summary Setup Pos Tables Schema
   * @request POST:/routes/pos-tables/setup-schema
   */
  setup_pos_tables_schema = (params: RequestParams = {}) =>
    this.request<SetupPosTablesSchemaData, any>({
      path: `/routes/pos-tables/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get table configuration using REST API
   *
   * @tags dbtn/module:pos_tables
   * @name get_tables_config
   * @summary Get Tables Config
   * @request GET:/routes/pos-tables/config
   */
  get_tables_config = (params: RequestParams = {}) =>
    this.request<GetTablesConfigData, any>({
      path: `/routes/pos-tables/config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update table configuration using REST API
   *
   * @tags dbtn/module:pos_tables
   * @name save_tables_config
   * @summary Save Tables Config
   * @request POST:/routes/pos-tables/save-config
   */
  save_tables_config = (data: PosTableConfig, params: RequestParams = {}) =>
    this.request<SaveTablesConfigData, SaveTablesConfigError>({
      path: `/routes/pos-tables/save-config`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a new table using REST API
   *
   * @tags dbtn/module:pos_tables
   * @name create_pos_table
   * @summary Create Pos Table
   * @request POST:/routes/pos-tables/create-table
   */
  create_pos_table = (data: CreateTableRequest, params: RequestParams = {}) =>
    this.request<CreatePosTableData, CreatePosTableError>({
      path: `/routes/pos-tables/create-table`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update a POS table using REST API
   *
   * @tags dbtn/module:pos_tables
   * @name update_pos_table
   * @summary Update Pos Table
   * @request PUT:/routes/pos-tables/update-table/{table_number}
   */
  update_pos_table = (
    { tableNumber, ...query }: UpdatePosTableParams,
    data: UpdateTableRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdatePosTableData, UpdatePosTableError>({
      path: `/routes/pos-tables/update-table/${tableNumber}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a POS table using REST API
   *
   * @tags dbtn/module:pos_tables
   * @name delete_pos_table
   * @summary Delete Pos Table
   * @request DELETE:/routes/pos-tables/delete-table/{table_number}
   */
  delete_pos_table = ({ tableNumber, ...query }: DeletePosTableParams, params: RequestParams = {}) =>
    this.request<DeletePosTableData, DeletePosTableError>({
      path: `/routes/pos-tables/delete-table/${tableNumber}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update a POS table's status using REST API
   *
   * @tags dbtn/module:pos_tables
   * @name update_pos_table_status
   * @summary Update Pos Table Status
   * @request PUT:/routes/pos-tables/update-table-status/{table_number}
   */
  update_pos_table_status = ({ tableNumber, ...query }: UpdatePosTableStatusParams, params: RequestParams = {}) =>
    this.request<UpdatePosTableStatusData, UpdatePosTableStatusError>({
      path: `/routes/pos-tables/update-table-status/${tableNumber}`,
      method: "PUT",
      query: query,
      ...params,
    });

  /**
   * @description Get all POS tables with operational status from table_orders
   *
   * @tags dbtn/module:pos_tables
   * @name get_tables
   * @summary Get Tables
   * @request GET:/routes/pos-tables/tables
   */
  get_tables = (params: RequestParams = {}) =>
    this.request<GetTablesData, any>({
      path: `/routes/pos-tables/tables`,
      method: "GET",
      ...params,
    });

  /**
   * @description Run full diagnostics on the POS tables system
   *
   * @tags dbtn/module:pos_tables
   * @name run_table_diagnostics
   * @summary Run Table Diagnostics
   * @request GET:/routes/pos-tables/diagnostics
   */
  run_table_diagnostics = (params: RequestParams = {}) =>
    this.request<RunTableDiagnosticsData, any>({
      path: `/routes/pos-tables/diagnostics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Optimize and resize images for faster loading. Returns optimized image with proper Content-Type headers. Caches resized images in db.storage for subsequent requests. Examples: - /optimized-image?url=https://example.com/image.jpg&w=400&h=400&format=webp - /optimized-image?url=https://example.com/image.jpg&w=80&h=80&format=jpeg&quality=90
   *
   * @tags dbtn/module:media_optimization
   * @name get_optimized_image
   * @summary Get Optimized Image
   * @request GET:/routes/optimized-image
   */
  get_optimized_image = (query: GetOptimizedImageParams, params: RequestParams = {}) =>
    this.request<GetOptimizedImageData, GetOptimizedImageError>({
      path: `/routes/optimized-image`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Clear cached optimized images matching a pattern. Admin endpoint for cache management.
   *
   * @tags dbtn/module:media_optimization
   * @name clear_image_cache
   * @summary Clear Image Cache
   * @request GET:/routes/clear-cache
   */
  clear_image_cache = (query: ClearImageCacheParams, params: RequestParams = {}) =>
    this.request<ClearImageCacheData, ClearImageCacheError>({
      path: `/routes/clear-cache`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create the optimized PostgreSQL function for menu queries. This function reduces 5 separate queries to 1 optimized query with joins.
   *
   * @tags dbtn/module:menu_optimization
   * @name create_optimized_function
   * @summary Create Optimized Function
   * @request POST:/routes/create-optimized-function
   */
  create_optimized_function = (params: RequestParams = {}) =>
    this.request<CreateOptimizedFunctionData, any>({
      path: `/routes/create-optimized-function`,
      method: "POST",
      ...params,
    });

  /**
   * @description Drop the optimized PostgreSQL function (for testing/rollback).
   *
   * @tags dbtn/module:menu_optimization
   * @name drop_optimized_function
   * @summary Drop Optimized Function
   * @request POST:/routes/drop-optimized-function
   */
  drop_optimized_function = (params: RequestParams = {}) =>
    this.request<DropOptimizedFunctionData, any>({
      path: `/routes/drop-optimized-function`,
      method: "POST",
      ...params,
    });

  /**
   * @description Invalidate the menu cache. Call this endpoint after updating menu items, categories, or variants to ensure users see fresh data.
   *
   * @tags dbtn/module:menu_optimization
   * @name invalidate_menu_cache
   * @summary Invalidate Menu Cache
   * @request POST:/routes/invalidate-cache
   */
  invalidate_menu_cache = (query: InvalidateMenuCacheParams, params: RequestParams = {}) =>
    this.request<InvalidateMenuCacheData, InvalidateMenuCacheError>({
      path: `/routes/invalidate-cache`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get cache statistics (hit ratio, expiration, etc.).
   *
   * @tags dbtn/module:menu_optimization
   * @name get_menu_cache_stats
   * @summary Get Menu Cache Stats
   * @request GET:/routes/cache-stats
   */
  get_menu_cache_stats = (params: RequestParams = {}) =>
    this.request<GetMenuCacheStatsData, any>({
      path: `/routes/cache-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get menu using optimized function with caching. This is the production-ready endpoint that combines: - Database function (reduces 5 queries to 1) - Application cache (TTL: 5 minutes) - Connection pooling (singleton client) Args: skip_cache: If True, bypass cache and query database directly
   *
   * @tags dbtn/module:menu_optimization
   * @name get_optimized_menu
   * @summary Get Optimized Menu
   * @request GET:/routes/get-optimized-menu
   */
  get_optimized_menu = (query: GetOptimizedMenuParams, params: RequestParams = {}) =>
    this.request<GetOptimizedMenuData, GetOptimizedMenuError>({
      path: `/routes/get-optimized-menu`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Test the optimized PostgreSQL function and measure performance.
   *
   * @tags dbtn/module:menu_optimization
   * @name test_optimized_function
   * @summary Test Optimized Function
   * @request GET:/routes/test-optimized-function
   */
  test_optimized_function = (params: RequestParams = {}) =>
    this.request<TestOptimizedFunctionData, any>({
      path: `/routes/test-optimized-function`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get printer service specification
   *
   * @tags dbtn/module:printer_service_manager
   * @name get_specification
   * @summary Get Specification
   * @request GET:/routes/printer-service/specification
   */
  get_specification = (params: RequestParams = {}) =>
    this.request<GetSpecificationData, any>({
      path: `/routes/printer-service/specification`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get complete printer service specification with all details
   *
   * @tags dbtn/module:printer_service_manager
   * @name get_full_specification
   * @summary Get Full Specification
   * @request GET:/routes/printer-service/specification/full
   */
  get_full_specification = (params: RequestParams = {}) =>
    this.request<GetFullSpecificationData, any>({
      path: `/routes/printer-service/specification/full`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate PowerShell installation script for NSSM service
   *
   * @tags dbtn/module:printer_service_manager
   * @name get_powershell_install_script
   * @summary Get Powershell Install Script
   * @request GET:/routes/printer-service/install-script/powershell
   */
  get_powershell_install_script = (params: RequestParams = {}) =>
    this.request<GetPowershellInstallScriptData, any>({
      path: `/routes/printer-service/install-script/powershell`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate PowerShell uninstallation script for NSSM service
   *
   * @tags dbtn/module:printer_service_manager
   * @name get_powershell_uninstall_script
   * @summary Get Powershell Uninstall Script
   * @request GET:/routes/printer-service/install-script/uninstall
   */
  get_powershell_uninstall_script = (params: RequestParams = {}) =>
    this.request<GetPowershellUninstallScriptData, any>({
      path: `/routes/printer-service/install-script/uninstall`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if printer service is running and accessible
   *
   * @tags dbtn/module:printer_service_manager
   * @name check_service_health
   * @summary Check Service Health
   * @request GET:/routes/printer-service/health
   */
  check_service_health = (params: RequestParams = {}) =>
    this.request<CheckServiceHealthData, any>({
      path: `/routes/printer-service/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get complete printer service specification. Returns: Service specification with all configuration details
   *
   * @tags dbtn/module:printer_service_installer
   * @name get_service_specification
   * @summary Get Service Specification
   * @request GET:/routes/printer-service/spec
   */
  get_service_specification = (params: RequestParams = {}) =>
    this.request<GetServiceSpecificationData, any>({
      path: `/routes/printer-service/spec`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get source code for a specific file. Args: filename: Name of the source file (e.g., 'server.js', 'package.json') Returns: File content and description Raises: HTTPException: If file not found
   *
   * @tags dbtn/module:printer_service_installer
   * @name get_source_file
   * @summary Get Source File
   * @request GET:/routes/printer-service/source/{filename}
   */
  get_source_file = ({ filename, ...query }: GetSourceFileParams, params: RequestParams = {}) =>
    this.request<GetSourceFileData, GetSourceFileError>({
      path: `/routes/printer-service/source/${filename}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get complete installation bundle metadata. Returns: Bundle information with all files and instructions
   *
   * @tags dbtn/module:printer_service_installer
   * @name get_installation_bundle
   * @summary Get Installation Bundle
   * @request GET:/routes/printer-service/bundle
   */
  get_installation_bundle = (params: RequestParams = {}) =>
    this.request<GetInstallationBundleData, any>({
      path: `/routes/printer-service/bundle`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get sample health check response for testing. Returns: Sample health check response
   *
   * @tags dbtn/module:printer_service_installer
   * @name get_health_check_template
   * @summary Get Health Check Template
   * @request GET:/routes/printer-service/health-check-template
   */
  get_health_check_template = (params: RequestParams = {}) =>
    this.request<GetHealthCheckTemplateData, any>({
      path: `/routes/printer-service/health-check-template`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get sample print request payloads for testing. Returns: Sample kitchen and customer print requests
   *
   * @tags dbtn/module:printer_service_installer
   * @name get_print_request_templates
   * @summary Get Print Request Templates
   * @request GET:/routes/printer-service/print-request-templates
   */
  get_print_request_templates = (params: RequestParams = {}) =>
    this.request<GetPrintRequestTemplatesData, any>({
      path: `/routes/printer-service/print-request-templates`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get metadata about the printer service package.
   *
   * @tags dbtn/module:printer_service_package
   * @name get_package_info
   * @summary Get Package Info
   * @request GET:/routes/package-info
   */
  get_package_info = (params: RequestParams = {}) =>
    this.request<GetPackageInfoData, any>({
      path: `/routes/package-info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate and download the complete Printer Service package as a zip file.
   *
   * @tags stream, dbtn/module:printer_service_package
   * @name download_printer_service_package
   * @summary Download Printer Service Package
   * @request GET:/routes/download
   */
  download_printer_service_package = (params: RequestParams = {}) =>
    this.requestStream<DownloadPrinterServicePackageData, any>({
      path: `/routes/download`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sync all installer files to cottage-pos-desktop GitHub repository. Pushes: - installer/cottage-tandoori-setup.nsi - installer/build.bat - installer/LICENSE.txt - installer/README.md - .gitignore (updated with installer outputs) Returns: InstallerSyncResponse with sync results
   *
   * @tags dbtn/module:installer_sync
   * @name sync_installer_files
   * @summary Sync Installer Files
   * @request POST:/routes/sync-installer-files
   */
  sync_installer_files = (params: RequestParams = {}) =>
    this.request<SyncInstallerFilesData, any>({
      path: `/routes/sync-installer-files`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get status of installer files in the library. Returns: Dict with file count and file list
   *
   * @tags dbtn/module:installer_sync
   * @name get_installer_files_status
   * @summary Get Installer Files Status
   * @request GET:/routes/installer-files-status
   */
  get_installer_files_status = (params: RequestParams = {}) =>
    this.request<GetInstallerFilesStatusData, any>({
      path: `/routes/installer-files-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description List recent workflow runs for the combined installer workflow.
   *
   * @tags dbtn/module:github_workflow_logs
   * @name list_workflow_runs
   * @summary List Workflow Runs
   * @request GET:/routes/list-workflow-runs
   */
  list_workflow_runs = (query: ListWorkflowRunsParams, params: RequestParams = {}) =>
    this.request<ListWorkflowRunsData, ListWorkflowRunsError>({
      path: `/routes/list-workflow-runs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get jobs for a specific workflow run.
   *
   * @tags dbtn/module:github_workflow_logs
   * @name get_workflow_run_jobs
   * @summary Get Workflow Run Jobs
   * @request GET:/routes/get-workflow-run-jobs
   */
  get_workflow_run_jobs = (query: GetWorkflowRunJobsParams, params: RequestParams = {}) =>
    this.request<GetWorkflowRunJobsData, GetWorkflowRunJobsError>({
      path: `/routes/get-workflow-run-jobs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get logs for a specific job. Returns the raw log text from GitHub Actions.
   *
   * @tags dbtn/module:github_workflow_logs
   * @name get_job_logs
   * @summary Get Job Logs
   * @request GET:/routes/get-job-logs
   */
  get_job_logs = (query: GetJobLogsParams, params: RequestParams = {}) =>
    this.request<GetJobLogsData, GetJobLogsError>({
      path: `/routes/get-job-logs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get logs from the most recent failed workflow run. This is a convenience endpoint that: 1. Finds the latest failed run 2. Gets its jobs 3. Returns logs from the failed job
   *
   * @tags dbtn/module:github_workflow_logs
   * @name get_latest_failed_run_logs
   * @summary Get Latest Failed Run Logs
   * @request GET:/routes/get-latest-failed-run-logs
   */
  get_latest_failed_run_logs = (query: GetLatestFailedRunLogsParams, params: RequestParams = {}) =>
    this.request<GetLatestFailedRunLogsData, GetLatestFailedRunLogsError>({
      path: `/routes/get-latest-failed-run-logs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Fetch the latest POS Desktop release from GitHub. Returns: ReleaseInfo with version, download URL, and metadata Raises: HTTPException: If GitHub API fails or no releases found
   *
   * @tags dbtn/module:pos_release
   * @name get_latest_pos_release
   * @summary Get Latest Pos Release
   * @request GET:/routes/pos-release/latest
   */
  get_latest_pos_release = (params: RequestParams = {}) =>
    this.request<GetLatestPosReleaseData, any>({
      path: `/routes/pos-release/latest`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get total count of registered customers for social proof display. Uses Supabase customers table to get accurate count.
   *
   * @tags dbtn/module:customer_stats
   * @name get_customer_count
   * @summary Get Customer Count
   * @request GET:/routes/customer-count
   */
  get_customer_count = (params: RequestParams = {}) =>
    this.request<GetCustomerCountData, any>({
      path: `/routes/customer-count`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if a user's email is verified in Supabase Auth. Args: user_id: The Supabase auth user ID Returns: EmailVerificationStatusResponse with verification status
   *
   * @tags dbtn/module:email_verification
   * @name get_email_verification_status
   * @summary Get Email Verification Status
   * @request GET:/routes/email-verification-status/{user_id}
   */
  get_email_verification_status = (
    { userId, ...query }: GetEmailVerificationStatusParams,
    params: RequestParams = {},
  ) =>
    this.request<GetEmailVerificationStatusData, GetEmailVerificationStatusError>({
      path: `/routes/email-verification-status/${userId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Send a verification email to a user. Args: request: Contains user_id Returns: SendVerificationEmailResponse with success status
   *
   * @tags dbtn/module:email_verification
   * @name send_verification_email
   * @summary Send Verification Email
   * @request POST:/routes/send-verification-email
   */
  send_verification_email = (data: SendVerificationEmailRequest, params: RequestParams = {}) =>
    this.request<SendVerificationEmailData, SendVerificationEmailError>({
      path: `/routes/send-verification-email`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get customer order history with proper data transformation. This endpoint: - Fetches orders from the 'orders' table - Transforms data structure to match CustomerPortal expectations - Maps items → order_items with correct field names - Uses order_number for display (not UUID) - Returns type-safe, structured data Args: customer_id: UUID of the customer limit: Maximum number of orders to return (default: 100) Returns: OrderHistoryListResponse with transformed order data
   *
   * @tags dbtn/module:customer_portal
   * @name get_order_history
   * @summary Get Order History
   * @request GET:/routes/order-history/{customer_id}
   */
  get_order_history = ({ customerId, ...query }: GetOrderHistoryParams, params: RequestParams = {}) =>
    this.request<GetOrderHistoryData, GetOrderHistoryError>({
      path: `/routes/order-history/${customerId}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create database schema for favorite lists feature: - favorite_lists: User's custom favorite lists - favorite_list_items: Many-to-many join table - shared_favorite_links: Shareable links with expiry Includes RLS policies for proper access control.
   *
   * @tags dbtn/module:favorite_lists_setup
   * @name setup_favorite_lists_schema
   * @summary Setup Favorite Lists Schema
   * @request POST:/routes/setup-favorite-lists-schema
   */
  setup_favorite_lists_schema = (params: RequestParams = {}) =>
    this.request<SetupFavoriteListsSchemaData, any>({
      path: `/routes/setup-favorite-lists-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if favorite lists tables exist and are properly configured.
   *
   * @tags dbtn/module:favorite_lists_setup
   * @name check_favorite_lists_schema
   * @summary Check Favorite Lists Schema
   * @request GET:/routes/check-favorite-lists-schema
   */
  check_favorite_lists_schema = (params: RequestParams = {}) =>
    this.request<CheckFavoriteListsSchemaData, any>({
      path: `/routes/check-favorite-lists-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all favorites for a specific user (now using customer_favorites table)
   *
   * @tags dbtn/module:favorites
   * @name get_user_favorites
   * @summary Get User Favorites
   * @request GET:/routes/get-user-favorites
   */
  get_user_favorites = (query: GetUserFavoritesParams, params: RequestParams = {}) =>
    this.request<GetUserFavoritesData, GetUserFavoritesError>({
      path: `/routes/get-user-favorites`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Add an item to user's favorites (now using customer_favorites table)
   *
   * @tags dbtn/module:favorites
   * @name add_favorite
   * @summary Add Favorite
   * @request POST:/routes/add-favorite
   */
  add_favorite = (data: AddFavoriteRequest, params: RequestParams = {}) =>
    this.request<AddFavoriteData, AddFavoriteError>({
      path: `/routes/add-favorite`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Remove an item from user's favorites (now using customer_favorites table)
   *
   * @tags dbtn/module:favorites
   * @name remove_favorite
   * @summary Remove Favorite
   * @request POST:/routes/remove-favorite
   */
  remove_favorite = (data: RemoveFavoriteRequest, params: RequestParams = {}) =>
    this.request<RemoveFavoriteData, RemoveFavoriteError>({
      path: `/routes/remove-favorite`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a specific item is in user's favorites (now using customer_favorites table)
   *
   * @tags dbtn/module:favorites
   * @name check_favorite_status
   * @summary Check Favorite Status
   * @request GET:/routes/check-favorite-status
   */
  check_favorite_status = (query: CheckFavoriteStatusParams, params: RequestParams = {}) =>
    this.request<CheckFavoriteStatusData, CheckFavoriteStatusError>({
      path: `/routes/check-favorite-status`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Remove all favorites for a user (now using customer_favorites table)
   *
   * @tags dbtn/module:favorites
   * @name clear_all_favorites
   * @summary Clear All Favorites
   * @request DELETE:/routes/clear-all-favorites
   */
  clear_all_favorites = (query: ClearAllFavoritesParams, params: RequestParams = {}) =>
    this.request<ClearAllFavoritesData, ClearAllFavoritesError>({
      path: `/routes/clear-all-favorites`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Create a new favorite list for a customer.
   *
   * @tags dbtn/module:favorite_lists
   * @name create_favorite_list
   * @summary Create Favorite List
   * @request POST:/routes/create-list
   */
  create_favorite_list = (data: CreateListRequest, params: RequestParams = {}) =>
    this.request<CreateFavoriteListData, CreateFavoriteListError>({
      path: `/routes/create-list`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Rename an existing favorite list.
   *
   * @tags dbtn/module:favorite_lists
   * @name rename_favorite_list
   * @summary Rename Favorite List
   * @request POST:/routes/rename-list
   */
  rename_favorite_list = (data: RenameListRequest, params: RequestParams = {}) =>
    this.request<RenameFavoriteListData, RenameFavoriteListError>({
      path: `/routes/rename-list`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a favorite list and all its items.
   *
   * @tags dbtn/module:favorite_lists
   * @name delete_favorite_list
   * @summary Delete Favorite List
   * @request POST:/routes/delete-list
   */
  delete_favorite_list = (data: DeleteListRequest, params: RequestParams = {}) =>
    this.request<DeleteFavoriteListData, DeleteFavoriteListError>({
      path: `/routes/delete-list`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Add a favorite item to a specific list.
   *
   * @tags dbtn/module:favorite_lists
   * @name add_favorite_to_list
   * @summary Add Favorite To List
   * @request POST:/routes/add-to-list
   */
  add_favorite_to_list = (data: AddToListRequest, params: RequestParams = {}) =>
    this.request<AddFavoriteToListData, AddFavoriteToListError>({
      path: `/routes/add-to-list`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Remove a favorite item from a specific list.
   *
   * @tags dbtn/module:favorite_lists
   * @name remove_favorite_from_list
   * @summary Remove Favorite From List
   * @request POST:/routes/remove-from-list
   */
  remove_favorite_from_list = (data: RemoveFromListRequest, params: RequestParams = {}) =>
    this.request<RemoveFavoriteFromListData, RemoveFavoriteFromListError>({
      path: `/routes/remove-from-list`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all favorite lists for a customer with their items.
   *
   * @tags dbtn/module:favorite_lists
   * @name get_customer_lists
   * @summary Get Customer Lists
   * @request GET:/routes/get-lists/{customer_id}
   */
  get_customer_lists = ({ customerId, ...query }: GetCustomerListsParams, params: RequestParams = {}) =>
    this.request<GetCustomerListsData, GetCustomerListsError>({
      path: `/routes/get-lists/${customerId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate a shareable link for a favorite list. Creates a token-based URL that expires after specified hours.
   *
   * @tags dbtn/module:favorite_lists
   * @name share_favorite_list
   * @summary Share Favorite List
   * @request POST:/routes/share-list
   */
  share_favorite_list = (data: ShareListRequest, params: RequestParams = {}) =>
    this.request<ShareFavoriteListData, ShareFavoriteListError>({
      path: `/routes/share-list`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Retrieve a shared favorite list by token (public endpoint). No authentication required - anyone with valid token can view.
   *
   * @tags dbtn/module:favorite_lists
   * @name get_shared_favorite_list
   * @summary Get Shared Favorite List
   * @request GET:/routes/shared-list/{token}
   */
  get_shared_favorite_list = ({ token, ...query }: GetSharedFavoriteListParams, params: RequestParams = {}) =>
    this.request<GetSharedFavoriteListData, GetSharedFavoriteListError>({
      path: `/routes/shared-list/${token}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for favorite lists API.
   *
   * @tags dbtn/module:favorite_lists
   * @name favorite_lists_health
   * @summary Favorite Lists Health
   * @request GET:/routes/favorite-lists-health
   */
  favorite_lists_health = (params: RequestParams = {}) =>
    this.request<FavoriteListsHealthData, any>({
      path: `/routes/favorite-lists-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add foreign key constraint from customer_favorites.menu_item_id to menu_items.id. This enables PostgREST to traverse the relationship in queries.
   *
   * @tags dbtn/module:favorite_lists
   * @name fix_customer_favorites_schema
   * @summary Fix Customer Favorites Schema
   * @request POST:/routes/fix-favorites-schema
   */
  fix_customer_favorites_schema = (params: RequestParams = {}) =>
    this.request<FixCustomerFavoritesSchemaData, any>({
      path: `/routes/fix-favorites-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Diagnose the customers table foreign key issue.
   *
   * @tags dbtn/module:fix_customers_fk
   * @name diagnose_customers_fk
   * @summary Diagnose Customers Fk
   * @request POST:/routes/fix-customers-fk/diagnose
   */
  diagnose_customers_fk = (params: RequestParams = {}) =>
    this.request<DiagnoseCustomersFkData, any>({
      path: `/routes/fix-customers-fk/diagnose`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix the customers table foreign key to reference auth.users instead of public.users.
   *
   * @tags dbtn/module:fix_customers_fk
   * @name fix_customers_fk
   * @summary Fix Customers Fk
   * @request POST:/routes/fix-customers-fk/fix
   */
  fix_customers_fk = (params: RequestParams = {}) =>
    this.request<FixCustomersFkData, any>({
      path: `/routes/fix-customers-fk/fix`,
      method: "POST",
      ...params,
    });

  /**
   * @description Add RLS policies to customers table to allow authenticated users to: 1. SELECT their own record (via auth_user_id) 2. INSERT their own record on first login 3. UPDATE their own record
   *
   * @tags dbtn/module:fix_customers_rls
   * @name fix_customers_rls_policies
   * @summary Fix Customers Rls Policies
   * @request POST:/routes/fix-customers-rls-policies
   */
  fix_customers_rls_policies = (params: RequestParams = {}) =>
    this.request<FixCustomersRlsPoliciesData, any>({
      path: `/routes/fix-customers-rls-policies`,
      method: "POST",
      ...params,
    });

  /**
   * @description Programmatically confirm a user's email address. This endpoint uses the service role key to bypass email confirmation, allowing users to have an active session immediately after signup. Critical for smooth onboarding flow.
   *
   * @tags dbtn/module:auto_confirm_email
   * @name auto_confirm_email
   * @summary Auto Confirm Email
   * @request POST:/routes/auto-confirm-email
   */
  auto_confirm_email = (data: AutoConfirmEmailRequest, params: RequestParams = {}) =>
    this.request<AutoConfirmEmailData, AutoConfirmEmailError>({
      path: `/routes/auto-confirm-email`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get personalization settings for a customer
   *
   * @tags dbtn/module:personalization_settings
   * @name get_personalization_settings
   * @summary Get Personalization Settings
   * @request GET:/routes/personalization-settings
   */
  get_personalization_settings = (query: GetPersonalizationSettingsParams, params: RequestParams = {}) =>
    this.request<GetPersonalizationSettingsData, GetPersonalizationSettingsError>({
      path: `/routes/personalization-settings`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Update personalization settings for a customer
   *
   * @tags dbtn/module:personalization_settings
   * @name update_personalization_settings
   * @summary Update Personalization Settings
   * @request POST:/routes/personalization-settings
   */
  update_personalization_settings = (data: PersonalizationSettingsRequest, params: RequestParams = {}) =>
    this.request<UpdatePersonalizationSettingsData, UpdatePersonalizationSettingsError>({
      path: `/routes/personalization-settings`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix the customer_addresses table foreign key constraint to reference the customers table instead of the deprecated customer_profiles table. This is safe to run multiple times (idempotent).
   *
   * @tags dbtn/module:fix_customer_addresses_fk
   * @name fix_foreign_key
   * @summary Fix Foreign Key
   * @request POST:/routes/fix-customer-addresses-fk/fix-foreign-key
   */
  fix_foreign_key = (params: RequestParams = {}) =>
    this.request<FixForeignKeyData, any>({
      path: `/routes/fix-customer-addresses-fk/fix-foreign-key`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check current unique constraints on profiles table
   *
   * @tags dbtn/module:fix_profiles_constraint
   * @name check_profiles_constraints
   * @summary Check Profiles Constraints
   * @request POST:/routes/check-profiles-constraints
   */
  check_profiles_constraints = (params: RequestParams = {}) =>
    this.request<CheckProfilesConstraintsData, any>({
      path: `/routes/check-profiles-constraints`,
      method: "POST",
      ...params,
    });

  /**
   * @description Drop the email_loyalty_token unique constraint that's blocking signups
   *
   * @tags dbtn/module:fix_profiles_constraint
   * @name drop_loyalty_token_constraint
   * @summary Drop Loyalty Token Constraint
   * @request POST:/routes/drop-loyalty-token-constraint
   */
  drop_loyalty_token_constraint = (params: RequestParams = {}) =>
    this.request<DropLoyaltyTokenConstraintData, any>({
      path: `/routes/drop-loyalty-token-constraint`,
      method: "POST",
      ...params,
    });

  /**
   * @description Make email_loyalty_token nullable and remove default to prevent duplicates
   *
   * @tags dbtn/module:fix_profiles_constraint
   * @name make_loyalty_token_nullable
   * @summary Make Loyalty Token Nullable
   * @request POST:/routes/make-loyalty-token-nullable
   */
  make_loyalty_token_nullable = (params: RequestParams = {}) =>
    this.request<MakeLoyaltyTokenNullableData, any>({
      path: `/routes/make-loyalty-token-nullable`,
      method: "POST",
      ...params,
    });

  /**
   * @description Diagnose the profiles.email_loyalty_token signup error
   *
   * @tags dbtn/module:auth_signup_diagnostic
   * @name diagnose_signup_error
   * @summary Diagnose Signup Error
   * @request POST:/routes/diagnose-signup-error
   */
  diagnose_signup_error = (params: RequestParams = {}) =>
    this.request<DiagnoseSignupErrorData, any>({
      path: `/routes/diagnose-signup-error`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check for database triggers that might be creating profile records
   *
   * @tags dbtn/module:auth_signup_diagnostic
   * @name check_auth_triggers
   * @summary Check Auth Triggers
   * @request POST:/routes/check-auth-triggers
   */
  check_auth_triggers = (params: RequestParams = {}) =>
    this.request<CheckAuthTriggersData, any>({
      path: `/routes/check-auth-triggers`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create customer_onboarding table and RLS policies. Only needs to be run once during initial setup.
   *
   * @tags dbtn/module:onboarding
   * @name setup_onboarding_database
   * @summary Setup Onboarding Database
   * @request POST:/routes/onboarding/setup-database
   */
  setup_onboarding_database = (params: RequestParams = {}) =>
    this.request<SetupOnboardingDatabaseData, any>({
      path: `/routes/onboarding/setup-database`,
      method: "POST",
      ...params,
    });

  /**
   * @description Initialize onboarding record for a new customer. Called immediately after customer signup.
   *
   * @tags dbtn/module:onboarding
   * @name initialize_onboarding
   * @summary Initialize Onboarding
   * @request POST:/routes/onboarding/initialize
   */
  initialize_onboarding = (data: InitializeOnboardingRequest, params: RequestParams = {}) =>
    this.request<InitializeOnboardingData, InitializeOnboardingError>({
      path: `/routes/onboarding/initialize`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current onboarding status for a customer. Auto-creates record if it doesn't exist (lazy loading pattern). Returns flat structure for simple frontend consumption. IMPORTANT: Includes retry logic to handle race condition where auth trigger hasn't finished creating customer record yet.
   *
   * @tags dbtn/module:onboarding
   * @name get_onboarding_status
   * @summary Get Onboarding Status
   * @request GET:/routes/onboarding/status/{customer_id}
   */
  get_onboarding_status = ({ customerId, ...query }: GetOnboardingStatusParams, params: RequestParams = {}) =>
    this.request<GetOnboardingStatusData, GetOnboardingStatusError>({
      path: `/routes/onboarding/status/${customerId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Mark the welcome tour as completed for a customer.
   *
   * @tags dbtn/module:onboarding
   * @name mark_tour_complete
   * @summary Mark Tour Complete
   * @request POST:/routes/onboarding/mark-tour-complete
   */
  mark_tour_complete = (data: MarkTourCompleteRequest, params: RequestParams = {}) =>
    this.request<MarkTourCompleteData, MarkTourCompleteError>({
      path: `/routes/onboarding/mark-tour-complete`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Mark the setup wizard as completed for a customer.
   *
   * @tags dbtn/module:onboarding
   * @name mark_wizard_complete
   * @summary Mark Wizard Complete
   * @request POST:/routes/onboarding/mark-wizard-complete
   */
  mark_wizard_complete = (data: MarkWizardCompleteRequest, params: RequestParams = {}) =>
    this.request<MarkWizardCompleteData, MarkWizardCompleteError>({
      path: `/routes/onboarding/mark-wizard-complete`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update the email series step after sending an email. Internal endpoint used by email scheduler.
   *
   * @tags dbtn/module:onboarding
   * @name update_email_step
   * @summary Update Email Step
   * @request POST:/routes/onboarding/update-email-step
   */
  update_email_step = (query: UpdateEmailStepParams, params: RequestParams = {}) =>
    this.request<UpdateEmailStepData, UpdateEmailStepError>({
      path: `/routes/onboarding/update-email-step`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Create the chatbot_prompts table with all required fields for GPT-5 and Google GenAI support. Includes RLS policies for admin-only access.
   *
   * @tags dbtn/module:chatbot_prompts_schema
   * @name setup_chatbot_prompts_table
   * @summary Setup Chatbot Prompts Table
   * @request POST:/routes/chatbot-prompts-schema/setup-chatbot-prompts-table
   */
  setup_chatbot_prompts_table = (params: RequestParams = {}) =>
    this.request<SetupChatbotPromptsTableData, any>({
      path: `/routes/chatbot-prompts-schema/setup-chatbot-prompts-table`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if the chatbot_prompts table exists and validate its schema.
   *
   * @tags dbtn/module:chatbot_prompts_schema
   * @name check_chatbot_prompts_schema
   * @summary Check Chatbot Prompts Schema
   * @request GET:/routes/chatbot-prompts-schema/check-chatbot-prompts-schema
   */
  check_chatbot_prompts_schema = (params: RequestParams = {}) =>
    this.request<CheckChatbotPromptsSchemaData, any>({
      path: `/routes/chatbot-prompts-schema/check-chatbot-prompts-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a simple chatbot_prompts table for immediate testing. We'll expand the schema later.
   *
   * @tags dbtn/module:init_chatbot_schema
   * @name init_simple_chatbot_table
   * @summary Init Simple Chatbot Table
   * @request POST:/routes/init-simple-table
   */
  init_simple_chatbot_table = (params: RequestParams = {}) =>
    this.request<InitSimpleChatbotTableData, any>({
      path: `/routes/init-simple-table`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if the chatbot_prompts table exists and has data.
   *
   * @tags dbtn/module:init_chatbot_schema
   * @name check_chatbot_table
   * @summary Check Chatbot Table
   * @request GET:/routes/check-table
   */
  check_chatbot_table = (params: RequestParams = {}) =>
    this.request<CheckChatbotTableData, any>({
      path: `/routes/check-table`,
      method: "GET",
      ...params,
    });

  /**
   * @description Creates the unified_agent_config table with RLS policies and inserts default Uncle Raj data. Safe to call multiple times - handles existing table gracefully.
   *
   * @tags dbtn/module:unified_agent_config
   * @name initialize_unified_agent_config
   * @summary Initialize Unified Agent Config
   * @request POST:/routes/initialize-unified-agent-config
   */
  initialize_unified_agent_config = (params: RequestParams = {}) =>
    this.request<InitializeUnifiedAgentConfigData, any>({
      path: `/routes/initialize-unified-agent-config`,
      method: "POST",
      ...params,
    });

  /**
   * @description Returns the active unified agent config (single row). Returns 404 if not initialized.
   *
   * @tags dbtn/module:unified_agent_config
   * @name get_unified_agent_config
   * @summary Get Unified Agent Config
   * @request GET:/routes/get-unified-agent-config
   */
  get_unified_agent_config = (params: RequestParams = {}) =>
    this.request<GetUnifiedAgentConfigData, any>({
      path: `/routes/get-unified-agent-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Returns chat-specific configuration from unified_agent_config. Mirrors the old chatbot_config endpoint structure for compatibility. Returns None/null values if config doesn't exist (chat-store.ts handles defaults).
   *
   * @tags dbtn/module:unified_agent_config
   * @name get_chat_config
   * @summary Get Chat Config
   * @request GET:/routes/get-chat-config
   */
  get_chat_config = (params: RequestParams = {}) =>
    this.request<GetChatConfigData, any>({
      path: `/routes/get-chat-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Updates the unified agent config with partial updates. Only updates provided fields and automatically updates updated_at timestamp.
   *
   * @tags dbtn/module:unified_agent_config
   * @name update_unified_agent_config
   * @summary Update Unified Agent Config
   * @request POST:/routes/update-unified-agent-config
   */
  update_unified_agent_config = (data: UpdateUnifiedAgentConfigRequest, params: RequestParams = {}) =>
    this.request<UpdateUnifiedAgentConfigData, UpdateUnifiedAgentConfigError>({
      path: `/routes/update-unified-agent-config`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint to verify if the unified agent config is initialized.
   *
   * @tags dbtn/module:unified_agent_config
   * @name unified_agent_config_status
   * @summary Unified Agent Config Status
   * @request GET:/routes/unified-agent-config-status
   */
  unified_agent_config_status = (params: RequestParams = {}) =>
    this.request<UnifiedAgentConfigStatusData, any>({
      path: `/routes/unified-agent-config-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Publishes the complete wizard configuration by updating unified_agent_config. Transforms wizard state into the unified config schema.
   *
   * @tags dbtn/module:unified_agent_config
   * @name publish_wizard_config
   * @summary Publish Wizard Config
   * @request POST:/routes/publish-wizard-config
   */
  publish_wizard_config = (data: PublishWizardConfigRequest, params: RequestParams = {}) =>
    this.request<PublishWizardConfigData, PublishWizardConfigError>({
      path: `/routes/publish-wizard-config`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Look up menu item by structured item code
   *
   * @tags dbtn/module:voice_menu_matching
   * @name lookup_menu_item_by_code
   * @summary Lookup Menu Item By Code
   * @request POST:/routes/voice-menu-matching/lookup-by-code
   */
  lookup_menu_item_by_code = (data: MenuItemCodeRequest, params: RequestParams = {}) =>
    this.request<LookupMenuItemByCodeData, LookupMenuItemByCodeError>({
      path: `/routes/voice-menu-matching/lookup-by-code`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Search menu items using natural language with fallback fuzzy matching
   *
   * @tags dbtn/module:voice_menu_matching
   * @name natural_language_search
   * @summary Natural Language Search
   * @request POST:/routes/voice-menu-matching/natural-language-search
   */
  natural_language_search = (data: NaturalLanguageSearchRequest, params: RequestParams = {}) =>
    this.request<NaturalLanguageSearchData, NaturalLanguageSearchError>({
      path: `/routes/voice-menu-matching/natural-language-search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate structured item code for a menu item
   *
   * @tags dbtn/module:voice_menu_matching
   * @name generate_menu_item_code
   * @summary Generate Menu Item Code
   * @request POST:/routes/voice-menu-matching/generate-item-code
   */
  generate_menu_item_code = (data: CodeGenerationRequest, params: RequestParams = {}) =>
    this.request<GenerateMenuItemCodeData, GenerateMenuItemCodeError>({
      path: `/routes/voice-menu-matching/generate-item-code`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for voice menu matching API
   *
   * @tags dbtn/module:voice_menu_matching
   * @name check_voice_menu_matching_health
   * @summary Check Voice Menu Matching Health
   * @request GET:/routes/voice-menu-matching/health
   */
  check_voice_menu_matching_health = (params: RequestParams = {}) =>
    this.request<CheckVoiceMenuMatchingHealthData, any>({
      path: `/routes/voice-menu-matching/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get complete menu context optimized for AI consumption. Includes structured data for categories, items, variants, and metadata.
   *
   * @tags dbtn/module:ai_menu_context
   * @name get_full_menu_context
   * @summary Get Full Menu Context
   * @request GET:/routes/ai-menu-context/full-context
   */
  get_full_menu_context = (query: GetFullMenuContextParams, params: RequestParams = {}) =>
    this.request<GetFullMenuContextData, GetFullMenuContextError>({
      path: `/routes/ai-menu-context/full-context`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Validate and match menu items using fuzzy matching and confidence scoring. Returns the best match with confidence score and alternative suggestions.
   *
   * @tags dbtn/module:ai_menu_context
   * @name validate_menu_item
   * @summary Validate Menu Item
   * @request POST:/routes/ai-menu-context/validate-item
   */
  validate_menu_item = (data: MenuValidationRequest, params: RequestParams = {}) =>
    this.request<ValidateMenuItemData, ValidateMenuItemError>({
      path: `/routes/ai-menu-context/validate-item`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a lightweight summary of menu context for token-efficient AI prompts.
   *
   * @tags dbtn/module:ai_menu_context
   * @name get_context_summary
   * @summary Get Context Summary
   * @request GET:/routes/ai-menu-context/context-summary
   */
  get_context_summary = (params: RequestParams = {}) =>
    this.request<GetContextSummaryData, any>({
      path: `/routes/ai-menu-context/context-summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check the status of menu tables This endpoint verifies if all required menu tables exist and contain data. Returns: Dict[str, Any]: Status of all menu tables
   *
   * @tags dbtn/module:menu_tables
   * @name check_tables_status
   * @summary Check Tables Status
   * @request GET:/routes/menu-tables/check
   */
  check_tables_status = (params: RequestParams = {}) =>
    this.request<CheckTablesStatusData, any>({
      path: `/routes/menu-tables/check`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set up the menu tables if they don't exist yet This function creates the necessary tables for the menu system if they don't exist yet. It's a non-destructive operation that only creates tables that are missing. Returns: MenuTablesResponse: Setup status and details
   *
   * @tags dbtn/module:menu_tables
   * @name setup_menu_tables2
   * @summary Setup Menu Tables2
   * @request POST:/routes/menu-tables/setup
   */
  setup_menu_tables2 = (params: RequestParams = {}) =>
    this.request<SetupMenuTables2Data, any>({
      path: `/routes/menu-tables/setup`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test the SQL function execution from menu_tables module This endpoint tests if the SQL execution function is working correctly and provides diagnostics information. Returns: Dict[str, Any]: Test results and diagnostics
   *
   * @tags dbtn/module:menu_tables
   * @name test_sql_function_menu_tables
   * @summary Test Sql Function Menu Tables
   * @request POST:/routes/menu-tables/test-sql-function
   */
  test_sql_function_menu_tables = (params: RequestParams = {}) =>
    this.request<TestSqlFunctionMenuTablesData, any>({
      path: `/routes/menu-tables/test-sql-function`,
      method: "POST",
      ...params,
    });

  /**
   * @description Execute direct SQL migration to drop preparation_time columns. This uses a simple, reliable approach: 1. Execute raw DDL via Supabase execute_sql RPC 2. Use IF EXISTS to make it safe and idempotent 3. Return clear success/failure status No complex inspection - just drops the columns if they exist.
   *
   * @tags dbtn/module:prep_time_migration
   * @name execute_simple_migration
   * @summary Execute Simple Migration
   * @request POST:/routes/prep-time-migration/execute-simple
   */
  execute_simple_migration = (params: RequestParams = {}) =>
    this.request<ExecuteSimpleMigrationData, any>({
      path: `/routes/prep-time-migration/execute-simple`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that columns were successfully dropped by checking information_schema.
   *
   * @tags dbtn/module:prep_time_migration
   * @name verify_simple_migration
   * @summary Verify Simple Migration
   * @request GET:/routes/prep-time-migration/verify-simple
   */
  verify_simple_migration = (params: RequestParams = {}) =>
    this.request<VerifySimpleMigrationData, any>({
      path: `/routes/prep-time-migration/verify-simple`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all available customizations for menu items. This endpoint is used by the Admin Portal and other components.
   *
   * @tags dbtn/module:menu_customizations
   * @name get_customizations
   * @summary Get Customizations
   * @request GET:/routes/get-customizations
   */
  get_customizations = (params: RequestParams = {}) =>
    this.request<GetCustomizationsData, any>({
      path: `/routes/get-customizations`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get customizations enabled for AI Voice Agent in a format optimized for voice interaction. Returns only customizations where ai_voice_agent = true.
   *
   * @tags dbtn/module:menu_customizations
   * @name get_voice_agent_customizations
   * @summary Get Voice Agent Customizations
   * @request GET:/routes/voice-agent/customizations
   */
  get_voice_agent_customizations = (params: RequestParams = {}) =>
    this.request<GetVoiceAgentCustomizationsData, any>({
      path: `/routes/voice-agent/customizations`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new customization (add-on or instruction). Used by Admin UI to add new customizations with toggle states.
   *
   * @tags dbtn/module:menu_customizations
   * @name create_customization
   * @summary Create Customization
   * @request POST:/routes/create-customization
   */
  create_customization = (data: CreateCustomizationRequest, params: RequestParams = {}) =>
    this.request<CreateCustomizationData, CreateCustomizationError>({
      path: `/routes/create-customization`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update an existing customization. Used by Admin UI to modify customizations and toggle states.
   *
   * @tags dbtn/module:menu_customizations
   * @name update_customization
   * @summary Update Customization
   * @request PUT:/routes/update-customization/{customization_id}
   */
  update_customization = (
    { customizationId, ...query }: UpdateCustomizationParams,
    data: UpdateCustomizationRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateCustomizationData, UpdateCustomizationError>({
      path: `/routes/update-customization/${customizationId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a customization. Used by Admin UI to remove customizations.
   *
   * @tags dbtn/module:menu_customizations
   * @name delete_customization
   * @summary Delete Customization
   * @request DELETE:/routes/delete-customization/{customization_id}
   */
  delete_customization = ({ customizationId, ...query }: DeleteCustomizationParams, params: RequestParams = {}) =>
    this.request<DeleteCustomizationData, DeleteCustomizationError>({
      path: `/routes/delete-customization/${customizationId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Create the cart_events table for analytics tracking. This is a one-time setup endpoint. Safe to run multiple times (checks if exists first).
   *
   * @tags dbtn/module:setup_cart_analytics_table
   * @name setup_cart_analytics_table
   * @summary Setup Cart Analytics Table
   * @request POST:/routes/setup-cart-analytics-table
   */
  setup_cart_analytics_table = (params: RequestParams = {}) =>
    this.request<SetupCartAnalyticsTableData, any>({
      path: `/routes/setup-cart-analytics-table`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if cart_events table exists and is properly configured.
   *
   * @tags dbtn/module:setup_cart_analytics_table
   * @name check_cart_analytics_table
   * @summary Check Cart Analytics Table
   * @request GET:/routes/check-cart-analytics-table
   */
  check_cart_analytics_table = (params: RequestParams = {}) =>
    this.request<CheckCartAnalyticsTableData, any>({
      path: `/routes/check-cart-analytics-table`,
      method: "GET",
      ...params,
    });

  /**
   * @description Comprehensive diagnostic endpoint to verify menu data loading. Tests direct database access for categories and protein types.
   *
   * @tags dbtn/module:menu_diagnostics
   * @name get_menu_data_status
   * @summary Get Menu Data Status
   * @request GET:/routes/menu-data-status
   */
  get_menu_data_status = (params: RequestParams = {}) =>
    this.request<GetMenuDataStatusData, any>({
      path: `/routes/menu-data-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Creates proper parent category records for virtual section references. Scans existing categories for parent_category_id values starting with 'section-', creates actual parent records with those IDs, and ensures the hierarchy is valid. This is a one-time migration to fix the category hierarchy.
   *
   * @tags dbtn/module:fix_category_sections
   * @name create_section_parent_records
   * @summary Create Section Parent Records
   * @request POST:/routes/create-section-parents
   */
  create_section_parent_records = (params: RequestParams = {}) =>
    this.request<CreateSectionParentRecordsData, any>({
      path: `/routes/create-section-parents`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get user's favorites enriched with full menu item and variant details
   *
   * @tags dbtn/module:enriched_favorites
   * @name get_enriched_favorites
   * @summary Get Enriched Favorites
   * @request GET:/routes/get-enriched-favorites
   */
  get_enriched_favorites = (query: GetEnrichedFavoritesParams, params: RequestParams = {}) =>
    this.request<GetEnrichedFavoritesData, GetEnrichedFavoritesError>({
      path: `/routes/get-enriched-favorites`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Serve menu data in format optimized for voice agent crawling This endpoint provides menu data in a natural language format that voice agents can crawl and index for responses. Returns: HTML formatted menu content for web crawling
   *
   * @tags voice-agent, dbtn/module:menu_voice_agent_web
   * @name get_menu_for_voice_agent
   * @summary Get Menu For Voice Agent
   * @request GET:/routes/api/menu-for-voice-agent
   */
  get_menu_for_voice_agent = (params: RequestParams = {}) =>
    this.request<GetMenuForVoiceAgentData, any>({
      path: `/routes/api/menu-for-voice-agent`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve menu data as plain text for voice agent crawling Alternative endpoint that returns pure text format for different crawling preferences.
   *
   * @tags voice-agent, dbtn/module:menu_voice_agent_web
   * @name get_menu_for_voice_agent_text
   * @summary Get Menu For Voice Agent Text
   * @request GET:/routes/api/menu-for-voice-agent/text
   */
  get_menu_for_voice_agent_text = (params: RequestParams = {}) =>
    this.request<GetMenuForVoiceAgentTextData, any>({
      path: `/routes/api/menu-for-voice-agent/text`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve menu data as direct HTML for voice agent corpus crawling Returns HTML content directly (not wrapped in JSON) for better compatibility with voice agent web crawling.
   *
   * @tags voice-agent, dbtn/module:menu_voice_agent_web
   * @name get_menu_for_voice_agent_html
   * @summary Get Menu For Voice Agent Html
   * @request GET:/routes/api/menu-for-voice-agent/html
   */
  get_menu_for_voice_agent_html = (params: RequestParams = {}) =>
    this.request<GetMenuForVoiceAgentHtmlData, any>({
      path: `/routes/api/menu-for-voice-agent/html`,
      method: "GET",
      ...params,
    });

  /**
   * @description Analyze current database state and generate migration plan. This is a DRY RUN - no changes are made to the database. Shows exactly what will change when migration is executed.
   *
   * @tags dbtn/module:category_section_migration
   * @name analyze_category_migration
   * @summary Analyze Category Migration
   * @request POST:/routes/category-migration/analyze
   */
  analyze_category_migration = (params: RequestParams = {}) =>
    this.request<AnalyzeCategoryMigrationData, any>({
      path: `/routes/category-migration/analyze`,
      method: "POST",
      ...params,
    });

  /**
   * @description Execute the category section migration. WARNING: This modifies the database. Run /analyze first to review the plan. Steps: 1. Create section parent records 2. Update category parent_category_id fields 3. Capture post-migration snapshot
   *
   * @tags dbtn/module:category_section_migration
   * @name execute_category_migration
   * @summary Execute Category Migration
   * @request POST:/routes/category-migration/execute
   */
  execute_category_migration = (params: RequestParams = {}) =>
    this.request<ExecuteCategoryMigrationData, any>({
      path: `/routes/category-migration/execute`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify the migration was successful. Checks: - All 7 sections exist - All categories have valid parent_category_id - No orphaned categories - Proper section assignments
   *
   * @tags dbtn/module:category_section_migration
   * @name verify_category_migration
   * @summary Verify Category Migration
   * @request POST:/routes/category-migration/verify
   */
  verify_category_migration = (params: RequestParams = {}) =>
    this.request<VerifyCategoryMigrationData, any>({
      path: `/routes/category-migration/verify`,
      method: "POST",
      ...params,
    });

  /**
   * @description Rollback the migration using a pre-migration snapshot. WARNING: This will restore the database to the pre-migration state. Args: snapshot_json: JSON string of CategorySnapshot list from analyze endpoint
   *
   * @tags dbtn/module:category_section_migration
   * @name rollback_category_migration
   * @summary Rollback Category Migration
   * @request POST:/routes/category-migration/rollback
   */
  rollback_category_migration = (query: RollbackCategoryMigrationParams, params: RequestParams = {}) =>
    this.request<RollbackCategoryMigrationData, RollbackCategoryMigrationError>({
      path: `/routes/category-migration/rollback`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Force refresh menu cache endpoint. **PURPOSE:** After database migrations (e.g., restructuring category hierarchies), the frontend realtime store may have stale cached data. This endpoint triggers a timestamp update that forces the frontend to recognize the data as "changed" and reload from Supabase. **HOW IT WORKS:** The frontend realtime store watches for changes. By calling this endpoint, you signal that a manual refresh is needed. The frontend should: 1. Clear its categories cache 2. Re-fetch from Supabase 3. Rebuild computed hierarchies **WHEN TO USE:** - After running category restructure migrations - After bulk updates to menu_categories table - When frontend shows stale category structure
   *
   * @tags dbtn/module:force_refresh_menu
   * @name force_refresh_menu
   * @summary Force Refresh Menu
   * @request POST:/routes/force-refresh-menu
   */
  force_refresh_menu = (params: RequestParams = {}) =>
    this.request<ForceRefreshMenuData, any>({
      path: `/routes/force-refresh-menu`,
      method: "POST",
      ...params,
    });

  /**
   * @description Populate missing default variants for single menu items. This migration: 1. Finds all menu_items with 0 entries in item_variants 2. Creates a default "Regular" variant for each 3. Uses menu_item's base price (price_collection or price) 4. Sets is_default=true, is_active=true Returns: MigrationResult: Summary of migration with detailed results
   *
   * @tags dbtn/module:database_migration
   * @name populate_missing_variants
   * @summary Populate Missing Variants
   * @request POST:/routes/populate-missing-variants
   */
  populate_missing_variants = (params: RequestParams = {}) =>
    this.request<PopulateMissingVariantsData, any>({
      path: `/routes/populate-missing-variants`,
      method: "POST",
      ...params,
    });

  /**
   * @description Preview which items are missing variants without making changes. Returns: Summary of items that would be affected by the migration
   *
   * @tags dbtn/module:database_migration
   * @name check_missing_variants
   * @summary Check Missing Variants
   * @request GET:/routes/check-missing-variants
   */
  check_missing_variants = (params: RequestParams = {}) =>
    this.request<CheckMissingVariantsData, any>({
      path: `/routes/check-missing-variants`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix existing variants that have duplicate item names in their variant_name. Example: BEFORE: variant_name = "TANDOORI CHICKEN (starter) (Regular)" AFTER:  variant_name = "Regular" This fixes variants created by the initial (incorrect) migration.
   *
   * @tags dbtn/module:database_migration
   * @name fix_duplicate_variant_names
   * @summary Fix Duplicate Variant Names
   * @request POST:/routes/fix-duplicate-variant-names
   */
  fix_duplicate_variant_names = (params: RequestParams = {}) =>
    this.request<FixDuplicateVariantNamesData, any>({
      path: `/routes/fix-duplicate-variant-names`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create a POS order directly in Supabase unified tables
   *
   * @tags dbtn/module:pos_orders
   * @name create_pos_order
   * @summary Create Pos Order
   * @request POST:/routes/pos-orders/create-order
   */
  create_pos_order = (data: POSOrderRequest, params: RequestParams = {}) =>
    this.request<CreatePosOrderData, CreatePosOrderError>({
      path: `/routes/pos-orders/create-order`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Process template variables in template content
   *
   * @tags dbtn/module:template_variables
   * @name process_template_variables
   * @summary Process Template Variables
   * @request POST:/routes/process_template_variables
   */
  process_template_variables = (data: TemplateVariablesRequest, params: RequestParams = {}) =>
    this.request<ProcessTemplateVariablesData, ProcessTemplateVariablesError>({
      path: `/routes/process_template_variables`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all available template variables
   *
   * @tags dbtn/module:template_variables
   * @name get_available_variables_endpoint
   * @summary Get Available Variables Endpoint
   * @request POST:/routes/get_available_variables
   */
  get_available_variables_endpoint = (data: VariableListRequest, params: RequestParams = {}) =>
    this.request<GetAvailableVariablesEndpointData, GetAvailableVariablesEndpointError>({
      path: `/routes/get_available_variables`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get sample order data for testing templates
   *
   * @tags dbtn/module:template_variables
   * @name get_sample_order_data_endpoint
   * @summary Get Sample Order Data Endpoint
   * @request POST:/routes/get_sample_order_data
   */
  get_sample_order_data_endpoint = (data: SampleDataRequest, params: RequestParams = {}) =>
    this.request<GetSampleOrderDataEndpointData, GetSampleOrderDataEndpointError>({
      path: `/routes/get_sample_order_data`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Process template with sample data based on order type
   *
   * @tags dbtn/module:template_variables
   * @name process_template_with_sample
   * @summary Process Template With Sample
   * @request POST:/routes/process_template_with_sample
   */
  process_template_with_sample = (data: TemplateVariablesRequest, params: RequestParams = {}) =>
    this.request<ProcessTemplateWithSampleData, ProcessTemplateWithSampleError>({
      path: `/routes/process_template_with_sample`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:order_management
   * @name store_order
   * @summary Store Order
   * @request POST:/routes/order-management/orders
   */
  store_order = (data: OrderModel, params: RequestParams = {}) =>
    this.request<StoreOrderData, StoreOrderError>({
      path: `/routes/order-management/orders`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get orders from unified Supabase tables with filtering support
   *
   * @tags dbtn/module:order_management
   * @name get_orders
   * @summary Get Orders
   * @request GET:/routes/order-management/orders
   */
  get_orders = (query: GetOrdersParams, params: RequestParams = {}) =>
    this.request<GetOrdersData, GetOrdersError>({
      path: `/routes/order-management/orders`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:order_management
   * @name get_reconciliation_summary
   * @summary Get Reconciliation Summary
   * @request GET:/routes/order-management/reconciliation
   */
  get_reconciliation_summary = (query: GetReconciliationSummaryParams, params: RequestParams = {}) =>
    this.request<GetReconciliationSummaryData, GetReconciliationSummaryError>({
      path: `/routes/order-management/reconciliation`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:order_management
   * @name get_order_by_id
   * @summary Get Order By Id
   * @request GET:/routes/order-management/orders/{order_id}
   */
  get_order_by_id = ({ orderId, ...query }: GetOrderByIdParams, params: RequestParams = {}) =>
    this.request<GetOrderByIdData, GetOrderByIdError>({
      path: `/routes/order-management/orders/${orderId}`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:order_management
   * @name export_orders
   * @summary Export Orders
   * @request GET:/routes/order-management/export
   */
  export_orders = (query: ExportOrdersParams, params: RequestParams = {}) =>
    this.request<ExportOrdersData, ExportOrdersError>({
      path: `/routes/order-management/export`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:order_management
   * @name process_cash_payment
   * @summary Process Cash Payment
   * @request POST:/routes/order-management/cash-payment
   */
  process_cash_payment = (data: CashPaymentRequest, params: RequestParams = {}) =>
    this.request<ProcessCashPaymentData, ProcessCashPaymentError>({
      path: `/routes/order-management/cash-payment`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get full order items for reordering. Handles both: - Legacy orders (items stored as JSONB in 'items' column) - New orders (items in 'order_items' table) Returns complete item data for reordering with proper variant names.
   *
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_order_items
   * @summary Get Order Items
   * @request GET:/routes/customer-profile/get-order-items/{order_id}
   */
  get_order_items = ({ orderId, ...query }: GetOrderItemsParams, params: RequestParams = {}) =>
    this.request<GetOrderItemsData, GetOrderItemsError>({
      path: `/routes/customer-profile/get-order-items/${orderId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description POST version of get_customer_profile for JSON body requests (Ultravox compatibility). This endpoint accepts a JSON body with customer identifiers and returns the same data as the GET version. Designed for voice agents and webhooks.
   *
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_customer_profile_post
   * @summary Get Customer Profile Post
   * @request POST:/routes/customer-profile/get-customer-profile
   */
  get_customer_profile_post = (data: CustomerLookupRequest, params: RequestParams = {}) =>
    this.request<GetCustomerProfilePostData, GetCustomerProfilePostError>({
      path: `/routes/customer-profile/get-customer-profile`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get customer profile by email, phone, customer_id, or reference number. This endpoint serves the voice agent's getCustomerProfile tool and other systems that need to lookup customer information. Args: comprehensive: If True, includes addresses, orders, and favorites for voice agent personalization
   *
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_customer_profile
   * @summary Get Customer Profile
   * @request GET:/routes/customer-profile/get-customer-profile
   */
  get_customer_profile = (query: GetCustomerProfileParams, params: RequestParams = {}) =>
    this.request<GetCustomerProfileData, GetCustomerProfileError>({
      path: `/routes/customer-profile/get-customer-profile`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get user order history. This endpoint serves the CustomerPortal and other systems that need to display customer order history.
   *
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_user_orders
   * @summary Get User Orders
   * @request GET:/routes/customer-profile/get-user-orders
   */
  get_user_orders = (query: GetUserOrdersParams, params: RequestParams = {}) =>
    this.request<GetUserOrdersData, GetUserOrdersError>({
      path: `/routes/customer-profile/get-user-orders`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Flexible customer lookup endpoint for various use cases. Accepts multiple identifier types and returns customer profile if found.
   *
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name lookup_customer
   * @summary Lookup Customer
   * @request POST:/routes/customer-profile/lookup-customer
   */
  lookup_customer = (data: CustomerLookupRequest, params: RequestParams = {}) =>
    this.request<LookupCustomerData, LookupCustomerError>({
      path: `/routes/customer-profile/lookup-customer`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint for customer profile API
   *
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name customer_profile_health
   * @summary Customer Profile Health
   * @request GET:/routes/customer-profile/health
   */
  customer_profile_health = (params: RequestParams = {}) =>
    this.request<CustomerProfileHealthData, any>({
      path: `/routes/customer-profile/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new user receipt template Stores the template in Supabase with RLS protection. Only the creating user can access this template. Args: request: Template creation request with user_id, name, description, design_data Returns: Created template with generated ID and timestamps
   *
   * @tags dbtn/module:receipt_templates
   * @name create_receipt_template
   * @summary Create Receipt Template
   * @request POST:/routes/receipt-templates
   */
  create_receipt_template = (data: TemplateCreateRequest, params: RequestParams = {}) =>
    this.request<CreateReceiptTemplateData, CreateReceiptTemplateError>({
      path: `/routes/receipt-templates`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all receipt templates for a user Returns only templates created by the specified user. RLS policies ensure users can only see their own templates. Args: user_id: User ID to filter templates Returns: List of user's templates wrapped in success response
   *
   * @tags dbtn/module:receipt_templates
   * @name list_receipt_templates
   * @summary List Receipt Templates
   * @request GET:/routes/receipt-templates
   */
  list_receipt_templates = (query: ListReceiptTemplatesParams, params: RequestParams = {}) =>
    this.request<ListReceiptTemplatesData, ListReceiptTemplatesError>({
      path: `/routes/receipt-templates`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific receipt template by ID or name Validates that the requesting user owns the template. Supports both UUID lookup and name-based lookup for backward compatibility. Args: template_id: Template ID (UUID) or template name user_id: User ID for permission check Returns: Template data wrapped in success response
   *
   * @tags dbtn/module:receipt_templates
   * @name get_receipt_template
   * @summary Get Receipt Template
   * @request GET:/routes/receipt-templates/{template_id}
   */
  get_receipt_template = ({ templateId, ...query }: GetReceiptTemplateParams, params: RequestParams = {}) =>
    this.request<GetReceiptTemplateData, GetReceiptTemplateError>({
      path: `/routes/receipt-templates/${templateId}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Update an existing receipt template Validates user ownership before allowing updates. Only updates fields that are provided in the request. Args: template_id: Template ID to update request: Update request with optional name, description, design_data Returns: Updated template data
   *
   * @tags dbtn/module:receipt_templates
   * @name update_receipt_template
   * @summary Update Receipt Template
   * @request PUT:/routes/receipt-templates/{template_id}
   */
  update_receipt_template = (
    { templateId, ...query }: UpdateReceiptTemplateParams,
    data: TemplateUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateReceiptTemplateData, UpdateReceiptTemplateError>({
      path: `/routes/receipt-templates/${templateId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a receipt template Also cleans up: - Stored preview HTML/images - Order mode assignments in POS settings Args: template_id: Template ID to delete request: Delete request with user_id for permission check Returns: Success message with cleanup details
   *
   * @tags dbtn/module:receipt_templates
   * @name delete_receipt_template
   * @summary Delete Receipt Template
   * @request DELETE:/routes/receipt-templates/{template_id}
   */
  delete_receipt_template = (
    { templateId, ...query }: DeleteReceiptTemplateParams,
    data: TemplateDeleteRequest,
    params: RequestParams = {},
  ) =>
    this.request<DeleteReceiptTemplateData, DeleteReceiptTemplateError>({
      path: `/routes/receipt-templates/${templateId}`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all template assignments for order modes
   *
   * @tags dbtn/module:template_assignments
   * @name get_template_assignments
   * @summary Get Template Assignments
   * @request GET:/routes/template-assignments
   */
  get_template_assignments = (params: RequestParams = {}) =>
    this.request<GetTemplateAssignmentsData, any>({
      path: `/routes/template-assignments`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set template assignment for an order mode
   *
   * @tags dbtn/module:template_assignments
   * @name set_template_assignment
   * @summary Set Template Assignment
   * @request POST:/routes/template-assignments
   */
  set_template_assignment = (data: SetTemplateAssignmentRequest, params: RequestParams = {}) =>
    this.request<SetTemplateAssignmentData, SetTemplateAssignmentError>({
      path: `/routes/template-assignments`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get template assignment for a specific order mode
   *
   * @tags dbtn/module:template_assignments
   * @name get_template_assignment
   * @summary Get Template Assignment
   * @request GET:/routes/template-assignments/{order_mode}
   */
  get_template_assignment = ({ orderMode, ...query }: GetTemplateAssignmentParams, params: RequestParams = {}) =>
    this.request<GetTemplateAssignmentData, GetTemplateAssignmentError>({
      path: `/routes/template-assignments/${orderMode}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Reset template assignment for an order mode to default
   *
   * @tags dbtn/module:template_assignments
   * @name reset_template_assignment
   * @summary Reset Template Assignment
   * @request DELETE:/routes/template-assignments/{order_mode}
   */
  reset_template_assignment = ({ orderMode, ...query }: ResetTemplateAssignmentParams, params: RequestParams = {}) =>
    this.request<ResetTemplateAssignmentData, ResetTemplateAssignmentError>({
      path: `/routes/template-assignments/${orderMode}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Initialize all template assignments with default values
   *
   * @tags dbtn/module:template_assignments
   * @name initialize_default_assignments
   * @summary Initialize Default Assignments
   * @request POST:/routes/template-assignments/initialize-defaults
   */
  initialize_default_assignments = (params: RequestParams = {}) =>
    this.request<InitializeDefaultAssignmentsData, any>({
      path: `/routes/template-assignments/initialize-defaults`,
      method: "POST",
      ...params,
    });

  /**
   * @description Add hierarchical columns to media_assets table: - asset_category: Classification (menu-item, ai-avatar, marketing, gallery, general) - menu_section_id: FK to parent section category - menu_category_id: FK to menu category - usage_context: JSONB for flexible metadata This is a SAFE, IDEMPOTENT operation using SupabaseManager.
   *
   * @tags dbtn/module:media_hierarchical_migration
   * @name add_hierarchical_columns
   * @summary Add Hierarchical Columns
   * @request POST:/routes/media-migration/add-hierarchical-columns
   */
  add_hierarchical_columns = (query: AddHierarchicalColumnsParams, params: RequestParams = {}) =>
    this.request<AddHierarchicalColumnsData, AddHierarchicalColumnsError>({
      path: `/routes/media-migration/add-hierarchical-columns`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Backfill existing menu item images with hierarchical metadata: - Set asset_category = 'menu-item' - Populate menu_category_id from linked menu items - Populate menu_section_id from category's parent - Set bucket_name appropriately
   *
   * @tags dbtn/module:media_hierarchical_migration
   * @name backfill_menu_images
   * @summary Backfill Menu Images
   * @request POST:/routes/media-migration/backfill-menu-images
   */
  backfill_menu_images = (query: BackfillMenuImagesParams, params: RequestParams = {}) =>
    this.request<BackfillMenuImagesData, BackfillMenuImagesError>({
      path: `/routes/media-migration/backfill-menu-images`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Backfill AI agent avatars: - Find assets tagged as 'avatar' or in usage field - Set asset_category = 'ai-avatar' - Set bucket_name = 'avatars' - Populate usage_context with agent details
   *
   * @tags dbtn/module:media_hierarchical_migration
   * @name backfill_ai_avatars
   * @summary Backfill Ai Avatars
   * @request POST:/routes/media-migration/backfill-ai-avatars
   */
  backfill_ai_avatars = (query: BackfillAiAvatarsParams, params: RequestParams = {}) =>
    this.request<BackfillAiAvatarsData, BackfillAiAvatarsError>({
      path: `/routes/media-migration/backfill-ai-avatars`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Execute complete migration workflow: 1. Add hierarchical columns to schema 2. Backfill menu item images 3. Backfill AI avatar images 4. Generate comprehensive report
   *
   * @tags dbtn/module:media_hierarchical_migration
   * @name run_full_migration
   * @summary Run Full Migration
   * @request POST:/routes/media-migration/run-full-migration
   */
  run_full_migration = (query: RunFullMigrationParams, params: RequestParams = {}) =>
    this.request<RunFullMigrationData, RunFullMigrationError>({
      path: `/routes/media-migration/run-full-migration`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Verify that hierarchical columns exist and are properly configured
   *
   * @tags dbtn/module:media_hierarchical_migration
   * @name verify_schema
   * @summary Verify Schema
   * @request GET:/routes/media-migration/verify-schema
   */
  verify_schema = (params: RequestParams = {}) =>
    this.request<VerifySchemaData, any>({
      path: `/routes/media-migration/verify-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add optimization-related columns to media_assets table: - Variant URLs (square, widescreen, thumbnail × WebP/JPEG) - Size metrics (original, optimized, compression ratio) Args: dry_run: If True, validates SQL without executing Returns: SchemaUpdateResponse with migration details
   *
   * @tags dbtn/module:media_assets_optimizer_schema
   * @name add_optimization_columns
   * @summary Add Optimization Columns
   * @request POST:/routes/media-assets/add-optimization-columns
   */
  add_optimization_columns = (query: AddOptimizationColumnsParams, params: RequestParams = {}) =>
    this.request<AddOptimizationColumnsData, AddOptimizationColumnsError>({
      path: `/routes/media-assets/add-optimization-columns`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Check if optimization columns exist in media_assets table. Returns: SchemaUpdateResponse indicating which columns exist
   *
   * @tags dbtn/module:media_assets_optimizer_schema
   * @name check_optimization_columns
   * @summary Check Optimization Columns
   * @request GET:/routes/media-assets/check-optimization-columns
   */
  check_optimization_columns = (params: RequestParams = {}) =>
    this.request<CheckOptimizationColumnsData, any>({
      path: `/routes/media-assets/check-optimization-columns`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create database trigger to auto-create customer records. Creates: 1. Postgres function: create_customer_on_auth_signup() 2. Trigger: on_auth_user_created (fires on auth.users INSERT) This ensures atomic customer record creation for ALL signup methods.
   *
   * @tags dbtn/module:auth_sync
   * @name setup_trigger
   * @summary Setup Trigger
   * @request POST:/routes/setup-trigger
   */
  setup_trigger = (params: RequestParams = {}) =>
    this.request<SetupTriggerData, any>({
      path: `/routes/setup-trigger`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate existing auth users to customers table. Finds all auth.users who don't have a customer record and creates them. Safe to run multiple times (idempotent).
   *
   * @tags dbtn/module:auth_sync
   * @name backfill_customers
   * @summary Backfill Customers
   * @request POST:/routes/backfill-customers
   */
  backfill_customers = (params: RequestParams = {}) =>
    this.request<BackfillCustomersData, any>({
      path: `/routes/backfill-customers`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check trigger status and identify unsynced auth users. Returns: - Whether trigger and function exist - Count of auth users vs customers - List of unsynced users (email + id)
   *
   * @tags dbtn/module:auth_sync
   * @name check_status
   * @summary Check Status
   * @request GET:/routes/auth-sync-status
   */
  check_status = (params: RequestParams = {}) =>
    this.request<CheckStatusData, any>({
      path: `/routes/auth-sync-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check endpoint
   *
   * @tags dbtn/module:auth_sync
   * @name auth_sync_health_check
   * @summary Auth Sync Health Check
   * @request GET:/routes/auth-sync-health
   */
  auth_sync_health_check = (params: RequestParams = {}) =>
    this.request<AuthSyncHealthCheckData, any>({
      path: `/routes/auth-sync-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check endpoint for thermal printer system Converted from cottage-tandoori-simple-printer /health endpoint
   *
   * @tags dbtn/module:thermal_printer
   * @name check_printer_health
   * @summary Check Printer Health
   * @request GET:/routes/thermal-printer/health
   */
  check_printer_health = (params: RequestParams = {}) =>
    this.request<CheckPrinterHealthData, any>({
      path: `/routes/thermal-printer/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get detailed printer capabilities Converted from cottage-tandoori-simple-printer /capabilities endpoint
   *
   * @tags dbtn/module:thermal_printer
   * @name get_printer_capabilities
   * @summary Get Printer Capabilities
   * @request GET:/routes/capabilities
   */
  get_printer_capabilities = (params: RequestParams = {}) =>
    this.request<GetPrinterCapabilitiesData, any>({
      path: `/routes/capabilities`,
      method: "GET",
      ...params,
    });

  /**
   * @description Enhanced template-based printing endpoint Converted from cottage-tandoori-simple-printer /print/template endpoint
   *
   * @tags dbtn/module:thermal_printer
   * @name print_rich_template
   * @summary Print Rich Template
   * @request POST:/routes/print/template
   */
  print_rich_template = (data: PrintTemplateRequest, params: RequestParams = {}) =>
    this.request<PrintRichTemplateData, PrintRichTemplateError>({
      path: `/routes/print/template`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Print kitchen ticket with Supabase order integration Supports all four POS order modes with station-specific variants DUAL-MODE ARCHITECTURE: - Electron Mode: Routes to localhost:3000 printer service - Web Mode: Uses thermal_printer_engine (existing behavior) TEMPLATE ASSIGNMENT: - Automatically queries template_assignments by order mode - Uses kitchen_template_id for kitchen tickets - Manual override via template_data still supported - Falls back to default template if no assignment
   *
   * @tags dbtn/module:thermal_printer
   * @name print_kitchen_ticket
   * @summary Print Kitchen Ticket
   * @request POST:/routes/print/kitchen-ticket
   */
  print_kitchen_ticket = (data: KitchenTicketRequest, params: RequestParams = {}) =>
    this.request<PrintKitchenTicketData, PrintKitchenTicketError>({
      path: `/routes/print/kitchen-ticket`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Print customer receipt with Supabase order integration Supports all four POS order modes with order tracking DUAL-MODE ARCHITECTURE: - Electron Mode: Routes to localhost:3000 printer service - Web Mode: Uses thermal_printer_engine (existing behavior) TEMPLATE ASSIGNMENT: - Automatically queries template_assignments by order mode - Uses customer_template_id for FOH receipts - Manual override via template_data still supported - Falls back to default template if no assignment
   *
   * @tags dbtn/module:thermal_printer
   * @name print_customer_receipt
   * @summary Print Customer Receipt
   * @request POST:/routes/print/customer-receipt
   */
  print_customer_receipt = (data: CustomerReceiptRequest, params: RequestParams = {}) =>
    this.request<PrintCustomerReceiptData, PrintCustomerReceiptError>({
      path: `/routes/print/customer-receipt`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Print both kitchen ticket and customer receipt atomically Designed for POSDesktop printing architecture standardization DUAL-MODE ARCHITECTURE: - Electron Mode: Routes to localhost:3000 printer service - Web Mode: Uses thermal_printer_engine (existing behavior)
   *
   * @tags dbtn/module:thermal_printer
   * @name print_kitchen_and_customer
   * @summary Print Kitchen And Customer
   * @request POST:/routes/print/kitchen-and-customer
   */
  print_kitchen_and_customer = (data: KitchenAndCustomerRequest, params: RequestParams = {}) =>
    this.request<PrintKitchenAndCustomerData, PrintKitchenAndCustomerError>({
      path: `/routes/print/kitchen-and-customer`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test print endpoint for thermal printer engine Converted from cottage-tandoori-simple-printer /print/test endpoint
   *
   * @tags dbtn/module:thermal_printer
   * @name thermal_test_print
   * @summary Thermal Test Print
   * @request POST:/routes/print/test
   */
  thermal_test_print = (params: RequestParams = {}) =>
    this.request<ThermalTestPrintData, any>({
      path: `/routes/print/test`,
      method: "POST",
      ...params,
    });

  /**
   * @description View all menu items that have variants to test the complete flow
   *
   * @tags dbtn/module:variants_view
   * @name view_menu_items_with_variants
   * @summary View Menu Items With Variants
   * @request GET:/routes/view-menu-items-with-variants
   */
  view_menu_items_with_variants = (params: RequestParams = {}) =>
    this.request<ViewMenuItemsWithVariantsData, any>({
      path: `/routes/view-menu-items-with-variants`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test endpoint to check how many media assets need variant generation. This is a safe read-only check that doesn't modify anything. Args: limit: Number of sample assets to return (default: 10) Returns: DryRunResult with count and sample of assets needing variants
   *
   * @tags dbtn/module:test_batch_variants
   * @name test_batch_variants_dry_run
   * @summary Test Batch Variants Dry Run
   * @request GET:/routes/test-batch-variants/dry-run
   */
  test_batch_variants_dry_run = (query: TestBatchVariantsDryRunParams, params: RequestParams = {}) =>
    this.request<TestBatchVariantsDryRunData, TestBatchVariantsDryRunError>({
      path: `/routes/test-batch-variants/dry-run`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Internal trigger to run batch variant generation. This endpoint directly executes the generation logic. Args: limit: Optional limit on number of assets to process dry_run: If True, only check what would be processed Returns: Generation results
   *
   * @tags dbtn/module:test_batch_variants
   * @name run_batch_generation
   * @summary Run Batch Generation
   * @request POST:/routes/test-batch-variants/run-generation
   */
  run_batch_generation = (query: RunBatchGenerationParams, params: RequestParams = {}) =>
    this.request<RunBatchGenerationData, RunBatchGenerationError>({
      path: `/routes/test-batch-variants/run-generation`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Create the variant_name auto-generation trigger and function. This trigger automatically generates variant_name in the format: "[PROTEIN_NAME] [ITEM_NAME]" (e.g., "CHICKEN Tikka Masala") FOR BOSS🫡: This fixes the blocker in MYA-1438 where variant_name was NULL causing NOT NULL constraint violations.
   *
   * @tags dbtn/module:variant_trigger_fix
   * @name create_variant_name_trigger
   * @summary Create Variant Name Trigger
   * @request POST:/routes/create-variant-name-trigger
   */
  create_variant_name_trigger = (params: RequestParams = {}) =>
    this.request<CreateVariantNameTriggerData, any>({
      path: `/routes/create-variant-name-trigger`,
      method: "POST",
      ...params,
    });

  /**
   * @description Complete setup for variant_name auto-generation. Steps: 1. Add variant_name column to menu_item_variants 2. Create trigger function generate_variant_name() 3. Install BEFORE INSERT OR UPDATE trigger 4. Backfill existing variants Returns: SetupResponse with success status and completed steps
   *
   * @tags dbtn/module:variant_name_trigger_setup
   * @name setup_variant_name_trigger
   * @summary Setup Variant Name Trigger
   * @request POST:/routes/variant-name-trigger/setup-complete
   */
  setup_variant_name_trigger = (params: RequestParams = {}) =>
    this.request<SetupVariantNameTriggerData, any>({
      path: `/routes/variant-name-trigger/setup-complete`,
      method: "POST",
      ...params,
    });

  /**
   * @description Backfill variant_name for all existing variants in the database. This triggers the generate_variant_name() function for all existing records by performing a dummy UPDATE on each row. Returns: BackfillResponse with count of updated variants
   *
   * @tags dbtn/module:variant_name_trigger_setup
   * @name backfill_existing_variants
   * @summary Backfill Existing Variants
   * @request POST:/routes/variant-name-trigger/backfill-existing-variants
   */
  backfill_existing_variants = (params: RequestParams = {}) =>
    this.request<BackfillExistingVariantsData, any>({
      path: `/routes/variant-name-trigger/backfill-existing-variants`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that the variant_name trigger is properly installed. Checks: 1. variant_name column exists 2. generate_variant_name() function exists 3. set_variant_name_trigger trigger exists 4. Sample variant has variant_name populated Returns: Status of all verification checks
   *
   * @tags dbtn/module:variant_name_trigger_setup
   * @name verify_trigger_setup
   * @summary Verify Trigger Setup
   * @request GET:/routes/variant-name-trigger/verify-setup
   */
  verify_trigger_setup = (params: RequestParams = {}) =>
    this.request<VerifyTriggerSetupData, any>({
      path: `/routes/variant-name-trigger/verify-setup`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add name_pattern column to menu_item_variants table. This enables the variant name pattern cycling feature: - SUFFIX: "Base Name - Protein" (default) - PREFIX: "Protein Base Name" - INFIX: "First Word Protein Remaining Words" - CUSTOM: User's manual input (locked from auto-regeneration)
   *
   * @tags dbtn/module:variant_name_pattern_schema
   * @name setup_variant_name_pattern_schema
   * @summary Setup Variant Name Pattern Schema
   * @request POST:/routes/setup-variant-name-pattern-schema
   */
  setup_variant_name_pattern_schema = (params: RequestParams = {}) =>
    this.request<SetupVariantNamePatternSchemaData, any>({
      path: `/routes/setup-variant-name-pattern-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if name_pattern column exists in menu_item_variants table.
   *
   * @tags dbtn/module:variant_name_pattern_schema
   * @name check_variant_name_pattern_schema
   * @summary Check Variant Name Pattern Schema
   * @request GET:/routes/check-variant-name-pattern-schema
   */
  check_variant_name_pattern_schema = (params: RequestParams = {}) =>
    this.request<CheckVariantNamePatternSchemaData, any>({
      path: `/routes/check-variant-name-pattern-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the complete menu corpus for voice AI agent integration This endpoint returns the complete menu corpus data formatted specifically for AI voice agent platforms. It includes all the fields needed for natural language processing of menu-related queries. Security: Requires authentication with voice AI API key as Bearer token Returns: MenuCorpusResponse: The complete menu corpus with metadata
   *
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name get_menu_corpus
   * @summary Get Menu Corpus
   * @request GET:/routes/menu-corpus
   */
  get_menu_corpus = (params: RequestParams = {}) =>
    this.request<GetMenuCorpusData, GetMenuCorpusError>({
      path: `/routes/menu-corpus`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sync menu corpus data for voice AI agent This endpoint forces a refresh of the menu corpus data and returns the updated corpus. This is useful when menu items have been updated and you want to ensure the voice agent has the latest information. Args: force: Whether to force a refresh of the menu data Security: Requires authentication with voice AI API key as Bearer token Returns: MenuCorpusResponse: The updated menu corpus with metadata
   *
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name sync_menu_corpus
   * @summary Sync Menu Corpus
   * @request POST:/routes/menu-corpus/sync
   */
  sync_menu_corpus = (query: SyncMenuCorpusParams, params: RequestParams = {}) =>
    this.request<SyncMenuCorpusData, SyncMenuCorpusError>({
      path: `/routes/menu-corpus/sync`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Debug endpoint for voice AI agents - no authentication required This endpoint returns a simplified menu structure for debugging voice AI integrations without authentication requirements. Returns: Dict[str, Any]: Simplified menu data for debugging
   *
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name get_menu_corpus_debug
   * @summary Get Menu Corpus Debug
   * @request GET:/routes/menu-corpus/debug
   */
  get_menu_corpus_debug = (params: RequestParams = {}) =>
    this.request<GetMenuCorpusDebugData, any>({
      path: `/routes/menu-corpus/debug`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check the health of the menu corpus system This endpoint verifies if the menu corpus system is working correctly by: 1. Testing database connectivity 2. Checking menu data extraction 3. Verifying authentication is working Security: Requires authentication with voice AI API key as Bearer token Returns: Dict[str, Any]: Health check status and diagnostics
   *
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name get_menu_corpus_health
   * @summary Get Menu Corpus Health
   * @request GET:/routes/menu-corpus/health
   */
  get_menu_corpus_health = (params: RequestParams = {}) =>
    this.request<GetMenuCorpusHealthData, GetMenuCorpusHealthError>({
      path: `/routes/menu-corpus/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add published_at field to menu_items table for draft/live publishing
   *
   * @tags menu-publish, dbtn/module:menu_corpus
   * @name setup_publish_schema
   * @summary Setup Publish Schema
   * @request POST:/routes/setup-publish-schema
   */
  setup_publish_schema = (params: RequestParams = {}) =>
    this.request<SetupPublishSchemaData, any>({
      path: `/routes/setup-publish-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Publish draft menu items to live status This endpoint: 1. Sets published_at = NOW() on all active draft items (published_at IS NULL) 2. Syncs only published items to menu corpus 3. Publishes menu to AI Knowledge Corpus (NEW) 4. Syncs customizations configuration to POS, Online Orders, and Voice Agent 5. Makes changes visible to POS and online menu systems 6. Auto-invalidates menu cache to ensure fresh data Returns: PublishMenuResponse: Status of the publish operation with draft/live counts
   *
   * @tags menu-publish, dbtn/module:menu_corpus
   * @name publish_menu
   * @summary Publish Menu
   * @request POST:/routes/publish-menu
   */
  publish_menu = (params: RequestParams = {}) =>
    this.request<PublishMenuData, any>({
      path: `/routes/publish-menu`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get detailed menu status including draft vs published item counts Provides comprehensive status information for the draft/live publishing system including corpus accessibility and item counts broken down by status. Returns: MenuStatusResponse: Current status with draft/published breakdowns
   *
   * @tags menu-publish, dbtn/module:menu_corpus
   * @name get_menu_status
   * @summary Get Menu Status
   * @request GET:/routes/menu-status
   */
  get_menu_status = (params: RequestParams = {}) =>
    this.request<GetMenuStatusData, any>({
      path: `/routes/menu-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set up the complete infrastructure for profile images
   *
   * @tags dbtn/module:profile_images
   * @name setup_profile_images_infrastructure
   * @summary Setup Profile Images Infrastructure
   * @request POST:/routes/setup-profile-images-infrastructure
   */
  setup_profile_images_infrastructure = (params: RequestParams = {}) =>
    this.request<SetupProfileImagesInfrastructureData, any>({
      path: `/routes/setup-profile-images-infrastructure`,
      method: "POST",
      ...params,
    });

  /**
   * @description Upload and process a profile image for a user with WebP optimization
   *
   * @tags dbtn/module:profile_images
   * @name upload_profile_image
   * @summary Upload Profile Image
   * @request POST:/routes/upload-profile-image
   */
  upload_profile_image = (data: BodyUploadProfileImage, params: RequestParams = {}) =>
    this.request<UploadProfileImageData, UploadProfileImageError>({
      path: `/routes/upload-profile-image`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Sync Google profile image for a user
   *
   * @tags dbtn/module:profile_images
   * @name sync_google_profile_image
   * @summary Sync Google Profile Image
   * @request POST:/routes/sync-google-profile-image
   */
  sync_google_profile_image = (query: SyncGoogleProfileImageParams, params: RequestParams = {}) =>
    this.request<SyncGoogleProfileImageData, SyncGoogleProfileImageError>({
      path: `/routes/sync-google-profile-image`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Delete a user's profile image
   *
   * @tags dbtn/module:profile_images
   * @name delete_profile_image
   * @summary Delete Profile Image
   * @request DELETE:/routes/delete-profile-image
   */
  delete_profile_image = (query: DeleteProfileImageParams, params: RequestParams = {}) =>
    this.request<DeleteProfileImageData, DeleteProfileImageError>({
      path: `/routes/delete-profile-image`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Get current profile image URL for a user
   *
   * @tags dbtn/module:profile_images
   * @name get_profile_image
   * @summary Get Profile Image
   * @request GET:/routes/get-profile-image/{user_id}
   */
  get_profile_image = ({ userId, ...query }: GetProfileImageParams, params: RequestParams = {}) =>
    this.request<GetProfileImageData, GetProfileImageError>({
      path: `/routes/get-profile-image/${userId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload avatar photo for the primary agent and persist URL with WebP optimization. - Validates file type (jpg, png, webp) - Validates file size (max 2MB) - Generates optimized WebP + JPEG variants (standard 400x400 + thumbnail 100x100) - Uploads to Supabase Storage bucket 'agent-avatars' - Updates unified_agent_config.agent_avatar_url - Also ensures voice_agent_profiles.avatar_url column exists and updates the default agent if present - Returns public URL
   *
   * @tags dbtn/module:primary_agent_config
   * @name upload_primary_agent_avatar
   * @summary Upload Primary Agent Avatar
   * @request POST:/routes/primary-agent-config/avatar
   */
  upload_primary_agent_avatar = (data: BodyUploadPrimaryAgentAvatar, params: RequestParams = {}) =>
    this.request<UploadPrimaryAgentAvatarData, UploadPrimaryAgentAvatarError>({
      path: `/routes/primary-agent-config/avatar`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Validate that media asset IDs exist in the media_assets table. This endpoint is used for pre-submission validation to prevent foreign key violations when creating or updating menu items with media references. Returns: - List of validation results for each asset ID - Overall validation status - Friendly names for valid assets
   *
   * @tags dbtn/module:media_assets_validation
   * @name validate_media_assets
   * @summary Validate Media Assets
   * @request POST:/routes/validate-media-assets
   */
  validate_media_assets = (data: ValidateAssetsRequest, params: RequestParams = {}) =>
    this.request<ValidateMediaAssetsData, ValidateMediaAssetsError>({
      path: `/routes/validate-media-assets`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a media asset is currently being used by any menu items. This is used for cascade protection before deletion. Returns: - is_linked: Whether the asset is referenced by any menu items - usage_count: Number of menu items using this asset - menu_items: List of menu items using this asset
   *
   * @tags dbtn/module:media_assets_validation
   * @name check_media_asset_usage
   * @summary Check Media Asset Usage
   * @request POST:/routes/check-media-asset-usage
   */
  check_media_asset_usage = (query: CheckMediaAssetUsageParams, params: RequestParams = {}) =>
    this.request<CheckMediaAssetUsageData, CheckMediaAssetUsageError>({
      path: `/routes/check-media-asset-usage`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Upload and optimize menu item image. Process: 1. Validate file type and size 2. Optimize and compress image 3. Generate thumbnail 4. Upload to Supabase Storage 5. Create media_assets record 6. Return asset_id and URLs Sensible Defaults: - Max upload: 5MB - Target size: 500KB for full image, 50KB for thumbnail - Dimensions: 800x600 full, 200x150 thumbnail - Format: WebP for maximum compression
   *
   * @tags dbtn/module:menu_image_upload
   * @name upload_menu_item_image
   * @summary Upload Menu Item Image
   * @request POST:/routes/menu-image-upload/upload
   */
  upload_menu_item_image = (data: BodyUploadMenuItemImage, params: RequestParams = {}) =>
    this.request<UploadMenuItemImageData, UploadMenuItemImageError>({
      path: `/routes/menu-image-upload/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Health check endpoint
   *
   * @tags dbtn/module:menu_image_upload
   * @name menu_image_upload_health
   * @summary Menu Image Upload Health
   * @request GET:/routes/menu-image-upload/health
   */
  menu_image_upload_health = (params: RequestParams = {}) =>
    this.request<MenuImageUploadHealthData, any>({
      path: `/routes/menu-image-upload/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload menu item image with WebP optimization and variant generation
   *
   * @tags dbtn/module:unified_media_storage
   * @name upload_menu_image
   * @summary Upload Menu Image
   * @request POST:/routes/unified-media/upload/menu-image
   */
  upload_menu_image = (data: BodyUploadMenuImage, params: RequestParams = {}) =>
    this.request<UploadMenuImageData, UploadMenuImageError>({
      path: `/routes/unified-media/upload/menu-image`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Upload avatar image with WebP optimization (Infrastructure Layer - no agent linking)
   *
   * @tags dbtn/module:unified_media_storage
   * @name upload_avatar
   * @summary Upload Avatar
   * @request POST:/routes/unified-media/upload/avatar
   */
  upload_avatar = (data: BodyUploadAvatar, params: RequestParams = {}) =>
    this.request<UploadAvatarData, UploadAvatarError>({
      path: `/routes/unified-media/upload/avatar`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Upload general file to storage with asset categorization and WebP optimization for images
   *
   * @tags dbtn/module:unified_media_storage
   * @name upload_general_file
   * @summary Upload General File
   * @request POST:/routes/unified-media/upload/general
   */
  upload_general_file = (data: BodyUploadGeneralFile, params: RequestParams = {}) =>
    this.request<UploadGeneralFileData, UploadGeneralFileError>({
      path: `/routes/unified-media/upload/general`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Get media library with filtering and pagination
   *
   * @tags dbtn/module:unified_media_storage
   * @name get_media_library
   * @summary Get Media Library
   * @request GET:/routes/unified-media/library/list
   */
  get_media_library = (query: GetMediaLibraryParams, params: RequestParams = {}) =>
    this.request<GetMediaLibraryData, GetMediaLibraryError>({
      path: `/routes/unified-media/library/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get recently uploaded media assets
   *
   * @tags dbtn/module:unified_media_storage
   * @name get_recent_media_assets
   * @summary Get Recent Media Assets
   * @request GET:/routes/unified-media/library/recent
   */
  get_recent_media_assets = (query: GetRecentMediaAssetsParams, params: RequestParams = {}) =>
    this.request<GetRecentMediaAssetsData, GetRecentMediaAssetsError>({
      path: `/routes/unified-media/library/recent`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get specific media asset details
   *
   * @tags dbtn/module:unified_media_storage
   * @name get_media_asset
   * @summary Get Media Asset
   * @request GET:/routes/unified-media/asset/{asset_id}
   */
  get_media_asset = ({ assetId, ...query }: GetMediaAssetParams, params: RequestParams = {}) =>
    this.request<GetMediaAssetData, GetMediaAssetError>({
      path: `/routes/unified-media/asset/${assetId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update media asset metadata
   *
   * @tags dbtn/module:unified_media_storage
   * @name update_media_asset
   * @summary Update Media Asset
   * @request PUT:/routes/unified-media/asset/{asset_id}
   */
  update_media_asset = (
    { assetId, ...query }: UpdateMediaAssetParams,
    data: UpdateMediaAssetPayload,
    params: RequestParams = {},
  ) =>
    this.request<UpdateMediaAssetData, UpdateMediaAssetError>({
      path: `/routes/unified-media/asset/${assetId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete media asset and its files
   *
   * @tags dbtn/module:unified_media_storage
   * @name delete_media_asset
   * @summary Delete Media Asset
   * @request DELETE:/routes/unified-media/asset/{asset_id}
   */
  delete_media_asset = ({ assetId, ...query }: DeleteMediaAssetParams, params: RequestParams = {}) =>
    this.request<DeleteMediaAssetData, DeleteMediaAssetError>({
      path: `/routes/unified-media/asset/${assetId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Link media asset to menu item and auto-sync hierarchical metadata
   *
   * @tags dbtn/module:unified_media_storage
   * @name link_media_to_menu_item
   * @summary Link Media To Menu Item
   * @request POST:/routes/unified-media/link/menu-item
   */
  link_media_to_menu_item = (data: MediaLinkRequest, params: RequestParams = {}) =>
    this.request<LinkMediaToMenuItemData, LinkMediaToMenuItemError>({
      path: `/routes/unified-media/link/menu-item`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Remove media link
   *
   * @tags dbtn/module:unified_media_storage
   * @name unlink_media
   * @summary Unlink Media
   * @request DELETE:/routes/unified-media/link/{link_id}
   */
  unlink_media = ({ linkId, ...query }: UnlinkMediaParams, params: RequestParams = {}) =>
    this.request<UnlinkMediaData, UnlinkMediaError>({
      path: `/routes/unified-media/link/${linkId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Bulk update tags for multiple media assets
   *
   * @tags dbtn/module:unified_media_storage
   * @name bulk_update_media_tags
   * @summary Bulk Update Media Tags
   * @request POST:/routes/unified-media/bulk/update-tags
   */
  bulk_update_media_tags = (data: MediaBulkUpdateRequest, params: RequestParams = {}) =>
    this.request<BulkUpdateMediaTagsData, BulkUpdateMediaTagsError>({
      path: `/routes/unified-media/bulk/update-tags`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get storage system status and usage
   *
   * @tags dbtn/module:unified_media_storage
   * @name get_storage_status
   * @summary Get Storage Status
   * @request GET:/routes/unified-media/storage/status
   */
  get_storage_status = (params: RequestParams = {}) =>
    this.request<GetStorageStatusData, any>({
      path: `/routes/unified-media/storage/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Clean up orphaned media files (assets without links)
   *
   * @tags dbtn/module:unified_media_storage
   * @name cleanup_orphaned_media
   * @summary Cleanup Orphaned Media
   * @request POST:/routes/unified-media/storage/cleanup-orphaned
   */
  cleanup_orphaned_media = (params: RequestParams = {}) =>
    this.request<CleanupOrphanedMediaData, any>({
      path: `/routes/unified-media/storage/cleanup-orphaned`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get media usage analytics
   *
   * @tags dbtn/module:unified_media_storage
   * @name get_media_usage_summary
   * @summary Get Media Usage Summary
   * @request GET:/routes/unified-media/usage/summary
   */
  get_media_usage_summary = (params: RequestParams = {}) =>
    this.request<GetMediaUsageSummaryData, any>({
      path: `/routes/unified-media/usage/summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set up the required 'media_assets' and 'media_links' tables in Supabase. This endpoint is idempotent and can be safely run multiple times.
   *
   * @tags dbtn/module:unified_media_storage
   * @name setup_unified_media_schema
   * @summary Setup Unified Media Schema
   * @request POST:/routes/unified-media/storage/setup-schema
   */
  setup_unified_media_schema = (params: RequestParams = {}) =>
    this.request<SetupUnifiedMediaSchemaData, any>({
      path: `/routes/unified-media/storage/setup-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check avatar count against 8-avatar limit (Business Logic Layer)
   *
   * @tags dbtn/module:unified_media_storage
   * @name validate_avatar_limit
   * @summary Validate Avatar Limit
   * @request GET:/routes/unified-media/avatars/validate-limit
   */
  validate_avatar_limit = (params: RequestParams = {}) =>
    this.request<ValidateAvatarLimitData, any>({
      path: `/routes/unified-media/avatars/validate-limit`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get media library organized by hierarchy. Returns: - Menu images: nested by section → category - Menu orphans: menu items without section/category - AI avatars: all avatar images - AI avatar orphans: avatars not linked to agents - General media: other assets
   *
   * @tags dbtn/module:media_library_hierarchical
   * @name get_hierarchical_media
   * @summary Get Hierarchical Media
   * @request GET:/routes/hierarchical
   */
  get_hierarchical_media = (params: RequestParams = {}) =>
    this.request<GetHierarchicalMediaData, any>({
      path: `/routes/hierarchical`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get quick statistics about media organization.
   *
   * @tags dbtn/module:media_library_hierarchical
   * @name get_hierarchical_stats
   * @summary Get Hierarchical Stats
   * @request GET:/routes/hierarchical/stats
   */
  get_hierarchical_stats = (params: RequestParams = {}) =>
    this.request<GetHierarchicalStatsData, any>({
      path: `/routes/hierarchical/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Import avatar files from Supabase storage into media_assets table. Scans the 'avatars/avatars/' folder and creates media_assets records. Returns: Summary of import operation including count of avatars imported.
   *
   * @tags dbtn/module:media_library_hierarchical
   * @name import_avatars_from_storage
   * @summary Import Avatars From Storage
   * @request POST:/routes/import-avatars-from-storage
   */
  import_avatars_from_storage = (params: RequestParams = {}) =>
    this.request<ImportAvatarsFromStorageData, any>({
      path: `/routes/import-avatars-from-storage`,
      method: "POST",
      ...params,
    });

  /**
   * @description Initialize the POS settings table
   *
   * @tags dbtn/module:pos_settings
   * @name init_pos_settings
   * @summary Init Pos Settings
   * @request POST:/routes/pos-settings/init
   */
  init_pos_settings = (params: RequestParams = {}) =>
    this.request<InitPosSettingsData, any>({
      path: `/routes/pos-settings/init`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get POS settings
   *
   * @tags dbtn/module:pos_settings
   * @name get_pos_settings
   * @summary Get Pos Settings
   * @request GET:/routes/pos-settings
   */
  get_pos_settings = (params: RequestParams = {}) =>
    this.request<GetPosSettingsData, any>({
      path: `/routes/pos-settings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Save POS settings
   *
   * @tags dbtn/module:pos_settings
   * @name save_pos_settings
   * @summary Save Pos Settings
   * @request POST:/routes/pos-settings
   */
  save_pos_settings = (data: SavePOSSettingsRequest, params: RequestParams = {}) =>
    this.request<SavePosSettingsData, SavePosSettingsError>({
      path: `/routes/pos-settings`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get diagnostic information about the POS settings table
   *
   * @tags dbtn/module:pos_settings
   * @name pos_settings_diagnostics
   * @summary Pos Settings Diagnostics
   * @request GET:/routes/pos-settings/diagnostics
   */
  pos_settings_diagnostics = (params: RequestParams = {}) =>
    this.request<PosSettingsDiagnosticsData, any>({
      path: `/routes/pos-settings/diagnostics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add food-specific detail columns to menu_item_variants table. Adds: spice_level, allergens, allergen_notes
   *
   * @tags dbtn/module:variant_food_details_schema
   * @name setup_variant_food_details_schema
   * @summary Setup Variant Food Details Schema
   * @request POST:/routes/setup-variant-food-details-schema
   */
  setup_variant_food_details_schema = (params: RequestParams = {}) =>
    this.request<SetupVariantFoodDetailsSchemaData, any>({
      path: `/routes/setup-variant-food-details-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if food-specific detail columns exist in menu_item_variants table.
   *
   * @tags dbtn/module:variant_food_details_schema
   * @name check_variant_food_details_schema
   * @summary Check Variant Food Details Schema
   * @request GET:/routes/check-variant-food-details-schema
   */
  check_variant_food_details_schema = (params: RequestParams = {}) =>
    this.request<CheckVariantFoodDetailsSchemaData, any>({
      path: `/routes/check-variant-food-details-schema`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all menu items with variants and categories
   *
   * @tags dbtn/module:unified_menu_operations
   * @name get_menu_items
   * @summary Get Menu Items
   * @request GET:/routes/unified-menu/items
   */
  get_menu_items = (params: RequestParams = {}) =>
    this.request<GetMenuItemsData, any>({
      path: `/routes/unified-menu/items`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new menu item
   *
   * @tags dbtn/module:unified_menu_operations
   * @name create_menu_item
   * @summary Create Menu Item
   * @request POST:/routes/unified-menu/items
   */
  create_menu_item = (data: MenuItemBase, params: RequestParams = {}) =>
    this.request<CreateMenuItemData, CreateMenuItemError>({
      path: `/routes/unified-menu/items`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update an existing menu item and its pricing data
   *
   * @tags dbtn/module:unified_menu_operations
   * @name update_menu_item
   * @summary Update Menu Item
   * @request PUT:/routes/unified-menu/items/{item_id}
   */
  update_menu_item = ({ itemId, ...query }: UpdateMenuItemParams, data: MenuItemUpdate, params: RequestParams = {}) =>
    this.request<UpdateMenuItemData, UpdateMenuItemError>({
      path: `/routes/unified-menu/items/${itemId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a menu item by ID
   *
   * @tags dbtn/module:unified_menu_operations
   * @name delete_menu_item
   * @summary Delete Menu Item
   * @request DELETE:/routes/unified-menu/items/{item_id}
   */
  delete_menu_item = ({ itemId, ...query }: DeleteMenuItemParams, params: RequestParams = {}) =>
    this.request<DeleteMenuItemData, DeleteMenuItemError>({
      path: `/routes/unified-menu/items/${itemId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Bulk delete categories, proteins, or menu items
   *
   * @tags dbtn/module:unified_menu_operations
   * @name bulk_delete_items
   * @summary Bulk Delete Items
   * @request POST:/routes/unified-menu/bulk/delete
   */
  bulk_delete_items = (data: AppApisUnifiedMenuOperationsBulkDeleteRequest, params: RequestParams = {}) =>
    this.request<BulkDeleteItemsData, BulkDeleteItemsError>({
      path: `/routes/unified-menu/bulk/delete`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Bulk toggle active status for categories, proteins, or menu items
   *
   * @tags dbtn/module:unified_menu_operations
   * @name bulk_toggle_active
   * @summary Bulk Toggle Active
   * @request POST:/routes/unified-menu/bulk/toggle
   */
  bulk_toggle_active = (data: BulkToggleRequest, params: RequestParams = {}) =>
    this.request<BulkToggleActiveData, BulkToggleActiveError>({
      path: `/routes/unified-menu/bulk/toggle`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a single category, protein, or menu item
   *
   * @tags dbtn/module:unified_menu_operations
   * @name delete_single_item
   * @summary Delete Single Item
   * @request POST:/routes/unified-menu/single/delete
   */
  delete_single_item = (data: DeleteItemRequest, params: RequestParams = {}) =>
    this.request<DeleteSingleItemData, DeleteSingleItemError>({
      path: `/routes/unified-menu/single/delete`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all menu categories
   *
   * @tags dbtn/module:unified_menu_operations
   * @name get_categories
   * @summary Get Categories
   * @request GET:/routes/unified-menu/categories
   */
  get_categories = (params: RequestParams = {}) =>
    this.request<GetCategoriesData, any>({
      path: `/routes/unified-menu/categories`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all protein types
   *
   * @tags dbtn/module:unified_menu_operations
   * @name get_protein_types
   * @summary Get Protein Types
   * @request GET:/routes/unified-menu/proteins
   */
  get_protein_types = (params: RequestParams = {}) =>
    this.request<GetProteinTypesData, any>({
      path: `/routes/unified-menu/proteins`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add is_available column to menu_items table
   *
   * @tags dbtn/module:fix_menu_is_available
   * @name add_is_available_column
   * @summary Add Is Available Column
   * @request POST:/routes/add-is-available-column
   */
  add_is_available_column = (params: RequestParams = {}) =>
    this.request<AddIsAvailableColumnData, any>({
      path: `/routes/add-is-available-column`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if is_available column exists
   *
   * @tags dbtn/module:fix_menu_is_available
   * @name check_is_available_column
   * @summary Check Is Available Column
   * @request GET:/routes/check-is-available-column
   */
  check_is_available_column = (params: RequestParams = {}) =>
    this.request<CheckIsAvailableColumnData, any>({
      path: `/routes/check-is-available-column`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the next display order for a category
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_next_display_order
   * @summary Get Next Display Order
   * @request POST:/routes/unified-menu-business/ordering/next-display-order
   */
  get_next_display_order = (data: NextOrderRequest, params: RequestParams = {}) =>
    this.request<GetNextDisplayOrderData, GetNextDisplayOrderError>({
      path: `/routes/unified-menu-business/ordering/next-display-order`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the next display order for a menu item within a category
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_next_item_display_order
   * @summary Get Next Item Display Order
   * @request POST:/routes/unified-menu-business/ordering/next-item-display-order
   */
  get_next_item_display_order = (data: NextOrderRequest, params: RequestParams = {}) =>
    this.request<GetNextItemDisplayOrderData, GetNextItemDisplayOrderError>({
      path: `/routes/unified-menu-business/ordering/next-item-display-order`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Reorder category siblings
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name reorder_siblings
   * @summary Reorder Siblings
   * @request POST:/routes/unified-menu-business/ordering/reorder-siblings
   */
  reorder_siblings = (data: ReorderRequest, params: RequestParams = {}) =>
    this.request<ReorderSiblingsData, ReorderSiblingsError>({
      path: `/routes/unified-menu-business/ordering/reorder-siblings`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get menu structure with proper ordering (with caching) Returns menu items with variants including: - Variant-level dietary tags (is_vegetarian, is_vegan, is_gluten_free, is_halal, is_dairy_free, is_nut_free) - Variant-level featured flag - Base item featured flag - All 6 optimized image variants - Protein type enrichment - Display image/description inheritance
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_menu_with_ordering
   * @summary Get Menu With Ordering
   * @request GET:/routes/unified-menu-business/ordering/menu-with-ordering
   */
  get_menu_with_ordering = (params: RequestParams = {}) =>
    this.request<GetMenuWithOrderingData, any>({
      path: `/routes/unified-menu-business/ordering/menu-with-ordering`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a menu item variant with detailed pricing breakdown
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name update_variant_pricing
   * @summary Update Variant Pricing
   * @request POST:/routes/unified-menu-business/pricing/update-variant
   */
  update_variant_pricing = (data: PriceBreakdownRequest, params: RequestParams = {}) =>
    this.request<UpdateVariantPricingData, UpdateVariantPricingError>({
      path: `/routes/unified-menu-business/pricing/update-variant`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Batch update pricing for multiple variants
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name batch_update_pricing
   * @summary Batch Update Pricing
   * @request POST:/routes/unified-menu-business/pricing/batch-update
   */
  batch_update_pricing = (data: BatchPricingRequest, params: RequestParams = {}) =>
    this.request<BatchUpdatePricingData, BatchUpdatePricingError>({
      path: `/routes/unified-menu-business/pricing/batch-update`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Apply category template structure to existing categories
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name apply_category_template
   * @summary Apply Category Template
   * @request POST:/routes/unified-menu-business/templates/apply-category-template
   */
  apply_category_template = (data: TemplateApplicationRequest, params: RequestParams = {}) =>
    this.request<ApplyCategoryTemplateData, ApplyCategoryTemplateError>({
      path: `/routes/unified-menu-business/templates/apply-category-template`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current template application status
   *
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_template_status
   * @summary Get Template Status
   * @request GET:/routes/unified-menu-business/templates/template-status
   */
  get_template_status = (params: RequestParams = {}) =>
    this.request<GetTemplateStatusData, any>({
      path: `/routes/unified-menu-business/templates/template-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create the Supabase cart table with proper schema and constraints. Schema Design: - Supports both guest (session_id) and authenticated (user_id) carts - Stores full menu item data for display - Handles variants (e.g., protein type for curry dishes) - Supports customizations via notes field - Dual pricing for delivery vs collection modes - Automatic deduplication via UNIQUE constraint - Real-time broadcast enabled for live updates Returns: CartSetupResponse with success status and migration details
   *
   * @tags dbtn/module:cart_setup
   * @name create_cart_table
   * @summary Create Cart Table
   * @request POST:/routes/create-cart-table
   */
  create_cart_table = (params: RequestParams = {}) =>
    this.request<CreateCartTableData, any>({
      path: `/routes/create-cart-table`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if cart table exists and get schema info. Returns: Dict with table existence status and column details
   *
   * @tags dbtn/module:cart_setup
   * @name get_cart_table_status
   * @summary Get Cart Table Status
   * @request GET:/routes/cart-table-status
   */
  get_cart_table_status = (params: RequestParams = {}) =>
    this.request<GetCartTableStatusData, any>({
      path: `/routes/cart-table-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add item to cart with intelligent menu search. If item has variants and no variant_id provided, returns variants list for user clarification.
   *
   * @tags dbtn/module:cart_operations
   * @name add_item_to_cart
   * @summary Add Item To Cart
   * @request POST:/routes/cart-operations/add-item
   */
  add_item_to_cart = (data: AddItemRequest, params: RequestParams = {}) =>
    this.request<AddItemToCartData, AddItemToCartError>({
      path: `/routes/cart-operations/add-item`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Remove item from cart by name or ID. Writes directly to Supabase cart table.
   *
   * @tags dbtn/module:cart_operations
   * @name remove_item_from_cart
   * @summary Remove Item From Cart
   * @request POST:/routes/cart-operations/remove-item
   */
  remove_item_from_cart = (data: RemoveItemRequest, params: RequestParams = {}) =>
    this.request<RemoveItemFromCartData, RemoveItemFromCartError>({
      path: `/routes/cart-operations/remove-item`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update quantity of item in cart. Writes directly to Supabase cart table.
   *
   * @tags dbtn/module:cart_operations
   * @name update_item_quantity
   * @summary Update Item Quantity
   * @request POST:/routes/cart-operations/update-quantity
   */
  update_item_quantity = (data: UpdateQuantityRequest, params: RequestParams = {}) =>
    this.request<UpdateItemQuantityData, UpdateItemQuantityError>({
      path: `/routes/cart-operations/update-quantity`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update customizations for an item in cart. Frontend provides current cart state via cart_context.
   *
   * @tags dbtn/module:cart_operations
   * @name update_item_customizations
   * @summary Update Item Customizations
   * @request POST:/routes/cart-operations/update-customizations
   */
  update_item_customizations = (data: UpdateCustomizationsRequest, params: RequestParams = {}) =>
    this.request<UpdateItemCustomizationsData, UpdateItemCustomizationsError>({
      path: `/routes/cart-operations/update-customizations`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get formatted cart summary. Frontend provides current cart state via cart_context.
   *
   * @tags dbtn/module:cart_operations
   * @name get_cart_summary
   * @summary Get Cart Summary
   * @request POST:/routes/cart-operations/get-summary
   */
  get_cart_summary = (data: GetSummaryRequest, params: RequestParams = {}) =>
    this.request<GetCartSummaryData, GetCartSummaryError>({
      path: `/routes/cart-operations/get-summary`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Clear all items from cart. Writes directly to Supabase to delete all cart items for this session/user.
   *
   * @tags dbtn/module:cart_operations
   * @name clear_cart
   * @summary Clear Cart
   * @request POST:/routes/cart-operations/clear-all
   */
  clear_cart = (data: ClearCartRequest, params: RequestParams = {}) =>
    this.request<ClearCartData, ClearCartError>({
      path: `/routes/cart-operations/clear-all`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get cart items for a user or session.
   *
   * @tags dbtn/module:cart_operations
   * @name get_cart
   * @summary Get Cart
   * @request GET:/routes/cart-operations/get-cart
   */
  get_cart = (query: GetCartParams, params: RequestParams = {}) =>
    this.request<GetCartData, GetCartError>({
      path: `/routes/cart-operations/get-cart`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Upload and optimize menu item image with automatic variant generation. This endpoint: 1. Validates file type and size 2. Generates 3 size variants (square, widescreen, thumbnail) 3. Converts each to WebP (primary) and JPEG (fallback) 4. Uploads all 6 files to Supabase Storage 5. Returns URLs and metadata for all variants Max upload size: 15MB Accepted formats: JPEG, PNG, WebP Generated variants: Square (800x800), Widescreen (1200x675), Thumbnail (200x200) Output formats: WebP + JPEG per variant
   *
   * @tags dbtn/module:menu_media_optimizer
   * @name upload_optimized_menu_image
   * @summary Upload Optimized Menu Image
   * @request POST:/routes/upload-optimized
   */
  upload_optimized_menu_image = (data: BodyUploadOptimizedMenuImage, params: RequestParams = {}) =>
    this.request<UploadOptimizedMenuImageData, UploadOptimizedMenuImageError>({
      path: `/routes/upload-optimized`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Simple health check endpoint
   *
   * @tags dbtn/module:menu_media_optimizer
   * @name menu_media_optimizer_health_check
   * @summary Menu Media Optimizer Health Check
   * @request GET:/routes/menu-media/health
   */
  menu_media_optimizer_health_check = (params: RequestParams = {}) =>
    this.request<MenuMediaOptimizerHealthCheckData, any>({
      path: `/routes/menu-media/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Batch generate all 6 variants (WebP/JPEG × square/widescreen/thumbnail) for existing media_assets that don't have variants yet. This is a one-time migration endpoint to backfill variant URLs. Args: limit: Optional limit on number of assets to process (for testing) dry_run: If True, only check what would be processed without uploading asset_type: Optional filter by media_assets.type (e.g., 'image', 'general') Returns: BatchGenerationResponse with results for each processed asset
   *
   * @tags dbtn/module:menu_media_optimizer
   * @name batch_generate_variants
   * @summary Batch Generate Variants
   * @request POST:/routes/batch-generate-variants
   */
  batch_generate_variants = (query: BatchGenerateVariantsParams, params: RequestParams = {}) =>
    this.request<BatchGenerateVariantsData, BatchGenerateVariantsError>({
      path: `/routes/batch-generate-variants`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Add terminal payment tracking columns to orders table Columns: - transaction_id: Unique ID for terminal payment request - psp_reference: Adyen payment reference - terminal_payment_status: Status of terminal payment (PENDING, APPROVED, DECLINED, etc.) - terminal_payment_sent_at: Timestamp when payment request was sent - terminal_payment_completed_at: Timestamp when payment was completed
   *
   * @tags dbtn/module:database_setup
   * @name add_terminal_payment_columns
   * @summary Add Terminal Payment Columns
   * @request POST:/routes/add-terminal-payment-columns
   */
  add_terminal_payment_columns = (params: RequestParams = {}) =>
    this.request<AddTerminalPaymentColumnsData, any>({
      path: `/routes/add-terminal-payment-columns`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that terminal payment columns exist and are properly indexed
   *
   * @tags dbtn/module:database_setup
   * @name verify_terminal_payment_schema
   * @summary Verify Terminal Payment Schema
   * @request POST:/routes/verify-terminal-payment-schema
   */
  verify_terminal_payment_schema = (params: RequestParams = {}) =>
    this.request<VerifyTerminalPaymentSchemaData, any>({
      path: `/routes/verify-terminal-payment-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Add missing columns to cart table for AI integration. Adds: - variant_id: Optional FK to menu_item_variants - notes: Customer special instructions - order_mode: 'delivery' or 'collection' for pricing - price_delivery: Cached delivery price - price_collection: Cached collection price - user_id: Optional FK to auth.users for authenticated users
   *
   * @tags dbtn/module:database_setup
   * @name add_cart_ai_columns
   * @summary Add Cart Ai Columns
   * @request POST:/routes/add-cart-ai-columns
   */
  add_cart_ai_columns = (params: RequestParams = {}) =>
    this.request<AddCartAiColumnsData, any>({
      path: `/routes/add-cart-ai-columns`,
      method: "POST",
      ...params,
    });

  /**
   * @description Verify that cart table has all columns needed for AI integration
   *
   * @tags dbtn/module:database_setup
   * @name verify_cart_ai_schema
   * @summary Verify Cart Ai Schema
   * @request POST:/routes/verify-cart-ai-schema
   */
  verify_cart_ai_schema = (params: RequestParams = {}) =>
    this.request<VerifyCartAiSchemaData, any>({
      path: `/routes/verify-cart-ai-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Drop UNIQUE constraint on cart table to allow items with different customizations. MYA-1550: Previously, cart enforced UNIQUE(user_id, session_id, menu_item_id, variant_id) which prevented adding the same item with different customizations. Now we remove this constraint so: - Same item + different customizations = separate cart entries - Uniqueness is determined by comparing customizations JSON Returns: dict: Status of constraint removal
   *
   * @tags dbtn/module:database_setup
   * @name drop_cart_unique_constraint
   * @summary Drop Cart Unique Constraint
   * @request POST:/routes/drop-cart-unique-constraint
   */
  drop_cart_unique_constraint = (params: RequestParams = {}) =>
    this.request<DropCartUniqueConstraintData, any>({
      path: `/routes/drop-cart-unique-constraint`,
      method: "POST",
      ...params,
    });

  /**
   * @description End-to-end test for customization support. Tests: 1. Add same item with different customizations → separate entries 2. Add same item with same customizations → quantity update 3. Verify cart returns customizations correctly Args: test_session_id: Custom session ID for testing (auto-generated if not provided) Returns: dict: Test results with pass/fail status
   *
   * @tags dbtn/module:cart_customization_test
   * @name test_customizations_end_to_end
   * @summary Test Customizations End To End
   * @request POST:/routes/test-customizations-e2e
   */
  test_customizations_end_to_end = (query: TestCustomizationsEndToEndParams, params: RequestParams = {}) =>
    this.request<TestCustomizationsEndToEndData, TestCustomizationsEndToEndError>({
      path: `/routes/test-customizations-e2e`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Same test as above but with a REAL menu item ID. Args: menu_item_id: Actual menu item UUID from menu_items table test_session_id: Custom session ID for testing Returns: dict: Test results
   *
   * @tags dbtn/module:cart_customization_test
   * @name test_customizations_with_real_item
   * @summary Test Customizations With Real Item
   * @request POST:/routes/test-customizations-with-real-item
   */
  test_customizations_with_real_item = (query: TestCustomizationsWithRealItemParams, params: RequestParams = {}) =>
    this.request<TestCustomizationsWithRealItemData, TestCustomizationsWithRealItemError>({
      path: `/routes/test-customizations-with-real-item`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Verify schema fix: items with different customizations can be separate entries. MYA-1550: After dropping UNIQUE constraint, this test should pass. Tests: 1. Fetch real menu item from database 2. Add with customization set A → should insert 3. Add with customization set B → should insert (NEW separate entry) 4. Get cart → should show 2 entries with different customizations Returns: dict: Test results
   *
   * @tags dbtn/module:cart_customization_test
   * @name test_customizations_schema_fix
   * @summary Test Customizations Schema Fix
   * @request POST:/routes/test-customizations-schema-fix
   */
  test_customizations_schema_fix = (params: RequestParams = {}) =>
    this.request<TestCustomizationsSchemaFixData, any>({
      path: `/routes/test-customizations-schema-fix`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get current cart contents for AI chat awareness This enables the AI to access and reference cart contents during conversations. Returns cart summary that can be included in AI context. ✅ MYA-1550: Now includes customizations in cart context
   *
   * @tags dbtn/module:chat_cart_context
   * @name get_chat_cart_context
   * @summary Get Chat Cart Context
   * @request POST:/routes/chat-cart-context/get-cart-context
   */
  get_chat_cart_context = (data: CartContextRequest, params: RequestParams = {}) =>
    this.request<GetChatCartContextData, GetChatCartContextError>({
      path: `/routes/chat-cart-context/get-cart-context`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a natural language summary of the current cart for AI responses
   *
   * @tags dbtn/module:chat_cart_context
   * @name get_cart_summary_text
   * @summary Get Cart Summary Text
   * @request GET:/routes/chat-cart-context/cart-summary-text
   */
  get_cart_summary_text = (query: GetCartSummaryTextParams, params: RequestParams = {}) =>
    this.request<GetCartSummaryTextData, GetCartSummaryTextError>({
      path: `/routes/chat-cart-context/cart-summary-text`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Health check for chat cart context API
   *
   * @tags dbtn/module:chat_cart_context
   * @name chat_cart_context_health
   * @summary Chat Cart Context Health
   * @request GET:/routes/chat-cart-context/health
   */
  chat_cart_context_health = (params: RequestParams = {}) =>
    this.request<ChatCartContextHealthData, any>({
      path: `/routes/chat-cart-context/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate a dynamic system prompt from the primary unified agent config. Supports both chat and voice channels with channel-specific customization. Now includes AI Knowledge Corpus menu injection and live restaurant data. NEW: Returns structured response with: - user_portion: Editable personality/style customization (safe to edit) - complete_prompt: Full assembled prompt with CORE instructions (read-only preview)
   *
   * @tags dbtn/module:prompt_generator
   * @name generate_system_prompt
   * @summary Generate System Prompt
   * @request GET:/routes/generate-system-prompt
   */
  generate_system_prompt = (query: GenerateSystemPromptParams, params: RequestParams = {}) =>
    this.request<GenerateSystemPromptData, GenerateSystemPromptError>({
      path: `/routes/generate-system-prompt`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Generate a preview system prompt with custom agent configuration. Useful for testing different agent personalities before saving to database. This endpoint allows you to preview prompts without affecting the production unified_agent_config. Optionally include a menu snapshot to test menu injection.
   *
   * @tags dbtn/module:prompt_generator
   * @name preview_prompt
   * @summary Preview Prompt
   * @request POST:/routes/preview-prompt
   */
  preview_prompt = (data: PreviewPromptRequest, params: RequestParams = {}) =>
    this.request<PreviewPromptData, PreviewPromptError>({
      path: `/routes/preview-prompt`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint for prompt generator service. Returns status of agent config, menu corpus, and last generation time.
   *
   * @tags dbtn/module:prompt_generator
   * @name prompt_generator_health
   * @summary Prompt Generator Health
   * @request GET:/routes/prompt-generator-health
   */
  prompt_generator_health = (params: RequestParams = {}) =>
    this.request<PromptGeneratorHealthData, any>({
      path: `/routes/prompt-generator-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create the get_menu_items_with_variants_rpc() Postgres function. This RPC function optimizes menu search by moving all filtering logic server-side, eliminating SDK overhead. Parameters: - p_category: Filter by menu section (e.g., 'STARTERS', 'MAIN COURSE') - p_dietary_filter: Filter by dietary requirement ('vegetarian', 'vegan', 'gluten-free') - p_search_query: Free-text search in item names - p_order_mode: Pricing mode ('delivery', 'collection', 'dine_in') Returns: JSONB with unified list of items (both standalone and variants)
   *
   * @tags dbtn/module:menu_rpc_setup
   * @name create_menu_variants_rpc
   * @summary Create Menu Variants Rpc
   * @request POST:/routes/create-menu-variants-rpc
   */
  create_menu_variants_rpc = (params: RequestParams = {}) =>
    this.request<CreateMenuVariantsRpcData, any>({
      path: `/routes/create-menu-variants-rpc`,
      method: "POST",
      ...params,
    });

  /**
   * @description Drop (remove) the get_menu_items_with_variants_rpc() function. Use this for rollback if the RPC function causes issues.
   *
   * @tags dbtn/module:menu_rpc_setup
   * @name drop_menu_variants_rpc
   * @summary Drop Menu Variants Rpc
   * @request POST:/routes/drop-menu-variants-rpc
   */
  drop_menu_variants_rpc = (params: RequestParams = {}) =>
    this.request<DropMenuVariantsRpcData, any>({
      path: `/routes/drop-menu-variants-rpc`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test the get_menu_items_with_variants_rpc() function. Query parameters: - category: Filter by menu section (optional) - dietary_filter: Filter by dietary requirement (optional) - search_query: Free-text search (optional) - order_mode: Pricing mode (default: 'collection') Returns sample data to verify the RPC function works correctly.
   *
   * @tags dbtn/module:menu_rpc_setup
   * @name test_menu_variants_rpc
   * @summary Test Menu Variants Rpc
   * @request GET:/routes/test-menu-variants-rpc
   */
  test_menu_variants_rpc = (query: TestMenuVariantsRpcParams, params: RequestParams = {}) =>
    this.request<TestMenuVariantsRpcData, TestMenuVariantsRpcError>({
      path: `/routes/test-menu-variants-rpc`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create the menu_items_unified VIEW for optimized menu queries. This VIEW combines: - Standalone items (has_variants = FALSE) - Variant items (from menu_item_variants + parent menu_items) - Category names (with parent-child support) Returns both types in a unified structure for easy querying.
   *
   * @tags dbtn/module:menu_view_setup
   * @name create_menu_unified_view
   * @summary Create Menu Unified View
   * @request POST:/routes/create-menu-unified-view
   */
  create_menu_unified_view = (params: RequestParams = {}) =>
    this.request<CreateMenuUnifiedViewData, any>({
      path: `/routes/create-menu-unified-view`,
      method: "POST",
      ...params,
    });

  /**
   * @description Drop (remove) the menu_items_unified VIEW. Use this for rollback if the VIEW causes issues.
   *
   * @tags dbtn/module:menu_view_setup
   * @name drop_menu_unified_view
   * @summary Drop Menu Unified View
   * @request POST:/routes/drop-menu-unified-view
   */
  drop_menu_unified_view = (params: RequestParams = {}) =>
    this.request<DropMenuUnifiedViewData, any>({
      path: `/routes/drop-menu-unified-view`,
      method: "POST",
      ...params,
    });

  /**
   * @description Test query against the menu_items_unified VIEW. Returns sample data to verify the VIEW works correctly.
   *
   * @tags dbtn/module:menu_view_setup
   * @name test_menu_unified_view
   * @summary Test Menu Unified View
   * @request GET:/routes/test-menu-unified-view
   */
  test_menu_unified_view = (params: RequestParams = {}) =>
    this.request<TestMenuUnifiedViewData, any>({
      path: `/routes/test-menu-unified-view`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get restaurant settings with caching
   *
   * @tags dbtn/module:restaurant_settings
   * @name get_restaurant_settings
   * @summary Get Restaurant Settings
   * @request GET:/routes/settings
   */
  get_restaurant_settings = (params: RequestParams = {}) =>
    this.request<GetRestaurantSettingsData, any>({
      path: `/routes/settings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Save restaurant settings and invalidate cache
   *
   * @tags dbtn/module:restaurant_settings
   * @name save_restaurant_settings
   * @summary Save Restaurant Settings
   * @request POST:/routes/settings
   */
  save_restaurant_settings = (data: SaveSettingsRequest, params: RequestParams = {}) =>
    this.request<SaveRestaurantSettingsData, SaveRestaurantSettingsError>({
      path: `/routes/settings`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all available customizations for a specific menu item. This endpoint is designed for AI consumption during conversational ordering. It returns customizations from all linking methods: - Junction table (menu_item_customizations) - Global customizations (is_global = true) - Direct array links (item_ids field) Args: menu_item_id: UUID of the menu item Returns: ItemCustomizationsResponse with grouped customizations and formatted text Example Usage (by AI): When user says: "Add chicken tikka with extra hot" 1. AI searches menu for "chicken tikka" → gets menu_item_id 2. AI calls this endpoint: /ai-customizations/for-item/{menu_item_id} 3. AI validates "extra hot" is available 4. AI adds to cart with verified customization
   *
   * @tags dbtn/module:ai_customizations
   * @name get_customizations_for_item
   * @summary Get Customizations For Item
   * @request GET:/routes/ai-customizations/for-item/{menu_item_id}
   */
  get_customizations_for_item = (
    { menuItemId, ...query }: GetCustomizationsForItemParams,
    params: RequestParams = {},
  ) =>
    this.request<GetCustomizationsForItemData, GetCustomizationsForItemError>({
      path: `/routes/ai-customizations/for-item/${menuItemId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Validate if a requested customization is available for a menu item. This helps AI avoid adding invalid customizations to orders. Args: request: Contains menu_item_id and requested_customization text Returns: Validation result with matched option or suggestion Example: Request: {"menu_item_id": "abc-123", "requested_customization": "no onions"} Response: {"is_valid": true, "matched_option": {"id": "...", "name": "No Onions", "price": 0.0}}
   *
   * @tags dbtn/module:ai_customizations
   * @name validate_customization
   * @summary Validate Customization
   * @request POST:/routes/ai-customizations/validate
   */
  validate_customization = (data: ValidateCustomizationRequest, params: RequestParams = {}) =>
    this.request<ValidateCustomizationData, ValidateCustomizationError>({
      path: `/routes/ai-customizations/validate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint for AI customizations service.
   *
   * @tags dbtn/module:ai_customizations
   * @name ai_customizations_health_check
   * @summary Ai Customizations Health Check
   * @request GET:/routes/ai-customizations/health
   */
  ai_customizations_health_check = (params: RequestParams = {}) =>
    this.request<AiCustomizationsHealthCheckData, any>({
      path: `/routes/ai-customizations/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new Gemini cache with the static BASE_SYSTEM_INSTRUCTION. This cache can be reused across all chat requests to reduce AI latency. The cache will expire after the specified TTL (default 24 hours). Returns the cache name to be used in subsequent chat requests.
   *
   * @tags dbtn/module:gemini_cache_manager
   * @name create_base_cache
   * @summary Create Base Cache
   * @request POST:/routes/gemini-cache/create-base-cache
   */
  create_base_cache = (data: CreateCacheRequest, params: RequestParams = {}) =>
    this.request<CreateBaseCacheData, CreateBaseCacheError>({
      path: `/routes/gemini-cache/create-base-cache`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all active Gemini caches with metadata. Useful for monitoring cache usage and expiration times.
   *
   * @tags dbtn/module:gemini_cache_manager
   * @name list_caches
   * @summary List Caches
   * @request GET:/routes/gemini-cache/list-caches
   */
  list_caches = (params: RequestParams = {}) =>
    this.request<ListCachesData, any>({
      path: `/routes/gemini-cache/list-caches`,
      method: "GET",
      ...params,
    });

  /**
   * @description Extend the expiration time of an existing cache. Useful for keeping active caches alive without recreating them.
   *
   * @tags dbtn/module:gemini_cache_manager
   * @name extend_cache
   * @summary Extend Cache
   * @request POST:/routes/gemini-cache/extend-cache
   */
  extend_cache = (data: ExtendCacheRequest, params: RequestParams = {}) =>
    this.request<ExtendCacheData, ExtendCacheError>({
      path: `/routes/gemini-cache/extend-cache`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a specific Gemini cache. Use this to clean up expired or unused caches.
   *
   * @tags dbtn/module:gemini_cache_manager
   * @name delete_cache
   * @summary Delete Cache
   * @request DELETE:/routes/gemini-cache/delete-cache/{cache_name}
   */
  delete_cache = ({ cacheName, ...query }: DeleteCacheParams, params: RequestParams = {}) =>
    this.request<DeleteCacheData, DeleteCacheError>({
      path: `/routes/gemini-cache/delete-cache/${cacheName}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Health check for cache manager
   *
   * @tags dbtn/module:gemini_cache_manager
   * @name gemini_cache_health_check
   * @summary Gemini Cache Health Check
   * @request GET:/routes/gemini-cache/health
   */
  gemini_cache_health_check = (params: RequestParams = {}) =>
    this.request<GeminiCacheHealthCheckData, any>({
      path: `/routes/gemini-cache/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get orders placed by customers through the OnlineOrders page only. This endpoint exclusively returns orders with order_source: 'CUSTOMER_ONLINE_ORDER'
   *
   * @tags dbtn/module:online_orders
   * @name get_online_orders
   * @summary Get Online Orders
   * @request GET:/routes/online-orders/orders
   */
  get_online_orders = (query: GetOnlineOrdersParams, params: RequestParams = {}) =>
    this.request<GetOnlineOrdersData, GetOnlineOrdersError>({
      path: `/routes/online-orders/orders`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new online order with Supabase storage. Now generates proper order numbers using unified sequence API. Includes retry logic to handle race conditions and transient failures.
   *
   * @tags dbtn/module:online_orders
   * @name create_online_order
   * @summary Create Online Order
   * @request POST:/routes/online-orders/create
   */
  create_online_order = (data: CreateOnlineOrderRequest, params: RequestParams = {}) =>
    this.request<CreateOnlineOrderData, CreateOnlineOrderError>({
      path: `/routes/online-orders/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a Stripe Payment Intent for online order checkout. Returns client_secret for frontend Stripe Elements.
   *
   * @tags dbtn/module:stripe
   * @name create_payment_intent
   * @summary Create Payment Intent
   * @request POST:/routes/stripe/create-payment-intent
   */
  create_payment_intent = (data: CreatePaymentIntentRequest, params: RequestParams = {}) =>
    this.request<CreatePaymentIntentData, CreatePaymentIntentError>({
      path: `/routes/stripe/create-payment-intent`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get Stripe publishable key for frontend initialization. This is safe to expose to the client.
   *
   * @tags dbtn/module:stripe
   * @name get_stripe_publishable_key
   * @summary Get Stripe Publishable Key
   * @request GET:/routes/stripe/config
   */
  get_stripe_publishable_key = (params: RequestParams = {}) =>
    this.request<GetStripePublishableKeyData, any>({
      path: `/routes/stripe/config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Handle Stripe webhook events. Verifies webhook signature and processes payment events.
   *
   * @tags dbtn/module:stripe
   * @name stripe_webhook
   * @summary Stripe Webhook
   * @request POST:/routes/stripe/webhook
   */
  stripe_webhook = (params: RequestParams = {}) =>
    this.request<StripeWebhookData, any>({
      path: `/routes/stripe/webhook`,
      method: "POST",
      ...params,
    });

  /**
   * @description Confirm payment status and update order. Called from frontend after Stripe confirms payment.
   *
   * @tags dbtn/module:stripe
   * @name confirm_payment
   * @summary Confirm Payment
   * @request POST:/routes/stripe/confirm-payment
   */
  confirm_payment = (data: ConfirmPaymentRequest, params: RequestParams = {}) =>
    this.request<ConfirmPaymentData, ConfirmPaymentError>({
      path: `/routes/stripe/confirm-payment`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Stream chat endpoint with model provider routing
   *
   * @tags stream, dbtn/module:streaming_chat
   * @name stream_chat
   * @summary Stream Chat
   * @request POST:/routes/streaming-chat/chat
   */
  stream_chat = (data: ChatRequest, params: RequestParams = {}) =>
    this.requestStream<StreamChatData, StreamChatError>({
      path: `/routes/streaming-chat/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint for streaming chat service
   *
   * @tags dbtn/module:streaming_chat
   * @name check_streaming_health
   * @summary Check Streaming Health
   * @request GET:/routes/streaming-chat/streaming-health
   */
  check_streaming_health = (params: RequestParams = {}) =>
    this.request<CheckStreamingHealthData, any>({
      path: `/routes/streaming-chat/streaming-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description List available models
   *
   * @tags dbtn/module:streaming_chat
   * @name list_available_models
   * @summary List Available Models
   * @request GET:/routes/streaming-chat/models
   */
  list_available_models = (params: RequestParams = {}) =>
    this.request<ListAvailableModelsData, any>({
      path: `/routes/streaming-chat/models`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get AI-powered menu recommendations based on current cart contents. Features: - Analyzes cart items for complementary suggestions - Incorporates customer order history for personalization - 5-minute caching to reduce API costs - Fallback to empty list if Gemini fails Example: ```json { "cart_items": [ {"name": "Chicken Tikka Masala", "quantity": 1, "price": 9.95, "category": "Mains"} ], "customer_id": "user-123", "order_mode": "delivery", "limit": 3 } ```
   *
   * @tags dbtn/module:ai_recommendations
   * @name get_cart_suggestions
   * @summary Get Cart Suggestions
   * @request POST:/routes/ai-recommendations/cart-suggestions
   */
  get_cart_suggestions = (data: RecommendationRequest, params: RequestParams = {}) =>
    this.request<GetCartSuggestionsData, GetCartSuggestionsError>({
      path: `/routes/ai-recommendations/cart-suggestions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get cache statistics for monitoring
   *
   * @tags dbtn/module:ai_recommendations
   * @name get_cache_stats
   * @summary Get Cache Stats
   * @request GET:/routes/ai-recommendations/cache-stats
   */
  get_cache_stats = (params: RequestParams = {}) =>
    this.request<GetCacheStatsData, any>({
      path: `/routes/ai-recommendations/cache-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Clear recommendation cache (for testing/debugging)
   *
   * @tags dbtn/module:ai_recommendations
   * @name clear_cache
   * @summary Clear Cache
   * @request POST:/routes/ai-recommendations/clear-cache
   */
  clear_cache = (params: RequestParams = {}) =>
    this.request<ClearCacheData, any>({
      path: `/routes/ai-recommendations/clear-cache`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check endpoint
   *
   * @tags dbtn/module:ai_recommendations
   * @name ai_recommendations_health
   * @summary Ai Recommendations Health
   * @request GET:/routes/ai-recommendations/health
   */
  ai_recommendations_health = (params: RequestParams = {}) =>
    this.request<AiRecommendationsHealthData, any>({
      path: `/routes/ai-recommendations/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Geocode a postcode or location name to get coordinates and other details
   *
   * @tags dbtn/module:geocoding
   * @name geocode
   * @summary Geocode
   * @request POST:/routes/geocode
   */
  geocode = (data: GeocodingRequest, params: RequestParams = {}) =>
    this.request<GeocodeData, GeocodeError>({
      path: `/routes/geocode`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate Google Static Maps URL for mini map previews Returns a properly formatted Google Static Maps URL with: - Burgundy marker matching CustomerPortal theme - Dark theme styling for consistency - Optimized for address preview cards
   *
   * @tags dbtn/module:google_static_maps
   * @name generate_static_map
   * @summary Generate Static Map
   * @request POST:/routes/generate-static-map
   */
  generate_static_map = (data: StaticMapRequest, params: RequestParams = {}) =>
    this.request<GenerateStaticMapData, GenerateStaticMapError>({
      path: `/routes/generate-static-map`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get Google Maps configuration for static maps specifically Returns the API key validation for static maps generation
   *
   * @tags dbtn/module:google_static_maps
   * @name get_static_maps_config
   * @summary Get Static Maps Config
   * @request GET:/routes/static-maps-config
   */
  get_static_maps_config = (params: RequestParams = {}) =>
    this.request<GetStaticMapsConfigData, any>({
      path: `/routes/static-maps-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Validate if a postcode is within delivery zone and meets minimum order requirements
   *
   * @tags dbtn/module:business_rules_validation
   * @name validate_delivery_postcode
   * @summary Validate Delivery Postcode
   * @request POST:/routes/validate-delivery-postcode
   */
  validate_delivery_postcode = (data: DeliveryValidationRequest, params: RequestParams = {}) =>
    this.request<ValidateDeliveryPostcodeData, ValidateDeliveryPostcodeError>({
      path: `/routes/validate-delivery-postcode`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Validate if restaurant is open for delivery/collection at specified time
   *
   * @tags dbtn/module:business_rules_validation
   * @name validate_opening_hours
   * @summary Validate Opening Hours
   * @request POST:/routes/validate-opening-hours
   */
  validate_opening_hours = (data: OpeningHoursValidationRequest, params: RequestParams = {}) =>
    this.request<ValidateOpeningHoursData, ValidateOpeningHoursError>({
      path: `/routes/validate-opening-hours`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all current business rules for frontend use
   *
   * @tags dbtn/module:business_rules_validation
   * @name get_current_business_rules
   * @summary Get Current Business Rules
   * @request GET:/routes/get-current-business-rules
   */
  get_current_business_rules = (params: RequestParams = {}) =>
    this.request<GetCurrentBusinessRulesData, any>({
      path: `/routes/get-current-business-rules`,
      method: "GET",
      ...params,
    });

  /**
   * @description Comprehensive order validation including all business rules
   *
   * @tags dbtn/module:business_rules_validation
   * @name validate_order
   * @summary Validate Order
   * @request POST:/routes/validate-order
   */
  validate_order = (data: OrderValidationRequest, params: RequestParams = {}) =>
    this.request<ValidateOrderData, ValidateOrderError>({
      path: `/routes/validate-order`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Proxy Google Maps Static API images to avoid referrer restrictions. Fetches the map image from Google and serves it directly. Now uses GoogleMapsService library for centralized API management.
   *
   * @tags dbtn/module:map_image_proxy
   * @name get_map_image_proxy
   * @summary Get Map Image Proxy
   * @request GET:/routes/map-image-proxy
   */
  get_map_image_proxy = (query: GetMapImageProxyParams, params: RequestParams = {}) =>
    this.request<GetMapImageProxyData, GetMapImageProxyError>({
      path: `/routes/map-image-proxy`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Calculate delivery route with traffic consideration
   *
   * @tags dbtn/module:delivery_calculator
   * @name calculate_delivery_route
   * @summary Calculate Delivery Route
   * @request POST:/routes/calculate
   */
  calculate_delivery_route = (data: DeliveryRequest, params: RequestParams = {}) =>
    this.request<CalculateDeliveryRouteData, CalculateDeliveryRouteError>({
      path: `/routes/calculate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Calculate enhanced delivery route with traffic intelligence, weather, and location context
   *
   * @tags dbtn/module:delivery_calculator
   * @name calculate_enhanced_delivery_route
   * @summary Calculate Enhanced Delivery Route
   * @request POST:/routes/calculate-enhanced
   */
  calculate_enhanced_delivery_route = (data: DeliveryRequest, params: RequestParams = {}) =>
    this.request<CalculateEnhancedDeliveryRouteData, CalculateEnhancedDeliveryRouteError>({
      path: `/routes/calculate-enhanced`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the Google Maps API key and restaurant location for frontend use
   *
   * @tags dbtn/module:delivery_calculator
   * @name get_maps_config
   * @summary Get Maps Config
   * @request GET:/routes/maps-config
   */
  get_maps_config = (params: RequestParams = {}) =>
    this.request<GetMapsConfigData, any>({
      path: `/routes/maps-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Run health checks for all services This endpoint always runs fresh checks (bypasses cache). Use /health/status for cached results. Returns: HealthCheckResponse with status of all services
   *
   * @tags dbtn/module:health_monitoring
   * @name check_all_services
   * @summary Check All Services
   * @request POST:/routes/health/check-all
   */
  check_all_services = (params: RequestParams = {}) =>
    this.request<CheckAllServicesData, any>({
      path: `/routes/health/check-all`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get current health status (cached, fast) Returns cached results if available and not expired. Falls back to fresh check if cache is empty or expired. Returns: HealthCheckResponse with cached or fresh health status
   *
   * @tags dbtn/module:health_monitoring
   * @name get_health_status
   * @summary Get Health Status
   * @request GET:/routes/health/status
   */
  get_health_status = (params: RequestParams = {}) =>
    this.request<GetHealthStatusData, any>({
      path: `/routes/health/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check health of a specific service Args: service: Service name (supabase, stripe, google_ai, google_maps) Returns: HealthStatusResponse for the requested service
   *
   * @tags dbtn/module:health_monitoring
   * @name check_specific_service
   * @summary Check Specific Service
   * @request POST:/routes/health/check/{service}
   */
  check_specific_service = ({ service, ...query }: CheckSpecificServiceParams, params: RequestParams = {}) =>
    this.request<CheckSpecificServiceData, CheckSpecificServiceError>({
      path: `/routes/health/check/${service}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get recent health check history Note: Currently returns empty list. Future: Implement persistent logging to Supabase Args: limit: Maximum number of entries to return (default: 50) Returns: HealthHistoryResponse with recent health checks
   *
   * @tags dbtn/module:health_monitoring
   * @name get_health_history
   * @summary Get Health History
   * @request GET:/routes/health/history
   */
  get_health_history = (query: GetHealthHistoryParams, params: RequestParams = {}) =>
    this.request<GetHealthHistoryData, GetHealthHistoryError>({
      path: `/routes/health/history`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Clear the health check cache Forces next /health/status call to run fresh checks. Returns: Success message
   *
   * @tags dbtn/module:health_monitoring
   * @name clear_health_cache
   * @summary Clear Health Cache
   * @request POST:/routes/health/clear-cache
   */
  clear_health_cache = (params: RequestParams = {}) =>
    this.request<ClearHealthCacheData, any>({
      path: `/routes/health/clear-cache`,
      method: "POST",
      ...params,
    });

  /**
   * @description 🧪 Test end-to-end customization flow. This test simulates what happens when Gemini adds items with customizations: Test Scenarios: 1. Item with free customizations (spice level) 2. Item with paid customizations (sauce) 3. Item with multiple customizations 4. Verify cart totals include customization prices 5. Verify customizations appear in cart response Args: request: Test configuration with session/user IDs Returns: Detailed test results with step-by-step validation
   *
   * @tags dbtn/module:test_customizations
   * @name run_customization_test
   * @summary Run Customization Test
   * @request POST:/routes/run-customization-test
   */
  run_customization_test = (data: CustomizationTestRequest, params: RequestParams = {}) =>
    this.request<RunCustomizationTestData, RunCustomizationTestError>({
      path: `/routes/run-customization-test`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for customization test endpoint.
   *
   * @tags dbtn/module:test_customizations
   * @name test_customizations_health_check
   * @summary Test Customizations Health Check
   * @request GET:/routes/test-customizations-health
   */
  test_customizations_health_check = (params: RequestParams = {}) =>
    this.request<TestCustomizationsHealthCheckData, any>({
      path: `/routes/test-customizations-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test endpoint to validate mode='ANY' with streaming. Query params: query: User message to test (default: "what main courses do you have?") mode: Function calling mode - 'ANY', 'AUTO', or 'NONE' (default: 'ANY') Returns: SSE stream with test results Test cases: 1. /test-mode-any?query=what starters do you have?&mode=ANY 2. /test-mode-any?query=what main courses do you have?&mode=ANY 3. /test-mode-any?query=what starters do you have?&mode=AUTO 4. /test-mode-any?query=what main courses do you have?&mode=AUTO Expected results: - mode='ANY': Should ALWAYS call function (100% rate) - mode='AUTO': May or may not call function (inconsistent)
   *
   * @tags stream, dbtn/module:test_mode_any
   * @name test_mode_any
   * @summary Test Mode Any
   * @request GET:/routes/test-mode-any
   */
  test_mode_any = (query: TestModeAnyParams, params: RequestParams = {}) =>
    this.requestStream<TestModeAnyData, TestModeAnyError>({
      path: `/routes/test-mode-any`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Health check for test endpoint
   *
   * @tags dbtn/module:test_mode_any
   * @name test_mode_any_health_check
   * @summary Test Mode Any Health Check
   * @request GET:/routes/test-mode-any-health
   */
  test_mode_any_health_check = (params: RequestParams = {}) =>
    this.request<TestModeAnyHealthCheckData, any>({
      path: `/routes/test-mode-any-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Multi-turn test: AI calls function → we execute → send result back → AI formats. This mimics production streaming behavior. CRITICAL TEST: Does mode='ANY' allow AI to format function results into text? Or does it force another function call (infinite loop)? Query params: query: User message mode: 'ANY', 'AUTO', or 'NONE' Expected with mode='ANY': Round 1: AI calls function ✅ Round 2: AI formats results into text ❓ (THIS IS THE KEY QUESTION)
   *
   * @tags stream, dbtn/module:test_mode_any
   * @name test_mode_any_multiturn
   * @summary Test Mode Any Multiturn
   * @request GET:/routes/test-mode-any-multiturn
   */
  test_mode_any_multiturn = (query: TestModeAnyMultiturnParams, params: RequestParams = {}) =>
    this.requestStream<TestModeAnyMultiturnData, TestModeAnyMultiturnError>({
      path: `/routes/test-mode-any-multiturn`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Test voice function executor with a single cart operation. Example: POST /test-voice-executor/test-execution { "session_id": "test_session_123", "user_id": null, "function_name": "search_and_add_to_cart", "args": {"search_query": "chicken tikka", "quantity": 2} }
   *
   * @tags dbtn/module:test_voice_executor
   * @name test_voice_executor
   * @summary Test Voice Executor
   * @request POST:/routes/test-execution
   */
  test_voice_executor = (data: TestRequest, params: RequestParams = {}) =>
    this.request<TestVoiceExecutorData, TestVoiceExecutorError>({
      path: `/routes/test-execution`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test all 6 cart operations in sequence to validate complete integration. Test Flow: 1. Clear cart (if requested) 2. Search and add item (using real menu item name) 3. Add direct item (using real menu_item_id) 4. Get cart 5. Update quantity 6. Remove item 7. Clear cart Returns detailed results for each operation.
   *
   * @tags dbtn/module:test_voice_executor
   * @name test_all_cart_operations
   * @summary Test All Cart Operations
   * @request POST:/routes/test-all-operations
   */
  test_all_cart_operations = (data: BulkTestRequest, params: RequestParams = {}) =>
    this.request<TestAllCartOperationsData, TestAllCartOperationsError>({
      path: `/routes/test-all-operations`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test ALL 12 voice functions to validate complete function parity. Categories tested: 1. Menu Functions (2) 2. Info Functions (2) 3. Order Functions (1) 4. Cart Functions (6) Returns detailed results for each function with pass/fail status.
   *
   * @tags dbtn/module:test_voice_executor
   * @name test_all_voice_functions
   * @summary Test All Voice Functions
   * @request POST:/routes/test-all-functions
   */
  test_all_voice_functions = (data: BulkTestRequest, params: RequestParams = {}) =>
    this.request<TestAllVoiceFunctionsData, TestAllVoiceFunctionsError>({
      path: `/routes/test-all-functions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of all supported voice cart functions.
   *
   * @tags dbtn/module:test_voice_executor
   * @name list_supported_functions
   * @summary List Supported Functions
   * @request GET:/routes/supported-functions
   */
  list_supported_functions = (params: RequestParams = {}) =>
    this.request<ListSupportedFunctionsData, any>({
      path: `/routes/supported-functions`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for voice executor test endpoint.
   *
   * @tags dbtn/module:test_voice_executor
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/health
   */
  health_check = (params: RequestParams = {}) =>
    this.request<HealthCheckData, any>({
      path: `/routes/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initialize Google Live voice settings linked to primary agent. Generates default system prompt from unified_agent_config personality.
   *
   * @tags dbtn/module:google_live_voice_config
   * @name initialize_google_live_voice_settings
   * @summary Initialize Google Live Voice Settings
   * @request POST:/routes/google-live-voice-config/initialize
   */
  initialize_google_live_voice_settings = (params: RequestParams = {}) =>
    this.request<InitializeGoogleLiveVoiceSettingsData, any>({
      path: `/routes/google-live-voice-config/initialize`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get current Google Live voice settings for the primary agent.
   *
   * @tags dbtn/module:google_live_voice_config
   * @name get_google_live_voice_settings
   * @summary Get Google Live Voice Settings
   * @request GET:/routes/google-live-voice-config
   */
  get_google_live_voice_settings = (params: RequestParams = {}) =>
    this.request<GetGoogleLiveVoiceSettingsData, any>({
      path: `/routes/google-live-voice-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update Google Live voice settings.
   *
   * @tags dbtn/module:google_live_voice_config
   * @name update_google_live_voice_settings
   * @summary Update Google Live Voice Settings
   * @request PUT:/routes/google-live-voice-config
   */
  update_google_live_voice_settings = (data: UpdateGoogleLiveVoiceSettingsRequest, params: RequestParams = {}) =>
    this.request<UpdateGoogleLiveVoiceSettingsData, UpdateGoogleLiveVoiceSettingsError>({
      path: `/routes/google-live-voice-config`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check and current configuration status for Google Live voice.
   *
   * @tags dbtn/module:google_live_voice_config
   * @name google_live_voice_status
   * @summary Google Live Voice Status
   * @request GET:/routes/google-live-voice-config/status
   */
  google_live_voice_status = (params: RequestParams = {}) =>
    this.request<GoogleLiveVoiceStatusData, any>({
      path: `/routes/google-live-voice-config/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initiate a test call using current Google Live settings. Returns call status and connection info.
   *
   * @tags dbtn/module:google_live_voice_config
   * @name test_google_live_voice_call
   * @summary Test Google Live Voice Call
   * @request POST:/routes/google-live-voice-config/test-call
   */
  test_google_live_voice_call = (params: RequestParams = {}) =>
    this.request<TestGoogleLiveVoiceCallData, any>({
      path: `/routes/google-live-voice-config/test-call`,
      method: "POST",
      ...params,
    });

  /**
   * @description Mark current Google Live voice settings as published/live. Sets is_published=true and published_at=now(). This signals that these settings are the active production configuration.
   *
   * @tags dbtn/module:google_live_voice_config
   * @name publish_voice_settings
   * @summary Publish Voice Settings
   * @request POST:/routes/google-live-voice-config/publish
   */
  publish_voice_settings = (params: RequestParams = {}) =>
    this.request<PublishVoiceSettingsData, any>({
      path: `/routes/google-live-voice-config/publish`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create a new chatbot prompt with GPT-5 and Google GenAI support. Admin/Manager access only.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name create_chatbot_prompt
   * @summary Create Chatbot Prompt
   * @request POST:/routes/chatbot-prompts/create
   */
  create_chatbot_prompt = (data: ChatbotPromptCreate, params: RequestParams = {}) =>
    this.request<CreateChatbotPromptData, CreateChatbotPromptError>({
      path: `/routes/chatbot-prompts/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all chatbot prompts with optional filtering. Admin/Manager access for all prompts, public access for published prompts only.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name list_chatbot_prompts
   * @summary List Chatbot Prompts
   * @request GET:/routes/chatbot-prompts/list
   */
  list_chatbot_prompts = (query: ListChatbotPromptsParams, params: RequestParams = {}) =>
    this.request<ListChatbotPromptsData, ListChatbotPromptsError>({
      path: `/routes/chatbot-prompts/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get the currently active chatbot prompt. Public access for chat runtime.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name get_active_prompt
   * @summary Get Active Prompt
   * @request GET:/routes/chatbot-prompts/active
   */
  get_active_prompt = (params: RequestParams = {}) =>
    this.request<GetActivePromptData, any>({
      path: `/routes/chatbot-prompts/active`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a specific chatbot prompt by ID. Admin/Manager access only.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name get_chatbot_prompt
   * @summary Get Chatbot Prompt
   * @request GET:/routes/chatbot-prompts/{prompt_id}
   */
  get_chatbot_prompt = ({ promptId, ...query }: GetChatbotPromptParams, params: RequestParams = {}) =>
    this.request<GetChatbotPromptData, GetChatbotPromptError>({
      path: `/routes/chatbot-prompts/${promptId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a chatbot prompt. Admin/Manager access only.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name update_chatbot_prompt
   * @summary Update Chatbot Prompt
   * @request PUT:/routes/chatbot-prompts/update/{prompt_id}
   */
  update_chatbot_prompt = (
    { promptId, ...query }: UpdateChatbotPromptParams,
    data: ChatbotPromptUpdate,
    params: RequestParams = {},
  ) =>
    this.request<UpdateChatbotPromptData, UpdateChatbotPromptError>({
      path: `/routes/chatbot-prompts/update/${promptId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Set a prompt as the active one. Only one prompt can be active at a time. Admin/Manager access only.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name set_active_prompt
   * @summary Set Active Prompt
   * @request POST:/routes/chatbot-prompts/set-active
   */
  set_active_prompt = (data: SetActivePromptRequest, params: RequestParams = {}) =>
    this.request<SetActivePromptData, SetActivePromptError>({
      path: `/routes/chatbot-prompts/set-active`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a chatbot prompt. Admin/Manager access only. Cannot delete active prompts.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name delete_chatbot_prompt
   * @summary Delete Chatbot Prompt
   * @request DELETE:/routes/chatbot-prompts/delete/{prompt_id}
   */
  delete_chatbot_prompt = ({ promptId, ...query }: DeleteChatbotPromptParams, params: RequestParams = {}) =>
    this.request<DeleteChatbotPromptData, DeleteChatbotPromptError>({
      path: `/routes/chatbot-prompts/delete/${promptId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Publish a prompt (make it available for selection as active). Admin/Manager access only.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name publish_prompt
   * @summary Publish Prompt
   * @request POST:/routes/chatbot-prompts/publish/{prompt_id}
   */
  publish_prompt = ({ promptId, ...query }: PublishPromptParams, params: RequestParams = {}) =>
    this.request<PublishPromptData, PublishPromptError>({
      path: `/routes/chatbot-prompts/publish/${promptId}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Unpublish a prompt (remove from active selection, deactivate if active). Admin/Manager access only.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name unpublish_prompt
   * @summary Unpublish Prompt
   * @request POST:/routes/chatbot-prompts/unpublish/{prompt_id}
   */
  unpublish_prompt = ({ promptId, ...query }: UnpublishPromptParams, params: RequestParams = {}) =>
    this.request<UnpublishPromptData, UnpublishPromptError>({
      path: `/routes/chatbot-prompts/unpublish/${promptId}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get available model options for each provider.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name get_available_models
   * @summary Get Available Models
   * @request GET:/routes/chatbot-prompts/models/available
   */
  get_available_models = (params: RequestParams = {}) =>
    this.request<GetAvailableModelsData, any>({
      path: `/routes/chatbot-prompts/models/available`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for chatbot prompts API.
   *
   * @tags dbtn/module:chatbot_prompts
   * @name chatbot_prompts_health
   * @summary Chatbot Prompts Health
   * @request GET:/routes/chatbot-prompts/health
   */
  chatbot_prompts_health = (params: RequestParams = {}) =>
    this.request<ChatbotPromptsHealthData, any>({
      path: `/routes/chatbot-prompts/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fetch menu data from Supabase and format it for Gemini system prompt. Returns concise menu context for voice ordering with full variant awareness.
   *
   * @tags dbtn/module:gemini_voice_session
   * @name get_menu_context
   * @summary Get Menu Context
   * @request GET:/routes/gemini-voice/menu-context
   */
  get_menu_context = (params: RequestParams = {}) =>
    this.request<GetMenuContextData, any>({
      path: `/routes/gemini-voice/menu-context`,
      method: "GET",
      ...params,
    });

  /**
   * @description Search menu items by query or category. Used by Gemini voice agent to fetch menu data on-demand. This lazy-loading approach prevents context bloat and reduces latency.
   *
   * @tags dbtn/module:gemini_voice_session
   * @name search_menu
   * @summary Search Menu
   * @request POST:/routes/gemini-voice/search-menu
   */
  search_menu = (data: SearchMenuRequest, params: RequestParams = {}) =>
    this.request<SearchMenuData, SearchMenuError>({
      path: `/routes/gemini-voice/search-menu`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create ephemeral credentials for Gemini Live API. Returns short-lived JWT token (2-hour TTL) instead of permanent API key.
   *
   * @tags dbtn/module:gemini_voice_session
   * @name create_gemini_voice_session
   * @summary Create Gemini Voice Session
   * @request POST:/routes/gemini-voice/create-session
   */
  create_gemini_voice_session = (data: VoiceSessionRequest, params: RequestParams = {}) =>
    this.request<CreateGeminiVoiceSessionData, CreateGeminiVoiceSessionError>({
      path: `/routes/gemini-voice/create-session`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for voice session service
   *
   * @tags dbtn/module:gemini_voice_session
   * @name voice_session_health
   * @summary Voice Session Health
   * @request GET:/routes/gemini-voice/health
   */
  voice_session_health = (params: RequestParams = {}) =>
    this.request<VoiceSessionHealthData, any>({
      path: `/routes/gemini-voice/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Chat endpoint with true token-by-token streaming + automatic function calling
   *
   * @tags stream, dbtn/module:structured_streaming
   * @name chat_stream
   * @summary Chat Stream
   * @request POST:/routes/structured-streaming/chat
   */
  chat_stream = (data: StructuredStreamingRequest, params: RequestParams = {}) =>
    this.requestStream<ChatStreamData, ChatStreamError>({
      path: `/routes/structured-streaming/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for structured streaming
   *
   * @tags dbtn/module:structured_streaming
   * @name check_structured_streaming_health
   * @summary Check Structured Streaming Health
   * @request GET:/routes/structured-streaming/health
   */
  check_structured_streaming_health = (params: RequestParams = {}) =>
    this.request<CheckStructuredStreamingHealthData, any>({
      path: `/routes/structured-streaming/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initialize AI voice settings table and default configuration
   *
   * @tags dbtn/module:ai_voice_settings
   * @name initialize_ai_voice_settings
   * @summary Initialize Ai Voice Settings
   * @request POST:/routes/ai-voice-settings/initialize
   */
  initialize_ai_voice_settings = (params: RequestParams = {}) =>
    this.request<InitializeAiVoiceSettingsData, any>({
      path: `/routes/ai-voice-settings/initialize`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get current AI voice settings
   *
   * @tags dbtn/module:ai_voice_settings
   * @name get_ai_voice_settings
   * @summary Get Ai Voice Settings
   * @request GET:/routes/ai-voice-settings
   */
  get_ai_voice_settings = (params: RequestParams = {}) =>
    this.request<GetAiVoiceSettingsData, any>({
      path: `/routes/ai-voice-settings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update AI voice settings
   *
   * @tags dbtn/module:ai_voice_settings
   * @name update_ai_voice_settings
   * @summary Update Ai Voice Settings
   * @request PUT:/routes/ai-voice-settings
   */
  update_ai_voice_settings = (data: AIVoiceSettingsUpdate, params: RequestParams = {}) =>
    this.request<UpdateAiVoiceSettingsData, UpdateAiVoiceSettingsError>({
      path: `/routes/ai-voice-settings`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get just the master toggle status for quick checks
   *
   * @tags dbtn/module:ai_voice_settings
   * @name get_master_toggle
   * @summary Get Master Toggle
   * @request GET:/routes/ai-voice-settings/master-toggle
   */
  get_master_toggle = (params: RequestParams = {}) =>
    this.request<GetMasterToggleData, any>({
      path: `/routes/ai-voice-settings/master-toggle`,
      method: "GET",
      ...params,
    });

  /**
   * @description Quick toggle for AI voice assistant (master switch)
   *
   * @tags dbtn/module:ai_voice_settings
   * @name toggle_ai_voice_assistant
   * @summary Toggle Ai Voice Assistant
   * @request POST:/routes/ai-voice-settings/toggle
   */
  toggle_ai_voice_assistant = (query: ToggleAiVoiceAssistantParams, params: RequestParams = {}) =>
    this.request<ToggleAiVoiceAssistantData, ToggleAiVoiceAssistantError>({
      path: `/routes/ai-voice-settings/toggle`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get live AI voice calls in progress (mock data for now)
   *
   * @tags dbtn/module:ai_voice_settings
   * @name get_live_calls
   * @summary Get Live Calls
   * @request GET:/routes/ai-voice-settings/live-calls
   */
  get_live_calls = (params: RequestParams = {}) =>
    this.request<GetLiveCallsData, any>({
      path: `/routes/ai-voice-settings/live-calls`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test connection to AI voice services
   *
   * @tags dbtn/module:ai_voice_settings
   * @name test_ai_voice_connection
   * @summary Test Ai Voice Connection
   * @request POST:/routes/ai-voice-settings/test-connection
   */
  test_ai_voice_connection = (params: RequestParams = {}) =>
    this.request<TestAiVoiceConnectionData, any>({
      path: `/routes/ai-voice-settings/test-connection`,
      method: "POST",
      ...params,
    });

  /**
   * @description Sync printer service workflow and installer files to cottage-pos-desktop repo. Pushes: - .github/workflows/publish-on-release.yml - installer/printer-service-setup.nsi - installer/README.md - printer-service/LICENSE.txt Returns: Dict with sync status and file URLs
   *
   * @tags dbtn/module:update_pos_desktop
   * @name sync_printer_workflow_files
   * @summary Sync Printer Workflow Files
   * @request POST:/routes/sync-printer-workflow-files
   */
  sync_printer_workflow_files = (params: RequestParams = {}) =>
    this.request<SyncPrinterWorkflowFilesData, any>({
      path: `/routes/sync-printer-workflow-files`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create a GitHub release for the printer service. This triggers the GitHub Actions workflow to build the installer. Args: request: Release version and notes Returns: Release info including URL
   *
   * @tags dbtn/module:update_pos_desktop
   * @name create_printer_release
   * @summary Create Printer Release
   * @request POST:/routes/create-printer-release
   */
  create_printer_release = (data: PrinterReleaseRequest, params: RequestParams = {}) =>
    this.request<CreatePrinterReleaseData, CreatePrinterReleaseError>({
      path: `/routes/create-printer-release`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the latest printer service release info. Returns: Latest release version, download URL, and metadata
   *
   * @tags dbtn/module:update_pos_desktop
   * @name get_latest_printer_release
   * @summary Get Latest Printer Release
   * @request GET:/routes/latest-printer-release
   */
  get_latest_printer_release = (params: RequestParams = {}) =>
    this.request<GetLatestPrinterReleaseData, any>({
      path: `/routes/latest-printer-release`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the latest combined installer (POS Desktop + Printer Service) release info. Looks for releases containing the combined installer executable (CottageTandooriSetup*.exe). Returns: Dict with success status, version, download URLs, and metadata
   *
   * @tags dbtn/module:update_pos_desktop
   * @name get_latest_combined_installer
   * @summary Get Latest Combined Installer
   * @request GET:/routes/get-latest-combined-installer
   */
  get_latest_combined_installer = (params: RequestParams = {}) =>
    this.request<GetLatestCombinedInstallerData, any>({
      path: `/routes/get-latest-combined-installer`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a printer service release by version tag. Useful for recreating releases cleanly. Args: version: Version tag (e.g., 'v1.0.0')
   *
   * @tags dbtn/module:update_pos_desktop
   * @name delete_printer_release
   * @summary Delete Printer Release
   * @request DELETE:/routes/delete-printer-release
   */
  delete_printer_release = (query: DeletePrinterReleaseParams, params: RequestParams = {}) =>
    this.request<DeletePrinterReleaseData, DeletePrinterReleaseError>({
      path: `/routes/delete-printer-release`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Create GitHub release for POS Desktop (triggers build workflow)
   *
   * @tags dbtn/module:update_pos_desktop
   * @name update_pos_desktop
   * @summary Update Pos Desktop
   * @request POST:/routes/update-pos-desktop
   */
  update_pos_desktop = (data: UpdatePOSDesktopRequest, params: RequestParams = {}) =>
    this.request<UpdatePosDesktopData, UpdatePosDesktopError>({
      path: `/routes/update-pos-desktop`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current POS Desktop version information
   *
   * @tags dbtn/module:update_pos_desktop
   * @name get_pos_desktop_version
   * @summary Get Pos Desktop Version
   * @request GET:/routes/pos-desktop-version
   */
  get_pos_desktop_version = (params: RequestParams = {}) =>
    this.request<GetPosDesktopVersionData, any>({
      path: `/routes/pos-desktop-version`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sync POS Desktop files from Databutton to GitHub and optionally create a release
   *
   * @tags dbtn/module:update_pos_desktop
   * @name sync_pos_files
   * @summary Sync Pos Files
   * @request POST:/routes/sync-pos-files
   */
  sync_pos_files = (data: SyncPOSFilesRequest, params: RequestParams = {}) =>
    this.request<SyncPosFilesData, SyncPosFilesError>({
      path: `/routes/sync-pos-files`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check which files exist before syncing
   *
   * @tags dbtn/module:update_pos_desktop
   * @name preflight_check
   * @summary Preflight Check
   * @request GET:/routes/preflight-check
   */
  preflight_check = (params: RequestParams = {}) =>
    this.request<PreflightCheckData, any>({
      path: `/routes/preflight-check`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sync Printer Helper Service files to GitHub using central library
   *
   * @tags dbtn/module:update_pos_desktop
   * @name sync_printer_service
   * @summary Sync Printer Service
   * @request POST:/routes/sync-printer-service
   */
  sync_printer_service = (data: SyncPrinterServiceRequest, params: RequestParams = {}) =>
    this.request<SyncPrinterServiceData, SyncPrinterServiceError>({
      path: `/routes/sync-printer-service`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Push all printer service files to cottage-pos-desktop GitHub repo
   *
   * @tags dbtn/module:update_pos_desktop
   * @name push_printer_service_to_github_endpoint
   * @summary Push Printer Service To Github Endpoint
   * @request POST:/routes/push-printer-service-to-github
   */
  push_printer_service_to_github_endpoint = (
    query: PushPrinterServiceToGithubEndpointParams,
    params: RequestParams = {},
  ) =>
    this.request<PushPrinterServiceToGithubEndpointData, PushPrinterServiceToGithubEndpointError>({
      path: `/routes/push-printer-service-to-github`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Sync electron-builder configuration files to cottage-pos-desktop repository. Pushes: - package.json (with electron-builder config) - build/installer.nsh (NSSM service installation script) - .github/workflows/build-pos-installer.yml (GitHub Actions workflow) This replaces the custom NSIS installer approach with native electron-builder. Returns: Sync status with GitHub URLs
   *
   * @tags dbtn/module:update_pos_desktop
   * @name sync_electron_builder_config
   * @summary Sync Electron Builder Config
   * @request POST:/routes/sync-electron-builder-config
   */
  sync_electron_builder_config = (params: RequestParams = {}) =>
    this.request<SyncElectronBuilderConfigData, any>({
      path: `/routes/sync-electron-builder-config`,
      method: "POST",
      ...params,
    });

  /**
   * @description Analyze POSDesktop.tsx to find all import dependencies and compare against current file_mapping to identify unmapped files. Returns: Analysis report with mapped and unmapped files
   *
   * @tags dbtn/module:update_pos_desktop
   * @name analyze_pos_dependencies
   * @summary Analyze Pos Dependencies
   * @request POST:/routes/analyze-pos-dependencies
   */
  analyze_pos_dependencies = (params: RequestParams = {}) =>
    this.request<AnalyzePosDependenciesData, any>({
      path: `/routes/analyze-pos-dependencies`,
      method: "POST",
      ...params,
    });

  /**
   * @description Update the file_mapping dictionary with new files. Args: request: List of files to add with their databutton and github paths Returns: Success status and updated mapping count
   *
   * @tags dbtn/module:update_pos_desktop
   * @name update_file_mapping
   * @summary Update File Mapping
   * @request POST:/routes/update-file-mapping
   */
  update_file_mapping = (data: UpdateFileMappingRequest, params: RequestParams = {}) =>
    this.request<UpdateFileMappingData, UpdateFileMappingError>({
      path: `/routes/update-file-mapping`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
