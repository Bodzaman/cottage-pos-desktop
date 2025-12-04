import {
  AIContentSuggestionRequest,
  AIVoiceSettingsUpdate,
  AbbreviateTextData,
  AbbreviationRequest,
  ActivateCorpusVersionData,
  AddCartAiColumnsData,
  AddCustomerReferenceFieldData,
  AddFavoriteData,
  AddFavoriteRequest,
  AddFavoriteToListData,
  AddGenderFieldData,
  AddHierarchicalColumnsData,
  AddIsAvailableColumnData,
  AddItemRequest,
  AddItemToCartData,
  AddItemsToCustomerTabData,
  AddItemsToCustomerTabPayload,
  AddItemsToTableData,
  AddItemsToTablePayload,
  AddLinkingColumnsData,
  AddMenuAiRlsData,
  AddOptimizationColumnsData,
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
  AnalyzeTableItemsData,
  AppApisAdminAuthRevokeDeviceRequest,
  AppApisBulkMenuOperationsBulkDeleteRequest,
  AppApisPosSupabaseAuthRevokeDeviceRequest,
  AppApisPrintJobsPrintJobRequest,
  AppApisPrintQueuePrintJobRequest,
  AppApisThermalTestTestPrintRequest,
  AppApisUnifiedMenuOperationsBulkDeleteRequest,
  AppApisUnifiedTestPrintTestPrintRequest,
  ApplyCategoryTemplateData,
  ApplyPromoCodeData,
  AuditReportData,
  AuthSyncHealthCheckData,
  AutoConfirmEmailData,
  AutoConfirmEmailRequest,
  AutoLinkUnusedMediaData,
  AutoProcessPrintQueueData,
  AutoSyncConfig,
  AutoSyncOnSetMealChangeData,
  BackfillAiAvatarsData,
  BackfillCustomersData,
  BackfillExistingVariantsData,
  BackfillLegacyData,
  BackfillMenuImagesData,
  BatchAnalyzeMenuItemsData,
  BatchCodeGenerationRequest,
  BatchGenerateVariantsData,
  BatchPricingRequest,
  BatchSchemaRequest,
  BatchUpdatePricingData,
  BodyUploadAvatar,
  BodyUploadGeneralFile,
  BodyUploadMenuImage,
  BodyUploadMenuItemImage,
  BodyUploadOptimizedMenuImage,
  BodyUploadPrimaryAgentAvatar,
  BodyUploadProfileImage,
  BulkDeleteItemsData,
  BulkDeleteItemsSafeData,
  BulkTestRequest,
  BulkToggleActiveData,
  BulkToggleRequest,
  BulkTrackingUpdate,
  BulkUpdateMediaTagsData,
  BulkUpdateOrderTrackingData,
  CalculateDeliveryData,
  CalculateDeliveryRouteData,
  CalculateEnhancedDeliveryRouteData,
  CalculateOrderFeesData,
  CartContextRequest,
  CartEventRequest,
  CartRemoveData,
  CartRemoveRequest,
  CashPaymentRequest,
  CategoryDeleteRequest,
  CategoryWithIsProteinType,
  ChatCartContextHealthData,
  ChatRequest,
  ChatStreamData,
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
  CheckChatAnalyticsSchemaData,
  CheckChatbotPromptsSchemaData,
  CheckChatbotTableData,
  CheckCorpusHealthData,
  CheckCustomerTabsSchemaData,
  CheckDatabaseConnectionData,
  CheckDatabaseSchemaData,
  CheckDeviceTrustData,
  CheckDeviceTrustRequest,
  CheckFavoriteListsSchemaData,
  CheckFavoriteStatusData,
  CheckHealthData,
  CheckHealthResult,
  CheckIsAvailableColumnData,
  CheckKdsSchemaData,
  CheckLatestReleaseData,
  CheckMediaAssetUsageData,
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
  CheckPosAccessData,
  CheckPosAuthSetupData,
  CheckPosTablesSchemaData,
  CheckPrinterHealthData,
  CheckProfilesConstraintsData,
  CheckSchemaMigrationsData,
  CheckSchemaStatusData,
  CheckServiceHealthData,
  CheckSpecificServiceData,
  CheckStatusData,
  CheckStreamingHealthData,
  CheckStructuredStreamingHealthData,
  CheckTableExistsData,
  CheckTableOrdersSchemaData,
  CheckTablesStatusData,
  CheckTrustRequest,
  CheckUserRolesTableExistsData,
  CheckUserTrustedDeviceData,
  CheckVariantFoodDetailsSchemaData,
  CheckVariantNamePatternSchemaData,
  CheckVariantNameStatusData,
  CheckVoiceMenuMatchingHealthData,
  CleanDuplicateCategoriesData,
  CleanupOrphanedMediaData,
  CleanupSafeTablesData,
  CleanupTableTestItemsData,
  ClearAllFavoritesData,
  ClearAllPendingChangesData,
  ClearCacheData,
  ClearCartData,
  ClearCartRequest,
  ClearHealthCacheData,
  ClearImageCacheData,
  ClearPerformanceMetricsData,
  CloseCustomerTabData,
  CodeGenerationRequest,
  CompleteTableOrderData,
  ConfirmPaymentData,
  ConfirmPaymentRequest,
  CreateAddressRequest,
  CreateAgentData,
  CreateBaseCacheData,
  CreateCacheRequest,
  CreateCartTableData,
  CreateChatbotPromptData,
  CreateCustomerAddressData,
  CreateCustomerTabData,
  CreateCustomerTabRequest,
  CreateCustomizationData,
  CreateCustomizationRequest,
  CreateElectronRepositoryData,
  CreateExecuteSqlRpcData,
  CreateFavoriteListData,
  CreateFileData,
  CreateFileRequest,
  CreateGeminiVoiceSessionData,
  CreateListRequest,
  CreateMenuCustomizationsTableData,
  CreateMenuItemData,
  CreateMenuUnifiedViewData,
  CreateMenuVariantsRpcData,
  CreateOnlineOrderData,
  CreateOnlineOrderRequest,
  CreateOptimizedFunctionData,
  CreatePaymentIntentData,
  CreatePaymentIntentRequest,
  CreatePosOrderData,
  CreatePosTableData,
  CreatePrintJobData,
  CreatePrintQueueJobData,
  CreatePrintTemplateData,
  CreatePrinterReleaseData,
  CreatePromoCodeData,
  CreatePromoCodeRequest,
  CreateProteinTypeData,
  CreateReceiptTemplateData,
  CreateReleaseData,
  CreateReleaseRequest,
  CreateRepoRequest,
  CreateRepositoryData,
  CreateRepositoryFileData,
  CreateRepositoryRequest,
  CreateSectionParentRecordsData,
  CreateSetMealData,
  CreateSmsPaymentLinkData,
  CreateTableOrderData,
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
  DeleteChatbotPromptData,
  DeleteCustomerAddressData,
  DeleteCustomizationData,
  DeleteFavoriteListData,
  DeleteItemRequest,
  DeleteListRequest,
  DeleteMediaAssetData,
  DeleteMenuItemData,
  DeletePosTableData,
  DeletePrintJobData,
  DeletePrintQueueJobData,
  DeletePrinterReleaseData,
  DeleteProfileImageData,
  DeletePromoCodeData,
  DeleteProteinTypeData,
  DeleteReceiptTemplateData,
  DeleteReleaseData,
  DeleteSetMealData,
  DeleteSingleItemData,
  DeleteTemplatePreviewData,
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
  EmailReceiptRequest,
  EmitEventEndpointData,
  EmitEventRequest,
  EnableRlsAndPoliciesData,
  EpsonPrintRequest,
  ExecuteCategoryMigrationData,
  ExecuteMigrationData,
  ExecuteSimpleMigrationData,
  ExecuteSqlEndpointData,
  ExecuteSqlSafeData,
  ExportOrdersData,
  ExtendCacheData,
  ExtendCacheRequest,
  FavoriteListsHealthData,
  FeeCalculationRequest,
  FileContent,
  FinalizeCutoverData,
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
  FullRunRequest,
  FullSetupData,
  GeminiCacheHealthCheckData,
  GenerateAiContentSuggestion2Data,
  GenerateAiContentSuggestionData,
  GenerateAiRecommendationsData,
  GenerateAllCodesData,
  GenerateAuditReportData,
  GenerateItemCodeData,
  GenerateMenuItemCodeData,
  GenerateOrderNumberData,
  GenerateOrderNumberRequest,
  GenerateReceiptData,
  GenerateReceiptHtmlData,
  GenerateReceiptRequest,
  GenerateReferenceNumbersForExistingCustomersData,
  GenerateStaticMapData,
  GenerateStructuredResponseData,
  GenerateSystemPromptData,
  GenerateTemplatePreviewData,
  GenerateVariantCodeData,
  GeocodeData,
  GeocodingRequest,
  GetAbbreviationDictionaryData,
  GetActiveCorpusData,
  GetActivePromptData,
  GetAdminLockStatusData,
  GetAgentByIdData,
  GetAgentProfilesEndpointData,
  GetAiSettingsStatusData,
  GetAiVoiceSettingsData,
  GetAllAgentsData,
  GetAllOrderSamplesData,
  GetAssetUsageData,
  GetAutoSyncConfigEndpointData,
  GetAvailableModelsData,
  GetAvailableVariablesEndpointData,
  GetBusinessDataEndpointData,
  GetCacheStatsData,
  GetCartData,
  GetCartMetricsData,
  GetCartSuggestionsData,
  GetCartSummaryData,
  GetCartSummaryTextData,
  GetCartTableStatusData,
  GetCategoriesData,
  GetCategoryDiagnosticsData,
  GetCategoryItemsData,
  GetCategorySectionMappingsData,
  GetChatCartContextData,
  GetChatConfigData,
  GetChatbotPromptData,
  GetCodeStandardsData,
  GetContextSummaryData,
  GetConversationAnalyticsData,
  GetCorpusVersionsData,
  GetCurrentBusinessRulesData,
  GetCurrentPasswordData,
  GetCustomerAddressesData,
  GetCustomerContextSummaryData,
  GetCustomerCountData,
  GetCustomerListsData,
  GetCustomerPreferencesData,
  GetCustomerProfileData,
  GetCustomerProfilePostData,
  GetCustomerReferenceData,
  GetCustomerTabData,
  GetCustomizationsData,
  GetCustomizationsForItemData,
  GetDeliveryConfigData,
  GetDeliveryZonesEndpointData,
  GetEmailVerificationStatusData,
  GetEnhancedMediaLibraryData,
  GetEnrichedFavoritesData,
  GetFileShaData,
  GetFullMenuContextData,
  GetFullSpecificationData,
  GetGalleryMenuItemsData,
  GetGithubUserData,
  GetGoogleLiveVoiceSettingsData,
  GetHealthCheckTemplateData,
  GetHealthHistoryData,
  GetHealthStatusData,
  GetHierarchicalMediaData,
  GetHierarchicalStatsData,
  GetIconInfoData,
  GetInstallationBundleData,
  GetInstallerFilesStatusData,
  GetItemDetailsData,
  GetItemSectionOrderData,
  GetJobLogsData,
  GetLatestCombinedInstallerData,
  GetLatestFailedRunLogsData,
  GetLatestPosReleaseData,
  GetLatestPrinterReleaseData,
  GetLatestReleaseData,
  GetLiveCallsData,
  GetLockStatusData,
  GetMapImageProxyData,
  GetMapsConfigData,
  GetMasterSwitchStatusData,
  GetMasterToggleData,
  GetMediaAssetData,
  GetMediaLibraryData,
  GetMediaUsageSummaryData,
  GetMenuCacheStatsData,
  GetMenuContextData,
  GetMenuCorpusData,
  GetMenuCorpusDebugData,
  GetMenuCorpusHealthData,
  GetMenuDataStatusData,
  GetMenuDataSummaryData,
  GetMenuDeltaSyncData,
  GetMenuForVoiceAgentData,
  GetMenuForVoiceAgentHtmlData,
  GetMenuForVoiceAgentTextData,
  GetMenuItemsData,
  GetMenuPrintSettingsData,
  GetMenuStatusData,
  GetMenuTextForRagData,
  GetMenuWithOrderingData,
  GetMigrationHistoryEndpointData,
  GetNextDisplayOrderData,
  GetNextItemDisplayOrderData,
  GetOfflineSyncStatusData,
  GetOnboardingStatusData,
  GetOnlineOrdersData,
  GetOptimizedImageData,
  GetOptimizedMenuData,
  GetOrderByIdData,
  GetOrderHistoryData,
  GetOrderItemsData,
  GetOrderSampleData,
  GetOrderTrackingDetailsData,
  GetOrdersByStatusData,
  GetOrdersData,
  GetPackageInfoData,
  GetPasswordStatusData,
  GetPaymentNotificationsMainData,
  GetPendingChangesData,
  GetPerformanceReportData,
  GetPersonalizationSettingsData,
  GetPosBundleData,
  GetPosDesktopVersionData,
  GetPosSettingsData,
  GetPowershellInstallScriptData,
  GetPowershellUninstallScriptData,
  GetPrintJobData,
  GetPrintJobStatsData,
  GetPrintJobsData,
  GetPrintQueueJobData,
  GetPrintQueueJobStatsData,
  GetPrintQueueJobsData,
  GetPrintRequestTemplatesData,
  GetPrinterCapabilitiesData,
  GetPrinterStatusData,
  GetPrintingSystemStatusData,
  GetProfileImageData,
  GetProteinTypeData,
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
  GetRealtimeNotificationsData,
  GetReceiptData,
  GetReceiptTemplateData,
  GetRecentMediaAssetsData,
  GetRecentPrintJobsData,
  GetReconciliationSummaryData,
  GetRepositoryInfoData,
  GetRestaurantConfigData,
  GetRestaurantDetailsForVoiceAgentData,
  GetRestaurantInfoTextForRagData,
  GetRestaurantProfileForVoiceAgentData,
  GetRestaurantProfileForVoiceAgentHtmlData,
  GetRestaurantProfileForVoiceAgentTextData,
  GetRestaurantSettingsData,
  GetSampleOrderDataEndpointData,
  GetSchemaHealthData,
  GetSequenceStatusData,
  GetServiceChargeConfigEndpointData,
  GetServiceSpecificationData,
  GetSessionMetricsData,
  GetSetMealData,
  GetSharedFavoriteListData,
  GetSignatureDishesData,
  GetSourceFileData,
  GetSpecificationData,
  GetStaticMapsConfigData,
  GetStatusOptionsData,
  GetStorageStatusData,
  GetStripePublishableKeyData,
  GetSummaryRequest,
  GetSupabaseConfigData,
  GetSyncStatusEndpointData,
  GetTableOrderData,
  GetTableSessionStatusData,
  GetTablesConfigData,
  GetTablesData,
  GetTemplateAssignmentData,
  GetTemplateAssignmentsData,
  GetTemplatePreviewData,
  GetTemplateStatusData,
  GetTestInfoData,
  GetTestStatusData,
  GetUnifiedAgentConfigData,
  GetUserFavoritesData,
  GetUserOrdersData,
  GetVoiceAgentCustomizationsData,
  GetVoiceAgentDataData,
  GetVoiceAgentStatusData,
  GetWorkflowRunJobsData,
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
  InitializeOnboardingRequest,
  InitializeSchemaMigrationsData,
  InitializeUnifiedAgentConfigData,
  InvalidateMenuCacheData,
  InvalidateOfflineCacheData,
  InvestigateMenuSchemaData,
  ItemCodeRequest,
  KitchenAndCustomerRequest,
  KitchenPrintRequest,
  KitchenTicketRequest,
  LinkMediaToMenuIntegrationData,
  LinkMediaToMenuIntegrationPayload,
  LinkMediaToMenuItemData,
  LinkMenuItemMediaData,
  ListAllTablesData,
  ListAvailableModelsData,
  ListCachesData,
  ListChatbotPromptsData,
  ListCustomerTabsForTableData,
  ListPendingPaymentsData,
  ListPrintTemplatesData,
  ListPromoCodesData,
  ListProteinTypesData,
  ListReceiptTemplatesData,
  ListRecentEventsData,
  ListReleasesData,
  ListRlsPoliciesData,
  ListSetMealsData,
  ListSupportedFunctionsData,
  ListTableOrdersData,
  ListTrustedDevicesData,
  ListWorkflowRunsData,
  LockLegacyAndViewsData,
  LogEscalationData,
  LogEscalationPayload,
  LogMessageData,
  LogMessagePayload,
  LogSessionEndData,
  LogSessionEndPayload,
  LogSessionStartData,
  LogSessionStartPayload,
  LookupCustomerData,
  LookupMenuItemByCodeData,
  LookupPostcodeSchemaData,
  MakeLoyaltyTokenNullableData,
  MarkNotificationsProcessedMainData,
  MarkNotificationsProcessedMainPayload,
  MarkPaymentAsPaidData,
  MarkRealtimeNotificationsData,
  MarkTourCompleteData,
  MarkTourCompleteRequest,
  MarkWizardCompleteData,
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
  MenuMediaCoreLinkToItemPayload,
  MenuMediaCoreUpdateTrackingData,
  MenuMediaCoreVerifyRelationshipsData,
  MenuMediaOptimizerHealthCheckData,
  MenuValidationRequest,
  MergeTabsData,
  MergeTabsRequest,
  MigrateFixTableStatusesData,
  MigrateProfilesToCustomersData,
  MigrateTablesNowData,
  MigrateVariantNamesToTitleCaseData,
  MoveCategorySectionData,
  MoveCategorySectionRequest,
  MoveItemsBetweenTabsData,
  MoveItemsRequest,
  NaturalLanguageSearchData,
  NaturalLanguageSearchRequest,
  NextOrderRequest,
  NotificationMarkRequest,
  NotificationPreferences,
  NotificationRequest,
  OpeningHoursValidationRequest,
  OrderConfirmationRequest,
  OrderModel,
  OrderSampleRequest,
  OrderStatus,
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
  PreviewPromptRequest,
  PriceBreakdownRequest,
  PrintCustomerReceiptData,
  PrintEpsonData,
  PrintJobUpdateRequest,
  PrintKitchenAndCustomerData,
  PrintKitchenThermalData,
  PrintKitchenTicketData,
  PrintReceiptThermalData,
  PrintRichTemplateData,
  PrintTemplate,
  PrintTemplateRequest,
  PrintTestReceiptData,
  PrintWithTemplateData,
  PrintWithTemplatePayload,
  PrinterReleaseRequest,
  ProcessCashPaymentData,
  ProcessFailedPrintJobsData,
  ProcessFinalBillForTableData,
  ProcessPrintQueueData,
  ProcessPrintQueueJobsData,
  ProcessQueueRequest,
  ProcessTemplateVariablesData,
  ProcessTemplateWithSampleData,
  PromoCodeRequest,
  PromptGeneratorHealthData,
  ProteinTypeCreate,
  ProteinTypeUpdate,
  PublishCorpusData,
  PublishCorpusRequest,
  PublishMenuData,
  PublishPromptData,
  PublishVoiceSettingsData,
  PublishWizardConfigData,
  PublishWizardConfigRequest,
  PushPrinterServiceToGithubEndpointData,
  RealTimeSyncHealthCheckData,
  ReceiptData,
  ReceiptGeneratorHealthCheckData,
  ReceiptPrintRequest,
  RecommendationRequest,
  RecordMenuChangeData,
  RefreshSchemaCacheData,
  RegenerateAllVariantNamesData,
  RemoveAssetReferencesData,
  RemoveFavoriteData,
  RemoveFavoriteFromListData,
  RemoveFavoriteRequest,
  RemoveFromListRequest,
  RemoveItemFromCartData,
  RemoveItemRequest,
  RenameCustomerTabData,
  RenameFavoriteListData,
  RenameListRequest,
  ReorderRequest,
  ReorderSiblingsData,
  ReplaceAssetInMenuItemsData,
  ReplaceAssetRequest,
  ResetCodeSystemData,
  ResetMenuStructureData,
  ResetTableCompletelyData,
  ResetTemplateAssignmentData,
  RetryItemMigrationData,
  RevokeDeviceData,
  RevokeUserDeviceData,
  RollbackCategoryMigrationData,
  RollbackData,
  RunBatchGenerationData,
  RunCustomizationTestData,
  RunFullMigrationData,
  RunFullTestSuiteData,
  RunTableDiagnosticsData,
  SMSPaymentLinkRequest,
  SQLExecuteRequest,
  SQLQuery,
  SafeDeleteCategoryData,
  SampleDataRequest,
  SaveCategoryData,
  SaveMenuPrintSettingsData,
  SaveMenuPrintSettingsPayload,
  SavePOSSettingsRequest,
  SavePosSettingsData,
  SaveRestaurantSettingsData,
  SaveSettingsRequest,
  SaveTablesConfigData,
  SchemaMigrateMenuImagesV2Data,
  SearchMenuData,
  SearchMenuRequest,
  SectionChangeImpactRequest,
  SelectAgentData,
  SendOrderConfirmationEmailData,
  SendRealtimeNotificationData,
  SendVerificationEmailData,
  SendVerificationEmailRequest,
  ServiceChargeConfig,
  SetActivePromptData,
  SetActivePromptRequest,
  SetKdsPinData,
  SetMasterSwitchData,
  SetMealRequest,
  SetMealUpdateRequest,
  SetPINRequest,
  SetTemplateAssignmentData,
  SetTemplateAssignmentRequest,
  SetupAllSchemasBatchData,
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
  ShareListRequest,
  ShowMenuItemData,
  ShowMenuItemHealthData,
  SortOrderItemsBySectionsData,
  SortOrderItemsBySectionsPayload,
  SplitTabData,
  SplitTabRequest,
  StaticMapRequest,
  StoreOrderData,
  StreamChatData,
  StripeWebhookData,
  StructuredChatRequest,
  StructuredStreamingRequest,
  SuggestKitchenNamesData,
  SupabaseManagerHealthCheckData,
  SupabasePosLoginData,
  SyncCountersWithDatabaseData,
  SyncElectronBuilderConfigData,
  SyncGoogleProfileImageData,
  SyncInstallerFilesData,
  SyncMenuChangesNowData,
  SyncMenuCorpusData,
  SyncPOSFilesRequest,
  SyncPosFilesData,
  SyncPrinterServiceData,
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
  TestAiVoiceConnectionData,
  TestAllCartOperationsData,
  TestAllPrintersData,
  TestAllVoiceFunctionsData,
  TestBatchVariantsDryRunData,
  TestCategoryFilterData,
  TestComprehensiveMenuSqlFunctionData,
  TestCustomizationsEndToEndData,
  TestCustomizationsHealthCheckData,
  TestCustomizationsSchemaFixData,
  TestCustomizationsWithRealItemData,
  TestGoogleLiveVoiceCallData,
  TestMenuCustomizationsQueryData,
  TestMenuUnifiedViewData,
  TestMenuVariantsRpcData,
  TestModeAnyData,
  TestModeAnyHealthCheckData,
  TestModeAnyMultiturnData,
  TestOptimizedFunctionData,
  TestPrintData,
  TestPrintSimpleDataData,
  TestPrintUnifiedData,
  TestRequest,
  TestSafetyValidationData,
  TestSqlFunctionMenuTablesData,
  TestTier1CrudData,
  TestTier2DdlData,
  TestTier3AdvancedData,
  TestVoiceExecutorData,
  ThermalTestPrintData,
  ToggleAiAssistantData,
  ToggleAiVoiceAssistantData,
  TrackCartEventData,
  TrustDeviceForUserData,
  TrustDeviceRequest,
  UnifiedAgentConfigStatusData,
  UnlinkMediaData,
  UnpublishPromptData,
  UpdateAbbreviationDictionaryData,
  UpdateAbbreviationDictionaryPayload,
  UpdateAgentData,
  UpdateAiVoiceSettingsData,
  UpdateAutoSyncConfigData,
  UpdateCategoriesPrintFieldsData,
  UpdateChatbotPromptData,
  UpdateCustomerPreferencesData,
  UpdateCustomerTabData,
  UpdateCustomerTabRequest,
  UpdateCustomizationData,
  UpdateCustomizationRequest,
  UpdateCustomizationsRequest,
  UpdateDeliveryZonesData,
  UpdateDeliveryZonesPayload,
  UpdateEmailStepData,
  UpdateExistingAgentsGenderData,
  UpdateFileMappingData,
  UpdateFileMappingRequest,
  UpdateGoogleLiveVoiceSettingsData,
  UpdateGoogleLiveVoiceSettingsRequest,
  UpdateItemCustomizationsData,
  UpdateItemQuantityData,
  UpdateMediaAssetData,
  UpdateMediaAssetPayload,
  UpdateMenuItemData,
  UpdateMenuItemsSchemaData,
  UpdateMenuItemsWithAiFields2Data,
  UpdateMenuItemsWithAiFieldsData,
  UpdateOrderTrackingStatusData,
  UpdatePOSDesktopRequest,
  UpdatePasswordData,
  UpdatePersonalizationSettingsData,
  UpdatePosDesktopData,
  UpdatePosTableData,
  UpdatePosTableStatusData,
  UpdatePrintJobStatusData,
  UpdatePrintQueueJobStatusData,
  UpdateProteinTypeData,
  UpdateQuantityRequest,
  UpdateReceiptTemplateData,
  UpdateServiceChargeConfigData,
  UpdateSetMealData,
  UpdateTableOrderData,
  UpdateTableOrderRequest,
  UpdateTableRequest,
  UpdateUnifiedAgentConfigData,
  UpdateUnifiedAgentConfigRequest,
  UpdateVariantPricingData,
  UploadAssetRequest,
  UploadAvatarData,
  UploadGeneralFileData,
  UploadMenuImageData,
  UploadMenuItemImageData,
  UploadOptimizedMenuImageData,
  UploadPrimaryAgentAvatarData,
  UploadProfileImageData,
  UploadReleaseAssetData,
  ValidateAssetsRequest,
  ValidateAvatarLimitData,
  ValidateCodeStandardData,
  ValidateCodeUniqueData,
  ValidateCustomizationData,
  ValidateCustomizationRequest,
  ValidateDeliveryPostcodeData,
  ValidateMediaAssetsData,
  ValidateMenuItemData,
  ValidateOpeningHoursData,
  ValidateOrderData,
  ValidatePromoCodeData,
  ValidateReferenceSystemData,
  ValidateStructuredPromptsData,
  VariableListRequest,
  VariantCodeRequest,
  VerifyCartAiSchemaData,
  VerifyCategoryMigrationData,
  VerifyDatabaseProceduresData,
  VerifyExecuteSqlRpcData,
  VerifyKdsPinData,
  VerifyMigrationData,
  VerifyPINRequest,
  VerifyPasswordData,
  VerifyPasswordWithDeviceData,
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

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Link media assets to a menu item and update the relationship in the database. This endpoint maintains bidirectional relationships and updates tracking info.
   * @tags dbtn/module:link_media_to_menu_item
   * @name link_menu_item_media
   * @summary Link Menu Item Media
   * @request POST:/routes/link-media-to-menu-item/{menu_item_id}
   */
  export namespace link_menu_item_media {
    export type RequestParams = {
      /** Menu Item Id */
      menuItemId: string;
    };
    export type RequestQuery = {
      /** Primary Media Id */
      primary_media_id?: string | null;
      /** Secondary Media Id */
      secondary_media_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LinkMenuItemMediaData;
  }

  /**
   * @description Get all code standards and naming conventions This endpoint returns the complete list of code standards and naming conventions used in the project, with examples for each. Returns: StandardsResponse: List of code standards and naming conventions
   * @tags dbtn/module:code_standards
   * @name get_code_standards
   * @summary Get Code Standards
   * @request GET:/routes/standards
   */
  export namespace get_code_standards {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCodeStandardsData;
  }

  /**
   * @description Validate if a given standard is implemented correctly This endpoint checks if a specific code standard is being followed correctly in the codebase. Args: standard_id: The ID of the standard to validate Returns: Dict[str, Any]: Validation results with compliance metrics
   * @tags dbtn/module:code_standards
   * @name validate_code_standard
   * @summary Validate Code Standard
   * @request POST:/routes/standards/validate
   */
  export namespace validate_code_standard {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Standard Id */
      standard_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateCodeStandardData;
  }

  /**
   * @description Get all signature dishes - role_level determines access level
   * @tags dbtn/module:signature_dishes
   * @name get_signature_dishes
   * @summary Get Signature Dishes
   * @request GET:/routes/signature-dishes
   */
  export namespace get_signature_dishes {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Role Level
       * @default "viewer"
       */
      role_level?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSignatureDishesData;
  }

  /**
   * @description Provides the correct Supabase configuration to the frontend. Only returns the URL and anon key that are safe for frontend use.
   * @tags dbtn/module:supabase_config
   * @name get_supabase_config
   * @summary Get Supabase Config
   * @request GET:/routes/get-supabase-config
   */
  export namespace get_supabase_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSupabaseConfigData;
  }

  /**
   * @description Safely bulk delete categories or protein types. This version provides better error handling and user guidance.
   * @tags dbtn/module:bulk_menu_operations
   * @name bulk_delete_items_safe
   * @summary Bulk Delete Items Safe
   * @request POST:/routes/bulk-delete-safe
   */
  export namespace bulk_delete_items_safe {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisBulkMenuOperationsBulkDeleteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkDeleteItemsSafeData;
  }

  /**
   * @description Checks and automatically fixes Supabase storage bucket permissions for menu media uploads. This endpoint is designed to be called before media uploads to ensure proper permissions are set. It will: 1. Check if the client-menu-images bucket exists 2. Create it if it doesn't exist 3. Verify and fix RLS policies for the bucket Returns: StoragePermissionsResponse: Object with success status and details
   * @tags dbtn/module:storage_permissions
   * @name check_and_fix_storage_permissions
   * @summary Check And Fix Storage Permissions
   * @request GET:/routes/check-and-fix-storage-permissions
   */
  export namespace check_and_fix_storage_permissions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckAndFixStoragePermissionsData;
  }

  /**
   * @description Add RLS policies to the menu_items_ai_metadata table
   * @tags dbtn/module:menu_rls
   * @name add_menu_ai_rls
   * @summary Add Menu Ai Rls
   * @request POST:/routes/add-menu-ai-rls
   */
  export namespace add_menu_ai_rls {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddMenuAiRlsData;
  }

  /**
   * @description Update the categories table to add print_order and print_to_kitchen columns
   * @tags dbtn/module:menu_print_settings
   * @name update_categories_print_fields
   * @summary Update Categories Print Fields
   * @request POST:/routes/update-categories-print-fields
   */
  export namespace update_categories_print_fields {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCategoriesPrintFieldsData;
  }

  /**
   * @description Check if the print_order and print_to_kitchen fields exist in the menu_categories table
   * @tags dbtn/module:menu_print_settings
   * @name check_categories_print_fields
   * @summary Check Categories Print Fields
   * @request GET:/routes/check-categories-print-fields
   */
  export namespace check_categories_print_fields {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckCategoriesPrintFieldsData;
  }

  /**
   * @description Reset the menu structure to the default template categories
   * @tags dbtn/module:menu_structure_reset
   * @name reset_menu_structure
   * @summary Reset Menu Structure
   * @request POST:/routes/reset-menu-structure
   */
  export namespace reset_menu_structure {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResetMenuStructureData;
  }

  /**
   * @description Fix the schema mismatch by renaming sort_order to display_order in menu_categories
   * @tags dbtn/module:menu_schema_fix
   * @name fix_schema_column_mismatch
   * @summary Fix Schema Column Mismatch
   * @request POST:/routes/menu-schema-fix/fix-schema-column-mismatch
   */
  export namespace fix_schema_column_mismatch {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixSchemaColumnMismatchData;
  }

  /**
   * @description Remove duplicate categories, keeping one of each category name
   * @tags dbtn/module:menu_schema_fix
   * @name clean_duplicate_categories
   * @summary Clean Duplicate Categories
   * @request POST:/routes/menu-schema-fix/clean-duplicate-categories
   */
  export namespace clean_duplicate_categories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CleanDuplicateCategoriesData;
  }

  /**
   * @description Check the current schema status and data consistency
   * @tags dbtn/module:menu_schema_fix
   * @name check_schema_status
   * @summary Check Schema Status
   * @request GET:/routes/menu-schema-fix/check-schema-status
   */
  export namespace check_schema_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckSchemaStatusData;
  }

  /**
   * @description Execute SQL query and return results
   * @tags dbtn/module:sql_execution
   * @name execute_sql_endpoint
   * @summary Execute Sql Endpoint
   * @request POST:/routes/execute-sql
   */
  export namespace execute_sql_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SQLQuery;
    export type RequestHeaders = {};
    export type ResponseBody = ExecuteSqlEndpointData;
  }

  /**
   * @description Add timing fields to orders table for Collection and Delivery scheduling
   * @tags dbtn/module:sql_execution
   * @name add_order_timing_fields
   * @summary Add Order Timing Fields
   * @request POST:/routes/add-order-timing-fields
   */
  export namespace add_order_timing_fields {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddOrderTimingFieldsData;
  }

  /**
   * @description Check if timing fields exist in orders table
   * @tags dbtn/module:sql_execution
   * @name check_order_timing_fields
   * @summary Check Order Timing Fields
   * @request GET:/routes/check-order-timing-fields
   */
  export namespace check_order_timing_fields {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckOrderTimingFieldsData;
  }

  /**
   * @description Add is_linked_table and is_linked_primary columns to existing pos_tables table
   * @tags dbtn/module:pos_tables_migration
   * @name add_linking_columns
   * @summary Add Linking Columns
   * @request POST:/routes/pos-tables-migration/add-linking-columns
   */
  export namespace add_linking_columns {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddLinkingColumnsData;
  }

  /**
   * @description Remove test items with invalid menu_item_ids and reset table status
   * @tags dbtn/module:table_cleanup
   * @name cleanup_table_test_items
   * @summary Cleanup Table Test Items
   * @request POST:/routes/cleanup-table-test-items
   */
  export namespace cleanup_table_test_items {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TableCleanupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CleanupTableTestItemsData;
  }

  /**
   * @description Completely reset a table by deleting its order record
   * @tags dbtn/module:table_cleanup
   * @name reset_table_completely
   * @summary Reset Table Completely
   * @request DELETE:/routes/reset-table/{table_number}
   */
  export namespace reset_table_completely {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResetTableCompletelyData;
  }

  /**
   * @description Analyze table items to identify test/invalid items
   * @tags dbtn/module:table_cleanup
   * @name analyze_table_items
   * @summary Analyze Table Items
   * @request GET:/routes/analyze-table/{table_number}
   */
  export namespace analyze_table_items {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeTableItemsData;
  }

  /**
   * @description Get sample order data for testing templates
   * @tags dbtn/module:sample_data
   * @name get_order_sample
   * @summary Get Order Sample
   * @request POST:/routes/order-sample
   */
  export namespace get_order_sample {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OrderSampleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetOrderSampleData;
  }

  /**
   * @description Get all sample order data for testing templates
   * @tags dbtn/module:sample_data
   * @name get_all_order_samples
   * @summary Get All Order Samples
   * @request GET:/routes/all-order-samples
   */
  export namespace get_all_order_samples {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllOrderSamplesData;
  }

  /**
   * @description Get business data for template processing
   * @tags dbtn/module:sample_data
   * @name get_business_data_endpoint
   * @summary Get Business Data Endpoint
   * @request GET:/routes/business-data
   */
  export namespace get_business_data_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBusinessDataEndpointData;
  }

  /**
   * @description Sync all active set meals to menu items in SET MEALS category
   * @tags dbtn/module:set_meal_sync
   * @name sync_set_meals_to_menu
   * @summary Sync Set Meals To Menu
   * @request POST:/routes/sync-set-meals-to-menu
   */
  export namespace sync_set_meals_to_menu {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncSetMealsToMenuData;
  }

  /**
   * @description Auto-sync a specific set meal when it's created/updated in admin
   * @tags dbtn/module:set_meal_sync
   * @name auto_sync_on_set_meal_change
   * @summary Auto Sync On Set Meal Change
   * @request POST:/routes/auto-sync-on-set-meal-change
   */
  export namespace auto_sync_on_set_meal_change {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Set Meal Id */
      set_meal_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AutoSyncOnSetMealChangeData;
  }

  /**
   * @description Verify and update relationships between menu items and media assets
   * @tags dbtn/module:menu_media
   * @name menu_media_core_verify_relationships
   * @summary Menu Media Core Verify Relationships
   * @request POST:/routes/menu-media-core/verify-relationships
   */
  export namespace menu_media_core_verify_relationships {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MenuMediaCoreVerifyRelationshipsData;
  }

  /**
   * @description Update core media tracking
   * @tags dbtn/module:menu_media
   * @name menu_media_core_update_tracking
   * @summary Menu Media Core Update Tracking
   * @request POST:/routes/menu-media-core/update-tracking
   */
  export namespace menu_media_core_update_tracking {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MenuMediaCoreUpdateTrackingData;
  }

  /**
   * @description Link media to menu item using unified core system
   * @tags dbtn/module:menu_media
   * @name menu_media_core_link_to_item
   * @summary Menu Media Core Link To Item
   * @request POST:/routes/menu-media-core/link-to-item/{menu_item_id}
   */
  export namespace menu_media_core_link_to_item {
    export type RequestParams = {
      /** Menu Item Id */
      menuItemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MenuMediaCoreLinkToItemPayload;
    export type RequestHeaders = {};
    export type ResponseBody = MenuMediaCoreLinkToItemData;
  }

  /**
   * @description Clean up orphaned media assets using core system
   * @tags dbtn/module:menu_media
   * @name menu_media_core_cleanup_orphaned
   * @summary Menu Media Core Cleanup Orphaned
   * @request POST:/routes/menu-media-core/cleanup-orphaned
   */
  export namespace menu_media_core_cleanup_orphaned {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MenuMediaCoreCleanupOrphanedData;
  }

  /**
   * @description Verify relationships between menu items and their associated media assets
   * @tags dbtn/module:menu_media_integration
   * @name media_integration_verify_relationships
   * @summary Media Integration Verify Relationships
   * @request GET:/routes/media-integration/verify-menu-relationships
   */
  export namespace media_integration_verify_relationships {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MediaIntegrationVerifyRelationshipsData;
  }

  /**
   * @description Update media tracking through integration system
   * @tags dbtn/module:menu_media_integration
   * @name media_integration_update_tracking
   * @summary Media Integration Update Tracking
   * @request POST:/routes/media-integration/update-media-tracking
   */
  export namespace media_integration_update_tracking {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MediaIntegrationUpdateTrackingData;
  }

  /**
   * @description Link media to menu integration using unified system
   * @tags dbtn/module:menu_media_integration
   * @name link_media_to_menu_integration
   * @summary Link Media To Menu Integration
   * @request POST:/routes/menu-integration/link-media/{menu_item_id}
   */
  export namespace link_media_to_menu_integration {
    export type RequestParams = {
      /** Menu Item Id */
      menuItemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = LinkMediaToMenuIntegrationPayload;
    export type RequestHeaders = {};
    export type ResponseBody = LinkMediaToMenuIntegrationData;
  }

  /**
   * @description Clean up orphaned media assets through integration system
   * @tags dbtn/module:menu_media_integration
   * @name media_integration_cleanup_orphaned
   * @summary Media Integration Cleanup Orphaned
   * @request DELETE:/routes/media-integration/cleanup-orphaned-media
   */
  export namespace media_integration_cleanup_orphaned {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MediaIntegrationCleanupOrphanedData;
  }

  /**
   * @description Generate FOH and Kitchen preview thumbnails for a template
   * @tags dbtn/module:template_previews
   * @name generate_template_preview
   * @summary Generate Template Preview
   * @request POST:/routes/generate-preview/{template_id}
   */
  export namespace generate_template_preview {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = PreviewGenerationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateTemplatePreviewData;
  }

  /**
   * @description Get preview image data for a template variant
   * @tags dbtn/module:template_previews
   * @name get_template_preview
   * @summary Get Template Preview
   * @request GET:/routes/get-preview/{template_id}/{variant}
   */
  export namespace get_template_preview {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
      /** Variant */
      variant: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTemplatePreviewData;
  }

  /**
   * @description Delete preview images for a template
   * @tags dbtn/module:template_previews
   * @name delete_template_preview
   * @summary Delete Template Preview
   * @request DELETE:/routes/delete-preview/{template_id}
   */
  export namespace delete_template_preview {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTemplatePreviewData;
  }

  /**
   * @description Generate abbreviated version of text using smart abbreviation dictionary
   * @tags dbtn/module:smart_abbreviation
   * @name abbreviate_text
   * @summary Abbreviate Text
   * @request POST:/routes/abbreviate-text
   */
  export namespace abbreviate_text {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AbbreviationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AbbreviateTextData;
  }

  /**
   * @description Generate kitchen display name suggestions for menu items with proteins
   * @tags dbtn/module:smart_abbreviation
   * @name suggest_kitchen_names
   * @summary Suggest Kitchen Names
   * @request POST:/routes/suggest-kitchen-names
   */
  export namespace suggest_kitchen_names {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Menu Item Name */
      menu_item_name: string;
      /** Protein Name */
      protein_name?: string | null;
      /**
       * Thermal Width
       * @default 25
       */
      thermal_width?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SuggestKitchenNamesData;
  }

  /**
   * @description Get the current abbreviation dictionary
   * @tags dbtn/module:smart_abbreviation
   * @name get_abbreviation_dictionary
   * @summary Get Abbreviation Dictionary
   * @request GET:/routes/abbreviation-dictionary
   */
  export namespace get_abbreviation_dictionary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAbbreviationDictionaryData;
  }

  /**
   * @description Update the abbreviation dictionary with custom restaurant terms
   * @tags dbtn/module:smart_abbreviation
   * @name update_abbreviation_dictionary
   * @summary Update Abbreviation Dictionary
   * @request POST:/routes/update-abbreviation-dictionary
   */
  export namespace update_abbreviation_dictionary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateAbbreviationDictionaryPayload;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateAbbreviationDictionaryData;
  }

  /**
   * @description Analyze all menu items and suggest kitchen display names for long items
   * @tags dbtn/module:smart_abbreviation
   * @name batch_analyze_menu_items
   * @summary Batch Analyze Menu Items
   * @request POST:/routes/batch-analyze-menu-items
   */
  export namespace batch_analyze_menu_items {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BatchAnalyzeMenuItemsData;
  }

  /**
   * @description Get recent payment notifications
   * @tags dbtn/module:payment_notifications
   * @name get_payment_notifications_main
   * @summary Get Payment Notifications Main
   * @request GET:/routes/payment-notifications
   */
  export namespace get_payment_notifications_main {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @min 1
       * @max 50
       * @default 10
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPaymentNotificationsMainData;
  }

  /**
   * @description Mark notifications as processed
   * @tags dbtn/module:payment_notifications
   * @name mark_notifications_processed_main
   * @summary Mark Notifications Processed Main
   * @request POST:/routes/payment-notifications/mark-processed
   */
  export namespace mark_notifications_processed_main {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MarkNotificationsProcessedMainPayload;
    export type RequestHeaders = {};
    export type ResponseBody = MarkNotificationsProcessedMainData;
  }

  /**
   * @description Get notification preferences for a customer
   * @tags dbtn/module:preferences
   * @name get_customer_preferences
   * @summary Get Customer Preferences
   * @request GET:/routes/preferences/{phone_number}
   */
  export namespace get_customer_preferences {
    export type RequestParams = {
      /** Phone Number */
      phoneNumber: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerPreferencesData;
  }

  /**
   * @description Update notification preferences for a customer
   * @tags dbtn/module:preferences
   * @name update_customer_preferences
   * @summary Update Customer Preferences
   * @request POST:/routes/preferences/{phone_number}
   */
  export namespace update_customer_preferences {
    export type RequestParams = {
      /** Phone Number */
      phoneNumber: string;
    };
    export type RequestQuery = {};
    export type RequestBody = NotificationPreferences;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCustomerPreferencesData;
  }

  /**
   * @description Get recent events with optional filtering
   * @tags dbtn/module:events
   * @name list_recent_events
   * @summary List Recent Events
   * @request GET:/routes/events/recent-events
   */
  export namespace list_recent_events {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * Maximum number of events to return
       * @default 20
       */
      limit?: number;
      /**
       * Event Type
       * Filter events by type
       */
      event_type?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListRecentEventsData;
  }

  /**
   * @description Emit a new event through the API
   * @tags dbtn/module:events
   * @name emit_event_endpoint
   * @summary Emit Event Endpoint
   * @request POST:/routes/events/emit
   */
  export namespace emit_event_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EmitEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = EmitEventEndpointData;
  }

  /**
   * @description Check database schema status and health
   * @tags dbtn/module:unified_database_core
   * @name check_database_schema
   * @summary Check Database Schema
   * @request GET:/routes/unified-database/core/check-schema
   */
  export namespace check_database_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckDatabaseSchemaData;
  }

  /**
   * @description Test database connection and performance
   * @tags dbtn/module:unified_database_core
   * @name check_database_connection
   * @summary Check Database Connection
   * @request GET:/routes/unified-database/core/check-connection
   */
  export namespace check_database_connection {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckDatabaseConnectionData;
  }

  /**
   * @description Fix common foreign key constraint issues
   * @tags dbtn/module:unified_database_core
   * @name fix_database_foreign_keys
   * @summary Fix Database Foreign Keys
   * @request POST:/routes/unified-database/core/fix-foreign-keys
   */
  export namespace fix_database_foreign_keys {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixDatabaseForeignKeysData;
  }

  /**
   * @description Comprehensive analysis of all database tables
   * @tags dbtn/module:unified_database_core
   * @name analyze_database_tables
   * @summary Analyze Database Tables
   * @request GET:/routes/unified-database/audit/analyze-tables
   */
  export namespace analyze_database_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeDatabaseTablesData;
  }

  /**
   * @description Cleanup tables that are safe to delete (placeholder - would need careful implementation)
   * @tags dbtn/module:unified_database_core
   * @name cleanup_safe_tables
   * @summary Cleanup Safe Tables
   * @request POST:/routes/unified-database/audit/cleanup-safe-tables
   */
  export namespace cleanup_safe_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CleanupSafeTablesData;
  }

  /**
   * @description Setup user roles and Row Level Security
   * @tags dbtn/module:unified_database_core
   * @name setup_user_roles_rls
   * @summary Setup User Roles Rls
   * @request POST:/routes/unified-database/setup/user-roles-rls
   */
  export namespace setup_user_roles_rls {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupUserRolesRlsData;
  }

  /**
   * @description Check if user_roles table exists
   * @tags dbtn/module:unified_database_core
   * @name check_user_roles_table_exists
   * @summary Check User Roles Table Exists
   * @request GET:/routes/unified-database/setup/check-user-roles-table
   */
  export namespace check_user_roles_table_exists {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckUserRolesTableExistsData;
  }

  /**
   * @description Setup essential database procedures and functions
   * @tags dbtn/module:unified_database_core
   * @name setup_database_procedures
   * @summary Setup Database Procedures
   * @request POST:/routes/unified-database/procedures/setup
   */
  export namespace setup_database_procedures {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupDatabaseProceduresData;
  }

  /**
   * @description Verify that essential database procedures exist and work
   * @tags dbtn/module:unified_database_core
   * @name verify_database_procedures
   * @summary Verify Database Procedures
   * @request GET:/routes/unified-database/procedures/verify
   */
  export namespace verify_database_procedures {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyDatabaseProceduresData;
  }

  /**
   * @description Populate the menu tables with sample data Endpoint to populate menu tables with sample data for testing Returns: MenuSystemResponse: Population status and details
   * @tags dbtn/module:menu_system
   * @name populate_sample_menu_data_endpoint
   * @summary Populate Sample Menu Data Endpoint
   * @request POST:/routes/menu-system/populate-sample-data
   */
  export namespace populate_sample_menu_data_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PopulateSampleMenuDataEndpointData;
  }

  /**
   * @description Populate sample menu data in the database This function populates the database with sample menu data using SQL execution. It inserts categories, menu items, and variants if the tables exist but are empty. Returns: MenuSystemResponse: Result of the operation
   * @tags dbtn/module:menu_system
   * @name populate_sample_menu_data_v2
   * @summary Populate Sample Menu Data V2
   * @request POST:/routes/menu-system/populate-sample-data-v2
   */
  export namespace populate_sample_menu_data_v2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PopulateSampleMenuDataV2Data;
  }

  /**
   * @description Comprehensive test of SQL function, menu tables, and menu corpus data extraction This endpoint runs a series of tests to verify that all components needed for menu corpus extraction are working correctly, and provides detailed diagnostics about what might be failing. Returns: Dict[str, Any]: Comprehensive test results
   * @tags dbtn/module:menu_system
   * @name test_comprehensive_menu_sql_function
   * @summary Test Comprehensive Menu Sql Function
   * @request POST:/routes/menu-system/test-comprehensive-menu-sql
   */
  export namespace test_comprehensive_menu_sql_function {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestComprehensiveMenuSqlFunctionData;
  }

  /**
   * @description Check the health of the menu system This function verifies SQL connectivity and menu tables existence. Returns: Dict[str, Any]: Health status information
   * @tags dbtn/module:menu_system
   * @name check_menu_system_health
   * @summary Check Menu System Health
   * @request GET:/routes/menu-system/health
   */
  export namespace check_menu_system_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMenuSystemHealthData;
  }

  /**
   * @description Check the current schema of order_items table
   * @tags dbtn/module:order_items_schema_fix
   * @name check_order_items_schema
   * @summary Check Order Items Schema
   * @request GET:/routes/check-order-items-schema
   */
  export namespace check_order_items_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckOrderItemsSchemaData;
  }

  /**
   * @description Add missing columns to order_items table to match data structure
   * @tags dbtn/module:order_items_schema_fix
   * @name fix_order_items_schema
   * @summary Fix Order Items Schema
   * @request POST:/routes/fix-order-items-schema
   */
  export namespace fix_order_items_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixOrderItemsSchemaData;
  }

  /**
   * @description Retry migrating order items for successfully migrated orders
   * @tags dbtn/module:order_items_schema_fix
   * @name retry_item_migration
   * @summary Retry Item Migration
   * @request POST:/routes/retry-item-migration
   */
  export namespace retry_item_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RetryItemMigrationData;
  }

  /**
   * @description Unified test print endpoint that replaces all duplicate test_print functions. Sends test print requests to the helper app on localhost:3001.
   * @tags dbtn/module:unified_test_print
   * @name test_print_unified
   * @summary Test Print Unified
   * @request POST:/routes/test-print
   */
  export namespace test_print_unified {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisUnifiedTestPrintTestPrintRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestPrintUnifiedData;
  }

  /**
   * @description Returns sample print data format for testing (replaces windows_printer_helper version)
   * @tags dbtn/module:unified_test_print
   * @name test_print_simple_data
   * @summary Test Print Simple Data
   * @request GET:/routes/test-print-simple
   */
  export namespace test_print_simple_data {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestPrintSimpleDataData;
  }

  /**
   * @description Get comprehensive performance report for voice endpoints
   * @tags dbtn/module:voice_performance_monitor
   * @name get_performance_report
   * @summary Get Performance Report
   * @request GET:/routes/voice-performance/performance-report
   */
  export namespace get_performance_report {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPerformanceReportData;
  }

  /**
   * @description Get raw performance metrics for debugging
   * @tags dbtn/module:voice_performance_monitor
   * @name get_raw_performance_metrics
   * @summary Get Raw Performance Metrics
   * @request GET:/routes/voice-performance/performance-metrics
   */
  export namespace get_raw_performance_metrics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRawPerformanceMetricsData;
  }

  /**
   * @description Clear all performance metrics
   * @tags dbtn/module:voice_performance_monitor
   * @name clear_performance_metrics
   * @summary Clear Performance Metrics
   * @request POST:/routes/voice-performance/clear-metrics
   */
  export namespace clear_performance_metrics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearPerformanceMetricsData;
  }

  /**
   * @description Generate a receipt for a completed payment
   * @tags dbtn/module:receipt_generator
   * @name generate_receipt
   * @summary Generate Receipt
   * @request POST:/routes/receipt-generator/generate
   */
  export namespace generate_receipt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GenerateReceiptRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateReceiptData;
  }

  /**
   * @description Send an existing receipt via email
   * @tags dbtn/module:receipt_generator
   * @name email_receipt
   * @summary Email Receipt
   * @request POST:/routes/receipt-generator/email
   */
  export namespace email_receipt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EmailReceiptRequest;
    export type RequestHeaders = {};
    export type ResponseBody = EmailReceiptData;
  }

  /**
   * @description Get receipt information by ID
   * @tags dbtn/module:receipt_generator
   * @name get_receipt
   * @summary Get Receipt
   * @request GET:/routes/receipt-generator/receipt/{receipt_id}
   */
  export namespace get_receipt {
    export type RequestParams = {
      /** Receipt Id */
      receiptId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetReceiptData;
  }

  /**
   * @description Check if receipt generation service is working
   * @tags dbtn/module:receipt_generator
   * @name receipt_generator_health_check
   * @summary Receipt Generator Health Check
   * @request GET:/routes/receipt-generator/receipt-health
   */
  export namespace receipt_generator_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ReceiptGeneratorHealthCheckData;
  }

  /**
   * @description Add gender field to voice_agent_profiles table
   * @tags dbtn/module:agent_gender_migration
   * @name add_gender_field
   * @summary Add Gender Field
   * @request POST:/routes/add-gender-field
   */
  export namespace add_gender_field {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddGenderFieldData;
  }

  /**
   * @description Set default gender for existing agents
   * @tags dbtn/module:agent_gender_migration
   * @name update_existing_agents_gender
   * @summary Update Existing Agents Gender
   * @request POST:/routes/update-existing-agents-gender
   */
  export namespace update_existing_agents_gender {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateExistingAgentsGenderData;
  }

  /**
   * @description Remove items from the cart for voice assistant ordering. This endpoint allows the voice assistant to remove specific items or quantities from a customer's cart during voice ordering sessions.
   * @tags dbtn/module:cart_remove
   * @name cart_remove
   * @summary Cart Remove
   * @request POST:/routes/cart-remove
   */
  export namespace cart_remove {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CartRemoveRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CartRemoveData;
  }

  /**
   * @description Get all addresses for a customer
   * @tags dbtn/module:customer_addresses
   * @name get_customer_addresses
   * @summary Get Customer Addresses
   * @request GET:/routes/customer-addresses/{customer_id}
   */
  export namespace get_customer_addresses {
    export type RequestParams = {
      /** Customer Id */
      customerId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerAddressesData;
  }

  /**
   * @description Create a new customer address
   * @tags dbtn/module:customer_addresses
   * @name create_customer_address
   * @summary Create Customer Address
   * @request POST:/routes/customer-addresses
   */
  export namespace create_customer_address {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateAddressRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCustomerAddressData;
  }

  /**
   * @description Delete a customer address
   * @tags dbtn/module:customer_addresses
   * @name delete_customer_address
   * @summary Delete Customer Address
   * @request DELETE:/routes/customer-addresses/{address_id}
   */
  export namespace delete_customer_address {
    export type RequestParams = {
      /** Address Id */
      addressId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteCustomerAddressData;
  }

  /**
   * @description Get menu items with images for the food gallery Returns only menu items that have associated images
   * @tags dbtn/module:gallery_menu_items
   * @name get_gallery_menu_items
   * @summary Get Gallery Menu Items
   * @request GET:/routes/gallery-menu-items
   */
  export namespace get_gallery_menu_items {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGalleryMenuItemsData;
  }

  /**
   * @description Test thermal printer functionality
   * @tags dbtn/module:thermal_test
   * @name test_print
   * @summary Test Print
   * @request POST:/routes/print
   */
  export namespace test_print {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisThermalTestTestPrintRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestPrintData;
  }

  /**
   * @description Get status of thermal printer test system
   * @tags dbtn/module:thermal_test
   * @name get_test_status
   * @summary Get Test Status
   * @request GET:/routes/status
   */
  export namespace get_test_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestStatusData;
  }

  /**
   * @description Get information about the thermal printer test system
   * @tags dbtn/module:thermal_test
   * @name get_test_info
   * @summary Get Test Info
   * @request GET:/routes/info
   */
  export namespace get_test_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestInfoData;
  }

  /**
   * @description Download the professional Cottage Tandoori Restaurant icon file
   * @tags dbtn/module:download_icon
   * @name download_cottage_icon
   * @summary Download Cottage Icon
   * @request GET:/routes/download-cottage-icon
   */
  export namespace download_cottage_icon {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DownloadCottageIconData;
  }

  /**
   * @description Get information about the restaurant icon
   * @tags dbtn/module:download_icon
   * @name get_icon_info
   * @summary Get Icon Info
   * @request GET:/routes/icon-info
   */
  export namespace get_icon_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetIconInfoData;
  }

  /**
   * @description Create a new GitHub repository for the Electron POS application
   * @tags dbtn/module:github_electron_setup
   * @name create_electron_repository
   * @summary Create Electron Repository
   * @request POST:/routes/create-electron-repo
   */
  export namespace create_electron_repository {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateRepoRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateElectronRepositoryData;
  }

  /**
   * @description Create a file in the specified GitHub repository
   * @tags dbtn/module:github_electron_setup
   * @name create_repository_file
   * @summary Create Repository File
   * @request POST:/routes/create-file
   */
  export namespace create_repository_file {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Repo Name */
      repo_name: string;
    };
    export type RequestBody = FileContent;
    export type RequestHeaders = {};
    export type ResponseBody = CreateRepositoryFileData;
  }

  /**
   * @description Get authenticated GitHub user information
   * @tags dbtn/module:github_electron_setup
   * @name get_github_user
   * @summary Get Github User
   * @request GET:/routes/get-user
   */
  export namespace get_github_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGithubUserData;
  }

  /**
   * @description Process the print queue - attempt to print all queued jobs
   * @tags dbtn/module:print_queue_processor
   * @name process_print_queue_jobs
   * @summary Process Print Queue Jobs
   * @request POST:/routes/queue/process-print-queue
   */
  export namespace process_print_queue_jobs {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProcessQueueRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessPrintQueueJobsData;
  }

  /**
   * @description Get statistics about the print job queue
   * @tags dbtn/module:print_queue_processor
   * @name get_print_queue_job_stats
   * @summary Get Print Queue Job Stats
   * @request GET:/routes/queue/print-job-stats
   */
  export namespace get_print_queue_job_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintQueueJobStatsData;
  }

  /**
   * @description Create a new print job and add it to the queue Jobs are persisted to SQLite-like storage for offline resilience
   * @tags dbtn/module:print_queue
   * @name create_print_queue_job
   * @summary Create Print Queue Job
   * @request POST:/routes/queue/create-print-job
   */
  export namespace create_print_queue_job {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisPrintQueuePrintJobRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePrintQueueJobData;
  }

  /**
   * @description Get print jobs from the queue with optional status filtering
   * @tags dbtn/module:print_queue
   * @name get_print_queue_jobs
   * @summary Get Print Queue Jobs
   * @request GET:/routes/queue/print-jobs
   */
  export namespace get_print_queue_jobs {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Status */
      status?: string | null;
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintQueueJobsData;
  }

  /**
   * @description Get a specific print job by ID
   * @tags dbtn/module:print_queue
   * @name get_print_queue_job
   * @summary Get Print Queue Job
   * @request GET:/routes/queue/print-job/{job_id}
   */
  export namespace get_print_queue_job {
    export type RequestParams = {
      /** Job Id */
      jobId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintQueueJobData;
  }

  /**
   * @description Delete a print job from the queue
   * @tags dbtn/module:print_queue
   * @name delete_print_queue_job
   * @summary Delete Print Queue Job
   * @request DELETE:/routes/queue/print-job/{job_id}
   */
  export namespace delete_print_queue_job {
    export type RequestParams = {
      /** Job Id */
      jobId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeletePrintQueueJobData;
  }

  /**
   * @description Update the status of a print job
   * @tags dbtn/module:print_queue
   * @name update_print_queue_job_status
   * @summary Update Print Queue Job Status
   * @request PATCH:/routes/queue/print-job/{job_id}/status
   */
  export namespace update_print_queue_job_status {
    export type RequestParams = {
      /** Job Id */
      jobId: string;
    };
    export type RequestQuery = {
      /** Status */
      status: string;
      /** Error Message */
      error_message?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePrintQueueJobStatusData;
  }

  /**
   * @description Process failed print jobs with retry logic Implements exponential backoff and maximum retry limits
   * @tags dbtn/module:print_queue
   * @name process_failed_print_jobs
   * @summary Process Failed Print Jobs
   * @request POST:/routes/queue/process-failed-jobs
   */
  export namespace process_failed_print_jobs {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Max Retries
       * @default 3
       */
      max_retries?: number;
      /**
       * Max Jobs
       * @default 10
       */
      max_jobs?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessFailedPrintJobsData;
  }

  /**
   * @description Automatically process queued print jobs when printer becomes available This is the main background processing function for offline capabilities
   * @tags dbtn/module:print_queue
   * @name auto_process_print_queue
   * @summary Auto Process Print Queue
   * @request POST:/routes/queue/auto-process
   */
  export namespace auto_process_print_queue {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Max Jobs
       * @default 10
       */
      max_jobs?: number;
      /**
       * Include Failed
       * @default true
       */
      include_failed?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AutoProcessPrintQueueData;
  }

  /**
   * @description Get comprehensive status of the print queue and printer
   * @tags dbtn/module:print_queue
   * @name get_queue_status
   * @summary Get Queue Status
   * @request GET:/routes/queue/status
   */
  export namespace get_queue_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetQueueStatusData;
  }

  /**
   * @description Debug the menu_customizations table to understand the 400 error
   * @tags dbtn/module:debug_menu_customizations
   * @name debug_menu_customizations
   * @summary Debug Menu Customizations
   * @request GET:/routes/debug-menu-customizations
   */
  export namespace debug_menu_customizations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DebugMenuCustomizationsData;
  }

  /**
   * @description Create or fix the menu_customizations table schema
   * @tags dbtn/module:debug_menu_customizations
   * @name fix_menu_customizations_schema
   * @summary Fix Menu Customizations Schema
   * @request POST:/routes/fix-menu-customizations-schema
   */
  export namespace fix_menu_customizations_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixMenuCustomizationsSchemaData;
  }

  /**
   * @description Fix the 400 Bad Request error for menu_customizations table
   * @tags dbtn/module:fix_customizations_error
   * @name fix_menu_customizations_error
   * @summary Fix Menu Customizations Error
   * @request POST:/routes/fix-menu-customizations-400-error
   */
  export namespace fix_menu_customizations_error {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixMenuCustomizationsErrorData;
  }

  /**
   * @description Test the exact query that was failing with 400 error
   * @tags dbtn/module:fix_customizations_error
   * @name test_menu_customizations_query
   * @summary Test Menu Customizations Query
   * @request GET:/routes/test-menu-customizations-query
   */
  export namespace test_menu_customizations_query {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestMenuCustomizationsQueryData;
  }

  /**
   * @description Safely execute SQL using Supabase REST API with service role key
   * @tags dbtn/module:execute_sql_safe
   * @name execute_sql_safe
   * @summary Execute Sql Safe
   * @request POST:/routes/execute-sql-safe
   */
  export namespace execute_sql_safe {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SQLExecuteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ExecuteSqlSafeData;
  }

  /**
   * @description Check if menu_customizations table exists and its structure
   * @tags dbtn/module:execute_sql_safe
   * @name check_menu_customizations_table
   * @summary Check Menu Customizations Table
   * @request GET:/routes/check-menu-customizations-table
   */
  export namespace check_menu_customizations_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMenuCustomizationsTableData;
  }

  /**
   * @description Create the menu_customizations table with proper schema
   * @tags dbtn/module:execute_sql_safe
   * @name create_menu_customizations_table
   * @summary Create Menu Customizations Table
   * @request POST:/routes/create-menu-customizations-table
   */
  export namespace create_menu_customizations_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateMenuCustomizationsTableData;
  }

  /**
   * @description Split a customer tab by moving selected items to a new tab
   * @tags dbtn/module:customer_tabs
   * @name split_tab
   * @summary Split Tab
   * @request POST:/routes/customer-tabs/split
   */
  export namespace split_tab {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SplitTabRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SplitTabData;
  }

  /**
   * @description Merge two customer tabs by moving all items from source to target and closing source
   * @tags dbtn/module:customer_tabs
   * @name merge_tabs
   * @summary Merge Tabs
   * @request POST:/routes/customer-tabs/merge
   */
  export namespace merge_tabs {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MergeTabsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MergeTabsData;
  }

  /**
   * @description Move selected items from one customer tab to another
   * @tags dbtn/module:customer_tabs
   * @name move_items_between_tabs
   * @summary Move Items Between Tabs
   * @request POST:/routes/customer-tabs/move-items
   */
  export namespace move_items_between_tabs {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MoveItemsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MoveItemsBetweenTabsData;
  }

  /**
   * @description Create the customer_tabs table and required indexes
   * @tags dbtn/module:customer_tabs
   * @name setup_customer_tabs_schema
   * @summary Setup Customer Tabs Schema
   * @request POST:/routes/customer-tabs/setup-schema
   */
  export namespace setup_customer_tabs_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupCustomerTabsSchemaData;
  }

  /**
   * @description Check if customer_tabs schema exists
   * @tags dbtn/module:customer_tabs
   * @name check_customer_tabs_schema
   * @summary Check Customer Tabs Schema
   * @request GET:/routes/customer-tabs/check-schema
   */
  export namespace check_customer_tabs_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckCustomerTabsSchemaData;
  }

  /**
   * @description Create a new customer tab within a table
   * @tags dbtn/module:customer_tabs
   * @name create_customer_tab
   * @summary Create Customer Tab
   * @request POST:/routes/customer-tabs/create
   */
  export namespace create_customer_tab {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCustomerTabRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCustomerTabData;
  }

  /**
   * @description Get all active customer tabs for a specific table
   * @tags dbtn/module:customer_tabs
   * @name list_customer_tabs_for_table
   * @summary List Customer Tabs For Table
   * @request GET:/routes/customer-tabs/table/{table_number}
   */
  export namespace list_customer_tabs_for_table {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListCustomerTabsForTableData;
  }

  /**
   * @description Get specific customer tab by ID
   * @tags dbtn/module:customer_tabs
   * @name get_customer_tab
   * @summary Get Customer Tab
   * @request GET:/routes/customer-tabs/tab/{tab_id}
   */
  export namespace get_customer_tab {
    export type RequestParams = {
      /** Tab Id */
      tabId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerTabData;
  }

  /**
   * @description Update customer tab details and order items
   * @tags dbtn/module:customer_tabs
   * @name update_customer_tab
   * @summary Update Customer Tab
   * @request PUT:/routes/customer-tabs/tab/{tab_id}
   */
  export namespace update_customer_tab {
    export type RequestParams = {
      /** Tab Id */
      tabId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateCustomerTabRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCustomerTabData;
  }

  /**
   * @description Close customer tab (mark as paid)
   * @tags dbtn/module:customer_tabs
   * @name close_customer_tab
   * @summary Close Customer Tab
   * @request DELETE:/routes/customer-tabs/tab/{tab_id}
   */
  export namespace close_customer_tab {
    export type RequestParams = {
      /** Tab Id */
      tabId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CloseCustomerTabData;
  }

  /**
   * @description Add new items to existing customer tab
   * @tags dbtn/module:customer_tabs
   * @name add_items_to_customer_tab
   * @summary Add Items To Customer Tab
   * @request POST:/routes/customer-tabs/tab/{tab_id}/add-items
   */
  export namespace add_items_to_customer_tab {
    export type RequestParams = {
      /** Tab Id */
      tabId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = AddItemsToCustomerTabPayload;
    export type RequestHeaders = {};
    export type ResponseBody = AddItemsToCustomerTabData;
  }

  /**
   * @description Rename a customer tab
   * @tags dbtn/module:customer_tabs
   * @name rename_customer_tab
   * @summary Rename Customer Tab
   * @request POST:/routes/customer-tabs/tab/{tab_id}/rename
   */
  export namespace rename_customer_tab {
    export type RequestParams = {
      /** Tab Id */
      tabId: string;
    };
    export type RequestQuery = {
      /** New Name */
      new_name: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RenameCustomerTabData;
  }

  /**
   * @description Get table session status and analytics for debugging
   * @tags dbtn/module:customer_tabs
   * @name get_table_session_status
   * @summary Get Table Session Status
   * @request GET:/routes/customer-tabs/table/{table_number}/session-status
   */
  export namespace get_table_session_status {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTableSessionStatusData;
  }

  /**
   * @description Process final bill for entire table and reset table status
   * @tags dbtn/module:customer_tabs
   * @name process_final_bill_for_table
   * @summary Process Final Bill For Table
   * @request POST:/routes/customer-tabs/table/{table_number}/final-bill
   */
  export namespace process_final_bill_for_table {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessFinalBillForTableData;
  }

  /**
   * @description Migration endpoint to fix table statuses based on current order sessions
   * @tags dbtn/module:customer_tabs
   * @name migrate_fix_table_statuses
   * @summary Migrate Fix Table Statuses
   * @request POST:/routes/customer-tabs/migrate/fix-table-statuses
   */
  export namespace migrate_fix_table_statuses {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateFixTableStatusesData;
  }

  /**
   * @description Check if local cache needs updating for offline mode
   * @tags dbtn/module:offline_sync
   * @name get_offline_sync_status
   * @summary Get Offline Sync Status
   * @request GET:/routes/offline-sync-status
   */
  export namespace get_offline_sync_status {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Last Sync
       * Last sync timestamp (ISO format)
       */
      last_sync?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOfflineSyncStatusData;
  }

  /**
   * @description Get incremental menu changes since last sync for offline caching
   * @tags dbtn/module:offline_sync
   * @name get_menu_delta_sync
   * @summary Get Menu Delta Sync
   * @request GET:/routes/menu-delta-sync
   */
  export namespace get_menu_delta_sync {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Since
       * Last sync timestamp (ISO format)
       */
      since: string;
      /**
       * Limit
       * Maximum items to return
       * @min 1
       * @max 1000
       * @default 500
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuDeltaSyncData;
  }

  /**
   * @description Force cache invalidation for all offline clients
   * @tags dbtn/module:offline_sync
   * @name invalidate_offline_cache
   * @summary Invalidate Offline Cache
   * @request POST:/routes/invalidate-offline-cache
   */
  export namespace invalidate_offline_cache {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InvalidateOfflineCacheData;
  }

  /**
   * @description Validate a promo code and calculate discount
   * @tags dbtn/module:promo_codes
   * @name validate_promo_code
   * @summary Validate Promo Code
   * @request POST:/routes/validate-promo
   */
  export namespace validate_promo_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PromoCodeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidatePromoCodeData;
  }

  /**
   * @description Apply a promo code and increment usage count
   * @tags dbtn/module:promo_codes
   * @name apply_promo_code
   * @summary Apply Promo Code
   * @request POST:/routes/apply-promo
   */
  export namespace apply_promo_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PromoCodeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ApplyPromoCodeData;
  }

  /**
   * @description Create a new promo code (admin only)
   * @tags dbtn/module:promo_codes
   * @name create_promo_code
   * @summary Create Promo Code
   * @request POST:/routes/create-promo
   */
  export namespace create_promo_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreatePromoCodeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePromoCodeData;
  }

  /**
   * @description List all promo codes (admin only)
   * @tags dbtn/module:promo_codes
   * @name list_promo_codes
   * @summary List Promo Codes
   * @request GET:/routes/list-promos
   */
  export namespace list_promo_codes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListPromoCodesData;
  }

  /**
   * @description Delete a promo code (admin only)
   * @tags dbtn/module:promo_codes
   * @name delete_promo_code
   * @summary Delete Promo Code
   * @request DELETE:/routes/delete-promo/{code}
   */
  export namespace delete_promo_code {
    export type RequestParams = {
      /** Code */
      code: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeletePromoCodeData;
  }

  /**
   * @description Initialize system with some default promo codes for testing
   * @tags dbtn/module:promo_codes
   * @name initialize_default_promos
   * @summary Initialize Default Promos
   * @request POST:/routes/initialize-default-promos
   */
  export namespace initialize_default_promos {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeDefaultPromosData;
  }

  /**
   * @description Calculate all applicable fees for an order
   * @tags dbtn/module:fee_calculation
   * @name calculate_order_fees
   * @summary Calculate Order Fees
   * @request POST:/routes/calculate-fees
   */
  export namespace calculate_order_fees {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FeeCalculationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CalculateOrderFeesData;
  }

  /**
   * @description Update service charge configuration (admin only)
   * @tags dbtn/module:fee_calculation
   * @name update_service_charge_config
   * @summary Update Service Charge Config
   * @request POST:/routes/update-service-charge-config
   */
  export namespace update_service_charge_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ServiceChargeConfig;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateServiceChargeConfigData;
  }

  /**
   * @description Get current service charge configuration
   * @tags dbtn/module:fee_calculation
   * @name get_service_charge_config_endpoint
   * @summary Get Service Charge Config Endpoint
   * @request GET:/routes/service-charge-config
   */
  export namespace get_service_charge_config_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetServiceChargeConfigEndpointData;
  }

  /**
   * @description Update delivery zones configuration (admin only)
   * @tags dbtn/module:fee_calculation
   * @name update_delivery_zones
   * @summary Update Delivery Zones
   * @request POST:/routes/update-delivery-zones
   */
  export namespace update_delivery_zones {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateDeliveryZonesPayload;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateDeliveryZonesData;
  }

  /**
   * @description Get current delivery zones configuration
   * @tags dbtn/module:fee_calculation
   * @name get_delivery_zones_endpoint
   * @summary Get Delivery Zones Endpoint
   * @request GET:/routes/delivery-zones
   */
  export namespace get_delivery_zones_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDeliveryZonesEndpointData;
  }

  /**
   * @description Initialize default fee configurations
   * @tags dbtn/module:fee_calculation
   * @name initialize_fee_configs
   * @summary Initialize Fee Configs
   * @request POST:/routes/initialize-fee-configs
   */
  export namespace initialize_fee_configs {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeFeeConfigsData;
  }

  /**
   * @description Create a new print job for event-driven printing
   * @tags dbtn/module:print_jobs
   * @name create_print_job
   * @summary Create Print Job
   * @request POST:/routes/print-jobs
   */
  export namespace create_print_job {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisPrintJobsPrintJobRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePrintJobData;
  }

  /**
   * @description Get print jobs with optional filtering
   * @tags dbtn/module:print_jobs
   * @name get_print_jobs
   * @summary Get Print Jobs
   * @request GET:/routes/print-jobs
   */
  export namespace get_print_jobs {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Status */
      status?: string | null;
      /** Template Type */
      template_type?: string | null;
      /** Order Id */
      order_id?: string | null;
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintJobsData;
  }

  /**
   * @description Get a specific print job by ID
   * @tags dbtn/module:print_jobs
   * @name get_print_job
   * @summary Get Print Job
   * @request GET:/routes/print-jobs/{job_id}
   */
  export namespace get_print_job {
    export type RequestParams = {
      /** Job Id */
      jobId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintJobData;
  }

  /**
   * @description Delete a print job
   * @tags dbtn/module:print_jobs
   * @name delete_print_job
   * @summary Delete Print Job
   * @request DELETE:/routes/print-jobs/{job_id}
   */
  export namespace delete_print_job {
    export type RequestParams = {
      /** Job Id */
      jobId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeletePrintJobData;
  }

  /**
   * @description Update print job status (used by helper apps to report progress)
   * @tags dbtn/module:print_jobs
   * @name update_print_job_status
   * @summary Update Print Job Status
   * @request PUT:/routes/print-jobs/{job_id}/status
   */
  export namespace update_print_job_status {
    export type RequestParams = {
      /** Job Id */
      jobId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = PrintJobUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePrintJobStatusData;
  }

  /**
   * @description Process pending print jobs (used by helper apps to get work)
   * @tags dbtn/module:print_jobs
   * @name process_print_queue
   * @summary Process Print Queue
   * @request POST:/routes/print-jobs/queue/process
   */
  export namespace process_print_queue {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessPrintQueueData;
  }

  /**
   * @description Get print job statistics
   * @tags dbtn/module:print_jobs
   * @name get_print_job_stats
   * @summary Get Print Job Stats
   * @request GET:/routes/print-jobs/stats
   */
  export namespace get_print_job_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintJobStatsData;
  }

  /**
   * @description Check if the menu_items_ai_metadata table exists
   * @tags dbtn/module:menu_ai_fields
   * @name check_menu_ai_fields_exist
   * @summary Check Menu Ai Fields Exist
   * @request GET:/routes/check-menu-ai-fields
   */
  export namespace check_menu_ai_fields_exist {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMenuAiFieldsExistData;
  }

  /**
   * @description Create the menu_items_ai_metadata table if it doesn't exist
   * @tags dbtn/module:menu_ai_fields
   * @name update_menu_items_with_ai_fields
   * @summary Update Menu Items With Ai Fields
   * @request POST:/routes/update-menu-items-with-ai-fields
   */
  export namespace update_menu_items_with_ai_fields {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateMenuItemsWithAiFieldsData;
  }

  /**
   * @description Generate AI content suggestions for a menu item using OpenAI
   * @tags dbtn/module:menu_ai_fields
   * @name generate_ai_content_suggestion
   * @summary Generate Ai Content Suggestion
   * @request POST:/routes/generate-ai-content-suggestion
   */
  export namespace generate_ai_content_suggestion {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AIContentSuggestionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAiContentSuggestionData;
  }

  /**
   * @description Check if the menu_items_ai_metadata table exists using sql_executor
   * @tags dbtn/module:menu_ai_fields2
   * @name check_menu_ai_fields_exist2
   * @summary Check Menu Ai Fields Exist2
   * @request GET:/routes/check-menu-ai-fields2
   */
  export namespace check_menu_ai_fields_exist2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMenuAiFieldsExist2Data;
  }

  /**
   * @description Create the menu_items_ai_metadata table if it doesn't exist using sql_executor
   * @tags dbtn/module:menu_ai_fields2
   * @name update_menu_items_with_ai_fields2
   * @summary Update Menu Items With Ai Fields2
   * @request POST:/routes/update-menu-items-with-ai-fields2
   */
  export namespace update_menu_items_with_ai_fields2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateMenuItemsWithAiFields2Data;
  }

  /**
   * @description Generate AI content suggestions for a menu item using OpenAI
   * @tags dbtn/module:menu_ai_fields2
   * @name generate_ai_content_suggestion2
   * @summary Generate Ai Content Suggestion2
   * @request POST:/routes/generate-ai-content-suggestion2
   */
  export namespace generate_ai_content_suggestion2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AIContentSuggestionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAiContentSuggestion2Data;
  }

  /**
   * @description Generate AI response with embedded structured elements
   * @tags dbtn/module:structured_chat
   * @name generate_structured_response
   * @summary Generate Structured Response
   * @request POST:/routes/structured-chat
   */
  export namespace generate_structured_response {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = StructuredChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateStructuredResponseData;
  }

  /**
   * @description Validate that structured prompts generate expected responses
   * @tags dbtn/module:structured_chat
   * @name validate_structured_prompts
   * @summary Validate Structured Prompts
   * @request POST:/routes/validate-structured-prompts
   */
  export namespace validate_structured_prompts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateStructuredPromptsData;
  }

  /**
   * @description Setup the complete chat analytics schema with tables, policies, and triggers
   * @tags dbtn/module:chat_analytics
   * @name setup_chat_analytics_schema
   * @summary Setup Chat Analytics Schema
   * @request POST:/routes/chat-analytics/setup-schema
   */
  export namespace setup_chat_analytics_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupChatAnalyticsSchemaData;
  }

  /**
   * @description Check if chat analytics tables exist and are properly configured
   * @tags dbtn/module:chat_analytics
   * @name check_chat_analytics_schema
   * @summary Check Chat Analytics Schema
   * @request GET:/routes/chat-analytics/check-schema
   */
  export namespace check_chat_analytics_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckChatAnalyticsSchemaData;
  }

  /**
   * @description Log the start of a new chat session
   * @tags dbtn/module:chat_analytics
   * @name log_session_start
   * @summary Log Session Start
   * @request POST:/routes/chat-analytics/log-session-start
   */
  export namespace log_session_start {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogSessionStartPayload;
    export type RequestHeaders = {};
    export type ResponseBody = LogSessionStartData;
  }

  /**
   * @description Log a chat message with metadata
   * @tags dbtn/module:chat_analytics
   * @name log_message
   * @summary Log Message
   * @request POST:/routes/chat-analytics/log-message
   */
  export namespace log_message {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogMessagePayload;
    export type RequestHeaders = {};
    export type ResponseBody = LogMessageData;
  }

  /**
   * @description Log the end of a chat session with final metrics
   * @tags dbtn/module:chat_analytics
   * @name log_session_end
   * @summary Log Session End
   * @request POST:/routes/chat-analytics/log-session-end
   */
  export namespace log_session_end {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogSessionEndPayload;
    export type RequestHeaders = {};
    export type ResponseBody = LogSessionEndData;
  }

  /**
   * @description Log a chat escalation to human staff
   * @tags dbtn/module:chat_analytics
   * @name log_escalation
   * @summary Log Escalation
   * @request POST:/routes/chat-analytics/log-escalation
   */
  export namespace log_escalation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogEscalationPayload;
    export type RequestHeaders = {};
    export type ResponseBody = LogEscalationData;
  }

  /**
   * @description Get chat session metrics for the specified number of days
   * @tags dbtn/module:chat_analytics
   * @name get_session_metrics
   * @summary Get Session Metrics
   * @request GET:/routes/chat-analytics/session-metrics
   */
  export namespace get_session_metrics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days
       * @default 7
       */
      days?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSessionMetricsData;
  }

  /**
   * @description Get detailed conversation analytics with optional model filtering
   * @tags dbtn/module:chat_analytics
   * @name get_conversation_analytics
   * @summary Get Conversation Analytics
   * @request GET:/routes/chat-analytics/conversation-analytics
   */
  export namespace get_conversation_analytics {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Model Filter */
      model_filter?: string | null;
      /**
       * Compare Models
       * @default false
       */
      compare_models?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetConversationAnalyticsData;
  }

  /**
   * @description Get real-time chat system statistics
   * @tags dbtn/module:chat_analytics
   * @name get_real_time_stats
   * @summary Get Real Time Stats
   * @request GET:/routes/chat-analytics/real-time-stats
   */
  export namespace get_real_time_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealTimeStatsData;
  }

  /**
   * @description Health check for chat analytics system
   * @tags dbtn/module:chat_analytics
   * @name check_analytics_health
   * @summary Check Analytics Health
   * @request GET:/routes/chat-analytics/health
   */
  export namespace check_analytics_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckAnalyticsHealthData;
  }

  /**
   * @description Create and populate comprehensive Cottage Tandoori menu database
   * @tags dbtn/module:menu_database_setup
   * @name setup_menu_database
   * @summary Setup Menu Database
   * @request POST:/routes/setup-menu-database
   */
  export namespace setup_menu_database {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupMenuDatabaseData;
  }

  /**
   * @description Get summary of menu data for verification
   * @tags dbtn/module:menu_database_setup
   * @name get_menu_data_summary
   * @summary Get Menu Data Summary
   * @request GET:/routes/menu-data-summary
   */
  export namespace get_menu_data_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuDataSummaryData;
  }

  /**
   * @description Investigate the actual database schema for menu-related tables
   * @tags dbtn/module:schema_investigation
   * @name investigate_menu_schema
   * @summary Investigate Menu Schema
   * @request GET:/routes/investigate-menu-schema
   */
  export namespace investigate_menu_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InvestigateMenuSchemaData;
  }

  /**
   * @description Check if a specific table exists and get its structure
   * @tags dbtn/module:schema_investigation
   * @name check_table_exists
   * @summary Check Table Exists
   * @request GET:/routes/check-table-exists/{table_name}
   */
  export namespace check_table_exists {
    export type RequestParams = {
      /** Table Name */
      tableName: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckTableExistsData;
  }

  /**
   * @description Get complete real menu data from Supabase including sophisticated menu_item_variants Returns: RealMenuDataEnhanced: Complete menu data with categories, basic items AND sophisticated variants
   * @tags dbtn/module:menu_data_real_enhanced
   * @name get_real_menu_data_enhanced
   * @summary Get Real Menu Data Enhanced
   * @request GET:/routes/real-menu-data-enhanced
   */
  export namespace get_real_menu_data_enhanced {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealMenuDataEnhancedData;
  }

  /**
   * @description Add parent_id column to menu_categories table
   * @tags dbtn/module:fix_parent_id
   * @name fix_parent_id_column
   * @summary Fix Parent Id Column
   * @request POST:/routes/fix-parent-id-column
   */
  export namespace fix_parent_id_column {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixParentIdColumnData;
  }

  /**
   * @description Get category to section mappings for thermal receipt ordering
   * @tags dbtn/module:category_section_ordering
   * @name get_category_section_mappings
   * @summary Get Category Section Mappings
   * @request GET:/routes/get-section-mappings
   */
  export namespace get_category_section_mappings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCategorySectionMappingsData;
  }

  /**
   * @description Get the section order for a specific menu item based on its category
   * @tags dbtn/module:category_section_ordering
   * @name get_item_section_order
   * @summary Get Item Section Order
   * @request GET:/routes/get-item-section-order
   */
  export namespace get_item_section_order {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Menu Item Id */
      menu_item_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetItemSectionOrderData;
  }

  /**
   * @description Sort order items by their category sections (1-7) for thermal receipt display
   * @tags dbtn/module:category_section_ordering
   * @name sort_order_items_by_sections
   * @summary Sort Order Items By Sections
   * @request POST:/routes/sort-order-items
   */
  export namespace sort_order_items_by_sections {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SortOrderItemsBySectionsPayload;
    export type RequestHeaders = {};
    export type ResponseBody = SortOrderItemsBySectionsData;
  }

  /**
   * @description Generate a unique item code for a menu item
   * @tags dbtn/module:item_code_generation
   * @name generate_item_code
   * @summary Generate Item Code
   * @request POST:/routes/item-code-generation/generate-item-code
   */
  export namespace generate_item_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ItemCodeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateItemCodeData;
  }

  /**
   * @description Generate a variant code for a menu item variant
   * @tags dbtn/module:item_code_generation
   * @name generate_variant_code
   * @summary Generate Variant Code
   * @request POST:/routes/item-code-generation/generate-variant-code
   */
  export namespace generate_variant_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VariantCodeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateVariantCodeData;
  }

  /**
   * @description Check if a code is unique across items and variants
   * @tags dbtn/module:item_code_generation
   * @name validate_code_unique
   * @summary Validate Code Unique
   * @request GET:/routes/item-code-generation/validate-code-unique/{code}
   */
  export namespace validate_code_unique {
    export type RequestParams = {
      /** Code */
      code: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateCodeUniqueData;
  }

  /**
   * @description Generate codes for all menu items and variants that don't have them
   * @tags dbtn/module:item_code_generation
   * @name generate_all_codes
   * @summary Generate All Codes
   * @request POST:/routes/item-code-generation/generate-all-codes
   */
  export namespace generate_all_codes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BatchCodeGenerationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAllCodesData;
  }

  /**
   * @description Reset all item and variant codes and category prefixes
   * @tags dbtn/module:item_code_generation
   * @name reset_code_system
   * @summary Reset Code System
   * @request POST:/routes/item-code-generation/reset-code-system
   */
  export namespace reset_code_system {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResetCodeSystemData;
  }

  /**
   * @description Populate category prefixes based on category names
   * @tags dbtn/module:item_code_generation
   * @name populate_category_prefixes
   * @summary Populate Category Prefixes
   * @request POST:/routes/item-code-generation/populate-category-prefixes
   */
  export namespace populate_category_prefixes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PopulateCategoryPrefixesData;
  }

  /**
   * @description Automatically link unused media assets to menu items by name matching. Args: dry_run: If True, only show what would be linked without making changes min_confidence: Minimum similarity score (0.0-1.0) for fuzzy matching Returns: AutoLinkResponse with results of linking operation
   * @tags dbtn/module:auto_link_media
   * @name auto_link_unused_media
   * @summary Auto Link Unused Media
   * @request POST:/routes/auto-link-media
   */
  export namespace auto_link_unused_media {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
      /**
       * Min Confidence
       * @default 0.6
       */
      min_confidence?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AutoLinkUnusedMediaData;
  }

  /**
   * @description Pre-delete check: Get item count and details for a category before deletion. Returns: - category_id: The ID of the category - category_name: Name of the category - item_count: Number of menu items in this category - can_delete: Whether the category can be safely deleted - message: User-friendly message about the deletion - items: List of items that will be affected (sample, max 10)
   * @tags dbtn/module:safe_category_delete
   * @name check_category_delete
   * @summary Check Category Delete
   * @request GET:/routes/check-category-delete/{category_id}
   */
  export namespace check_category_delete {
    export type RequestParams = {
      /** Category Id */
      categoryId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckCategoryDeleteData;
  }

  /**
   * @description Safely delete a category with proper handling of associated menu items. Options: - action='reassign': Move all items to target_category_id before deleting category - action='delete_all': Delete category and all associated items Returns: - success: Whether the operation succeeded - message: User-friendly message - items_affected: Total number of items affected - items_reassigned: Number of items reassigned (if action='reassign') - items_deleted: Number of items deleted (if action='delete_all')
   * @tags dbtn/module:safe_category_delete
   * @name safe_delete_category
   * @summary Safe Delete Category
   * @request POST:/routes/safe-delete-category
   */
  export namespace safe_delete_category {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CategoryDeleteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SafeDeleteCategoryData;
  }

  /**
   * @description Get all menu items that are using a specific media asset. This helps users understand what will be affected before deleting an asset.
   * @tags dbtn/module:media_usage
   * @name get_asset_usage
   * @summary Get Asset Usage
   * @request GET:/routes/asset-usage/{asset_id}
   */
  export namespace get_asset_usage {
    export type RequestParams = {
      /** Asset Id */
      assetId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAssetUsageData;
  }

  /**
   * @description Replace all references of one asset with another asset in menu items. If menu_item_ids is provided, only update those specific items.
   * @tags dbtn/module:media_usage
   * @name replace_asset_in_menu_items
   * @summary Replace Asset In Menu Items
   * @request POST:/routes/replace-asset
   */
  export namespace replace_asset_in_menu_items {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ReplaceAssetRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ReplaceAssetInMenuItemsData;
  }

  /**
   * @description Remove all references to an asset from menu items (set to NULL). If menu_item_ids is provided (comma-separated), only update those specific items.
   * @tags dbtn/module:media_usage
   * @name remove_asset_references
   * @summary Remove Asset References
   * @request DELETE:/routes/remove-asset-references/{asset_id}
   */
  export namespace remove_asset_references {
    export type RequestParams = {
      /** Asset Id */
      assetId: string;
    };
    export type RequestQuery = {
      /** Menu Item Ids */
      menu_item_ids?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RemoveAssetReferencesData;
  }

  /**
   * @description Create a new set meal with auto-generated SM code
   * @tags dbtn/module:set_meals
   * @name create_set_meal
   * @summary Create Set Meal
   * @request POST:/routes/set-meals/create
   */
  export namespace create_set_meal {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SetMealRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateSetMealData;
  }

  /**
   * @description List all set meals with summary information
   * @tags dbtn/module:set_meals
   * @name list_set_meals
   * @summary List Set Meals
   * @request GET:/routes/set-meals/list
   */
  export namespace list_set_meals {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Active Only
       * @default false
       */
      active_only?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListSetMealsData;
  }

  /**
   * @description Get a specific set meal by ID
   * @tags dbtn/module:set_meals
   * @name get_set_meal
   * @summary Get Set Meal
   * @request GET:/routes/set-meals/{set_meal_id}
   */
  export namespace get_set_meal {
    export type RequestParams = {
      /** Set Meal Id */
      setMealId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSetMealData;
  }

  /**
   * @description Delete a set meal and cleanup related records
   * @tags dbtn/module:set_meals
   * @name delete_set_meal
   * @summary Delete Set Meal
   * @request DELETE:/routes/set-meals/{set_meal_id}
   */
  export namespace delete_set_meal {
    export type RequestParams = {
      /** Set Meal Id */
      setMealId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteSetMealData;
  }

  /**
   * @description Update an existing set meal
   * @tags dbtn/module:set_meals
   * @name update_set_meal
   * @summary Update Set Meal
   * @request PUT:/routes/set-meals/{set_meal_id}
   */
  export namespace update_set_meal {
    export type RequestParams = {
      /** Set Meal Id */
      setMealId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SetMealUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateSetMealData;
  }

  /**
   * @description Get media library with enhanced context including menu item relationships. Provides smart naming that shows menu item names + filenames for better UX.
   * @tags dbtn/module:enhanced_media_assets
   * @name get_enhanced_media_library
   * @summary Get Enhanced Media Library
   * @request GET:/routes/enhanced-media-library
   */
  export namespace get_enhanced_media_library {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Search
       * Search in menu item names, filenames, and descriptions
       */
      search?: string | null;
      /**
       * Asset Type
       * Filter by asset type (image, video)
       */
      asset_type?: string | null;
      /**
       * Tag
       * Filter by tag
       */
      tag?: string | null;
      /**
       * Usage
       * Filter by usage
       */
      usage?: string | null;
      /**
       * Aspect Ratio
       * Filter by aspect ratio
       */
      aspect_ratio?: string | null;
      /**
       * Linked Only
       * Show only assets linked to menu items
       */
      linked_only?: boolean | null;
      /**
       * Unlinked Only
       * Show only unlinked assets
       */
      unlinked_only?: boolean | null;
      /**
       * Limit
       * Number of results to return
       * @default 100
       */
      limit?: number;
      /**
       * Offset
       * Number of results to skip
       * @default 0
       */
      offset?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEnhancedMediaLibraryData;
  }

  /**
   * @description Update the menu_items table with image_asset_id columns to link to media_assets and pricing columns for multi-channel pricing
   * @tags dbtn/module:schema
   * @name update_menu_items_schema
   * @summary Update Menu Items Schema
   * @request POST:/routes/update-menu-items-schema
   */
  export namespace update_menu_items_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateMenuItemsSchemaData;
  }

  /**
   * @description Check if the menu_items table has the required image_asset_id columns
   * @tags dbtn/module:schema
   * @name check_menu_images_schema_v2
   * @summary Check Schema Status Menu Images V2
   * @request GET:/routes/check-status
   */
  export namespace check_menu_images_schema_v2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMenuImagesSchemaV2Data;
  }

  /**
   * @description Set up the required image_asset_id columns in the menu_items table
   * @tags dbtn/module:schema
   * @name setup_menu_images_schema_v2
   * @summary Setup Schema Menu Images
   * @request POST:/routes/setup
   */
  export namespace setup_menu_images_schema_v2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupMenuImagesSchemaV2Data;
  }

  /**
   * @description Migrate existing menu item images to use the new naming pattern and link them with media_assets
   * @tags dbtn/module:schema
   * @name schema_migrate_menu_images_v2
   * @summary Schema Migrate Menu Images V2
   * @request POST:/routes/schema-migrate-menu-images
   */
  export namespace schema_migrate_menu_images_v2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SchemaMigrateMenuImagesV2Data;
  }

  /**
   * @description Get lightweight POS bundle with essential data only for fast startup
   * @tags dbtn/module:pos_performance
   * @name get_pos_bundle
   * @summary Get Pos Bundle
   * @request GET:/routes/pos-bundle
   */
  export namespace get_pos_bundle {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPosBundleData;
  }

  /**
   * @description Get full item details including variants, customizations for on-demand loading
   * @tags dbtn/module:pos_performance
   * @name get_item_details
   * @summary Get Item Details
   * @request GET:/routes/item-details/{item_id}
   */
  export namespace get_item_details {
    export type RequestParams = {
      /** Item Id */
      itemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetItemDetailsData;
  }

  /**
   * @description Get full item data for a specific category when category is opened
   * @tags dbtn/module:pos_performance
   * @name get_category_items
   * @summary Get Category Items
   * @request GET:/routes/category-items/{category_id}
   */
  export namespace get_category_items {
    export type RequestParams = {
      /** Category Id */
      categoryId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCategoryItemsData;
  }

  /**
   * No description
   * @tags dbtn/module:menu_structure
   * @name check_menu_structure_schema_status
   * @summary Check Menu Schema Status
   * @request GET:/routes/check-menu-schema-status
   */
  export namespace check_menu_structure_schema_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMenuStructureSchemaStatusData;
  }

  /**
   * No description
   * @tags dbtn/module:menu_structure
   * @name setup_menu_structure_alter_table_function
   * @summary Setup Menu Alter Table Function
   * @request POST:/routes/setup-menu-alter-table-function
   */
  export namespace setup_menu_structure_alter_table_function {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupMenuStructureAlterTableFunctionData;
  }

  /**
   * No description
   * @tags dbtn/module:menu_structure
   * @name save_category
   * @summary Save Category
   * @request POST:/routes/save-category
   */
  export namespace save_category {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CategoryWithIsProteinType;
    export type RequestHeaders = {};
    export type ResponseBody = SaveCategoryData;
  }

  /**
   * @description Analyze the impact of moving a category to a different section. Returns count of affected items and subcategories.
   * @tags dbtn/module:menu_structure
   * @name analyze_section_change_impact
   * @summary Analyze Section Change Impact
   * @request POST:/routes/analyze-section-change-impact
   */
  export namespace analyze_section_change_impact {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SectionChangeImpactRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeSectionChangeImpactData;
  }

  /**
   * @description Move a category to a different section by updating its parent_category_id.
   * @tags dbtn/module:menu_structure
   * @name move_category_section
   * @summary Move Category Section
   * @request POST:/routes/move-category-section
   */
  export namespace move_category_section {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MoveCategorySectionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MoveCategorySectionData;
  }

  /**
   * @description Comprehensive diagnostics for menu items and category structure. Checks: - Orphaned menu items (category_id points to non-existent category) - Categories without valid parent sections - Item counts per section/category - Active/inactive status distribution Returns: DiagnosticsResponse: Complete diagnostic report with issues and stats
   * @tags dbtn/module:menu_items_diagnostics
   * @name diagnose_menu_items
   * @summary Diagnose Menu Items
   * @request GET:/routes/menu-items/diagnostics
   */
  export namespace diagnose_menu_items {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiagnoseMenuItemsData;
  }

  /**
   * @description DEPRECATED: AI recommendations have been retired. This endpoint is intentionally kept to preserve the API contract and avoid breaking generated clients or latent integrations. Behavior: Always returns a safe, no-op response with status "disabled" and an empty recommendations array. No external AI providers are called. TODO: Remove this endpoint after the deprecation window and when all consumers have been updated.
   * @tags dbtn/module:ai_menu_recommendations
   * @name generate_ai_recommendations
   * @summary Generate Ai Recommendations
   * @request POST:/routes/generate-ai-recommendations
   */
  export namespace generate_ai_recommendations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MenuContextRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAiRecommendationsData;
  }

  /**
   * @description Print kitchen order to thermal printer
   * @tags dbtn/module:unified_printing_system
   * @name print_kitchen_thermal
   * @summary Print Kitchen Thermal
   * @request POST:/routes/unified-printing/thermal/print-kitchen
   */
  export namespace print_kitchen_thermal {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = KitchenPrintRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PrintKitchenThermalData;
  }

  /**
   * @description Print customer receipt to thermal printer
   * @tags dbtn/module:unified_printing_system
   * @name print_receipt_thermal
   * @summary Print Receipt Thermal
   * @request POST:/routes/unified-printing/thermal/print-receipt
   */
  export namespace print_receipt_thermal {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ReceiptPrintRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PrintReceiptThermalData;
  }

  /**
   * @description Print to Epson printer using ePOS SDK
   * @tags dbtn/module:unified_printing_system
   * @name print_epson
   * @summary Print Epson
   * @request POST:/routes/unified-printing/epson/print
   */
  export namespace print_epson {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EpsonPrintRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PrintEpsonData;
  }

  /**
   * @description Discover available Epson printers
   * @tags dbtn/module:unified_printing_system
   * @name discover_epson_printers
   * @summary Discover Epson Printers
   * @request GET:/routes/unified-printing/epson/discover
   */
  export namespace discover_epson_printers {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiscoverEpsonPrintersData;
  }

  /**
   * @description Get all available print templates
   * @tags dbtn/module:unified_printing_system
   * @name list_print_templates
   * @summary List Print Templates
   * @request GET:/routes/unified-printing/templates/list
   */
  export namespace list_print_templates {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListPrintTemplatesData;
  }

  /**
   * @description Create a new print template
   * @tags dbtn/module:unified_printing_system
   * @name create_print_template
   * @summary Create Print Template
   * @request POST:/routes/unified-printing/templates/create
   */
  export namespace create_print_template {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PrintTemplate;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePrintTemplateData;
  }

  /**
   * @description Print using a saved template
   * @tags dbtn/module:unified_printing_system
   * @name print_with_template
   * @summary Print With Template
   * @request POST:/routes/unified-printing/templates/{template_id}/print
   */
  export namespace print_with_template {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = PrintWithTemplatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = PrintWithTemplateData;
  }

  /**
   * @description Get comprehensive printing system status
   * @tags dbtn/module:unified_printing_system
   * @name get_printing_system_status
   * @summary Get Printing System Status
   * @request GET:/routes/unified-printing/status/system
   */
  export namespace get_printing_system_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintingSystemStatusData;
  }

  /**
   * @description Get recent print jobs
   * @tags dbtn/module:unified_printing_system
   * @name get_recent_print_jobs
   * @summary Get Recent Print Jobs
   * @request GET:/routes/unified-printing/jobs/recent
   */
  export namespace get_recent_print_jobs {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 20
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRecentPrintJobsData;
  }

  /**
   * @description Test print to all available printers
   * @tags dbtn/module:unified_printing_system
   * @name test_all_printers
   * @summary Test All Printers
   * @request POST:/routes/unified-printing/test/all-printers
   */
  export namespace test_all_printers {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestAllPrintersData;
  }

  /**
   * @description Get menu printing settings
   * @tags dbtn/module:unified_printing_system
   * @name get_menu_print_settings
   * @summary Get Menu Print Settings
   * @request GET:/routes/unified-printing/settings/menu-print
   */
  export namespace get_menu_print_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuPrintSettingsData;
  }

  /**
   * @description Save menu printing settings
   * @tags dbtn/module:unified_printing_system
   * @name save_menu_print_settings
   * @summary Save Menu Print Settings
   * @request POST:/routes/unified-printing/settings/menu-print
   */
  export namespace save_menu_print_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SaveMenuPrintSettingsPayload;
    export type RequestHeaders = {};
    export type ResponseBody = SaveMenuPrintSettingsData;
  }

  /**
   * @description Add variant_name column to menu_item_variants table with auto-generation trigger. This migration: 1. Adds variant_name TEXT column 2. Creates trigger function to auto-generate variant names 3. Backfills existing records Generated format: "[Protein Type Name] [Menu Item Name]" Example: "Chicken Tikka Masala"
   * @tags dbtn/module:variant_name_migration
   * @name add_variant_name_column
   * @summary Add Variant Name Column
   * @request POST:/routes/add-variant-name-column
   */
  export namespace add_variant_name_column {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddVariantNameColumnData;
  }

  /**
   * @description Check if variant_name column exists and how many records have it populated.
   * @tags dbtn/module:variant_name_migration
   * @name check_variant_name_status
   * @summary Check Variant Name Status
   * @request GET:/routes/check-variant-name-status
   */
  export namespace check_variant_name_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckVariantNameStatusData;
  }

  /**
   * @description Force regeneration of all variant names. Useful for fixing data issues or after bulk updates.
   * @tags dbtn/module:variant_name_migration
   * @name regenerate_all_variant_names
   * @summary Regenerate All Variant Names
   * @request POST:/routes/regenerate-all-variant-names
   */
  export namespace regenerate_all_variant_names {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RegenerateAllVariantNamesData;
  }

  /**
   * @description Get complete real menu data from Supabase Returns: RealMenuData: Complete menu data with categories and items from database
   * @tags dbtn/module:menu_data_real
   * @name get_real_menu_data
   * @summary Get Real Menu Data
   * @request GET:/routes/real-menu-data
   */
  export namespace get_real_menu_data {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealMenuDataData;
  }

  /**
   * @description Preview what the migration will do without making changes. Shows sample of variants that will be updated.
   * @tags dbtn/module:migrate_variant_names
   * @name preview_migration
   * @summary Preview Migration
   * @request GET:/routes/migrate-variant-names/dry-run
   */
  export namespace preview_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PreviewMigrationData;
  }

  /**
   * @description Execute the migration to populate generated_name for all variants. Uses PostgreSQL INITCAP for Title Case formatting.
   * @tags dbtn/module:migrate_variant_names
   * @name execute_migration
   * @summary Execute Migration
   * @request POST:/routes/migrate-variant-names/execute
   */
  export namespace execute_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExecuteMigrationData;
  }

  /**
   * @description Verify that all variants have properly formatted generated_name values. Returns statistics and samples for validation.
   * @tags dbtn/module:migrate_variant_names
   * @name verify_migration
   * @summary Verify Migration
   * @request GET:/routes/migrate-variant-names/verify
   */
  export namespace verify_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyMigrationData;
  }

  /**
   * @description One-time migration to update all variant_name values to Title Case format. Also drops the generated_name column that was added by mistake. This migration: 1. Updates variant_name to Title Case using PostgreSQL's INITCAP function 2. Drops the generated_name column 3. Returns summary of changes
   * @tags dbtn/module:migrate_variant_names
   * @name migrate_variant_names_to_title_case
   * @summary Migrate Variant Names To Title Case
   * @request POST:/routes/migrate-variant-names-to-title-case
   */
  export namespace migrate_variant_names_to_title_case {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateVariantNamesToTitleCaseData;
  }

  /**
   * @description Verify that all variant names are in Title Case format. Returns statistics and sample variants.
   * @tags dbtn/module:migrate_variant_names
   * @name verify_variant_names
   * @summary Verify Variant Names
   * @request GET:/routes/verify-variant-names
   */
  export namespace verify_variant_names {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyVariantNamesData;
  }

  /**
   * @description Get all protein types
   * @tags dbtn/module:menu_protein_types
   * @name list_protein_types
   * @summary List Protein Types
   * @request GET:/routes/menu-protein-types
   */
  export namespace list_protein_types {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListProteinTypesData;
  }

  /**
   * @description Create a new protein type
   * @tags dbtn/module:menu_protein_types
   * @name create_protein_type
   * @summary Create Protein Type
   * @request POST:/routes/menu-protein-types
   */
  export namespace create_protein_type {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProteinTypeCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateProteinTypeData;
  }

  /**
   * @description Get a specific protein type by ID
   * @tags dbtn/module:menu_protein_types
   * @name get_protein_type
   * @summary Get Protein Type
   * @request GET:/routes/menu-protein-types/{protein_id}
   */
  export namespace get_protein_type {
    export type RequestParams = {
      /** Protein Id */
      proteinId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProteinTypeData;
  }

  /**
   * @description Update an existing protein type
   * @tags dbtn/module:menu_protein_types
   * @name update_protein_type
   * @summary Update Protein Type
   * @request PUT:/routes/menu-protein-types/{protein_id}
   */
  export namespace update_protein_type {
    export type RequestParams = {
      /** Protein Id */
      proteinId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = ProteinTypeUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateProteinTypeData;
  }

  /**
   * @description Delete a protein type (with dependency check)
   * @tags dbtn/module:menu_protein_types
   * @name delete_protein_type
   * @summary Delete Protein Type
   * @request DELETE:/routes/menu-protein-types/{protein_id}
   */
  export namespace delete_protein_type {
    export type RequestParams = {
      /** Protein Id */
      proteinId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteProteinTypeData;
  }

  /**
   * @description Securely fetch and summarize customer context for chat personalization. Uses service role to access all customer data while sanitizing output for logs.
   * @tags dbtn/module:customer_context
   * @name get_customer_context_summary
   * @summary Get Customer Context Summary
   * @request POST:/routes/customer-context
   */
  export namespace get_customer_context_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CustomerContextRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerContextSummaryData;
  }

  /**
   * @description Health check for customer context service
   * @tags dbtn/module:customer_context
   * @name customer_context_health_check
   * @summary Customer Context Health Check
   * @request GET:/routes/customer-context-health
   */
  export namespace customer_context_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CustomerContextHealthCheckData;
  }

  /**
   * @description Add customer_reference_number field to customers table
   * @tags dbtn/module:customer_reference_system
   * @name add_customer_reference_field
   * @summary Add Customer Reference Field
   * @request POST:/routes/add-customer-reference-field
   */
  export namespace add_customer_reference_field {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddCustomerReferenceFieldData;
  }

  /**
   * @description Generate customer reference numbers for existing customers who don't have them
   * @tags dbtn/module:customer_reference_system
   * @name generate_reference_numbers_for_existing_customers
   * @summary Generate Reference Numbers For Existing Customers
   * @request POST:/routes/generate-reference-numbers
   */
  export namespace generate_reference_numbers_for_existing_customers {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateReferenceNumbersForExistingCustomersData;
  }

  /**
   * @description Get customer reference number by customer ID
   * @tags dbtn/module:customer_reference_system
   * @name get_customer_reference
   * @summary Get Customer Reference
   * @request GET:/routes/check-customer-reference/{customer_id}
   */
  export namespace get_customer_reference {
    export type RequestParams = {
      /** Customer Id */
      customerId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerReferenceData;
  }

  /**
   * @description Validate that the customer reference system is working correctly
   * @tags dbtn/module:customer_reference_system
   * @name validate_reference_system
   * @summary Validate Reference System
   * @request GET:/routes/validate-reference-system
   */
  export namespace validate_reference_system {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateReferenceSystemData;
  }

  /**
   * No description
   * @tags dbtn/module:identity_migration
   * @name init_clients_and_core_tables
   * @summary Init Clients And Core Tables
   * @request POST:/routes/identity-migration/init
   */
  export namespace init_clients_and_core_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitClientsAndCoreTablesData;
  }

  /**
   * No description
   * @tags dbtn/module:identity_migration
   * @name enable_rls_and_policies
   * @summary Enable Rls And Policies
   * @request POST:/routes/identity-migration/enable-rls
   */
  export namespace enable_rls_and_policies {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = EnableRlsAndPoliciesData;
  }

  /**
   * No description
   * @tags dbtn/module:identity_migration
   * @name backfill_legacy
   * @summary Backfill Legacy
   * @request POST:/routes/identity-migration/backfill
   */
  export namespace backfill_legacy {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BackfillLegacyData;
  }

  /**
   * No description
   * @tags dbtn/module:identity_migration
   * @name lock_legacy_and_views
   * @summary Lock Legacy And Views
   * @request POST:/routes/identity-migration/lock-legacy-and-views
   */
  export namespace lock_legacy_and_views {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LockLegacyAndViewsData;
  }

  /**
   * No description
   * @tags dbtn/module:identity_migration
   * @name audit_report
   * @summary Audit Report
   * @request GET:/routes/identity-migration/audit
   */
  export namespace audit_report {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AuditReportData;
  }

  /**
   * No description
   * @tags dbtn/module:identity_migration
   * @name rollback
   * @summary Rollback
   * @request POST:/routes/identity-migration/rollback
   */
  export namespace rollback {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RollbackData;
  }

  /**
   * No description
   * @tags dbtn/module:identity_migration
   * @name full_run
   * @summary Full Run
   * @request POST:/routes/identity-migration/full-run
   */
  export namespace full_run {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FullRunRequest;
    export type RequestHeaders = {};
    export type ResponseBody = FullRunData;
  }

  /**
   * @description Return concrete counts for legacy vs new tables and quick integrity checks. Tolerant to missing legacy tables/views post-cutover.
   * @tags dbtn/module:identity_migration
   * @name admin_counts
   * @summary Admin Counts
   * @request GET:/routes/identity-migration/admin-counts
   */
  export namespace admin_counts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AdminCountsData;
  }

  /**
   * @description List RLS policies for key tables to verify presence and definitions.
   * @tags dbtn/module:identity_migration
   * @name list_rls_policies
   * @summary List Rls Policies
   * @request GET:/routes/identity-migration/list-rls-policies
   */
  export namespace list_rls_policies {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListRlsPoliciesData;
  }

  /**
   * @description Safely finalize identity cutover by: - Dropping the read-only compatibility view if present - Revoking remaining grants on legacy tables (customer_profiles, user_profiles_legacy) This is idempotent and will no-op if artifacts are already gone.
   * @tags dbtn/module:identity_migration
   * @name finalize_cutover
   * @summary Finalize Cutover
   * @request POST:/routes/identity-migration/finalize-cutover
   */
  export namespace finalize_cutover {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FinalizeCutoverRequest;
    export type RequestHeaders = {};
    export type ResponseBody = FinalizeCutoverData;
  }

  /**
   * @description Force Supabase PostgREST to reload its schema cache. This is necessary after DDL changes (ALTER TABLE, CREATE TABLE, etc.) to ensure PostgREST recognizes new columns/tables immediately. Uses service role key to execute NOTIFY pgrst, 'reload schema'.
   * @tags dbtn/module:supabase_admin
   * @name refresh_schema_cache
   * @summary Refresh Schema Cache
   * @request POST:/routes/supabase-admin/refresh-schema-cache
   */
  export namespace refresh_schema_cache {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RefreshSchemaCacheData;
  }

  /**
   * @description One-time migration: Create customers records for all profiles that have auth_user_id. Links profiles (admin/staff) to customers (diner) records via auth_user_id.
   * @tags dbtn/module:cutover_migration
   * @name migrate_profiles_to_customers
   * @summary Migrate Profiles To Customers
   * @request POST:/routes/migrate-profiles-to-customers
   */
  export namespace migrate_profiles_to_customers {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateProfilesToCustomersData;
  }

  /**
   * @description Check if management password is set and whether it's still the default. Returns status information without exposing the actual password.
   * @tags dbtn/module:admin_auth
   * @name get_password_status
   * @summary Get Password Status
   * @request GET:/routes/password-status
   */
  export namespace get_password_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPasswordStatusData;
  }

  /**
   * @description Get the current management password value. Returns 'admin123' if not set or is default, otherwise returns the custom password.
   * @tags dbtn/module:admin_auth
   * @name get_current_password
   * @summary Get Current Password
   * @request GET:/routes/get-current-password
   */
  export namespace get_current_password {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentPasswordData;
  }

  /**
   * @description Verify admin/management password for POSDesktop access. This endpoint validates passwords against known admin credentials: - admin123 (default password) - manager456 (manager password) - qsai2025 (system password)
   * @tags dbtn/module:admin_auth
   * @name verify_password
   * @summary Verify Password
   * @request POST:/routes/verify-password
   */
  export namespace verify_password {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PasswordVerificationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyPasswordData;
  }

  /**
   * @description Update the admin/management password and save to Supabase database. This replaces the default password with a custom one.
   * @tags dbtn/module:admin_auth
   * @name update_password
   * @summary Update Password
   * @request POST:/routes/update-password
   */
  export namespace update_password {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PasswordUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePasswordData;
  }

  /**
   * @description Initialize trusted device and audit tables (run once).
   * @tags dbtn/module:admin_auth
   * @name setup_trusted_device_tables
   * @summary Setup Trusted Device Tables
   * @request POST:/routes/setup-trusted-device-tables
   */
  export namespace setup_trusted_device_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupTrustedDeviceTablesData;
  }

  /**
   * @description Verify password with device trust and throttling support. - Checks password against stored value - Enforces 5-minute cooldown after 5 failed attempts - Optionally creates trusted device token - Logs all attempts to audit trail
   * @tags dbtn/module:admin_auth
   * @name verify_password_with_device
   * @summary Verify Password With Device
   * @request POST:/routes/verify-password-with-device
   */
  export namespace verify_password_with_device {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VerifyPasswordWithDeviceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyPasswordWithDeviceData;
  }

  /**
   * @description Check if a device fingerprint is currently trusted.
   * @tags dbtn/module:admin_auth
   * @name check_device_trust
   * @summary Check Device Trust
   * @request POST:/routes/check-device-trust
   */
  export namespace check_device_trust {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CheckTrustRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CheckDeviceTrustData;
  }

  /**
   * @description List all trusted devices (including revoked).
   * @tags dbtn/module:admin_auth
   * @name list_trusted_devices
   * @summary List Trusted Devices
   * @request GET:/routes/trusted-devices
   */
  export namespace list_trusted_devices {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTrustedDevicesData;
  }

  /**
   * @description Revoke a trusted device.
   * @tags dbtn/module:admin_auth
   * @name revoke_device
   * @summary Revoke Device
   * @request POST:/routes/revoke-device
   */
  export namespace revoke_device {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisAdminAuthRevokeDeviceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RevokeDeviceData;
  }

  /**
   * @description Check if a device is currently locked out due to failed attempts. Args: request: CheckTrustRequest with device_fingerprint Returns: LockStatusResponse with lock status, cooldown time, and failed attempts count
   * @tags dbtn/module:admin_auth
   * @name get_admin_lock_status
   * @summary Get Admin Lock Status
   * @request POST:/routes/get-admin-lock-status
   */
  export namespace get_admin_lock_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CheckTrustRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetAdminLockStatusData;
  }

  /**
   * @description Check if admin is currently locked due to failed attempts.
   * @tags dbtn/module:admin_auth
   * @name get_lock_status
   * @summary Get Lock Status
   * @request GET:/routes/lock-status
   */
  export namespace get_lock_status {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Device Fingerprint */
      device_fingerprint?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLockStatusData;
  }

  /**
   * @description Authenticate user with Supabase Auth and verify POS access Flow: 1. Sign in with Supabase (email + password) 2. Check if user has POS role (admin/manager/staff) 3. Optionally trust device if requested 4. Return session + role info
   * @tags dbtn/module:pos_supabase_auth
   * @name supabase_pos_login
   * @summary Supabase Pos Login
   * @request POST:/routes/supabase-pos-login
   */
  export namespace supabase_pos_login {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = POSLoginRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SupabasePosLoginData;
  }

  /**
   * @description Check if a user has POS access based on their role
   * @tags dbtn/module:pos_supabase_auth
   * @name check_pos_access
   * @summary Check Pos Access
   * @request POST:/routes/check-pos-access
   */
  export namespace check_pos_access {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CheckPOSAccessRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CheckPosAccessData;
  }

  /**
   * @description Link a trusted device to a specific user
   * @tags dbtn/module:pos_supabase_auth
   * @name trust_device_for_user
   * @summary Trust Device For User
   * @request POST:/routes/trust-device-for-user
   */
  export namespace trust_device_for_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrustDeviceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TrustDeviceForUserData;
  }

  /**
   * @description Check if a device is trusted for a specific user
   * @tags dbtn/module:pos_supabase_auth
   * @name check_user_trusted_device
   * @summary Check User Trusted Device
   * @request POST:/routes/check-user-trusted-device
   */
  export namespace check_user_trusted_device {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CheckDeviceTrustRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CheckUserTrustedDeviceData;
  }

  /**
   * @description Revoke device trust for a specific user
   * @tags dbtn/module:pos_supabase_auth
   * @name revoke_user_device
   * @summary Revoke User Device
   * @request POST:/routes/revoke-user-device
   */
  export namespace revoke_user_device {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisPosSupabaseAuthRevokeDeviceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RevokeUserDeviceData;
  }

  /**
   * @description Create Supabase tables for POS authentication: - pos_user_roles: map user_id to role (admin/manager/staff) - pos_trusted_devices_v2: per-user device trust - RLS policies - Initialize Boss's account with admin role
   * @tags dbtn/module:pos_auth_migration
   * @name setup_pos_auth_tables
   * @summary Setup Pos Auth Tables
   * @request POST:/routes/setup-pos-auth-tables
   */
  export namespace setup_pos_auth_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupPosAuthTablesData;
  }

  /**
   * @description Check if POS auth tables exist and are properly configured
   * @tags dbtn/module:pos_auth_migration
   * @name check_pos_auth_setup
   * @summary Check Pos Auth Setup
   * @request GET:/routes/check-pos-auth-setup
   */
  export namespace check_pos_auth_setup {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckPosAuthSetupData;
  }

  /**
   * @description Diagnostic endpoint to check category parent_category_id mappings. Shows which categories are under which sections.
   * @tags dbtn/module:category_diagnostics
   * @name get_category_diagnostics
   * @summary Get Category Diagnostics
   * @request GET:/routes/category-diagnostics
   */
  export namespace get_category_diagnostics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCategoryDiagnosticsData;
  }

  /**
   * @description Test the category filtering logic with actual database data. Simulates the frontend filtering logic to identify mismatches. Args: category_id: The category ID to filter by (optional - defaults to NON VEGETARIAN) Returns: Diagnostic information about filtering results
   * @tags dbtn/module:menu_filter_diagnostic
   * @name test_category_filter
   * @summary Test Category Filter
   * @request GET:/routes/test-category-filter
   */
  export namespace test_category_filter {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Category Id */
      category_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestCategoryFilterData;
  }

  /**
   * @description Send order confirmation email for online orders
   * @tags dbtn/module:order_notifications
   * @name send_order_confirmation_email
   * @summary Send Order Confirmation Email
   * @request POST:/routes/order-notifications/send-order-confirmation
   */
  export namespace send_order_confirmation_email {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OrderConfirmationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendOrderConfirmationEmailData;
  }

  /**
   * @description Send a real-time notification for order events
   * @tags dbtn/module:order_notifications
   * @name send_realtime_notification
   * @summary Send Realtime Notification
   * @request POST:/routes/order-notifications/send-realtime
   */
  export namespace send_realtime_notification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NotificationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendRealtimeNotificationData;
  }

  /**
   * @description Get real-time notifications for dashboard
   * @tags dbtn/module:order_notifications
   * @name get_realtime_notifications
   * @summary Get Realtime Notifications
   * @request GET:/routes/order-notifications/realtime/list
   */
  export namespace get_realtime_notifications {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id?: string | null;
      /** Role Target */
      role_target?: string | null;
      /**
       * Unread Only
       * @default false
       */
      unread_only?: boolean;
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealtimeNotificationsData;
  }

  /**
   * @description Mark notifications as read, acknowledged, or dismissed
   * @tags dbtn/module:order_notifications
   * @name mark_realtime_notifications
   * @summary Mark Realtime Notifications
   * @request POST:/routes/order-notifications/realtime/mark
   */
  export namespace mark_realtime_notifications {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NotificationMarkRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MarkRealtimeNotificationsData;
  }

  /**
   * @description Get notification statistics for dashboard
   * @tags dbtn/module:order_notifications
   * @name get_realtime_notification_stats
   * @summary Get Realtime Notification Stats
   * @request GET:/routes/order-notifications/realtime/stats
   */
  export namespace get_realtime_notification_stats {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id?: string | null;
      /** Role Target */
      role_target?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealtimeNotificationStatsData;
  }

  /**
   * @description Create an SMS payment link for delivery orders
   * @tags dbtn/module:sms_payment_links
   * @name create_sms_payment_link
   * @summary Create Sms Payment Link
   * @request POST:/routes/sms-payment/create-payment-link
   */
  export namespace create_sms_payment_link {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SMSPaymentLinkRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateSmsPaymentLinkData;
  }

  /**
   * @description Check the status of an SMS payment link
   * @tags dbtn/module:sms_payment_links
   * @name check_payment_link_status
   * @summary Check Payment Link Status
   * @request POST:/routes/sms-payment/check-payment-status
   */
  export namespace check_payment_link_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PaymentLinkStatusRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CheckPaymentLinkStatusData;
  }

  /**
   * @description Mark an SMS payment link as paid (called by Stripe webhook)
   * @tags dbtn/module:sms_payment_links
   * @name mark_payment_as_paid
   * @summary Mark Payment As Paid
   * @request POST:/routes/sms-payment/mark-as-paid
   */
  export namespace mark_payment_as_paid {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Payment Link Id */
      payment_link_id: string;
      /** Payment Intent Id */
      payment_intent_id: string;
      /** Amount Paid */
      amount_paid: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MarkPaymentAsPaidData;
  }

  /**
   * @description List all pending SMS payment links for delivery tracking
   * @tags dbtn/module:sms_payment_links
   * @name list_pending_payments
   * @summary List Pending Payments
   * @request GET:/routes/sms-payment/list-pending-payments
   */
  export namespace list_pending_payments {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListPendingPaymentsData;
  }

  /**
   * @description Generate HTML formatted receipt for system printer
   * @tags dbtn/module:system_printer
   * @name generate_receipt_html
   * @summary Generate Receipt Html
   * @request POST:/routes/generate-receipt-html
   */
  export namespace generate_receipt_html {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ReceiptData;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateReceiptHtmlData;
  }

  /**
   * @description Generate test receipt for printer setup verification
   * @tags dbtn/module:system_printer
   * @name print_test_receipt
   * @summary Print Test Receipt
   * @request POST:/routes/print-test-receipt
   */
  export namespace print_test_receipt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PrintTestReceiptData;
  }

  /**
   * @description Create schema_migrations table for audit trail. Table structure: - migration_id (PK): Unique identifier (m_YYYYMMDD_HHMMSS_hash) - sql_hash: SHA256 hash of SQL for idempotency - description: Human-readable description - sql: Full DDL statement - dry_run: Whether this was a test run - warnings: Array of validation warnings - executed_at: Timestamp of execution
   * @tags dbtn/module:supabase_setup
   * @name initialize_schema_migrations
   * @summary Initialize Schema Migrations
   * @request POST:/routes/supabase-setup/initialize-schema-migrations
   */
  export namespace initialize_schema_migrations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeSchemaMigrationsData;
  }

  /**
   * @description Create execute_sql RPC function in Supabase. This function allows executing arbitrary SQL statements with service role permissions. It's required for DDL operations. SECURITY: Uses SECURITY DEFINER to run with elevated privileges. Only accessible to service role, not exposed to anon users.
   * @tags dbtn/module:supabase_setup
   * @name create_execute_sql_rpc
   * @summary Create Execute Sql Rpc
   * @request POST:/routes/supabase-setup/create-execute-sql-rpc
   */
  export namespace create_execute_sql_rpc {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateExecuteSqlRpcData;
  }

  /**
   * @description Verify that execute_sql RPC function exists and works.
   * @tags dbtn/module:supabase_setup
   * @name verify_execute_sql_rpc
   * @summary Verify Execute Sql Rpc
   * @request GET:/routes/supabase-setup/verify-execute-sql-rpc
   */
  export namespace verify_execute_sql_rpc {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyExecuteSqlRpcData;
  }

  /**
   * @description Check if schema_migrations table exists and get its structure.
   * @tags dbtn/module:supabase_setup
   * @name check_schema_migrations
   * @summary Check Schema Migrations
   * @request GET:/routes/supabase-setup/check-schema-migrations
   */
  export namespace check_schema_migrations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckSchemaMigrationsData;
  }

  /**
   * @description Complete setup: verify execute_sql RPC and create schema_migrations table. This is the recommended endpoint to run first.
   * @tags dbtn/module:supabase_setup
   * @name full_setup
   * @summary Full Setup
   * @request POST:/routes/supabase-setup/full-setup
   */
  export namespace full_setup {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FullSetupData;
  }

  /**
   * @description Simple health check
   * @tags dbtn/module:supabase_manager_test
   * @name supabase_manager_health_check
   * @summary Supabase Manager Health Check
   * @request GET:/routes/supabase-manager-test/health
   */
  export namespace supabase_manager_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SupabaseManagerHealthCheckData;
  }

  /**
   * @description Test Tier 1: CRUD operations on a test table. Tests: 1. Create test table (via DDL) 2. INSERT data 3. SELECT data 4. UPDATE data 5. DELETE data 6. Cleanup (drop test table)
   * @tags dbtn/module:supabase_manager_test
   * @name test_tier1_crud
   * @summary Test Tier1 Crud
   * @request POST:/routes/supabase-manager-test/tier1-crud
   */
  export namespace test_tier1_crud {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestTier1CrudData;
  }

  /**
   * @description Test Tier 2: DDL operations with validation and audit. Tests: 1. CREATE TABLE (allowed) 2. ALTER TABLE (allowed) 3. DROP TABLE (allowed with warning) 4. Blocked operation (DROP DATABASE) 5. Dry-run mode 6. Audit trail verification
   * @tags dbtn/module:supabase_manager_test
   * @name test_tier2_ddl
   * @summary Test Tier2 Ddl
   * @request POST:/routes/supabase-manager-test/tier2-ddl
   */
  export namespace test_tier2_ddl {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestTier2DdlData;
  }

  /**
   * @description Test Tier 3: Advanced management features. Tests: 1. List all tables 2. Get table schema 3. Create Postgres function 4. Call Postgres function 5. Migration history
   * @tags dbtn/module:supabase_manager_test
   * @name test_tier3_advanced
   * @summary Test Tier3 Advanced
   * @request POST:/routes/supabase-manager-test/tier3-advanced
   */
  export namespace test_tier3_advanced {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestTier3AdvancedData;
  }

  /**
   * @description Run complete test suite for all three tiers. Returns comprehensive results showing what works and what doesn't.
   * @tags dbtn/module:supabase_manager_test
   * @name run_full_test_suite
   * @summary Run Full Test Suite
   * @request POST:/routes/supabase-manager-test/run-full-suite
   */
  export namespace run_full_test_suite {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RunFullTestSuiteData;
  }

  /**
   * @description Demonstrate safety validation features. Shows what operations are blocked vs allowed.
   * @tags dbtn/module:supabase_manager_test
   * @name test_safety_validation
   * @summary Test Safety Validation
   * @request GET:/routes/supabase-manager-test/safety-validation-demo
   */
  export namespace test_safety_validation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestSafetyValidationData;
  }

  /**
   * @description Get recent migration history from audit trail.
   * @tags dbtn/module:supabase_manager_test
   * @name get_migration_history_endpoint
   * @summary Get Migration History Endpoint
   * @request GET:/routes/supabase-manager-test/migration-history
   */
  export namespace get_migration_history_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 20
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMigrationHistoryEndpointData;
  }

  /**
   * @description Track cart analytics events (privacy-conscious). Event types: - cart_item_added - cart_item_removed - order_mode_switched - checkout_initiated - checkout_abandoned - cart_cleared
   * @tags dbtn/module:cart_analytics
   * @name track_cart_event
   * @summary Track Cart Event
   * @request POST:/routes/track-event
   */
  export namespace track_cart_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CartEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TrackCartEventData;
  }

  /**
   * @description Get cart analytics metrics for admin dashboard. Metrics include: - Total events - Cart abandonment rate - Average cart value - Popular items - Order mode switches
   * @tags dbtn/module:cart_analytics
   * @name get_cart_metrics
   * @summary Get Cart Metrics
   * @request GET:/routes/metrics
   */
  export namespace get_cart_metrics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days
       * @default 7
       */
      days?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCartMetricsData;
  }

  /**
   * @description Create the cottage-tandoori-kds GitHub repository. Returns repository details including URLs and metadata.
   * @tags dbtn/module:github_kds_manager
   * @name create_repository
   * @summary Create Repository
   * @request POST:/routes/create-repository
   */
  export namespace create_repository {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateRepositoryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateRepositoryData;
  }

  /**
   * @description Get information about the cottage-tandoori-kds repository. Returns repository metadata including stars, forks, topics, etc.
   * @tags dbtn/module:github_kds_manager
   * @name get_repository_info
   * @summary Get Repository Info
   * @request GET:/routes/repository-info
   */
  export namespace get_repository_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRepositoryInfoData;
  }

  /**
   * @description Create or update a file in the repository. Used to create README.md, LICENSE, .gitignore, etc.
   * @tags dbtn/module:github_kds_manager
   * @name create_file
   * @summary Create File
   * @request POST:/routes/kds-create-file
   */
  export namespace create_file {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateFileRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateFileData;
  }

  /**
   * @description Get SHA of existing file (needed for updates). Returns: {"sha": "...", "path": "..."}
   * @tags dbtn/module:github_kds_manager
   * @name get_file_sha
   * @summary Get File Sha
   * @request GET:/routes/get-file-sha
   */
  export namespace get_file_sha {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Path */
      path: string;
      /**
       * Branch
       * @default "main"
       */
      branch?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFileShaData;
  }

  /**
   * @description Create a new release with tag. Returns release ID and upload URL for attaching assets.
   * @tags dbtn/module:github_kds_manager
   * @name create_release
   * @summary Create Release
   * @request POST:/routes/create-release
   */
  export namespace create_release {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateReleaseRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateReleaseData;
  }

  /**
   * @description Upload build artifact to release. File content should be base64 encoded in request.
   * @tags dbtn/module:github_kds_manager
   * @name upload_release_asset
   * @summary Upload Release Asset
   * @request POST:/routes/upload-release-asset
   */
  export namespace upload_release_asset {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UploadAssetRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UploadReleaseAssetData;
  }

  /**
   * @description Get latest KDS release info. Used by UpdateKDS page to check for updates.
   * @tags dbtn/module:github_kds_manager
   * @name get_latest_release
   * @summary Get Latest Release
   * @request GET:/routes/latest-release
   */
  export namespace get_latest_release {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLatestReleaseData;
  }

  /**
   * @description List all KDS releases with pagination. Filters by draft/prerelease status.
   * @tags dbtn/module:github_kds_manager
   * @name list_releases
   * @summary List Releases
   * @request GET:/routes/list-releases
   */
  export namespace list_releases {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Page
       * @default 1
       */
      page?: number;
      /**
       * Per Page
       * @default 10
       */
      per_page?: number;
      /**
       * Include Drafts
       * @default false
       */
      include_drafts?: boolean;
      /**
       * Include Prereleases
       * @default true
       */
      include_prereleases?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListReleasesData;
  }

  /**
   * @description Delete a specific release. Useful for cleaning up test releases.
   * @tags dbtn/module:github_kds_manager
   * @name delete_release
   * @summary Delete Release
   * @request DELETE:/routes/delete-release
   */
  export namespace delete_release {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Release Id */
      release_id: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteReleaseData;
  }

  /**
   * @description Health check endpoint - verifies GitHub token and API connectivity.
   * @tags dbtn/module:github_kds_manager
   * @name check_health
   * @summary Check Health
   * @request GET:/routes/kds-health
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthResult;
  }

  /**
   * @description Add KDS-specific columns to pos_settings table - kds_pin_hash: Hashed 4-digit PIN - kds_auto_lock_minutes: Auto-lock timeout (default 30)
   * @tags dbtn/module:kds_setup
   * @name setup_kds_schema
   * @summary Setup Kds Schema
   * @request POST:/routes/kds-setup/setup-schema
   */
  export namespace setup_kds_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupKdsSchemaData;
  }

  /**
   * @description Check if KDS schema is set up and if PIN is configured
   * @tags dbtn/module:kds_setup
   * @name check_kds_schema
   * @summary Check Kds Schema
   * @request GET:/routes/kds-setup/check-schema
   */
  export namespace check_kds_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckKdsSchemaData;
  }

  /**
   * @description Set or update KDS PIN (4-digit code)
   * @tags dbtn/module:kds_setup
   * @name set_kds_pin
   * @summary Set Kds Pin
   * @request POST:/routes/kds-setup/set-pin
   */
  export namespace set_kds_pin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SetPINRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetKdsPinData;
  }

  /**
   * @description Verify KDS PIN
   * @tags dbtn/module:kds_setup
   * @name verify_kds_pin
   * @summary Verify Kds Pin
   * @request POST:/routes/kds-setup/verify-pin
   */
  export namespace verify_kds_pin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VerifyPINRequest;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyKdsPinData;
  }

  /**
   * @description Look up a postcode to get coordinates
   * @tags dbtn/module:delivery_schema
   * @name lookup_postcode_schema
   * @summary Lookup Postcode Schema
   * @request POST:/routes/lookup-postcode-schema
   */
  export namespace lookup_postcode_schema {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Postcode */
      postcode: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LookupPostcodeSchemaData;
  }

  /**
   * @description Calculate delivery eligibility, time and cost using unified restaurant_settings
   * @tags dbtn/module:delivery_schema
   * @name calculate_delivery
   * @summary Calculate Delivery
   * @request POST:/routes/calculate-delivery
   */
  export namespace calculate_delivery {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Customer Postcode */
      customer_postcode: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CalculateDeliveryData;
  }

  /**
   * @description Setup parent-child relationships for menu categories
   * @tags dbtn/module:unified_schema_management
   * @name setup_menu_categories_parent_relationship
   * @summary Setup Menu Categories Parent Relationship
   * @request POST:/routes/unified-schema/menu/setup-categories-parent-relationship
   */
  export namespace setup_menu_categories_parent_relationship {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupMenuCategoriesParentRelationshipData;
  }

  /**
   * @description Setup item code system for menu items
   * @tags dbtn/module:unified_schema_management
   * @name setup_menu_item_codes
   * @summary Setup Menu Item Codes
   * @request POST:/routes/unified-schema/menu/setup-item-codes
   */
  export namespace setup_menu_item_codes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupMenuItemCodesData;
  }

  /**
   * @description Setup food details for menu item variants
   * @tags dbtn/module:unified_schema_management
   * @name setup_variants_food_details
   * @summary Setup Variants Food Details
   * @request POST:/routes/unified-schema/menu/setup-variants-food-details
   */
  export namespace setup_variants_food_details {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupVariantsFoodDetailsData;
  }

  /**
   * @description Setup set meals schema
   * @tags dbtn/module:unified_schema_management
   * @name setup_set_meals_schema
   * @summary Setup Set Meals Schema
   * @request POST:/routes/unified-schema/specialized/setup-set-meals
   */
  export namespace setup_set_meals_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupSetMealsSchemaData;
  }

  /**
   * @description Setup special instructions columns
   * @tags dbtn/module:unified_schema_management
   * @name setup_special_instructions_schema
   * @summary Setup Special Instructions Schema
   * @request POST:/routes/unified-schema/specialized/setup-special-instructions
   */
  export namespace setup_special_instructions_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupSpecialInstructionsSchemaData;
  }

  /**
   * @description Setup simple payment tracking schema
   * @tags dbtn/module:unified_schema_management
   * @name setup_simple_payment_tracking
   * @summary Setup Simple Payment Tracking
   * @request POST:/routes/unified-schema/payment/setup-simple-payment-tracking
   */
  export namespace setup_simple_payment_tracking {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupSimplePaymentTrackingData;
  }

  /**
   * @description Setup delivery and logistics schema
   * @tags dbtn/module:unified_schema_management
   * @name setup_delivery_schema
   * @summary Setup Delivery Schema
   * @request POST:/routes/unified-schema/operational/setup-delivery-schema
   */
  export namespace setup_delivery_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupDeliverySchemaData;
  }

  /**
   * @description Setup kitchen display system schema
   * @tags dbtn/module:unified_schema_management
   * @name setup_kitchen_display_schema
   * @summary Setup Kitchen Display Schema
   * @request POST:/routes/unified-schema/operational/setup-kitchen-display
   */
  export namespace setup_kitchen_display_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupKitchenDisplaySchemaData;
  }

  /**
   * @description Setup restaurant configuration schema
   * @tags dbtn/module:unified_schema_management
   * @name setup_restaurant_schema
   * @summary Setup Restaurant Schema
   * @request POST:/routes/unified-schema/operational/setup-restaurant-schema
   */
  export namespace setup_restaurant_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupRestaurantSchemaData;
  }

  /**
   * @description Batch setup multiple schemas at once
   * @tags dbtn/module:unified_schema_management
   * @name setup_all_schemas_batch
   * @summary Setup All Schemas Batch
   * @request POST:/routes/unified-schema/batch/setup-all-schemas
   */
  export namespace setup_all_schemas_batch {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BatchSchemaRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetupAllSchemasBatchData;
  }

  /**
   * @description Check status of all schema tables and columns
   * @tags dbtn/module:unified_schema_management
   * @name check_all_schemas_status
   * @summary Check All Schemas Status
   * @request GET:/routes/unified-schema/status/check-all-schemas
   */
  export namespace check_all_schemas_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckAllSchemasStatusData;
  }

  /**
   * @description Get overall schema health status
   * @tags dbtn/module:unified_schema_management
   * @name get_schema_health
   * @summary Get Schema Health
   * @request GET:/routes/unified-schema/status/schema-health
   */
  export namespace get_schema_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSchemaHealthData;
  }

  /**
   * @description Get public restaurant information for voice agent (no auth required) This endpoint provides basic restaurant details that can be accessed by voice agents for voice agent responses. Returns real restaurant data in a voice-friendly format.
   * @tags dbtn/module:public_restaurant_details
   * @name get_public_restaurant_info
   * @summary Get Public Restaurant Info
   * @request GET:/routes/public-restaurant-info
   */
  export namespace get_public_restaurant_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPublicRestaurantInfoData;
  }

  /**
   * @description Get restaurant information as plain text for voice agent crawling Returns restaurant details in a narrative format that's optimized for voice agent responses and natural language processing.
   * @tags dbtn/module:public_restaurant_details
   * @name get_public_restaurant_text
   * @summary Get Public Restaurant Text
   * @request GET:/routes/public-restaurant-text
   */
  export namespace get_public_restaurant_text {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPublicRestaurantTextData;
  }

  /**
   * @description Get restaurant data formatted specifically for voice agent responses Returns data in a format that's easy for voice agents to parse and use in natural conversation with customers.
   * @tags dbtn/module:public_restaurant_details
   * @name get_voice_agent_data
   * @summary Get Voice Agent Data
   * @request GET:/routes/voice-agent-data
   */
  export namespace get_voice_agent_data {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetVoiceAgentDataData;
  }

  /**
   * @description Serve restaurant details in format optimized for voice agent consumption This endpoint provides restaurant details in a natural language format that voice agents can access and index for voice responses. **PUBLIC ENDPOINT - NO AUTHENTICATION REQUIRED** Returns: JSON formatted restaurant details content for voice agent access
   * @tags voice-agent, dbtn/module:restaurant_voice_agent_web
   * @name get_restaurant_details_for_voice_agent
   * @summary Get Restaurant Details For Voice Agent
   * @request GET:/routes/api/restaurant-details-for-voice-agent
   */
  export namespace get_restaurant_details_for_voice_agent {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRestaurantDetailsForVoiceAgentData;
  }

  /**
   * @description Get detailed status of AI voice agent system for dashboard
   * @tags dbtn/module:voice_agent_status
   * @name get_voice_agent_status
   * @summary Get Voice Agent Status
   * @request GET:/routes/voice-agent-status
   */
  export namespace get_voice_agent_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetVoiceAgentStatusData;
  }

  /**
   * @description Record a menu change event for real-time processing
   * @tags dbtn/module:real_time_menu_sync
   * @name record_menu_change
   * @summary Record Menu Change
   * @request POST:/routes/menu-change-event
   */
  export namespace record_menu_change {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MenuChangeEvent;
    export type RequestHeaders = {};
    export type ResponseBody = RecordMenuChangeData;
  }

  /**
   * @description Manually trigger sync of all pending menu changes
   * @tags dbtn/module:real_time_menu_sync
   * @name sync_menu_changes_now
   * @summary Sync Menu Changes Now
   * @request POST:/routes/sync-now
   */
  export namespace sync_menu_changes_now {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Force Update
       * @default false
       */
      force_update?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncMenuChangesNowData;
  }

  /**
   * @description Get current sync status and pending changes count
   * @tags dbtn/module:real_time_menu_sync
   * @name get_sync_status_endpoint
   * @summary Get Sync Status Endpoint
   * @request GET:/routes/sync-status
   */
  export namespace get_sync_status_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSyncStatusEndpointData;
  }

  /**
   * @description Get auto-sync configuration
   * @tags dbtn/module:real_time_menu_sync
   * @name get_auto_sync_config_endpoint
   * @summary Get Auto Sync Config Endpoint
   * @request GET:/routes/auto-sync-config
   */
  export namespace get_auto_sync_config_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAutoSyncConfigEndpointData;
  }

  /**
   * @description Update auto-sync configuration
   * @tags dbtn/module:real_time_menu_sync
   * @name update_auto_sync_config
   * @summary Update Auto Sync Config
   * @request PUT:/routes/auto-sync-config
   */
  export namespace update_auto_sync_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AutoSyncConfig;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateAutoSyncConfigData;
  }

  /**
   * @description Get list of pending menu changes
   * @tags dbtn/module:real_time_menu_sync
   * @name get_pending_changes
   * @summary Get Pending Changes
   * @request GET:/routes/pending-changes
   */
  export namespace get_pending_changes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPendingChangesData;
  }

  /**
   * @description Clear all pending changes (for testing/reset)
   * @tags dbtn/module:real_time_menu_sync
   * @name clear_all_pending_changes
   * @summary Clear All Pending Changes
   * @request DELETE:/routes/clear-pending-changes
   */
  export namespace clear_all_pending_changes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearAllPendingChangesData;
  }

  /**
   * @description Real-time menu sync health check
   * @tags dbtn/module:real_time_menu_sync
   * @name real_time_sync_health_check
   * @summary Real Time Sync Health Check
   * @request GET:/routes/sync-health
   */
  export namespace real_time_sync_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RealTimeSyncHealthCheckData;
  }

  /**
   * @description Get current sync status and pending changes count
   * @tags dbtn/module:real_time_menu_sync
   * @name get_real_time_sync_status
   * @summary Get Real Time Sync Status
   * @request GET:/routes/real-time-sync-status
   */
  export namespace get_real_time_sync_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealTimeSyncStatusData;
  }

  /**
   * @description Get all agent profiles with passport card data for frontend selection Returns agent profiles from voice_agent_profiles table with all necessary fields for displaying passport cards and agent selection in the UI.
   * @tags dbtn/module:agent_profiles_endpoint
   * @name get_agent_profiles_endpoint
   * @summary Get Agent Profiles Endpoint
   * @request GET:/routes/get-agent-profiles
   */
  export namespace get_agent_profiles_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAgentProfilesEndpointData;
  }

  /**
   * @description Health check for agent profiles endpoint
   * @tags dbtn/module:agent_profiles_endpoint
   * @name agent_profiles_health
   * @summary Agent Profiles Health
   * @request GET:/routes/agent-profiles-health
   */
  export namespace agent_profiles_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AgentProfilesHealthData;
  }

  /**
   * @description Get all voice agent profiles
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name get_all_agents
   * @summary Get All Agents
   * @request GET:/routes/voice-agent-core/agents
   */
  export namespace get_all_agents {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllAgentsData;
  }

  /**
   * @description Create new voice agent profile
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name create_agent
   * @summary Create Agent
   * @request POST:/routes/voice-agent-core/agents
   */
  export namespace create_agent {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AgentProfileInput;
    export type RequestHeaders = {};
    export type ResponseBody = CreateAgentData;
  }

  /**
   * @description Get specific agent profile by ID
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name get_agent_by_id
   * @summary Get Agent By Id
   * @request GET:/routes/voice-agent-core/agents/{agent_id}
   */
  export namespace get_agent_by_id {
    export type RequestParams = {
      /** Agent Id */
      agentId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAgentByIdData;
  }

  /**
   * @description Update existing voice agent profile
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name update_agent
   * @summary Update Agent
   * @request PUT:/routes/voice-agent-core/agents/{agent_id}
   */
  export namespace update_agent {
    export type RequestParams = {
      /** Agent Id */
      agentId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = AgentProfileInput;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateAgentData;
  }

  /**
   * @description Select an agent for voice ordering
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name select_agent
   * @summary Select Agent
   * @request POST:/routes/voice-agent-core/select-agent
   */
  export namespace select_agent {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AgentSelection;
    export type RequestHeaders = {};
    export type ResponseBody = SelectAgentData;
  }

  /**
   * @description Get current master switch status
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name get_master_switch_status
   * @summary Get Master Switch Status
   * @request GET:/routes/voice-agent-core/master-switch
   */
  export namespace get_master_switch_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMasterSwitchStatusData;
  }

  /**
   * @description Control the voice ordering master switch
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name set_master_switch
   * @summary Set Master Switch
   * @request POST:/routes/voice-agent-core/master-switch
   */
  export namespace set_master_switch {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MasterSwitchRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetMasterSwitchData;
  }

  /**
   * @description Health check for voice agent core API
   * @tags voice_agent_core, dbtn/module:voice_agent_core
   * @name voice_agent_core_health
   * @summary Voice Agent Core Health
   * @request GET:/routes/voice-agent-core/health
   */
  export namespace voice_agent_core_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VoiceAgentCoreHealthData;
  }

  /**
   * @description Serve restaurant profile data in format optimized for voice agent crawling This endpoint provides restaurant profile data in a natural language format that voice agents can crawl and index for responses about the restaurant. Returns: HTML formatted restaurant profile content for web crawling
   * @tags voice-agent, dbtn/module:restaurant_profile_voice_agent
   * @name get_restaurant_profile_for_voice_agent
   * @summary Get Restaurant Profile For Voice Agent
   * @request GET:/routes/api/restaurant-profile-for-voice-agent
   */
  export namespace get_restaurant_profile_for_voice_agent {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRestaurantProfileForVoiceAgentData;
  }

  /**
   * @description Serve restaurant profile data as plain text for voice agent crawling Alternative endpoint that returns pure text format for different crawling preferences.
   * @tags voice-agent, dbtn/module:restaurant_profile_voice_agent
   * @name get_restaurant_profile_for_voice_agent_text
   * @summary Get Restaurant Profile For Voice Agent Text
   * @request GET:/routes/api/restaurant-profile-for-voice-agent/text
   */
  export namespace get_restaurant_profile_for_voice_agent_text {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRestaurantProfileForVoiceAgentTextData;
  }

  /**
   * @description Serve restaurant profile data as direct HTML for voice agent corpus crawling Returns HTML content directly (not wrapped in JSON) for better compatibility with voice agent web crawling.
   * @tags voice-agent, dbtn/module:restaurant_profile_voice_agent
   * @name get_restaurant_profile_for_voice_agent_html
   * @summary Get Restaurant Profile For Voice Agent Html
   * @request GET:/routes/api/restaurant-profile-for-voice-agent/html
   */
  export namespace get_restaurant_profile_for_voice_agent_html {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRestaurantProfileForVoiceAgentHtmlData;
  }

  /**
   * @description Get the latest GitHub release information
   * @tags dbtn/module:github_release_manager
   * @name check_latest_release
   * @summary Check Latest Release
   * @request GET:/routes/check-latest-release
   */
  export namespace check_latest_release {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckLatestReleaseData;
  }

  /**
   * @description Create a new v8.0.0 EPOS SDK GitHub release
   * @tags dbtn/module:github_release_manager
   * @name create_v8_epos_sdk_release
   * @summary Create V8 Epos Sdk Release
   * @request POST:/routes/create-v8-epos-sdk-release
   */
  export namespace create_v8_epos_sdk_release {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateV8EposSdkReleaseData;
  }

  /**
   * @description Get thermal printer status for Voice Staff Control Center
   * @tags dbtn/module:github_release_manager
   * @name get_printer_status
   * @summary Get Printer Status
   * @request GET:/routes/printer-status
   */
  export namespace get_printer_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrinterStatusData;
  }

  /**
   * @description Show a menu item suggestion to the customer during voice conversation. This endpoint accepts parameters from multiple sources: - JSON body: {"menu_item_id": "...", "reason": "..."} - Query parameters: ?menu_item_id=... - Form data: menu_item_id=...
   * @tags dbtn/module:show_menu_item
   * @name show_menu_item
   * @summary Show Menu Item
   * @request POST:/routes/show-menu-item
   */
  export namespace show_menu_item {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Menu Item Id */
      menu_item_id?: string | null;
      /** Reason */
      reason?: string | null;
      /** Call Id */
      call_id?: string | null;
      /** Session Id */
      session_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ShowMenuItemData;
  }

  /**
   * @description Health check endpoint for showMenuItem tool
   * @tags dbtn/module:show_menu_item
   * @name show_menu_item_health
   * @summary Show Menu Item Health
   * @request GET:/routes/show-menu-item/health
   */
  export namespace show_menu_item_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ShowMenuItemHealthData;
  }

  /**
   * @description Get menu data formatted as structured text for optimal RAG ingestion by voice AI agents. Returns plain text instead of JSON for better crawling and indexing. Only shows published menu items (published_at IS NOT NULL).
   * @tags dbtn/module:menu_text_rag
   * @name get_menu_text_for_rag
   * @summary Get Menu Text For Rag
   * @request GET:/routes/public/menu-text
   */
  export namespace get_menu_text_for_rag {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuTextForRagData;
  }

  /**
   * @description Get restaurant information formatted as structured text for RAG ingestion. Includes opening hours, contact details, and general information.
   * @tags dbtn/module:menu_text_rag
   * @name get_restaurant_info_text_for_rag
   * @summary Get Restaurant Info Text For Rag
   * @request GET:/routes/public/restaurant-info-text
   */
  export namespace get_restaurant_info_text_for_rag {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRestaurantInfoTextForRagData;
  }

  /**
   * @description Test endpoint to verify cross-page synchronization of AI voice settings. This simulates changes to ai_voice_settings and triggers real-time updates.
   * @tags dbtn/module:test_ai_sync
   * @name test_ai_settings_sync
   * @summary Test Ai Settings Sync
   * @request POST:/routes/test-ai-settings-sync
   */
  export namespace test_ai_settings_sync {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestAISettingsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestAiSettingsSyncData;
  }

  /**
   * @description Get current AI voice settings status for testing.
   * @tags dbtn/module:test_ai_sync
   * @name get_ai_settings_status
   * @summary Get Ai Settings Status
   * @request GET:/routes/get-ai-settings-status
   */
  export namespace get_ai_settings_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAiSettingsStatusData;
  }

  /**
   * @description Quick toggle for AI assistant enabled/disabled state to test real-time sync. Uses unified_agent_config for agent selection.
   * @tags dbtn/module:test_ai_sync
   * @name toggle_ai_assistant
   * @summary Toggle Ai Assistant
   * @request POST:/routes/toggle-ai-assistant
   */
  export namespace toggle_ai_assistant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ToggleAiAssistantData;
  }

  /**
   * @description Update order status with tracking and validation
   * @tags dbtn/module:order_tracking
   * @name update_order_tracking_status
   * @summary Update Order Tracking Status
   * @request POST:/routes/order-tracking/update-status
   */
  export namespace update_order_tracking_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OrderTrackingUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateOrderTrackingStatusData;
  }

  /**
   * @description Get detailed order tracking information
   * @tags dbtn/module:order_tracking
   * @name get_order_tracking_details
   * @summary Get Order Tracking Details
   * @request GET:/routes/order-tracking/order/{order_id}
   */
  export namespace get_order_tracking_details {
    export type RequestParams = {
      /** Order Id */
      orderId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOrderTrackingDetailsData;
  }

  /**
   * @description Bulk update multiple order statuses
   * @tags dbtn/module:order_tracking
   * @name bulk_update_order_tracking
   * @summary Bulk Update Order Tracking
   * @request POST:/routes/order-tracking/bulk-update
   */
  export namespace bulk_update_order_tracking {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkTrackingUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = BulkUpdateOrderTrackingData;
  }

  /**
   * @description Get available order statuses and progression rules
   * @tags dbtn/module:order_tracking
   * @name get_status_options
   * @summary Get Status Options
   * @request GET:/routes/order-tracking/status-options
   */
  export namespace get_status_options {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStatusOptionsData;
  }

  /**
   * @description Get all orders with a specific status
   * @tags dbtn/module:order_tracking
   * @name get_orders_by_status
   * @summary Get Orders By Status
   * @request GET:/routes/order-tracking/orders-by-status/{status}
   */
  export namespace get_orders_by_status {
    export type RequestParams = {
      status: OrderStatus;
    };
    export type RequestQuery = {
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOrdersByStatusData;
  }

  /**
   * @description Set up the order tracking database schema
   * @tags dbtn/module:order_tracking_setup
   * @name setup_order_tracking_schema
   * @summary Setup Order Tracking Schema
   * @request POST:/routes/order-tracking-setup/setup-schema
   */
  export namespace setup_order_tracking_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupOrderTrackingSchemaData;
  }

  /**
   * @description Check if order tracking schema is properly set up
   * @tags dbtn/module:order_tracking_setup
   * @name check_order_tracking_schema
   * @summary Check Order Tracking Schema
   * @request GET:/routes/order-tracking-setup/check-schema
   */
  export namespace check_order_tracking_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckOrderTrackingSchemaData;
  }

  /**
   * @description List all tables in the public schema
   * @tags dbtn/module:database_audit
   * @name list_all_tables
   * @summary List All Tables
   * @request GET:/routes/database-audit/list-tables
   */
  export namespace list_all_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListAllTablesData;
  }

  /**
   * @description Generate comprehensive database audit report. Analyzes all tables in the public schema and categorizes them by: - Code usage (references in backend/frontend) - Data content (row counts) - Relationships (foreign keys) - Safety for cleanup (risk levels) Returns detailed report with recommendations for each table.
   * @tags dbtn/module:database_audit
   * @name generate_audit_report
   * @summary Generate Audit Report
   * @request POST:/routes/database-audit/generate-report
   */
  export namespace generate_audit_report {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAuditReportData;
  }

  /**
   * @description Create the ai_knowledge_corpus table with proper schema Creates: - ai_knowledge_corpus table - Indexes for performance - RLS policies - Auto-versioning trigger
   * @tags dbtn/module:ai_knowledge_service
   * @name setup_corpus_schema
   * @summary Setup Corpus Schema
   * @request POST:/routes/ai-knowledge/setup-schema
   */
  export namespace setup_corpus_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupCorpusSchemaData;
  }

  /**
   * @description Publish a new version of a corpus This creates a new corpus version and automatically: 1. Auto-increments the version number 2. Deactivates the previous active version 3. Activates the new version Args: request: Corpus data to publish Returns: CorpusResponse with the new corpus ID and version
   * @tags dbtn/module:ai_knowledge_service
   * @name publish_corpus
   * @summary Publish Corpus
   * @request POST:/routes/ai-knowledge/publish-corpus
   */
  export namespace publish_corpus {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PublishCorpusRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PublishCorpusData;
  }

  /**
   * @description Get the currently active corpus for a given type Args: corpus_type: Type of corpus to retrieve Returns: ActiveCorpusResponse with full corpus data
   * @tags dbtn/module:ai_knowledge_service
   * @name get_active_corpus
   * @summary Get Active Corpus
   * @request GET:/routes/ai-knowledge/get-active-corpus/{corpus_type}
   */
  export namespace get_active_corpus {
    export type RequestParams = {
      /** Corpus Type */
      corpusType: "menu" | "restaurant_info" | "policies" | "faq";
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActiveCorpusData;
  }

  /**
   * @description Get all versions of a corpus type Args: corpus_type: Type of corpus to get versions for Returns: List of all corpus versions with metadata
   * @tags dbtn/module:ai_knowledge_service
   * @name get_corpus_versions
   * @summary Get Corpus Versions
   * @request GET:/routes/ai-knowledge/corpus-versions/{corpus_type}
   */
  export namespace get_corpus_versions {
    export type RequestParams = {
      /** Corpus Type */
      corpusType: "menu" | "restaurant_info" | "policies" | "faq";
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCorpusVersionsData;
  }

  /**
   * @description Activate a specific corpus version (rollback capability) This deactivates the current active version and activates the specified version. Args: corpus_id: UUID of the corpus version to activate Returns: CorpusResponse with activation status
   * @tags dbtn/module:ai_knowledge_service
   * @name activate_corpus_version
   * @summary Activate Corpus Version
   * @request POST:/routes/ai-knowledge/activate-version/{corpus_id}
   */
  export namespace activate_corpus_version {
    export type RequestParams = {
      /** Corpus Id */
      corpusId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ActivateCorpusVersionData;
  }

  /**
   * @description Check health status of all corpus types Returns: Health status for each corpus type including active version info
   * @tags dbtn/module:ai_knowledge_service
   * @name check_corpus_health
   * @summary Check Corpus Health
   * @request GET:/routes/ai-knowledge/corpus-health
   */
  export namespace check_corpus_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckCorpusHealthData;
  }

  /**
   * @description Get delivery configuration from restaurant settings (applies to delivery mode only)
   * @tags dbtn/module:delivery_config
   * @name get_delivery_config
   * @summary Get Delivery Config
   * @request GET:/routes/delivery-config/config
   */
  export namespace get_delivery_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDeliveryConfigData;
  }

  /**
   * @description Get restaurant configuration for checkout and order processing
   * @tags dbtn/module:restaurant_config
   * @name get_restaurant_config
   * @summary Get Restaurant Config
   * @request GET:/routes/config
   */
  export namespace get_restaurant_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRestaurantConfigData;
  }

  /**
   * @description Generate production-ready order number with daily auto-reset sequence. Uses 5 separate counters for each order type combination. Format: - Online Collection: OC-001 - Online Delivery: OD-002 - POS Collection: PC-003 - POS Delivery: PD-004 - POS Dine-In: DI-005 Features: - Atomic sequence increment (race-condition safe) - Auto-reset to 001 at midnight for ALL counters - Thread-safe for concurrent orders - Separate sequences per order type
   * @tags dbtn/module:order_sequence
   * @name generate_order_number
   * @summary Generate Order Number
   * @request POST:/routes/order-sequence/generate
   */
  export namespace generate_order_number {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GenerateOrderNumberRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateOrderNumberData;
  }

  /**
   * @description Get current sequence status for diagnostics. Returns all 5 counter values, last reset date, and preview of next IDs.
   * @tags dbtn/module:order_sequence
   * @name get_sequence_status
   * @summary Get Sequence Status
   * @request GET:/routes/order-sequence/status
   */
  export namespace get_sequence_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSequenceStatusData;
  }

  /**
   * @description Sync order sequence counters with actual max order numbers in database. This endpoint fixes counter drift by: 1. Querying max order number for each prefix (OC, OD, PC, PD, DI) 2. Extracting sequence number from order_number 3. Updating counters to match database reality Use this to: - Fix duplicate order number errors - Recover from counter resets - Initialize counters after migration Returns: dict: Sync results with before/after values for each counter
   * @tags dbtn/module:order_sequence
   * @name sync_counters_with_database
   * @summary Sync Counters With Database
   * @request POST:/routes/order-sequence/sync-counters
   */
  export namespace sync_counters_with_database {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncCountersWithDatabaseData;
  }

  /**
   * @description Create the table_orders table and required indexes
   * @tags dbtn/module:table_orders
   * @name setup_table_orders_schema
   * @summary Setup Table Orders Schema
   * @request POST:/routes/table-orders/setup-schema
   */
  export namespace setup_table_orders_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupTableOrdersSchemaData;
  }

  /**
   * @description Check if table_orders schema exists
   * @tags dbtn/module:table_orders
   * @name check_table_orders_schema
   * @summary Check Table Orders Schema
   * @request GET:/routes/table-orders/check-schema
   */
  export namespace check_table_orders_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckTableOrdersSchemaData;
  }

  /**
   * @description Create a new table order (seat guests at table)
   * @tags dbtn/module:table_orders
   * @name create_table_order
   * @summary Create Table Order
   * @request POST:/routes/table-orders/create
   */
  export namespace create_table_order {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateTableOrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTableOrderData;
  }

  /**
   * @description Get all active table orders
   * @tags dbtn/module:table_orders
   * @name list_table_orders
   * @summary List Table Orders
   * @request GET:/routes/table-orders/list
   */
  export namespace list_table_orders {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTableOrdersData;
  }

  /**
   * @description Get order for specific table
   * @tags dbtn/module:table_orders
   * @name get_table_order
   * @summary Get Table Order
   * @request GET:/routes/table-orders/table/{table_number}
   */
  export namespace get_table_order {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTableOrderData;
  }

  /**
   * @description Update table order items and status
   * @tags dbtn/module:table_orders
   * @name update_table_order
   * @summary Update Table Order
   * @request PUT:/routes/table-orders/table/{table_number}
   */
  export namespace update_table_order {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateTableOrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateTableOrderData;
  }

  /**
   * @description Complete table order (final bill paid, table becomes available)
   * @tags dbtn/module:table_orders
   * @name complete_table_order
   * @summary Complete Table Order
   * @request DELETE:/routes/table-orders/table/{table_number}
   */
  export namespace complete_table_order {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CompleteTableOrderData;
  }

  /**
   * @description Add new items to existing table order
   * @tags dbtn/module:table_orders
   * @name add_items_to_table
   * @summary Add Items To Table
   * @request POST:/routes/table-orders/add-items/{table_number}
   */
  export namespace add_items_to_table {
    export type RequestParams = {
      /** Table Number */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = AddItemsToTablePayload;
    export type RequestHeaders = {};
    export type ResponseBody = AddItemsToTableData;
  }

  /**
   * @description Programmatically drop old tables and create new POS table schema without UI interaction
   * @tags dbtn/module:pos_tables
   * @name migrate_tables_now
   * @summary Migrate Tables Now
   * @request POST:/routes/pos-tables/migrate-tables-now
   */
  export namespace migrate_tables_now {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateTablesNowData;
  }

  /**
   * @description Directly initialize the tables using pure REST API calls to Supabase This function creates tables using multiple fallback approaches: 1. First tries to create tables with the PostgreSQL API directly 2. Then falls back to direct Data API table creation if needed 3. Finally verifies table creation with direct API checks This bypasses the need for SQL functions like execute_sql which may not be available
   * @tags dbtn/module:pos_tables
   * @name direct_initialize_tables
   * @summary Direct Initialize Tables
   * @request POST:/routes/pos-tables/direct-init
   */
  export namespace direct_initialize_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DirectInitializeTablesData;
  }

  /**
   * @description Drop legacy table management tables - no longer needed
   * @tags dbtn/module:pos_tables
   * @name drop_old_tables
   * @summary Drop Old Tables
   * @request POST:/routes/pos-tables/drop-old-tables
   */
  export namespace drop_old_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DropOldTablesData;
  }

  /**
   * @description Check if the POS tables schema exists in the database This function will try multiple methods to reliably detect if the tables exist: 1. First with standard SQL information_schema queries 2. Then with direct REST API calls to the tables 3. Finally checking for cached verification status This approach ensures even if SQL functions fail, we can still detect tables
   * @tags dbtn/module:pos_tables
   * @name check_pos_tables_schema
   * @summary Check Pos Tables Schema
   * @request GET:/routes/pos-tables/check-schema
   */
  export namespace check_pos_tables_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckPosTablesSchemaData;
  }

  /**
   * @description Set up the POS tables schema This creates the pos_tables and pos_tables_config tables in the database.
   * @tags dbtn/module:pos_tables
   * @name setup_pos_tables_schema
   * @summary Setup Pos Tables Schema
   * @request POST:/routes/pos-tables/setup-schema
   */
  export namespace setup_pos_tables_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupPosTablesSchemaData;
  }

  /**
   * @description Get table configuration using REST API
   * @tags dbtn/module:pos_tables
   * @name get_tables_config
   * @summary Get Tables Config
   * @request GET:/routes/pos-tables/config
   */
  export namespace get_tables_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTablesConfigData;
  }

  /**
   * @description Update table configuration using REST API
   * @tags dbtn/module:pos_tables
   * @name save_tables_config
   * @summary Save Tables Config
   * @request POST:/routes/pos-tables/save-config
   */
  export namespace save_tables_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PosTableConfig;
    export type RequestHeaders = {};
    export type ResponseBody = SaveTablesConfigData;
  }

  /**
   * @description Create a new table using REST API
   * @tags dbtn/module:pos_tables
   * @name create_pos_table
   * @summary Create Pos Table
   * @request POST:/routes/pos-tables/create-table
   */
  export namespace create_pos_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateTableRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePosTableData;
  }

  /**
   * @description Update a POS table using REST API
   * @tags dbtn/module:pos_tables
   * @name update_pos_table
   * @summary Update Pos Table
   * @request PUT:/routes/pos-tables/update-table/{table_number}
   */
  export namespace update_pos_table {
    export type RequestParams = {
      /**
       * Table Number
       * @exclusiveMin 0
       */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateTableRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePosTableData;
  }

  /**
   * @description Delete a POS table using REST API
   * @tags dbtn/module:pos_tables
   * @name delete_pos_table
   * @summary Delete Pos Table
   * @request DELETE:/routes/pos-tables/delete-table/{table_number}
   */
  export namespace delete_pos_table {
    export type RequestParams = {
      /**
       * Table Number
       * @exclusiveMin 0
       */
      tableNumber: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeletePosTableData;
  }

  /**
   * @description Update a POS table's status using REST API
   * @tags dbtn/module:pos_tables
   * @name update_pos_table_status
   * @summary Update Pos Table Status
   * @request PUT:/routes/pos-tables/update-table-status/{table_number}
   */
  export namespace update_pos_table_status {
    export type RequestParams = {
      /**
       * Table Number
       * @exclusiveMin 0
       */
      tableNumber: number;
    };
    export type RequestQuery = {
      /** Status */
      status: "available" | "occupied" | "reserved" | "unavailable";
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePosTableStatusData;
  }

  /**
   * @description Get all POS tables with operational status from table_orders
   * @tags dbtn/module:pos_tables
   * @name get_tables
   * @summary Get Tables
   * @request GET:/routes/pos-tables/tables
   */
  export namespace get_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTablesData;
  }

  /**
   * @description Run full diagnostics on the POS tables system
   * @tags dbtn/module:pos_tables
   * @name run_table_diagnostics
   * @summary Run Table Diagnostics
   * @request GET:/routes/pos-tables/diagnostics
   */
  export namespace run_table_diagnostics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RunTableDiagnosticsData;
  }

  /**
   * @description Optimize and resize images for faster loading. Returns optimized image with proper Content-Type headers. Caches resized images in db.storage for subsequent requests. Examples: - /optimized-image?url=https://example.com/image.jpg&w=400&h=400&format=webp - /optimized-image?url=https://example.com/image.jpg&w=80&h=80&format=jpeg&quality=90
   * @tags dbtn/module:media_optimization
   * @name get_optimized_image
   * @summary Get Optimized Image
   * @request GET:/routes/optimized-image
   */
  export namespace get_optimized_image {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Url
       * Original image URL to optimize
       */
      url: string;
      /**
       * W
       * Target width in pixels
       * @min 50
       * @max 2000
       * @default 400
       */
      w?: number;
      /**
       * H
       * Target height in pixels
       * @min 50
       * @max 2000
       * @default 400
       */
      h?: number;
      /**
       * Format
       * Output format (webp, jpeg, png)
       * @default "webp"
       */
      format?: string;
      /**
       * Quality
       * Image quality (1-100)
       * @min 1
       * @max 100
       * @default 85
       */
      quality?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOptimizedImageData;
  }

  /**
   * @description Clear cached optimized images matching a pattern. Admin endpoint for cache management.
   * @tags dbtn/module:media_optimization
   * @name clear_image_cache
   * @summary Clear Image Cache
   * @request GET:/routes/clear-cache
   */
  export namespace clear_image_cache {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Pattern
       * Cache key pattern to clear
       * @default "opt_img_"
       */
      pattern?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearImageCacheData;
  }

  /**
   * @description Create the optimized PostgreSQL function for menu queries. This function reduces 5 separate queries to 1 optimized query with joins.
   * @tags dbtn/module:menu_optimization
   * @name create_optimized_function
   * @summary Create Optimized Function
   * @request POST:/routes/create-optimized-function
   */
  export namespace create_optimized_function {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateOptimizedFunctionData;
  }

  /**
   * @description Drop the optimized PostgreSQL function (for testing/rollback).
   * @tags dbtn/module:menu_optimization
   * @name drop_optimized_function
   * @summary Drop Optimized Function
   * @request POST:/routes/drop-optimized-function
   */
  export namespace drop_optimized_function {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DropOptimizedFunctionData;
  }

  /**
   * @description Invalidate the menu cache. Call this endpoint after updating menu items, categories, or variants to ensure users see fresh data.
   * @tags dbtn/module:menu_optimization
   * @name invalidate_menu_cache
   * @summary Invalidate Menu Cache
   * @request POST:/routes/invalidate-cache
   */
  export namespace invalidate_menu_cache {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Reason
       * @default "Manual invalidation"
       */
      reason?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InvalidateMenuCacheData;
  }

  /**
   * @description Get cache statistics (hit ratio, expiration, etc.).
   * @tags dbtn/module:menu_optimization
   * @name get_menu_cache_stats
   * @summary Get Menu Cache Stats
   * @request GET:/routes/cache-stats
   */
  export namespace get_menu_cache_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuCacheStatsData;
  }

  /**
   * @description Get menu using optimized function with caching. This is the production-ready endpoint that combines: - Database function (reduces 5 queries to 1) - Application cache (TTL: 5 minutes) - Connection pooling (singleton client) Args: skip_cache: If True, bypass cache and query database directly
   * @tags dbtn/module:menu_optimization
   * @name get_optimized_menu
   * @summary Get Optimized Menu
   * @request GET:/routes/get-optimized-menu
   */
  export namespace get_optimized_menu {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Skip Cache
       * @default false
       */
      skip_cache?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOptimizedMenuData;
  }

  /**
   * @description Test the optimized PostgreSQL function and measure performance.
   * @tags dbtn/module:menu_optimization
   * @name test_optimized_function
   * @summary Test Optimized Function
   * @request GET:/routes/test-optimized-function
   */
  export namespace test_optimized_function {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestOptimizedFunctionData;
  }

  /**
   * @description Get printer service specification
   * @tags dbtn/module:printer_service_manager
   * @name get_specification
   * @summary Get Specification
   * @request GET:/routes/printer-service/specification
   */
  export namespace get_specification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSpecificationData;
  }

  /**
   * @description Get complete printer service specification with all details
   * @tags dbtn/module:printer_service_manager
   * @name get_full_specification
   * @summary Get Full Specification
   * @request GET:/routes/printer-service/specification/full
   */
  export namespace get_full_specification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFullSpecificationData;
  }

  /**
   * @description Generate PowerShell installation script for NSSM service
   * @tags dbtn/module:printer_service_manager
   * @name get_powershell_install_script
   * @summary Get Powershell Install Script
   * @request GET:/routes/printer-service/install-script/powershell
   */
  export namespace get_powershell_install_script {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPowershellInstallScriptData;
  }

  /**
   * @description Generate PowerShell uninstallation script for NSSM service
   * @tags dbtn/module:printer_service_manager
   * @name get_powershell_uninstall_script
   * @summary Get Powershell Uninstall Script
   * @request GET:/routes/printer-service/install-script/uninstall
   */
  export namespace get_powershell_uninstall_script {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPowershellUninstallScriptData;
  }

  /**
   * @description Check if printer service is running and accessible
   * @tags dbtn/module:printer_service_manager
   * @name check_service_health
   * @summary Check Service Health
   * @request GET:/routes/printer-service/health
   */
  export namespace check_service_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckServiceHealthData;
  }

  /**
   * @description Get complete printer service specification. Returns: Service specification with all configuration details
   * @tags dbtn/module:printer_service_installer
   * @name get_service_specification
   * @summary Get Service Specification
   * @request GET:/routes/printer-service/spec
   */
  export namespace get_service_specification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetServiceSpecificationData;
  }

  /**
   * @description Get source code for a specific file. Args: filename: Name of the source file (e.g., 'server.js', 'package.json') Returns: File content and description Raises: HTTPException: If file not found
   * @tags dbtn/module:printer_service_installer
   * @name get_source_file
   * @summary Get Source File
   * @request GET:/routes/printer-service/source/{filename}
   */
  export namespace get_source_file {
    export type RequestParams = {
      /** Filename */
      filename: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSourceFileData;
  }

  /**
   * @description Get complete installation bundle metadata. Returns: Bundle information with all files and instructions
   * @tags dbtn/module:printer_service_installer
   * @name get_installation_bundle
   * @summary Get Installation Bundle
   * @request GET:/routes/printer-service/bundle
   */
  export namespace get_installation_bundle {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInstallationBundleData;
  }

  /**
   * @description Get sample health check response for testing. Returns: Sample health check response
   * @tags dbtn/module:printer_service_installer
   * @name get_health_check_template
   * @summary Get Health Check Template
   * @request GET:/routes/printer-service/health-check-template
   */
  export namespace get_health_check_template {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHealthCheckTemplateData;
  }

  /**
   * @description Get sample print request payloads for testing. Returns: Sample kitchen and customer print requests
   * @tags dbtn/module:printer_service_installer
   * @name get_print_request_templates
   * @summary Get Print Request Templates
   * @request GET:/routes/printer-service/print-request-templates
   */
  export namespace get_print_request_templates {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrintRequestTemplatesData;
  }

  /**
   * @description Get metadata about the printer service package.
   * @tags dbtn/module:printer_service_package
   * @name get_package_info
   * @summary Get Package Info
   * @request GET:/routes/package-info
   */
  export namespace get_package_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPackageInfoData;
  }

  /**
   * @description Generate and download the complete Printer Service package as a zip file.
   * @tags stream, dbtn/module:printer_service_package
   * @name download_printer_service_package
   * @summary Download Printer Service Package
   * @request GET:/routes/download
   */
  export namespace download_printer_service_package {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DownloadPrinterServicePackageData;
  }

  /**
   * @description Sync all installer files to cottage-pos-desktop GitHub repository. Pushes: - installer/cottage-tandoori-setup.nsi - installer/build.bat - installer/LICENSE.txt - installer/README.md - .gitignore (updated with installer outputs) Returns: InstallerSyncResponse with sync results
   * @tags dbtn/module:installer_sync
   * @name sync_installer_files
   * @summary Sync Installer Files
   * @request POST:/routes/sync-installer-files
   */
  export namespace sync_installer_files {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncInstallerFilesData;
  }

  /**
   * @description Get status of installer files in the library. Returns: Dict with file count and file list
   * @tags dbtn/module:installer_sync
   * @name get_installer_files_status
   * @summary Get Installer Files Status
   * @request GET:/routes/installer-files-status
   */
  export namespace get_installer_files_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInstallerFilesStatusData;
  }

  /**
   * @description List recent workflow runs for the combined installer workflow.
   * @tags dbtn/module:github_workflow_logs
   * @name list_workflow_runs
   * @summary List Workflow Runs
   * @request GET:/routes/list-workflow-runs
   */
  export namespace list_workflow_runs {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Owner
       * @default "Bodzaman"
       */
      owner?: string;
      /**
       * Repo
       * @default "cottage-pos-desktop"
       */
      repo?: string;
      /**
       * Workflow File
       * @default "build-combined-installer.yml"
       */
      workflow_file?: string;
      /**
       * Per Page
       * @default 10
       */
      per_page?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListWorkflowRunsData;
  }

  /**
   * @description Get jobs for a specific workflow run.
   * @tags dbtn/module:github_workflow_logs
   * @name get_workflow_run_jobs
   * @summary Get Workflow Run Jobs
   * @request GET:/routes/get-workflow-run-jobs
   */
  export namespace get_workflow_run_jobs {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Run Id */
      run_id: number;
      /**
       * Owner
       * @default "Bodzaman"
       */
      owner?: string;
      /**
       * Repo
       * @default "cottage-pos-desktop"
       */
      repo?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetWorkflowRunJobsData;
  }

  /**
   * @description Get logs for a specific job. Returns the raw log text from GitHub Actions.
   * @tags dbtn/module:github_workflow_logs
   * @name get_job_logs
   * @summary Get Job Logs
   * @request GET:/routes/get-job-logs
   */
  export namespace get_job_logs {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Job Id */
      job_id: number;
      /**
       * Owner
       * @default "Bodzaman"
       */
      owner?: string;
      /**
       * Repo
       * @default "cottage-pos-desktop"
       */
      repo?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetJobLogsData;
  }

  /**
   * @description Get logs from the most recent failed workflow run. This is a convenience endpoint that: 1. Finds the latest failed run 2. Gets its jobs 3. Returns logs from the failed job
   * @tags dbtn/module:github_workflow_logs
   * @name get_latest_failed_run_logs
   * @summary Get Latest Failed Run Logs
   * @request GET:/routes/get-latest-failed-run-logs
   */
  export namespace get_latest_failed_run_logs {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Owner
       * @default "Bodzaman"
       */
      owner?: string;
      /**
       * Repo
       * @default "cottage-pos-desktop"
       */
      repo?: string;
      /**
       * Workflow File
       * @default "build-combined-installer.yml"
       */
      workflow_file?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLatestFailedRunLogsData;
  }

  /**
   * @description Fetch the latest POS Desktop release from GitHub. Returns: ReleaseInfo with version, download URL, and metadata Raises: HTTPException: If GitHub API fails or no releases found
   * @tags dbtn/module:pos_release
   * @name get_latest_pos_release
   * @summary Get Latest Pos Release
   * @request GET:/routes/pos-release/latest
   */
  export namespace get_latest_pos_release {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLatestPosReleaseData;
  }

  /**
   * @description Get total count of registered customers for social proof display. Uses Supabase customers table to get accurate count.
   * @tags dbtn/module:customer_stats
   * @name get_customer_count
   * @summary Get Customer Count
   * @request GET:/routes/customer-count
   */
  export namespace get_customer_count {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerCountData;
  }

  /**
   * @description Check if a user's email is verified in Supabase Auth. Args: user_id: The Supabase auth user ID Returns: EmailVerificationStatusResponse with verification status
   * @tags dbtn/module:email_verification
   * @name get_email_verification_status
   * @summary Get Email Verification Status
   * @request GET:/routes/email-verification-status/{user_id}
   */
  export namespace get_email_verification_status {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEmailVerificationStatusData;
  }

  /**
   * @description Send a verification email to a user. Args: request: Contains user_id Returns: SendVerificationEmailResponse with success status
   * @tags dbtn/module:email_verification
   * @name send_verification_email
   * @summary Send Verification Email
   * @request POST:/routes/send-verification-email
   */
  export namespace send_verification_email {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SendVerificationEmailRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendVerificationEmailData;
  }

  /**
   * @description Get customer order history with proper data transformation. This endpoint: - Fetches orders from the 'orders' table - Transforms data structure to match CustomerPortal expectations - Maps items → order_items with correct field names - Uses order_number for display (not UUID) - Returns type-safe, structured data Args: customer_id: UUID of the customer limit: Maximum number of orders to return (default: 100) Returns: OrderHistoryListResponse with transformed order data
   * @tags dbtn/module:customer_portal
   * @name get_order_history
   * @summary Get Order History
   * @request GET:/routes/order-history/{customer_id}
   */
  export namespace get_order_history {
    export type RequestParams = {
      /** Customer Id */
      customerId: string;
    };
    export type RequestQuery = {
      /**
       * Limit
       * @default 100
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOrderHistoryData;
  }

  /**
   * @description Create database schema for favorite lists feature: - favorite_lists: User's custom favorite lists - favorite_list_items: Many-to-many join table - shared_favorite_links: Shareable links with expiry Includes RLS policies for proper access control.
   * @tags dbtn/module:favorite_lists_setup
   * @name setup_favorite_lists_schema
   * @summary Setup Favorite Lists Schema
   * @request POST:/routes/setup-favorite-lists-schema
   */
  export namespace setup_favorite_lists_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupFavoriteListsSchemaData;
  }

  /**
   * @description Check if favorite lists tables exist and are properly configured.
   * @tags dbtn/module:favorite_lists_setup
   * @name check_favorite_lists_schema
   * @summary Check Favorite Lists Schema
   * @request GET:/routes/check-favorite-lists-schema
   */
  export namespace check_favorite_lists_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckFavoriteListsSchemaData;
  }

  /**
   * @description Get all favorites for a specific user (now using customer_favorites table)
   * @tags dbtn/module:favorites
   * @name get_user_favorites
   * @summary Get User Favorites
   * @request GET:/routes/get-user-favorites
   */
  export namespace get_user_favorites {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserFavoritesData;
  }

  /**
   * @description Add an item to user's favorites (now using customer_favorites table)
   * @tags dbtn/module:favorites
   * @name add_favorite
   * @summary Add Favorite
   * @request POST:/routes/add-favorite
   */
  export namespace add_favorite {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddFavoriteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddFavoriteData;
  }

  /**
   * @description Remove an item from user's favorites (now using customer_favorites table)
   * @tags dbtn/module:favorites
   * @name remove_favorite
   * @summary Remove Favorite
   * @request POST:/routes/remove-favorite
   */
  export namespace remove_favorite {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RemoveFavoriteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RemoveFavoriteData;
  }

  /**
   * @description Check if a specific item is in user's favorites (now using customer_favorites table)
   * @tags dbtn/module:favorites
   * @name check_favorite_status
   * @summary Check Favorite Status
   * @request GET:/routes/check-favorite-status
   */
  export namespace check_favorite_status {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
      /** Menu Item Id */
      menu_item_id: string;
      /** Variant Id */
      variant_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckFavoriteStatusData;
  }

  /**
   * @description Remove all favorites for a user (now using customer_favorites table)
   * @tags dbtn/module:favorites
   * @name clear_all_favorites
   * @summary Clear All Favorites
   * @request DELETE:/routes/clear-all-favorites
   */
  export namespace clear_all_favorites {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearAllFavoritesData;
  }

  /**
   * @description Create a new favorite list for a customer.
   * @tags dbtn/module:favorite_lists
   * @name create_favorite_list
   * @summary Create Favorite List
   * @request POST:/routes/create-list
   */
  export namespace create_favorite_list {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateListRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateFavoriteListData;
  }

  /**
   * @description Rename an existing favorite list.
   * @tags dbtn/module:favorite_lists
   * @name rename_favorite_list
   * @summary Rename Favorite List
   * @request POST:/routes/rename-list
   */
  export namespace rename_favorite_list {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RenameListRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RenameFavoriteListData;
  }

  /**
   * @description Delete a favorite list and all its items.
   * @tags dbtn/module:favorite_lists
   * @name delete_favorite_list
   * @summary Delete Favorite List
   * @request POST:/routes/delete-list
   */
  export namespace delete_favorite_list {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeleteListRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteFavoriteListData;
  }

  /**
   * @description Add a favorite item to a specific list.
   * @tags dbtn/module:favorite_lists
   * @name add_favorite_to_list
   * @summary Add Favorite To List
   * @request POST:/routes/add-to-list
   */
  export namespace add_favorite_to_list {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddToListRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddFavoriteToListData;
  }

  /**
   * @description Remove a favorite item from a specific list.
   * @tags dbtn/module:favorite_lists
   * @name remove_favorite_from_list
   * @summary Remove Favorite From List
   * @request POST:/routes/remove-from-list
   */
  export namespace remove_favorite_from_list {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RemoveFromListRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RemoveFavoriteFromListData;
  }

  /**
   * @description Get all favorite lists for a customer with their items.
   * @tags dbtn/module:favorite_lists
   * @name get_customer_lists
   * @summary Get Customer Lists
   * @request GET:/routes/get-lists/{customer_id}
   */
  export namespace get_customer_lists {
    export type RequestParams = {
      /** Customer Id */
      customerId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerListsData;
  }

  /**
   * @description Generate a shareable link for a favorite list. Creates a token-based URL that expires after specified hours.
   * @tags dbtn/module:favorite_lists
   * @name share_favorite_list
   * @summary Share Favorite List
   * @request POST:/routes/share-list
   */
  export namespace share_favorite_list {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ShareListRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ShareFavoriteListData;
  }

  /**
   * @description Retrieve a shared favorite list by token (public endpoint). No authentication required - anyone with valid token can view.
   * @tags dbtn/module:favorite_lists
   * @name get_shared_favorite_list
   * @summary Get Shared Favorite List
   * @request GET:/routes/shared-list/{token}
   */
  export namespace get_shared_favorite_list {
    export type RequestParams = {
      /** Token */
      token: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSharedFavoriteListData;
  }

  /**
   * @description Health check for favorite lists API.
   * @tags dbtn/module:favorite_lists
   * @name favorite_lists_health
   * @summary Favorite Lists Health
   * @request GET:/routes/favorite-lists-health
   */
  export namespace favorite_lists_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FavoriteListsHealthData;
  }

  /**
   * @description Add foreign key constraint from customer_favorites.menu_item_id to menu_items.id. This enables PostgREST to traverse the relationship in queries.
   * @tags dbtn/module:favorite_lists
   * @name fix_customer_favorites_schema
   * @summary Fix Customer Favorites Schema
   * @request POST:/routes/fix-favorites-schema
   */
  export namespace fix_customer_favorites_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixCustomerFavoritesSchemaData;
  }

  /**
   * @description Diagnose the customers table foreign key issue.
   * @tags dbtn/module:fix_customers_fk
   * @name diagnose_customers_fk
   * @summary Diagnose Customers Fk
   * @request POST:/routes/fix-customers-fk/diagnose
   */
  export namespace diagnose_customers_fk {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiagnoseCustomersFkData;
  }

  /**
   * @description Fix the customers table foreign key to reference auth.users instead of public.users.
   * @tags dbtn/module:fix_customers_fk
   * @name fix_customers_fk
   * @summary Fix Customers Fk
   * @request POST:/routes/fix-customers-fk/fix
   */
  export namespace fix_customers_fk {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixCustomersFkData;
  }

  /**
   * @description Add RLS policies to customers table to allow authenticated users to: 1. SELECT their own record (via auth_user_id) 2. INSERT their own record on first login 3. UPDATE their own record
   * @tags dbtn/module:fix_customers_rls
   * @name fix_customers_rls_policies
   * @summary Fix Customers Rls Policies
   * @request POST:/routes/fix-customers-rls-policies
   */
  export namespace fix_customers_rls_policies {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixCustomersRlsPoliciesData;
  }

  /**
   * @description Programmatically confirm a user's email address. This endpoint uses the service role key to bypass email confirmation, allowing users to have an active session immediately after signup. Critical for smooth onboarding flow.
   * @tags dbtn/module:auto_confirm_email
   * @name auto_confirm_email
   * @summary Auto Confirm Email
   * @request POST:/routes/auto-confirm-email
   */
  export namespace auto_confirm_email {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AutoConfirmEmailRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AutoConfirmEmailData;
  }

  /**
   * @description Get personalization settings for a customer
   * @tags dbtn/module:personalization_settings
   * @name get_personalization_settings
   * @summary Get Personalization Settings
   * @request GET:/routes/personalization-settings
   */
  export namespace get_personalization_settings {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Customer Id */
      customer_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPersonalizationSettingsData;
  }

  /**
   * @description Update personalization settings for a customer
   * @tags dbtn/module:personalization_settings
   * @name update_personalization_settings
   * @summary Update Personalization Settings
   * @request POST:/routes/personalization-settings
   */
  export namespace update_personalization_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PersonalizationSettingsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePersonalizationSettingsData;
  }

  /**
   * @description Fix the customer_addresses table foreign key constraint to reference the customers table instead of the deprecated customer_profiles table. This is safe to run multiple times (idempotent).
   * @tags dbtn/module:fix_customer_addresses_fk
   * @name fix_foreign_key
   * @summary Fix Foreign Key
   * @request POST:/routes/fix-customer-addresses-fk/fix-foreign-key
   */
  export namespace fix_foreign_key {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixForeignKeyData;
  }

  /**
   * @description Check current unique constraints on profiles table
   * @tags dbtn/module:fix_profiles_constraint
   * @name check_profiles_constraints
   * @summary Check Profiles Constraints
   * @request POST:/routes/check-profiles-constraints
   */
  export namespace check_profiles_constraints {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckProfilesConstraintsData;
  }

  /**
   * @description Drop the email_loyalty_token unique constraint that's blocking signups
   * @tags dbtn/module:fix_profiles_constraint
   * @name drop_loyalty_token_constraint
   * @summary Drop Loyalty Token Constraint
   * @request POST:/routes/drop-loyalty-token-constraint
   */
  export namespace drop_loyalty_token_constraint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DropLoyaltyTokenConstraintData;
  }

  /**
   * @description Make email_loyalty_token nullable and remove default to prevent duplicates
   * @tags dbtn/module:fix_profiles_constraint
   * @name make_loyalty_token_nullable
   * @summary Make Loyalty Token Nullable
   * @request POST:/routes/make-loyalty-token-nullable
   */
  export namespace make_loyalty_token_nullable {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MakeLoyaltyTokenNullableData;
  }

  /**
   * @description Diagnose the profiles.email_loyalty_token signup error
   * @tags dbtn/module:auth_signup_diagnostic
   * @name diagnose_signup_error
   * @summary Diagnose Signup Error
   * @request POST:/routes/diagnose-signup-error
   */
  export namespace diagnose_signup_error {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiagnoseSignupErrorData;
  }

  /**
   * @description Check for database triggers that might be creating profile records
   * @tags dbtn/module:auth_signup_diagnostic
   * @name check_auth_triggers
   * @summary Check Auth Triggers
   * @request POST:/routes/check-auth-triggers
   */
  export namespace check_auth_triggers {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckAuthTriggersData;
  }

  /**
   * @description Create customer_onboarding table and RLS policies. Only needs to be run once during initial setup.
   * @tags dbtn/module:onboarding
   * @name setup_onboarding_database
   * @summary Setup Onboarding Database
   * @request POST:/routes/onboarding/setup-database
   */
  export namespace setup_onboarding_database {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupOnboardingDatabaseData;
  }

  /**
   * @description Initialize onboarding record for a new customer. Called immediately after customer signup.
   * @tags dbtn/module:onboarding
   * @name initialize_onboarding
   * @summary Initialize Onboarding
   * @request POST:/routes/onboarding/initialize
   */
  export namespace initialize_onboarding {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = InitializeOnboardingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeOnboardingData;
  }

  /**
   * @description Get current onboarding status for a customer. Auto-creates record if it doesn't exist (lazy loading pattern). Returns flat structure for simple frontend consumption. IMPORTANT: Includes retry logic to handle race condition where auth trigger hasn't finished creating customer record yet.
   * @tags dbtn/module:onboarding
   * @name get_onboarding_status
   * @summary Get Onboarding Status
   * @request GET:/routes/onboarding/status/{customer_id}
   */
  export namespace get_onboarding_status {
    export type RequestParams = {
      /** Customer Id */
      customerId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOnboardingStatusData;
  }

  /**
   * @description Mark the welcome tour as completed for a customer.
   * @tags dbtn/module:onboarding
   * @name mark_tour_complete
   * @summary Mark Tour Complete
   * @request POST:/routes/onboarding/mark-tour-complete
   */
  export namespace mark_tour_complete {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MarkTourCompleteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MarkTourCompleteData;
  }

  /**
   * @description Mark the setup wizard as completed for a customer.
   * @tags dbtn/module:onboarding
   * @name mark_wizard_complete
   * @summary Mark Wizard Complete
   * @request POST:/routes/onboarding/mark-wizard-complete
   */
  export namespace mark_wizard_complete {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MarkWizardCompleteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = MarkWizardCompleteData;
  }

  /**
   * @description Update the email series step after sending an email. Internal endpoint used by email scheduler.
   * @tags dbtn/module:onboarding
   * @name update_email_step
   * @summary Update Email Step
   * @request POST:/routes/onboarding/update-email-step
   */
  export namespace update_email_step {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Customer Id */
      customer_id: string;
      /** Step */
      step: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateEmailStepData;
  }

  /**
   * @description Create the chatbot_prompts table with all required fields for GPT-5 and Google GenAI support. Includes RLS policies for admin-only access.
   * @tags dbtn/module:chatbot_prompts_schema
   * @name setup_chatbot_prompts_table
   * @summary Setup Chatbot Prompts Table
   * @request POST:/routes/chatbot-prompts-schema/setup-chatbot-prompts-table
   */
  export namespace setup_chatbot_prompts_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupChatbotPromptsTableData;
  }

  /**
   * @description Check if the chatbot_prompts table exists and validate its schema.
   * @tags dbtn/module:chatbot_prompts_schema
   * @name check_chatbot_prompts_schema
   * @summary Check Chatbot Prompts Schema
   * @request GET:/routes/chatbot-prompts-schema/check-chatbot-prompts-schema
   */
  export namespace check_chatbot_prompts_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckChatbotPromptsSchemaData;
  }

  /**
   * @description Create a simple chatbot_prompts table for immediate testing. We'll expand the schema later.
   * @tags dbtn/module:init_chatbot_schema
   * @name init_simple_chatbot_table
   * @summary Init Simple Chatbot Table
   * @request POST:/routes/init-simple-table
   */
  export namespace init_simple_chatbot_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitSimpleChatbotTableData;
  }

  /**
   * @description Check if the chatbot_prompts table exists and has data.
   * @tags dbtn/module:init_chatbot_schema
   * @name check_chatbot_table
   * @summary Check Chatbot Table
   * @request GET:/routes/check-table
   */
  export namespace check_chatbot_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckChatbotTableData;
  }

  /**
   * @description Creates the unified_agent_config table with RLS policies and inserts default Uncle Raj data. Safe to call multiple times - handles existing table gracefully.
   * @tags dbtn/module:unified_agent_config
   * @name initialize_unified_agent_config
   * @summary Initialize Unified Agent Config
   * @request POST:/routes/initialize-unified-agent-config
   */
  export namespace initialize_unified_agent_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeUnifiedAgentConfigData;
  }

  /**
   * @description Returns the active unified agent config (single row). Returns 404 if not initialized.
   * @tags dbtn/module:unified_agent_config
   * @name get_unified_agent_config
   * @summary Get Unified Agent Config
   * @request GET:/routes/get-unified-agent-config
   */
  export namespace get_unified_agent_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUnifiedAgentConfigData;
  }

  /**
   * @description Returns chat-specific configuration from unified_agent_config. Mirrors the old chatbot_config endpoint structure for compatibility. Returns None/null values if config doesn't exist (chat-store.ts handles defaults).
   * @tags dbtn/module:unified_agent_config
   * @name get_chat_config
   * @summary Get Chat Config
   * @request GET:/routes/get-chat-config
   */
  export namespace get_chat_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetChatConfigData;
  }

  /**
   * @description Updates the unified agent config with partial updates. Only updates provided fields and automatically updates updated_at timestamp.
   * @tags dbtn/module:unified_agent_config
   * @name update_unified_agent_config
   * @summary Update Unified Agent Config
   * @request POST:/routes/update-unified-agent-config
   */
  export namespace update_unified_agent_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateUnifiedAgentConfigRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateUnifiedAgentConfigData;
  }

  /**
   * @description Health check endpoint to verify if the unified agent config is initialized.
   * @tags dbtn/module:unified_agent_config
   * @name unified_agent_config_status
   * @summary Unified Agent Config Status
   * @request GET:/routes/unified-agent-config-status
   */
  export namespace unified_agent_config_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UnifiedAgentConfigStatusData;
  }

  /**
   * @description Publishes the complete wizard configuration by updating unified_agent_config. Transforms wizard state into the unified config schema.
   * @tags dbtn/module:unified_agent_config
   * @name publish_wizard_config
   * @summary Publish Wizard Config
   * @request POST:/routes/publish-wizard-config
   */
  export namespace publish_wizard_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PublishWizardConfigRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PublishWizardConfigData;
  }

  /**
   * @description Look up menu item by structured item code
   * @tags dbtn/module:voice_menu_matching
   * @name lookup_menu_item_by_code
   * @summary Lookup Menu Item By Code
   * @request POST:/routes/voice-menu-matching/lookup-by-code
   */
  export namespace lookup_menu_item_by_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MenuItemCodeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = LookupMenuItemByCodeData;
  }

  /**
   * @description Search menu items using natural language with fallback fuzzy matching
   * @tags dbtn/module:voice_menu_matching
   * @name natural_language_search
   * @summary Natural Language Search
   * @request POST:/routes/voice-menu-matching/natural-language-search
   */
  export namespace natural_language_search {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NaturalLanguageSearchRequest;
    export type RequestHeaders = {};
    export type ResponseBody = NaturalLanguageSearchData;
  }

  /**
   * @description Generate structured item code for a menu item
   * @tags dbtn/module:voice_menu_matching
   * @name generate_menu_item_code
   * @summary Generate Menu Item Code
   * @request POST:/routes/voice-menu-matching/generate-item-code
   */
  export namespace generate_menu_item_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CodeGenerationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateMenuItemCodeData;
  }

  /**
   * @description Health check for voice menu matching API
   * @tags dbtn/module:voice_menu_matching
   * @name check_voice_menu_matching_health
   * @summary Check Voice Menu Matching Health
   * @request GET:/routes/voice-menu-matching/health
   */
  export namespace check_voice_menu_matching_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckVoiceMenuMatchingHealthData;
  }

  /**
   * @description Get complete menu context optimized for AI consumption. Includes structured data for categories, items, variants, and metadata.
   * @tags dbtn/module:ai_menu_context
   * @name get_full_menu_context
   * @summary Get Full Menu Context
   * @request GET:/routes/ai-menu-context/full-context
   */
  export namespace get_full_menu_context {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Include Inactive
       * @default false
       */
      include_inactive?: boolean;
      /** Category Filter */
      category_filter?: string | null;
      /**
       * Compact Mode
       * @default false
       */
      compact_mode?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFullMenuContextData;
  }

  /**
   * @description Validate and match menu items using fuzzy matching and confidence scoring. Returns the best match with confidence score and alternative suggestions.
   * @tags dbtn/module:ai_menu_context
   * @name validate_menu_item
   * @summary Validate Menu Item
   * @request POST:/routes/ai-menu-context/validate-item
   */
  export namespace validate_menu_item {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MenuValidationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateMenuItemData;
  }

  /**
   * @description Get a lightweight summary of menu context for token-efficient AI prompts.
   * @tags dbtn/module:ai_menu_context
   * @name get_context_summary
   * @summary Get Context Summary
   * @request GET:/routes/ai-menu-context/context-summary
   */
  export namespace get_context_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetContextSummaryData;
  }

  /**
   * @description Check the status of menu tables This endpoint verifies if all required menu tables exist and contain data. Returns: Dict[str, Any]: Status of all menu tables
   * @tags dbtn/module:menu_tables
   * @name check_tables_status
   * @summary Check Tables Status
   * @request GET:/routes/menu-tables/check
   */
  export namespace check_tables_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckTablesStatusData;
  }

  /**
   * @description Set up the menu tables if they don't exist yet This function creates the necessary tables for the menu system if they don't exist yet. It's a non-destructive operation that only creates tables that are missing. Returns: MenuTablesResponse: Setup status and details
   * @tags dbtn/module:menu_tables
   * @name setup_menu_tables2
   * @summary Setup Menu Tables2
   * @request POST:/routes/menu-tables/setup
   */
  export namespace setup_menu_tables2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupMenuTables2Data;
  }

  /**
   * @description Test the SQL function execution from menu_tables module This endpoint tests if the SQL execution function is working correctly and provides diagnostics information. Returns: Dict[str, Any]: Test results and diagnostics
   * @tags dbtn/module:menu_tables
   * @name test_sql_function_menu_tables
   * @summary Test Sql Function Menu Tables
   * @request POST:/routes/menu-tables/test-sql-function
   */
  export namespace test_sql_function_menu_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestSqlFunctionMenuTablesData;
  }

  /**
   * @description Execute direct SQL migration to drop preparation_time columns. This uses a simple, reliable approach: 1. Execute raw DDL via Supabase execute_sql RPC 2. Use IF EXISTS to make it safe and idempotent 3. Return clear success/failure status No complex inspection - just drops the columns if they exist.
   * @tags dbtn/module:prep_time_migration
   * @name execute_simple_migration
   * @summary Execute Simple Migration
   * @request POST:/routes/prep-time-migration/execute-simple
   */
  export namespace execute_simple_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExecuteSimpleMigrationData;
  }

  /**
   * @description Verify that columns were successfully dropped by checking information_schema.
   * @tags dbtn/module:prep_time_migration
   * @name verify_simple_migration
   * @summary Verify Simple Migration
   * @request GET:/routes/prep-time-migration/verify-simple
   */
  export namespace verify_simple_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifySimpleMigrationData;
  }

  /**
   * @description Get all available customizations for menu items. This endpoint is used by the Admin Portal and other components.
   * @tags dbtn/module:menu_customizations
   * @name get_customizations
   * @summary Get Customizations
   * @request GET:/routes/get-customizations
   */
  export namespace get_customizations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomizationsData;
  }

  /**
   * @description Get customizations enabled for AI Voice Agent in a format optimized for voice interaction. Returns only customizations where ai_voice_agent = true.
   * @tags dbtn/module:menu_customizations
   * @name get_voice_agent_customizations
   * @summary Get Voice Agent Customizations
   * @request GET:/routes/voice-agent/customizations
   */
  export namespace get_voice_agent_customizations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetVoiceAgentCustomizationsData;
  }

  /**
   * @description Create a new customization (add-on or instruction). Used by Admin UI to add new customizations with toggle states.
   * @tags dbtn/module:menu_customizations
   * @name create_customization
   * @summary Create Customization
   * @request POST:/routes/create-customization
   */
  export namespace create_customization {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCustomizationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCustomizationData;
  }

  /**
   * @description Update an existing customization. Used by Admin UI to modify customizations and toggle states.
   * @tags dbtn/module:menu_customizations
   * @name update_customization
   * @summary Update Customization
   * @request PUT:/routes/update-customization/{customization_id}
   */
  export namespace update_customization {
    export type RequestParams = {
      /** Customization Id */
      customizationId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateCustomizationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCustomizationData;
  }

  /**
   * @description Delete a customization. Used by Admin UI to remove customizations.
   * @tags dbtn/module:menu_customizations
   * @name delete_customization
   * @summary Delete Customization
   * @request DELETE:/routes/delete-customization/{customization_id}
   */
  export namespace delete_customization {
    export type RequestParams = {
      /** Customization Id */
      customizationId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteCustomizationData;
  }

  /**
   * @description Create the cart_events table for analytics tracking. This is a one-time setup endpoint. Safe to run multiple times (checks if exists first).
   * @tags dbtn/module:setup_cart_analytics_table
   * @name setup_cart_analytics_table
   * @summary Setup Cart Analytics Table
   * @request POST:/routes/setup-cart-analytics-table
   */
  export namespace setup_cart_analytics_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupCartAnalyticsTableData;
  }

  /**
   * @description Check if cart_events table exists and is properly configured.
   * @tags dbtn/module:setup_cart_analytics_table
   * @name check_cart_analytics_table
   * @summary Check Cart Analytics Table
   * @request GET:/routes/check-cart-analytics-table
   */
  export namespace check_cart_analytics_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckCartAnalyticsTableData;
  }

  /**
   * @description Comprehensive diagnostic endpoint to verify menu data loading. Tests direct database access for categories and protein types.
   * @tags dbtn/module:menu_diagnostics
   * @name get_menu_data_status
   * @summary Get Menu Data Status
   * @request GET:/routes/menu-data-status
   */
  export namespace get_menu_data_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuDataStatusData;
  }

  /**
   * @description Creates proper parent category records for virtual section references. Scans existing categories for parent_category_id values starting with 'section-', creates actual parent records with those IDs, and ensures the hierarchy is valid. This is a one-time migration to fix the category hierarchy.
   * @tags dbtn/module:fix_category_sections
   * @name create_section_parent_records
   * @summary Create Section Parent Records
   * @request POST:/routes/create-section-parents
   */
  export namespace create_section_parent_records {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateSectionParentRecordsData;
  }

  /**
   * @description Get user's favorites enriched with full menu item and variant details
   * @tags dbtn/module:enriched_favorites
   * @name get_enriched_favorites
   * @summary Get Enriched Favorites
   * @request GET:/routes/get-enriched-favorites
   */
  export namespace get_enriched_favorites {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Customer Id */
      customer_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEnrichedFavoritesData;
  }

  /**
   * @description Serve menu data in format optimized for voice agent crawling This endpoint provides menu data in a natural language format that voice agents can crawl and index for responses. Returns: HTML formatted menu content for web crawling
   * @tags voice-agent, dbtn/module:menu_voice_agent_web
   * @name get_menu_for_voice_agent
   * @summary Get Menu For Voice Agent
   * @request GET:/routes/api/menu-for-voice-agent
   */
  export namespace get_menu_for_voice_agent {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuForVoiceAgentData;
  }

  /**
   * @description Serve menu data as plain text for voice agent crawling Alternative endpoint that returns pure text format for different crawling preferences.
   * @tags voice-agent, dbtn/module:menu_voice_agent_web
   * @name get_menu_for_voice_agent_text
   * @summary Get Menu For Voice Agent Text
   * @request GET:/routes/api/menu-for-voice-agent/text
   */
  export namespace get_menu_for_voice_agent_text {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuForVoiceAgentTextData;
  }

  /**
   * @description Serve menu data as direct HTML for voice agent corpus crawling Returns HTML content directly (not wrapped in JSON) for better compatibility with voice agent web crawling.
   * @tags voice-agent, dbtn/module:menu_voice_agent_web
   * @name get_menu_for_voice_agent_html
   * @summary Get Menu For Voice Agent Html
   * @request GET:/routes/api/menu-for-voice-agent/html
   */
  export namespace get_menu_for_voice_agent_html {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuForVoiceAgentHtmlData;
  }

  /**
   * @description Analyze current database state and generate migration plan. This is a DRY RUN - no changes are made to the database. Shows exactly what will change when migration is executed.
   * @tags dbtn/module:category_section_migration
   * @name analyze_category_migration
   * @summary Analyze Category Migration
   * @request POST:/routes/category-migration/analyze
   */
  export namespace analyze_category_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeCategoryMigrationData;
  }

  /**
   * @description Execute the category section migration. WARNING: This modifies the database. Run /analyze first to review the plan. Steps: 1. Create section parent records 2. Update category parent_category_id fields 3. Capture post-migration snapshot
   * @tags dbtn/module:category_section_migration
   * @name execute_category_migration
   * @summary Execute Category Migration
   * @request POST:/routes/category-migration/execute
   */
  export namespace execute_category_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExecuteCategoryMigrationData;
  }

  /**
   * @description Verify the migration was successful. Checks: - All 7 sections exist - All categories have valid parent_category_id - No orphaned categories - Proper section assignments
   * @tags dbtn/module:category_section_migration
   * @name verify_category_migration
   * @summary Verify Category Migration
   * @request POST:/routes/category-migration/verify
   */
  export namespace verify_category_migration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyCategoryMigrationData;
  }

  /**
   * @description Rollback the migration using a pre-migration snapshot. WARNING: This will restore the database to the pre-migration state. Args: snapshot_json: JSON string of CategorySnapshot list from analyze endpoint
   * @tags dbtn/module:category_section_migration
   * @name rollback_category_migration
   * @summary Rollback Category Migration
   * @request POST:/routes/category-migration/rollback
   */
  export namespace rollback_category_migration {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Snapshot Json */
      snapshot_json: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RollbackCategoryMigrationData;
  }

  /**
   * @description Force refresh menu cache endpoint. **PURPOSE:** After database migrations (e.g., restructuring category hierarchies), the frontend realtime store may have stale cached data. This endpoint triggers a timestamp update that forces the frontend to recognize the data as "changed" and reload from Supabase. **HOW IT WORKS:** The frontend realtime store watches for changes. By calling this endpoint, you signal that a manual refresh is needed. The frontend should: 1. Clear its categories cache 2. Re-fetch from Supabase 3. Rebuild computed hierarchies **WHEN TO USE:** - After running category restructure migrations - After bulk updates to menu_categories table - When frontend shows stale category structure
   * @tags dbtn/module:force_refresh_menu
   * @name force_refresh_menu
   * @summary Force Refresh Menu
   * @request POST:/routes/force-refresh-menu
   */
  export namespace force_refresh_menu {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ForceRefreshMenuData;
  }

  /**
   * @description Populate missing default variants for single menu items. This migration: 1. Finds all menu_items with 0 entries in item_variants 2. Creates a default "Regular" variant for each 3. Uses menu_item's base price (price_collection or price) 4. Sets is_default=true, is_active=true Returns: MigrationResult: Summary of migration with detailed results
   * @tags dbtn/module:database_migration
   * @name populate_missing_variants
   * @summary Populate Missing Variants
   * @request POST:/routes/populate-missing-variants
   */
  export namespace populate_missing_variants {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PopulateMissingVariantsData;
  }

  /**
   * @description Preview which items are missing variants without making changes. Returns: Summary of items that would be affected by the migration
   * @tags dbtn/module:database_migration
   * @name check_missing_variants
   * @summary Check Missing Variants
   * @request GET:/routes/check-missing-variants
   */
  export namespace check_missing_variants {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMissingVariantsData;
  }

  /**
   * @description Fix existing variants that have duplicate item names in their variant_name. Example: BEFORE: variant_name = "TANDOORI CHICKEN (starter) (Regular)" AFTER:  variant_name = "Regular" This fixes variants created by the initial (incorrect) migration.
   * @tags dbtn/module:database_migration
   * @name fix_duplicate_variant_names
   * @summary Fix Duplicate Variant Names
   * @request POST:/routes/fix-duplicate-variant-names
   */
  export namespace fix_duplicate_variant_names {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FixDuplicateVariantNamesData;
  }

  /**
   * @description Create a POS order directly in Supabase unified tables
   * @tags dbtn/module:pos_orders
   * @name create_pos_order
   * @summary Create Pos Order
   * @request POST:/routes/pos-orders/create-order
   */
  export namespace create_pos_order {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = POSOrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePosOrderData;
  }

  /**
   * @description Process template variables in template content
   * @tags dbtn/module:template_variables
   * @name process_template_variables
   * @summary Process Template Variables
   * @request POST:/routes/process_template_variables
   */
  export namespace process_template_variables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TemplateVariablesRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessTemplateVariablesData;
  }

  /**
   * @description Get all available template variables
   * @tags dbtn/module:template_variables
   * @name get_available_variables_endpoint
   * @summary Get Available Variables Endpoint
   * @request POST:/routes/get_available_variables
   */
  export namespace get_available_variables_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VariableListRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetAvailableVariablesEndpointData;
  }

  /**
   * @description Get sample order data for testing templates
   * @tags dbtn/module:template_variables
   * @name get_sample_order_data_endpoint
   * @summary Get Sample Order Data Endpoint
   * @request POST:/routes/get_sample_order_data
   */
  export namespace get_sample_order_data_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SampleDataRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetSampleOrderDataEndpointData;
  }

  /**
   * @description Process template with sample data based on order type
   * @tags dbtn/module:template_variables
   * @name process_template_with_sample
   * @summary Process Template With Sample
   * @request POST:/routes/process_template_with_sample
   */
  export namespace process_template_with_sample {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TemplateVariablesRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessTemplateWithSampleData;
  }

  /**
   * No description
   * @tags dbtn/module:order_management
   * @name store_order
   * @summary Store Order
   * @request POST:/routes/order-management/orders
   */
  export namespace store_order {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OrderModel;
    export type RequestHeaders = {};
    export type ResponseBody = StoreOrderData;
  }

  /**
   * @description Get orders from unified Supabase tables with filtering support
   * @tags dbtn/module:order_management
   * @name get_orders
   * @summary Get Orders
   * @request GET:/routes/order-management/orders
   */
  export namespace get_orders {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Page
       * Page number
       * @default 1
       */
      page?: number;
      /**
       * Page Size
       * Items per page
       * @default 20
       */
      page_size?: number;
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
      /** Order Type */
      order_type?: string | null;
      /** Order Source */
      order_source?: string | null;
      /** Payment Method */
      payment_method?: string | null;
      /** Status */
      status?: string | null;
      /** Table Number */
      table_number?: number | null;
      /** Search */
      search?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOrdersData;
  }

  /**
   * No description
   * @tags dbtn/module:order_management
   * @name get_reconciliation_summary
   * @summary Get Reconciliation Summary
   * @request GET:/routes/order-management/reconciliation
   */
  export namespace get_reconciliation_summary {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Start Date */
      start_date: string;
      /** End Date */
      end_date: string;
      /** Order Type */
      order_type?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetReconciliationSummaryData;
  }

  /**
   * No description
   * @tags dbtn/module:order_management
   * @name get_order_by_id
   * @summary Get Order By Id
   * @request GET:/routes/order-management/orders/{order_id}
   */
  export namespace get_order_by_id {
    export type RequestParams = {
      /** Order Id */
      orderId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOrderByIdData;
  }

  /**
   * No description
   * @tags dbtn/module:order_management
   * @name export_orders
   * @summary Export Orders
   * @request GET:/routes/order-management/export
   */
  export namespace export_orders {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
      /** Order Type */
      order_type?: string | null;
      /** Payment Method */
      payment_method?: string | null;
      /** Status */
      status?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExportOrdersData;
  }

  /**
   * No description
   * @tags dbtn/module:order_management
   * @name process_cash_payment
   * @summary Process Cash Payment
   * @request POST:/routes/order-management/cash-payment
   */
  export namespace process_cash_payment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CashPaymentRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessCashPaymentData;
  }

  /**
   * @description Get full order items for reordering. Handles both: - Legacy orders (items stored as JSONB in 'items' column) - New orders (items in 'order_items' table) Returns complete item data for reordering with proper variant names.
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_order_items
   * @summary Get Order Items
   * @request GET:/routes/customer-profile/get-order-items/{order_id}
   */
  export namespace get_order_items {
    export type RequestParams = {
      /** Order Id */
      orderId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOrderItemsData;
  }

  /**
   * @description POST version of get_customer_profile for JSON body requests (Ultravox compatibility). This endpoint accepts a JSON body with customer identifiers and returns the same data as the GET version. Designed for voice agents and webhooks.
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_customer_profile_post
   * @summary Get Customer Profile Post
   * @request POST:/routes/customer-profile/get-customer-profile
   */
  export namespace get_customer_profile_post {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CustomerLookupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerProfilePostData;
  }

  /**
   * @description Get customer profile by email, phone, customer_id, or reference number. This endpoint serves the voice agent's getCustomerProfile tool and other systems that need to lookup customer information. Args: comprehensive: If True, includes addresses, orders, and favorites for voice agent personalization
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_customer_profile
   * @summary Get Customer Profile
   * @request GET:/routes/customer-profile/get-customer-profile
   */
  export namespace get_customer_profile {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Email */
      email?: string | null;
      /** Phone */
      phone?: string | null;
      /** Customer Id */
      customer_id?: string | null;
      /** Customer Reference */
      customer_reference?: string | null;
      /** Customer Reference Number */
      customer_reference_number?: string | null;
      /**
       * Comprehensive
       * @default true
       */
      comprehensive?: boolean | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerProfileData;
  }

  /**
   * @description Get user order history. This endpoint serves the CustomerPortal and other systems that need to display customer order history.
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name get_user_orders
   * @summary Get User Orders
   * @request GET:/routes/customer-profile/get-user-orders
   */
  export namespace get_user_orders {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Userid */
      userId?: string | null;
      /** User Id */
      user_id?: string | null;
      /** Email */
      email?: string | null;
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserOrdersData;
  }

  /**
   * @description Flexible customer lookup endpoint for various use cases. Accepts multiple identifier types and returns customer profile if found.
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name lookup_customer
   * @summary Lookup Customer
   * @request POST:/routes/customer-profile/lookup-customer
   */
  export namespace lookup_customer {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CustomerLookupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = LookupCustomerData;
  }

  /**
   * @description Health check endpoint for customer profile API
   * @tags customer-profile, dbtn/module:customer_profile_api
   * @name customer_profile_health
   * @summary Customer Profile Health
   * @request GET:/routes/customer-profile/health
   */
  export namespace customer_profile_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CustomerProfileHealthData;
  }

  /**
   * @description Create a new user receipt template Stores the template in Supabase with RLS protection. Only the creating user can access this template. Args: request: Template creation request with user_id, name, description, design_data Returns: Created template with generated ID and timestamps
   * @tags dbtn/module:receipt_templates
   * @name create_receipt_template
   * @summary Create Receipt Template
   * @request POST:/routes/receipt-templates
   */
  export namespace create_receipt_template {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TemplateCreateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateReceiptTemplateData;
  }

  /**
   * @description List all receipt templates for a user Returns only templates created by the specified user. RLS policies ensure users can only see their own templates. Args: user_id: User ID to filter templates Returns: List of user's templates wrapped in success response
   * @tags dbtn/module:receipt_templates
   * @name list_receipt_templates
   * @summary List Receipt Templates
   * @request GET:/routes/receipt-templates
   */
  export namespace list_receipt_templates {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListReceiptTemplatesData;
  }

  /**
   * @description Get a specific receipt template by ID or name Validates that the requesting user owns the template. Supports both UUID lookup and name-based lookup for backward compatibility. Args: template_id: Template ID (UUID) or template name user_id: User ID for permission check Returns: Template data wrapped in success response
   * @tags dbtn/module:receipt_templates
   * @name get_receipt_template
   * @summary Get Receipt Template
   * @request GET:/routes/receipt-templates/{template_id}
   */
  export namespace get_receipt_template {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetReceiptTemplateData;
  }

  /**
   * @description Update an existing receipt template Validates user ownership before allowing updates. Only updates fields that are provided in the request. Args: template_id: Template ID to update request: Update request with optional name, description, design_data Returns: Updated template data
   * @tags dbtn/module:receipt_templates
   * @name update_receipt_template
   * @summary Update Receipt Template
   * @request PUT:/routes/receipt-templates/{template_id}
   */
  export namespace update_receipt_template {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = TemplateUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateReceiptTemplateData;
  }

  /**
   * @description Delete a receipt template Also cleans up: - Stored preview HTML/images - Order mode assignments in POS settings Args: template_id: Template ID to delete request: Delete request with user_id for permission check Returns: Success message with cleanup details
   * @tags dbtn/module:receipt_templates
   * @name delete_receipt_template
   * @summary Delete Receipt Template
   * @request DELETE:/routes/receipt-templates/{template_id}
   */
  export namespace delete_receipt_template {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = TemplateDeleteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteReceiptTemplateData;
  }

  /**
   * @description Get all template assignments for order modes
   * @tags dbtn/module:template_assignments
   * @name get_template_assignments
   * @summary Get Template Assignments
   * @request GET:/routes/template-assignments
   */
  export namespace get_template_assignments {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTemplateAssignmentsData;
  }

  /**
   * @description Set template assignment for an order mode
   * @tags dbtn/module:template_assignments
   * @name set_template_assignment
   * @summary Set Template Assignment
   * @request POST:/routes/template-assignments
   */
  export namespace set_template_assignment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SetTemplateAssignmentRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetTemplateAssignmentData;
  }

  /**
   * @description Get template assignment for a specific order mode
   * @tags dbtn/module:template_assignments
   * @name get_template_assignment
   * @summary Get Template Assignment
   * @request GET:/routes/template-assignments/{order_mode}
   */
  export namespace get_template_assignment {
    export type RequestParams = {
      /** Order Mode */
      orderMode: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTemplateAssignmentData;
  }

  /**
   * @description Reset template assignment for an order mode to default
   * @tags dbtn/module:template_assignments
   * @name reset_template_assignment
   * @summary Reset Template Assignment
   * @request DELETE:/routes/template-assignments/{order_mode}
   */
  export namespace reset_template_assignment {
    export type RequestParams = {
      /** Order Mode */
      orderMode: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResetTemplateAssignmentData;
  }

  /**
   * @description Initialize all template assignments with default values
   * @tags dbtn/module:template_assignments
   * @name initialize_default_assignments
   * @summary Initialize Default Assignments
   * @request POST:/routes/template-assignments/initialize-defaults
   */
  export namespace initialize_default_assignments {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeDefaultAssignmentsData;
  }

  /**
   * @description Add hierarchical columns to media_assets table: - asset_category: Classification (menu-item, ai-avatar, marketing, gallery, general) - menu_section_id: FK to parent section category - menu_category_id: FK to menu category - usage_context: JSONB for flexible metadata This is a SAFE, IDEMPOTENT operation using SupabaseManager.
   * @tags dbtn/module:media_hierarchical_migration
   * @name add_hierarchical_columns
   * @summary Add Hierarchical Columns
   * @request POST:/routes/media-migration/add-hierarchical-columns
   */
  export namespace add_hierarchical_columns {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddHierarchicalColumnsData;
  }

  /**
   * @description Backfill existing menu item images with hierarchical metadata: - Set asset_category = 'menu-item' - Populate menu_category_id from linked menu items - Populate menu_section_id from category's parent - Set bucket_name appropriately
   * @tags dbtn/module:media_hierarchical_migration
   * @name backfill_menu_images
   * @summary Backfill Menu Images
   * @request POST:/routes/media-migration/backfill-menu-images
   */
  export namespace backfill_menu_images {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BackfillMenuImagesData;
  }

  /**
   * @description Backfill AI agent avatars: - Find assets tagged as 'avatar' or in usage field - Set asset_category = 'ai-avatar' - Set bucket_name = 'avatars' - Populate usage_context with agent details
   * @tags dbtn/module:media_hierarchical_migration
   * @name backfill_ai_avatars
   * @summary Backfill Ai Avatars
   * @request POST:/routes/media-migration/backfill-ai-avatars
   */
  export namespace backfill_ai_avatars {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BackfillAiAvatarsData;
  }

  /**
   * @description Execute complete migration workflow: 1. Add hierarchical columns to schema 2. Backfill menu item images 3. Backfill AI avatar images 4. Generate comprehensive report
   * @tags dbtn/module:media_hierarchical_migration
   * @name run_full_migration
   * @summary Run Full Migration
   * @request POST:/routes/media-migration/run-full-migration
   */
  export namespace run_full_migration {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RunFullMigrationData;
  }

  /**
   * @description Verify that hierarchical columns exist and are properly configured
   * @tags dbtn/module:media_hierarchical_migration
   * @name verify_schema
   * @summary Verify Schema
   * @request GET:/routes/media-migration/verify-schema
   */
  export namespace verify_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifySchemaData;
  }

  /**
   * @description Add optimization-related columns to media_assets table: - Variant URLs (square, widescreen, thumbnail × WebP/JPEG) - Size metrics (original, optimized, compression ratio) Args: dry_run: If True, validates SQL without executing Returns: SchemaUpdateResponse with migration details
   * @tags dbtn/module:media_assets_optimizer_schema
   * @name add_optimization_columns
   * @summary Add Optimization Columns
   * @request POST:/routes/media-assets/add-optimization-columns
   */
  export namespace add_optimization_columns {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddOptimizationColumnsData;
  }

  /**
   * @description Check if optimization columns exist in media_assets table. Returns: SchemaUpdateResponse indicating which columns exist
   * @tags dbtn/module:media_assets_optimizer_schema
   * @name check_optimization_columns
   * @summary Check Optimization Columns
   * @request GET:/routes/media-assets/check-optimization-columns
   */
  export namespace check_optimization_columns {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckOptimizationColumnsData;
  }

  /**
   * @description Create database trigger to auto-create customer records. Creates: 1. Postgres function: create_customer_on_auth_signup() 2. Trigger: on_auth_user_created (fires on auth.users INSERT) This ensures atomic customer record creation for ALL signup methods.
   * @tags dbtn/module:auth_sync
   * @name setup_trigger
   * @summary Setup Trigger
   * @request POST:/routes/setup-trigger
   */
  export namespace setup_trigger {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupTriggerData;
  }

  /**
   * @description Migrate existing auth users to customers table. Finds all auth.users who don't have a customer record and creates them. Safe to run multiple times (idempotent).
   * @tags dbtn/module:auth_sync
   * @name backfill_customers
   * @summary Backfill Customers
   * @request POST:/routes/backfill-customers
   */
  export namespace backfill_customers {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BackfillCustomersData;
  }

  /**
   * @description Check trigger status and identify unsynced auth users. Returns: - Whether trigger and function exist - Count of auth users vs customers - List of unsynced users (email + id)
   * @tags dbtn/module:auth_sync
   * @name check_status
   * @summary Check Status
   * @request GET:/routes/auth-sync-status
   */
  export namespace check_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckStatusData;
  }

  /**
   * @description Health check endpoint
   * @tags dbtn/module:auth_sync
   * @name auth_sync_health_check
   * @summary Auth Sync Health Check
   * @request GET:/routes/auth-sync-health
   */
  export namespace auth_sync_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AuthSyncHealthCheckData;
  }

  /**
   * @description Health check endpoint for thermal printer system Converted from cottage-tandoori-simple-printer /health endpoint
   * @tags dbtn/module:thermal_printer
   * @name check_printer_health
   * @summary Check Printer Health
   * @request GET:/routes/thermal-printer/health
   */
  export namespace check_printer_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckPrinterHealthData;
  }

  /**
   * @description Get detailed printer capabilities Converted from cottage-tandoori-simple-printer /capabilities endpoint
   * @tags dbtn/module:thermal_printer
   * @name get_printer_capabilities
   * @summary Get Printer Capabilities
   * @request GET:/routes/capabilities
   */
  export namespace get_printer_capabilities {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPrinterCapabilitiesData;
  }

  /**
   * @description Enhanced template-based printing endpoint Converted from cottage-tandoori-simple-printer /print/template endpoint
   * @tags dbtn/module:thermal_printer
   * @name print_rich_template
   * @summary Print Rich Template
   * @request POST:/routes/print/template
   */
  export namespace print_rich_template {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PrintTemplateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PrintRichTemplateData;
  }

  /**
   * @description Print kitchen ticket with Supabase order integration Supports all four POS order modes with station-specific variants DUAL-MODE ARCHITECTURE: - Electron Mode: Routes to localhost:3000 printer service - Web Mode: Uses thermal_printer_engine (existing behavior) TEMPLATE ASSIGNMENT: - Automatically queries template_assignments by order mode - Uses kitchen_template_id for kitchen tickets - Manual override via template_data still supported - Falls back to default template if no assignment
   * @tags dbtn/module:thermal_printer
   * @name print_kitchen_ticket
   * @summary Print Kitchen Ticket
   * @request POST:/routes/print/kitchen-ticket
   */
  export namespace print_kitchen_ticket {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = KitchenTicketRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PrintKitchenTicketData;
  }

  /**
   * @description Print customer receipt with Supabase order integration Supports all four POS order modes with order tracking DUAL-MODE ARCHITECTURE: - Electron Mode: Routes to localhost:3000 printer service - Web Mode: Uses thermal_printer_engine (existing behavior) TEMPLATE ASSIGNMENT: - Automatically queries template_assignments by order mode - Uses customer_template_id for FOH receipts - Manual override via template_data still supported - Falls back to default template if no assignment
   * @tags dbtn/module:thermal_printer
   * @name print_customer_receipt
   * @summary Print Customer Receipt
   * @request POST:/routes/print/customer-receipt
   */
  export namespace print_customer_receipt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CustomerReceiptRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PrintCustomerReceiptData;
  }

  /**
   * @description Print both kitchen ticket and customer receipt atomically Designed for POSDesktop printing architecture standardization DUAL-MODE ARCHITECTURE: - Electron Mode: Routes to localhost:3000 printer service - Web Mode: Uses thermal_printer_engine (existing behavior)
   * @tags dbtn/module:thermal_printer
   * @name print_kitchen_and_customer
   * @summary Print Kitchen And Customer
   * @request POST:/routes/print/kitchen-and-customer
   */
  export namespace print_kitchen_and_customer {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = KitchenAndCustomerRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PrintKitchenAndCustomerData;
  }

  /**
   * @description Test print endpoint for thermal printer engine Converted from cottage-tandoori-simple-printer /print/test endpoint
   * @tags dbtn/module:thermal_printer
   * @name thermal_test_print
   * @summary Thermal Test Print
   * @request POST:/routes/print/test
   */
  export namespace thermal_test_print {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ThermalTestPrintData;
  }

  /**
   * @description View all menu items that have variants to test the complete flow
   * @tags dbtn/module:variants_view
   * @name view_menu_items_with_variants
   * @summary View Menu Items With Variants
   * @request GET:/routes/view-menu-items-with-variants
   */
  export namespace view_menu_items_with_variants {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ViewMenuItemsWithVariantsData;
  }

  /**
   * @description Test endpoint to check how many media assets need variant generation. This is a safe read-only check that doesn't modify anything. Args: limit: Number of sample assets to return (default: 10) Returns: DryRunResult with count and sample of assets needing variants
   * @tags dbtn/module:test_batch_variants
   * @name test_batch_variants_dry_run
   * @summary Test Batch Variants Dry Run
   * @request GET:/routes/test-batch-variants/dry-run
   */
  export namespace test_batch_variants_dry_run {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 10
       */
      limit?: number | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestBatchVariantsDryRunData;
  }

  /**
   * @description Internal trigger to run batch variant generation. This endpoint directly executes the generation logic. Args: limit: Optional limit on number of assets to process dry_run: If True, only check what would be processed Returns: Generation results
   * @tags dbtn/module:test_batch_variants
   * @name run_batch_generation
   * @summary Run Batch Generation
   * @request POST:/routes/test-batch-variants/run-generation
   */
  export namespace run_batch_generation {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Limit */
      limit?: number | null;
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RunBatchGenerationData;
  }

  /**
   * @description Create the variant_name auto-generation trigger and function. This trigger automatically generates variant_name in the format: "[PROTEIN_NAME] [ITEM_NAME]" (e.g., "CHICKEN Tikka Masala") FOR BOSS🫡: This fixes the blocker in MYA-1438 where variant_name was NULL causing NOT NULL constraint violations.
   * @tags dbtn/module:variant_trigger_fix
   * @name create_variant_name_trigger
   * @summary Create Variant Name Trigger
   * @request POST:/routes/create-variant-name-trigger
   */
  export namespace create_variant_name_trigger {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateVariantNameTriggerData;
  }

  /**
   * @description Complete setup for variant_name auto-generation. Steps: 1. Add variant_name column to menu_item_variants 2. Create trigger function generate_variant_name() 3. Install BEFORE INSERT OR UPDATE trigger 4. Backfill existing variants Returns: SetupResponse with success status and completed steps
   * @tags dbtn/module:variant_name_trigger_setup
   * @name setup_variant_name_trigger
   * @summary Setup Variant Name Trigger
   * @request POST:/routes/variant-name-trigger/setup-complete
   */
  export namespace setup_variant_name_trigger {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupVariantNameTriggerData;
  }

  /**
   * @description Backfill variant_name for all existing variants in the database. This triggers the generate_variant_name() function for all existing records by performing a dummy UPDATE on each row. Returns: BackfillResponse with count of updated variants
   * @tags dbtn/module:variant_name_trigger_setup
   * @name backfill_existing_variants
   * @summary Backfill Existing Variants
   * @request POST:/routes/variant-name-trigger/backfill-existing-variants
   */
  export namespace backfill_existing_variants {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BackfillExistingVariantsData;
  }

  /**
   * @description Verify that the variant_name trigger is properly installed. Checks: 1. variant_name column exists 2. generate_variant_name() function exists 3. set_variant_name_trigger trigger exists 4. Sample variant has variant_name populated Returns: Status of all verification checks
   * @tags dbtn/module:variant_name_trigger_setup
   * @name verify_trigger_setup
   * @summary Verify Trigger Setup
   * @request GET:/routes/variant-name-trigger/verify-setup
   */
  export namespace verify_trigger_setup {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyTriggerSetupData;
  }

  /**
   * @description Add name_pattern column to menu_item_variants table. This enables the variant name pattern cycling feature: - SUFFIX: "Base Name - Protein" (default) - PREFIX: "Protein Base Name" - INFIX: "First Word Protein Remaining Words" - CUSTOM: User's manual input (locked from auto-regeneration)
   * @tags dbtn/module:variant_name_pattern_schema
   * @name setup_variant_name_pattern_schema
   * @summary Setup Variant Name Pattern Schema
   * @request POST:/routes/setup-variant-name-pattern-schema
   */
  export namespace setup_variant_name_pattern_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupVariantNamePatternSchemaData;
  }

  /**
   * @description Check if name_pattern column exists in menu_item_variants table.
   * @tags dbtn/module:variant_name_pattern_schema
   * @name check_variant_name_pattern_schema
   * @summary Check Variant Name Pattern Schema
   * @request GET:/routes/check-variant-name-pattern-schema
   */
  export namespace check_variant_name_pattern_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckVariantNamePatternSchemaData;
  }

  /**
   * @description Get the complete menu corpus for voice AI agent integration This endpoint returns the complete menu corpus data formatted specifically for AI voice agent platforms. It includes all the fields needed for natural language processing of menu-related queries. Security: Requires authentication with voice AI API key as Bearer token Returns: MenuCorpusResponse: The complete menu corpus with metadata
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name get_menu_corpus
   * @summary Get Menu Corpus
   * @request GET:/routes/menu-corpus
   */
  export namespace get_menu_corpus {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetMenuCorpusData;
  }

  /**
   * @description Sync menu corpus data for voice AI agent This endpoint forces a refresh of the menu corpus data and returns the updated corpus. This is useful when menu items have been updated and you want to ensure the voice agent has the latest information. Args: force: Whether to force a refresh of the menu data Security: Requires authentication with voice AI API key as Bearer token Returns: MenuCorpusResponse: The updated menu corpus with metadata
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name sync_menu_corpus
   * @summary Sync Menu Corpus
   * @request POST:/routes/menu-corpus/sync
   */
  export namespace sync_menu_corpus {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Force
       * Force refresh of menu data
       * @default false
       */
      force?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = SyncMenuCorpusData;
  }

  /**
   * @description Debug endpoint for voice AI agents - no authentication required This endpoint returns a simplified menu structure for debugging voice AI integrations without authentication requirements. Returns: Dict[str, Any]: Simplified menu data for debugging
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name get_menu_corpus_debug
   * @summary Get Menu Corpus Debug
   * @request GET:/routes/menu-corpus/debug
   */
  export namespace get_menu_corpus_debug {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuCorpusDebugData;
  }

  /**
   * @description Check the health of the menu corpus system This endpoint verifies if the menu corpus system is working correctly by: 1. Testing database connectivity 2. Checking menu data extraction 3. Verifying authentication is working Security: Requires authentication with voice AI API key as Bearer token Returns: Dict[str, Any]: Health check status and diagnostics
   * @tags menu-corpus, dbtn/module:menu_corpus
   * @name get_menu_corpus_health
   * @summary Get Menu Corpus Health
   * @request GET:/routes/menu-corpus/health
   */
  export namespace get_menu_corpus_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetMenuCorpusHealthData;
  }

  /**
   * @description Add published_at field to menu_items table for draft/live publishing
   * @tags menu-publish, dbtn/module:menu_corpus
   * @name setup_publish_schema
   * @summary Setup Publish Schema
   * @request POST:/routes/setup-publish-schema
   */
  export namespace setup_publish_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupPublishSchemaData;
  }

  /**
   * @description Publish draft menu items to live status This endpoint: 1. Sets published_at = NOW() on all active draft items (published_at IS NULL) 2. Syncs only published items to menu corpus 3. Publishes menu to AI Knowledge Corpus (NEW) 4. Syncs customizations configuration to POS, Online Orders, and Voice Agent 5. Makes changes visible to POS and online menu systems 6. Auto-invalidates menu cache to ensure fresh data Returns: PublishMenuResponse: Status of the publish operation with draft/live counts
   * @tags menu-publish, dbtn/module:menu_corpus
   * @name publish_menu
   * @summary Publish Menu
   * @request POST:/routes/publish-menu
   */
  export namespace publish_menu {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PublishMenuData;
  }

  /**
   * @description Get detailed menu status including draft vs published item counts Provides comprehensive status information for the draft/live publishing system including corpus accessibility and item counts broken down by status. Returns: MenuStatusResponse: Current status with draft/published breakdowns
   * @tags menu-publish, dbtn/module:menu_corpus
   * @name get_menu_status
   * @summary Get Menu Status
   * @request GET:/routes/menu-status
   */
  export namespace get_menu_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuStatusData;
  }

  /**
   * @description Set up the complete infrastructure for profile images
   * @tags dbtn/module:profile_images
   * @name setup_profile_images_infrastructure
   * @summary Setup Profile Images Infrastructure
   * @request POST:/routes/setup-profile-images-infrastructure
   */
  export namespace setup_profile_images_infrastructure {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupProfileImagesInfrastructureData;
  }

  /**
   * @description Upload and process a profile image for a user with WebP optimization
   * @tags dbtn/module:profile_images
   * @name upload_profile_image
   * @summary Upload Profile Image
   * @request POST:/routes/upload-profile-image
   */
  export namespace upload_profile_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadProfileImage;
    export type RequestHeaders = {};
    export type ResponseBody = UploadProfileImageData;
  }

  /**
   * @description Sync Google profile image for a user
   * @tags dbtn/module:profile_images
   * @name sync_google_profile_image
   * @summary Sync Google Profile Image
   * @request POST:/routes/sync-google-profile-image
   */
  export namespace sync_google_profile_image {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
      /** Google Image Url */
      google_image_url?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncGoogleProfileImageData;
  }

  /**
   * @description Delete a user's profile image
   * @tags dbtn/module:profile_images
   * @name delete_profile_image
   * @summary Delete Profile Image
   * @request DELETE:/routes/delete-profile-image
   */
  export namespace delete_profile_image {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteProfileImageData;
  }

  /**
   * @description Get current profile image URL for a user
   * @tags dbtn/module:profile_images
   * @name get_profile_image
   * @summary Get Profile Image
   * @request GET:/routes/get-profile-image/{user_id}
   */
  export namespace get_profile_image {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProfileImageData;
  }

  /**
   * @description Upload avatar photo for the primary agent and persist URL with WebP optimization. - Validates file type (jpg, png, webp) - Validates file size (max 2MB) - Generates optimized WebP + JPEG variants (standard 400x400 + thumbnail 100x100) - Uploads to Supabase Storage bucket 'agent-avatars' - Updates unified_agent_config.agent_avatar_url - Also ensures voice_agent_profiles.avatar_url column exists and updates the default agent if present - Returns public URL
   * @tags dbtn/module:primary_agent_config
   * @name upload_primary_agent_avatar
   * @summary Upload Primary Agent Avatar
   * @request POST:/routes/primary-agent-config/avatar
   */
  export namespace upload_primary_agent_avatar {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadPrimaryAgentAvatar;
    export type RequestHeaders = {};
    export type ResponseBody = UploadPrimaryAgentAvatarData;
  }

  /**
   * @description Validate that media asset IDs exist in the media_assets table. This endpoint is used for pre-submission validation to prevent foreign key violations when creating or updating menu items with media references. Returns: - List of validation results for each asset ID - Overall validation status - Friendly names for valid assets
   * @tags dbtn/module:media_assets_validation
   * @name validate_media_assets
   * @summary Validate Media Assets
   * @request POST:/routes/validate-media-assets
   */
  export namespace validate_media_assets {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidateAssetsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateMediaAssetsData;
  }

  /**
   * @description Check if a media asset is currently being used by any menu items. This is used for cascade protection before deletion. Returns: - is_linked: Whether the asset is referenced by any menu items - usage_count: Number of menu items using this asset - menu_items: List of menu items using this asset
   * @tags dbtn/module:media_assets_validation
   * @name check_media_asset_usage
   * @summary Check Media Asset Usage
   * @request POST:/routes/check-media-asset-usage
   */
  export namespace check_media_asset_usage {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Asset Id */
      asset_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckMediaAssetUsageData;
  }

  /**
   * @description Upload and optimize menu item image. Process: 1. Validate file type and size 2. Optimize and compress image 3. Generate thumbnail 4. Upload to Supabase Storage 5. Create media_assets record 6. Return asset_id and URLs Sensible Defaults: - Max upload: 5MB - Target size: 500KB for full image, 50KB for thumbnail - Dimensions: 800x600 full, 200x150 thumbnail - Format: WebP for maximum compression
   * @tags dbtn/module:menu_image_upload
   * @name upload_menu_item_image
   * @summary Upload Menu Item Image
   * @request POST:/routes/menu-image-upload/upload
   */
  export namespace upload_menu_item_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadMenuItemImage;
    export type RequestHeaders = {};
    export type ResponseBody = UploadMenuItemImageData;
  }

  /**
   * @description Health check endpoint
   * @tags dbtn/module:menu_image_upload
   * @name menu_image_upload_health
   * @summary Menu Image Upload Health
   * @request GET:/routes/menu-image-upload/health
   */
  export namespace menu_image_upload_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MenuImageUploadHealthData;
  }

  /**
   * @description Upload menu item image with WebP optimization and variant generation
   * @tags dbtn/module:unified_media_storage
   * @name upload_menu_image
   * @summary Upload Menu Image
   * @request POST:/routes/unified-media/upload/menu-image
   */
  export namespace upload_menu_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadMenuImage;
    export type RequestHeaders = {};
    export type ResponseBody = UploadMenuImageData;
  }

  /**
   * @description Upload avatar image with WebP optimization (Infrastructure Layer - no agent linking)
   * @tags dbtn/module:unified_media_storage
   * @name upload_avatar
   * @summary Upload Avatar
   * @request POST:/routes/unified-media/upload/avatar
   */
  export namespace upload_avatar {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadAvatar;
    export type RequestHeaders = {};
    export type ResponseBody = UploadAvatarData;
  }

  /**
   * @description Upload general file to storage with asset categorization and WebP optimization for images
   * @tags dbtn/module:unified_media_storage
   * @name upload_general_file
   * @summary Upload General File
   * @request POST:/routes/unified-media/upload/general
   */
  export namespace upload_general_file {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadGeneralFile;
    export type RequestHeaders = {};
    export type ResponseBody = UploadGeneralFileData;
  }

  /**
   * @description Get media library with filtering and pagination
   * @tags dbtn/module:unified_media_storage
   * @name get_media_library
   * @summary Get Media Library
   * @request GET:/routes/unified-media/library/list
   */
  export namespace get_media_library {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Category */
      category?: string | null;
      /** Subcategory */
      subcategory?: string | null;
      /** Tags */
      tags?: string | null;
      /**
       * Page
       * @default 1
       */
      page?: number;
      /**
       * Page Size
       * @default 20
       */
      page_size?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMediaLibraryData;
  }

  /**
   * @description Get recently uploaded media assets
   * @tags dbtn/module:unified_media_storage
   * @name get_recent_media_assets
   * @summary Get Recent Media Assets
   * @request GET:/routes/unified-media/library/recent
   */
  export namespace get_recent_media_assets {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 10
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRecentMediaAssetsData;
  }

  /**
   * @description Get specific media asset details
   * @tags dbtn/module:unified_media_storage
   * @name get_media_asset
   * @summary Get Media Asset
   * @request GET:/routes/unified-media/asset/{asset_id}
   */
  export namespace get_media_asset {
    export type RequestParams = {
      /** Asset Id */
      assetId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMediaAssetData;
  }

  /**
   * @description Update media asset metadata
   * @tags dbtn/module:unified_media_storage
   * @name update_media_asset
   * @summary Update Media Asset
   * @request PUT:/routes/unified-media/asset/{asset_id}
   */
  export namespace update_media_asset {
    export type RequestParams = {
      /** Asset Id */
      assetId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateMediaAssetPayload;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateMediaAssetData;
  }

  /**
   * @description Delete media asset and its files
   * @tags dbtn/module:unified_media_storage
   * @name delete_media_asset
   * @summary Delete Media Asset
   * @request DELETE:/routes/unified-media/asset/{asset_id}
   */
  export namespace delete_media_asset {
    export type RequestParams = {
      /** Asset Id */
      assetId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteMediaAssetData;
  }

  /**
   * @description Link media asset to menu item and auto-sync hierarchical metadata
   * @tags dbtn/module:unified_media_storage
   * @name link_media_to_menu_item
   * @summary Link Media To Menu Item
   * @request POST:/routes/unified-media/link/menu-item
   */
  export namespace link_media_to_menu_item {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MediaLinkRequest;
    export type RequestHeaders = {};
    export type ResponseBody = LinkMediaToMenuItemData;
  }

  /**
   * @description Remove media link
   * @tags dbtn/module:unified_media_storage
   * @name unlink_media
   * @summary Unlink Media
   * @request DELETE:/routes/unified-media/link/{link_id}
   */
  export namespace unlink_media {
    export type RequestParams = {
      /** Link Id */
      linkId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UnlinkMediaData;
  }

  /**
   * @description Bulk update tags for multiple media assets
   * @tags dbtn/module:unified_media_storage
   * @name bulk_update_media_tags
   * @summary Bulk Update Media Tags
   * @request POST:/routes/unified-media/bulk/update-tags
   */
  export namespace bulk_update_media_tags {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MediaBulkUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkUpdateMediaTagsData;
  }

  /**
   * @description Get storage system status and usage
   * @tags dbtn/module:unified_media_storage
   * @name get_storage_status
   * @summary Get Storage Status
   * @request GET:/routes/unified-media/storage/status
   */
  export namespace get_storage_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStorageStatusData;
  }

  /**
   * @description Clean up orphaned media files (assets without links)
   * @tags dbtn/module:unified_media_storage
   * @name cleanup_orphaned_media
   * @summary Cleanup Orphaned Media
   * @request POST:/routes/unified-media/storage/cleanup-orphaned
   */
  export namespace cleanup_orphaned_media {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CleanupOrphanedMediaData;
  }

  /**
   * @description Get media usage analytics
   * @tags dbtn/module:unified_media_storage
   * @name get_media_usage_summary
   * @summary Get Media Usage Summary
   * @request GET:/routes/unified-media/usage/summary
   */
  export namespace get_media_usage_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMediaUsageSummaryData;
  }

  /**
   * @description Set up the required 'media_assets' and 'media_links' tables in Supabase. This endpoint is idempotent and can be safely run multiple times.
   * @tags dbtn/module:unified_media_storage
   * @name setup_unified_media_schema
   * @summary Setup Unified Media Schema
   * @request POST:/routes/unified-media/storage/setup-schema
   */
  export namespace setup_unified_media_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupUnifiedMediaSchemaData;
  }

  /**
   * @description Check avatar count against 8-avatar limit (Business Logic Layer)
   * @tags dbtn/module:unified_media_storage
   * @name validate_avatar_limit
   * @summary Validate Avatar Limit
   * @request GET:/routes/unified-media/avatars/validate-limit
   */
  export namespace validate_avatar_limit {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateAvatarLimitData;
  }

  /**
   * @description Get media library organized by hierarchy. Returns: - Menu images: nested by section → category - Menu orphans: menu items without section/category - AI avatars: all avatar images - AI avatar orphans: avatars not linked to agents - General media: other assets
   * @tags dbtn/module:media_library_hierarchical
   * @name get_hierarchical_media
   * @summary Get Hierarchical Media
   * @request GET:/routes/hierarchical
   */
  export namespace get_hierarchical_media {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHierarchicalMediaData;
  }

  /**
   * @description Get quick statistics about media organization.
   * @tags dbtn/module:media_library_hierarchical
   * @name get_hierarchical_stats
   * @summary Get Hierarchical Stats
   * @request GET:/routes/hierarchical/stats
   */
  export namespace get_hierarchical_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHierarchicalStatsData;
  }

  /**
   * @description Import avatar files from Supabase storage into media_assets table. Scans the 'avatars/avatars/' folder and creates media_assets records. Returns: Summary of import operation including count of avatars imported.
   * @tags dbtn/module:media_library_hierarchical
   * @name import_avatars_from_storage
   * @summary Import Avatars From Storage
   * @request POST:/routes/import-avatars-from-storage
   */
  export namespace import_avatars_from_storage {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ImportAvatarsFromStorageData;
  }

  /**
   * @description Initialize the POS settings table
   * @tags dbtn/module:pos_settings
   * @name init_pos_settings
   * @summary Init Pos Settings
   * @request POST:/routes/pos-settings/init
   */
  export namespace init_pos_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitPosSettingsData;
  }

  /**
   * @description Get POS settings
   * @tags dbtn/module:pos_settings
   * @name get_pos_settings
   * @summary Get Pos Settings
   * @request GET:/routes/pos-settings
   */
  export namespace get_pos_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPosSettingsData;
  }

  /**
   * @description Save POS settings
   * @tags dbtn/module:pos_settings
   * @name save_pos_settings
   * @summary Save Pos Settings
   * @request POST:/routes/pos-settings
   */
  export namespace save_pos_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SavePOSSettingsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SavePosSettingsData;
  }

  /**
   * @description Get diagnostic information about the POS settings table
   * @tags dbtn/module:pos_settings
   * @name pos_settings_diagnostics
   * @summary Pos Settings Diagnostics
   * @request GET:/routes/pos-settings/diagnostics
   */
  export namespace pos_settings_diagnostics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PosSettingsDiagnosticsData;
  }

  /**
   * @description Add food-specific detail columns to menu_item_variants table. Adds: spice_level, allergens, allergen_notes
   * @tags dbtn/module:variant_food_details_schema
   * @name setup_variant_food_details_schema
   * @summary Setup Variant Food Details Schema
   * @request POST:/routes/setup-variant-food-details-schema
   */
  export namespace setup_variant_food_details_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SetupVariantFoodDetailsSchemaData;
  }

  /**
   * @description Check if food-specific detail columns exist in menu_item_variants table.
   * @tags dbtn/module:variant_food_details_schema
   * @name check_variant_food_details_schema
   * @summary Check Variant Food Details Schema
   * @request GET:/routes/check-variant-food-details-schema
   */
  export namespace check_variant_food_details_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckVariantFoodDetailsSchemaData;
  }

  /**
   * @description Get all menu items with variants and categories
   * @tags dbtn/module:unified_menu_operations
   * @name get_menu_items
   * @summary Get Menu Items
   * @request GET:/routes/unified-menu/items
   */
  export namespace get_menu_items {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuItemsData;
  }

  /**
   * @description Create a new menu item
   * @tags dbtn/module:unified_menu_operations
   * @name create_menu_item
   * @summary Create Menu Item
   * @request POST:/routes/unified-menu/items
   */
  export namespace create_menu_item {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MenuItemBase;
    export type RequestHeaders = {};
    export type ResponseBody = CreateMenuItemData;
  }

  /**
   * @description Update an existing menu item and its pricing data
   * @tags dbtn/module:unified_menu_operations
   * @name update_menu_item
   * @summary Update Menu Item
   * @request PUT:/routes/unified-menu/items/{item_id}
   */
  export namespace update_menu_item {
    export type RequestParams = {
      /** Item Id */
      itemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MenuItemUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateMenuItemData;
  }

  /**
   * @description Delete a menu item by ID
   * @tags dbtn/module:unified_menu_operations
   * @name delete_menu_item
   * @summary Delete Menu Item
   * @request DELETE:/routes/unified-menu/items/{item_id}
   */
  export namespace delete_menu_item {
    export type RequestParams = {
      /** Item Id */
      itemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteMenuItemData;
  }

  /**
   * @description Bulk delete categories, proteins, or menu items
   * @tags dbtn/module:unified_menu_operations
   * @name bulk_delete_items
   * @summary Bulk Delete Items
   * @request POST:/routes/unified-menu/bulk/delete
   */
  export namespace bulk_delete_items {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisUnifiedMenuOperationsBulkDeleteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkDeleteItemsData;
  }

  /**
   * @description Bulk toggle active status for categories, proteins, or menu items
   * @tags dbtn/module:unified_menu_operations
   * @name bulk_toggle_active
   * @summary Bulk Toggle Active
   * @request POST:/routes/unified-menu/bulk/toggle
   */
  export namespace bulk_toggle_active {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkToggleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkToggleActiveData;
  }

  /**
   * @description Delete a single category, protein, or menu item
   * @tags dbtn/module:unified_menu_operations
   * @name delete_single_item
   * @summary Delete Single Item
   * @request POST:/routes/unified-menu/single/delete
   */
  export namespace delete_single_item {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeleteItemRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteSingleItemData;
  }

  /**
   * @description Get all menu categories
   * @tags dbtn/module:unified_menu_operations
   * @name get_categories
   * @summary Get Categories
   * @request GET:/routes/unified-menu/categories
   */
  export namespace get_categories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCategoriesData;
  }

  /**
   * @description Get all protein types
   * @tags dbtn/module:unified_menu_operations
   * @name get_protein_types
   * @summary Get Protein Types
   * @request GET:/routes/unified-menu/proteins
   */
  export namespace get_protein_types {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProteinTypesData;
  }

  /**
   * @description Add is_available column to menu_items table
   * @tags dbtn/module:fix_menu_is_available
   * @name add_is_available_column
   * @summary Add Is Available Column
   * @request POST:/routes/add-is-available-column
   */
  export namespace add_is_available_column {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddIsAvailableColumnData;
  }

  /**
   * @description Check if is_available column exists
   * @tags dbtn/module:fix_menu_is_available
   * @name check_is_available_column
   * @summary Check Is Available Column
   * @request GET:/routes/check-is-available-column
   */
  export namespace check_is_available_column {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckIsAvailableColumnData;
  }

  /**
   * @description Get the next display order for a category
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_next_display_order
   * @summary Get Next Display Order
   * @request POST:/routes/unified-menu-business/ordering/next-display-order
   */
  export namespace get_next_display_order {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NextOrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetNextDisplayOrderData;
  }

  /**
   * @description Get the next display order for a menu item within a category
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_next_item_display_order
   * @summary Get Next Item Display Order
   * @request POST:/routes/unified-menu-business/ordering/next-item-display-order
   */
  export namespace get_next_item_display_order {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NextOrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetNextItemDisplayOrderData;
  }

  /**
   * @description Reorder category siblings
   * @tags dbtn/module:unified_menu_business_logic
   * @name reorder_siblings
   * @summary Reorder Siblings
   * @request POST:/routes/unified-menu-business/ordering/reorder-siblings
   */
  export namespace reorder_siblings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ReorderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ReorderSiblingsData;
  }

  /**
   * @description Get menu structure with proper ordering (with caching) Returns menu items with variants including: - Variant-level dietary tags (is_vegetarian, is_vegan, is_gluten_free, is_halal, is_dairy_free, is_nut_free) - Variant-level featured flag - Base item featured flag - All 6 optimized image variants - Protein type enrichment - Display image/description inheritance
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_menu_with_ordering
   * @summary Get Menu With Ordering
   * @request GET:/routes/unified-menu-business/ordering/menu-with-ordering
   */
  export namespace get_menu_with_ordering {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuWithOrderingData;
  }

  /**
   * @description Update a menu item variant with detailed pricing breakdown
   * @tags dbtn/module:unified_menu_business_logic
   * @name update_variant_pricing
   * @summary Update Variant Pricing
   * @request POST:/routes/unified-menu-business/pricing/update-variant
   */
  export namespace update_variant_pricing {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PriceBreakdownRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateVariantPricingData;
  }

  /**
   * @description Batch update pricing for multiple variants
   * @tags dbtn/module:unified_menu_business_logic
   * @name batch_update_pricing
   * @summary Batch Update Pricing
   * @request POST:/routes/unified-menu-business/pricing/batch-update
   */
  export namespace batch_update_pricing {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BatchPricingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BatchUpdatePricingData;
  }

  /**
   * @description Apply category template structure to existing categories
   * @tags dbtn/module:unified_menu_business_logic
   * @name apply_category_template
   * @summary Apply Category Template
   * @request POST:/routes/unified-menu-business/templates/apply-category-template
   */
  export namespace apply_category_template {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TemplateApplicationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ApplyCategoryTemplateData;
  }

  /**
   * @description Get current template application status
   * @tags dbtn/module:unified_menu_business_logic
   * @name get_template_status
   * @summary Get Template Status
   * @request GET:/routes/unified-menu-business/templates/template-status
   */
  export namespace get_template_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTemplateStatusData;
  }

  /**
   * @description Create the Supabase cart table with proper schema and constraints. Schema Design: - Supports both guest (session_id) and authenticated (user_id) carts - Stores full menu item data for display - Handles variants (e.g., protein type for curry dishes) - Supports customizations via notes field - Dual pricing for delivery vs collection modes - Automatic deduplication via UNIQUE constraint - Real-time broadcast enabled for live updates Returns: CartSetupResponse with success status and migration details
   * @tags dbtn/module:cart_setup
   * @name create_cart_table
   * @summary Create Cart Table
   * @request POST:/routes/create-cart-table
   */
  export namespace create_cart_table {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCartTableData;
  }

  /**
   * @description Check if cart table exists and get schema info. Returns: Dict with table existence status and column details
   * @tags dbtn/module:cart_setup
   * @name get_cart_table_status
   * @summary Get Cart Table Status
   * @request GET:/routes/cart-table-status
   */
  export namespace get_cart_table_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCartTableStatusData;
  }

  /**
   * @description Add item to cart with intelligent menu search. If item has variants and no variant_id provided, returns variants list for user clarification.
   * @tags dbtn/module:cart_operations
   * @name add_item_to_cart
   * @summary Add Item To Cart
   * @request POST:/routes/cart-operations/add-item
   */
  export namespace add_item_to_cart {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddItemRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddItemToCartData;
  }

  /**
   * @description Remove item from cart by name or ID. Writes directly to Supabase cart table.
   * @tags dbtn/module:cart_operations
   * @name remove_item_from_cart
   * @summary Remove Item From Cart
   * @request POST:/routes/cart-operations/remove-item
   */
  export namespace remove_item_from_cart {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RemoveItemRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RemoveItemFromCartData;
  }

  /**
   * @description Update quantity of item in cart. Writes directly to Supabase cart table.
   * @tags dbtn/module:cart_operations
   * @name update_item_quantity
   * @summary Update Item Quantity
   * @request POST:/routes/cart-operations/update-quantity
   */
  export namespace update_item_quantity {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateQuantityRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateItemQuantityData;
  }

  /**
   * @description Update customizations for an item in cart. Frontend provides current cart state via cart_context.
   * @tags dbtn/module:cart_operations
   * @name update_item_customizations
   * @summary Update Item Customizations
   * @request POST:/routes/cart-operations/update-customizations
   */
  export namespace update_item_customizations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateCustomizationsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateItemCustomizationsData;
  }

  /**
   * @description Get formatted cart summary. Frontend provides current cart state via cart_context.
   * @tags dbtn/module:cart_operations
   * @name get_cart_summary
   * @summary Get Cart Summary
   * @request POST:/routes/cart-operations/get-summary
   */
  export namespace get_cart_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GetSummaryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetCartSummaryData;
  }

  /**
   * @description Clear all items from cart. Writes directly to Supabase to delete all cart items for this session/user.
   * @tags dbtn/module:cart_operations
   * @name clear_cart
   * @summary Clear Cart
   * @request POST:/routes/cart-operations/clear-all
   */
  export namespace clear_cart {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ClearCartRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ClearCartData;
  }

  /**
   * @description Get cart items for a user or session.
   * @tags dbtn/module:cart_operations
   * @name get_cart
   * @summary Get Cart
   * @request GET:/routes/cart-operations/get-cart
   */
  export namespace get_cart {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id?: string | null;
      /** Session Id */
      session_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCartData;
  }

  /**
   * @description Upload and optimize menu item image with automatic variant generation. This endpoint: 1. Validates file type and size 2. Generates 3 size variants (square, widescreen, thumbnail) 3. Converts each to WebP (primary) and JPEG (fallback) 4. Uploads all 6 files to Supabase Storage 5. Returns URLs and metadata for all variants Max upload size: 15MB Accepted formats: JPEG, PNG, WebP Generated variants: Square (800x800), Widescreen (1200x675), Thumbnail (200x200) Output formats: WebP + JPEG per variant
   * @tags dbtn/module:menu_media_optimizer
   * @name upload_optimized_menu_image
   * @summary Upload Optimized Menu Image
   * @request POST:/routes/upload-optimized
   */
  export namespace upload_optimized_menu_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadOptimizedMenuImage;
    export type RequestHeaders = {};
    export type ResponseBody = UploadOptimizedMenuImageData;
  }

  /**
   * @description Simple health check endpoint
   * @tags dbtn/module:menu_media_optimizer
   * @name menu_media_optimizer_health_check
   * @summary Menu Media Optimizer Health Check
   * @request GET:/routes/menu-media/health
   */
  export namespace menu_media_optimizer_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MenuMediaOptimizerHealthCheckData;
  }

  /**
   * @description Batch generate all 6 variants (WebP/JPEG × square/widescreen/thumbnail) for existing media_assets that don't have variants yet. This is a one-time migration endpoint to backfill variant URLs. Args: limit: Optional limit on number of assets to process (for testing) dry_run: If True, only check what would be processed without uploading asset_type: Optional filter by media_assets.type (e.g., 'image', 'general') Returns: BatchGenerationResponse with results for each processed asset
   * @tags dbtn/module:menu_media_optimizer
   * @name batch_generate_variants
   * @summary Batch Generate Variants
   * @request POST:/routes/batch-generate-variants
   */
  export namespace batch_generate_variants {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Limit */
      limit?: number | null;
      /**
       * Dry Run
       * @default false
       */
      dry_run?: boolean;
      /** Asset Type */
      asset_type?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BatchGenerateVariantsData;
  }

  /**
   * @description Add terminal payment tracking columns to orders table Columns: - transaction_id: Unique ID for terminal payment request - psp_reference: Adyen payment reference - terminal_payment_status: Status of terminal payment (PENDING, APPROVED, DECLINED, etc.) - terminal_payment_sent_at: Timestamp when payment request was sent - terminal_payment_completed_at: Timestamp when payment was completed
   * @tags dbtn/module:database_setup
   * @name add_terminal_payment_columns
   * @summary Add Terminal Payment Columns
   * @request POST:/routes/add-terminal-payment-columns
   */
  export namespace add_terminal_payment_columns {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddTerminalPaymentColumnsData;
  }

  /**
   * @description Verify that terminal payment columns exist and are properly indexed
   * @tags dbtn/module:database_setup
   * @name verify_terminal_payment_schema
   * @summary Verify Terminal Payment Schema
   * @request POST:/routes/verify-terminal-payment-schema
   */
  export namespace verify_terminal_payment_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyTerminalPaymentSchemaData;
  }

  /**
   * @description Add missing columns to cart table for AI integration. Adds: - variant_id: Optional FK to menu_item_variants - notes: Customer special instructions - order_mode: 'delivery' or 'collection' for pricing - price_delivery: Cached delivery price - price_collection: Cached collection price - user_id: Optional FK to auth.users for authenticated users
   * @tags dbtn/module:database_setup
   * @name add_cart_ai_columns
   * @summary Add Cart Ai Columns
   * @request POST:/routes/add-cart-ai-columns
   */
  export namespace add_cart_ai_columns {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AddCartAiColumnsData;
  }

  /**
   * @description Verify that cart table has all columns needed for AI integration
   * @tags dbtn/module:database_setup
   * @name verify_cart_ai_schema
   * @summary Verify Cart Ai Schema
   * @request POST:/routes/verify-cart-ai-schema
   */
  export namespace verify_cart_ai_schema {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyCartAiSchemaData;
  }

  /**
   * @description Drop UNIQUE constraint on cart table to allow items with different customizations. MYA-1550: Previously, cart enforced UNIQUE(user_id, session_id, menu_item_id, variant_id) which prevented adding the same item with different customizations. Now we remove this constraint so: - Same item + different customizations = separate cart entries - Uniqueness is determined by comparing customizations JSON Returns: dict: Status of constraint removal
   * @tags dbtn/module:database_setup
   * @name drop_cart_unique_constraint
   * @summary Drop Cart Unique Constraint
   * @request POST:/routes/drop-cart-unique-constraint
   */
  export namespace drop_cart_unique_constraint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DropCartUniqueConstraintData;
  }

  /**
   * @description End-to-end test for customization support. Tests: 1. Add same item with different customizations → separate entries 2. Add same item with same customizations → quantity update 3. Verify cart returns customizations correctly Args: test_session_id: Custom session ID for testing (auto-generated if not provided) Returns: dict: Test results with pass/fail status
   * @tags dbtn/module:cart_customization_test
   * @name test_customizations_end_to_end
   * @summary Test Customizations End To End
   * @request POST:/routes/test-customizations-e2e
   */
  export namespace test_customizations_end_to_end {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Test Session Id */
      test_session_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestCustomizationsEndToEndData;
  }

  /**
   * @description Same test as above but with a REAL menu item ID. Args: menu_item_id: Actual menu item UUID from menu_items table test_session_id: Custom session ID for testing Returns: dict: Test results
   * @tags dbtn/module:cart_customization_test
   * @name test_customizations_with_real_item
   * @summary Test Customizations With Real Item
   * @request POST:/routes/test-customizations-with-real-item
   */
  export namespace test_customizations_with_real_item {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Menu Item Id */
      menu_item_id: string;
      /** Test Session Id */
      test_session_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestCustomizationsWithRealItemData;
  }

  /**
   * @description Verify schema fix: items with different customizations can be separate entries. MYA-1550: After dropping UNIQUE constraint, this test should pass. Tests: 1. Fetch real menu item from database 2. Add with customization set A → should insert 3. Add with customization set B → should insert (NEW separate entry) 4. Get cart → should show 2 entries with different customizations Returns: dict: Test results
   * @tags dbtn/module:cart_customization_test
   * @name test_customizations_schema_fix
   * @summary Test Customizations Schema Fix
   * @request POST:/routes/test-customizations-schema-fix
   */
  export namespace test_customizations_schema_fix {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestCustomizationsSchemaFixData;
  }

  /**
   * @description Get current cart contents for AI chat awareness This enables the AI to access and reference cart contents during conversations. Returns cart summary that can be included in AI context. ✅ MYA-1550: Now includes customizations in cart context
   * @tags dbtn/module:chat_cart_context
   * @name get_chat_cart_context
   * @summary Get Chat Cart Context
   * @request POST:/routes/chat-cart-context/get-cart-context
   */
  export namespace get_chat_cart_context {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CartContextRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetChatCartContextData;
  }

  /**
   * @description Get a natural language summary of the current cart for AI responses
   * @tags dbtn/module:chat_cart_context
   * @name get_cart_summary_text
   * @summary Get Cart Summary Text
   * @request GET:/routes/chat-cart-context/cart-summary-text
   */
  export namespace get_cart_summary_text {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCartSummaryTextData;
  }

  /**
   * @description Health check for chat cart context API
   * @tags dbtn/module:chat_cart_context
   * @name chat_cart_context_health
   * @summary Chat Cart Context Health
   * @request GET:/routes/chat-cart-context/health
   */
  export namespace chat_cart_context_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ChatCartContextHealthData;
  }

  /**
   * @description Generate a dynamic system prompt from the primary unified agent config. Supports both chat and voice channels with channel-specific customization. Now includes AI Knowledge Corpus menu injection and live restaurant data. NEW: Returns structured response with: - user_portion: Editable personality/style customization (safe to edit) - complete_prompt: Full assembled prompt with CORE instructions (read-only preview)
   * @tags dbtn/module:prompt_generator
   * @name generate_system_prompt
   * @summary Generate System Prompt
   * @request GET:/routes/generate-system-prompt
   */
  export namespace generate_system_prompt {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Channel
       * Channel to generate prompt for
       * @default "chat"
       */
      channel?: "chat" | "voice";
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateSystemPromptData;
  }

  /**
   * @description Generate a preview system prompt with custom agent configuration. Useful for testing different agent personalities before saving to database. This endpoint allows you to preview prompts without affecting the production unified_agent_config. Optionally include a menu snapshot to test menu injection.
   * @tags dbtn/module:prompt_generator
   * @name preview_prompt
   * @summary Preview Prompt
   * @request POST:/routes/preview-prompt
   */
  export namespace preview_prompt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PreviewPromptRequest;
    export type RequestHeaders = {};
    export type ResponseBody = PreviewPromptData;
  }

  /**
   * @description Health check endpoint for prompt generator service. Returns status of agent config, menu corpus, and last generation time.
   * @tags dbtn/module:prompt_generator
   * @name prompt_generator_health
   * @summary Prompt Generator Health
   * @request GET:/routes/prompt-generator-health
   */
  export namespace prompt_generator_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PromptGeneratorHealthData;
  }

  /**
   * @description Create the get_menu_items_with_variants_rpc() Postgres function. This RPC function optimizes menu search by moving all filtering logic server-side, eliminating SDK overhead. Parameters: - p_category: Filter by menu section (e.g., 'STARTERS', 'MAIN COURSE') - p_dietary_filter: Filter by dietary requirement ('vegetarian', 'vegan', 'gluten-free') - p_search_query: Free-text search in item names - p_order_mode: Pricing mode ('delivery', 'collection', 'dine_in') Returns: JSONB with unified list of items (both standalone and variants)
   * @tags dbtn/module:menu_rpc_setup
   * @name create_menu_variants_rpc
   * @summary Create Menu Variants Rpc
   * @request POST:/routes/create-menu-variants-rpc
   */
  export namespace create_menu_variants_rpc {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateMenuVariantsRpcData;
  }

  /**
   * @description Drop (remove) the get_menu_items_with_variants_rpc() function. Use this for rollback if the RPC function causes issues.
   * @tags dbtn/module:menu_rpc_setup
   * @name drop_menu_variants_rpc
   * @summary Drop Menu Variants Rpc
   * @request POST:/routes/drop-menu-variants-rpc
   */
  export namespace drop_menu_variants_rpc {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DropMenuVariantsRpcData;
  }

  /**
   * @description Test the get_menu_items_with_variants_rpc() function. Query parameters: - category: Filter by menu section (optional) - dietary_filter: Filter by dietary requirement (optional) - search_query: Free-text search (optional) - order_mode: Pricing mode (default: 'collection') Returns sample data to verify the RPC function works correctly.
   * @tags dbtn/module:menu_rpc_setup
   * @name test_menu_variants_rpc
   * @summary Test Menu Variants Rpc
   * @request GET:/routes/test-menu-variants-rpc
   */
  export namespace test_menu_variants_rpc {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Category */
      category?: string | null;
      /** Dietary Filter */
      dietary_filter?: string | null;
      /** Search Query */
      search_query?: string | null;
      /**
       * Order Mode
       * @default "collection"
       */
      order_mode?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestMenuVariantsRpcData;
  }

  /**
   * @description Create the menu_items_unified VIEW for optimized menu queries. This VIEW combines: - Standalone items (has_variants = FALSE) - Variant items (from menu_item_variants + parent menu_items) - Category names (with parent-child support) Returns both types in a unified structure for easy querying.
   * @tags dbtn/module:menu_view_setup
   * @name create_menu_unified_view
   * @summary Create Menu Unified View
   * @request POST:/routes/create-menu-unified-view
   */
  export namespace create_menu_unified_view {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateMenuUnifiedViewData;
  }

  /**
   * @description Drop (remove) the menu_items_unified VIEW. Use this for rollback if the VIEW causes issues.
   * @tags dbtn/module:menu_view_setup
   * @name drop_menu_unified_view
   * @summary Drop Menu Unified View
   * @request POST:/routes/drop-menu-unified-view
   */
  export namespace drop_menu_unified_view {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DropMenuUnifiedViewData;
  }

  /**
   * @description Test query against the menu_items_unified VIEW. Returns sample data to verify the VIEW works correctly.
   * @tags dbtn/module:menu_view_setup
   * @name test_menu_unified_view
   * @summary Test Menu Unified View
   * @request GET:/routes/test-menu-unified-view
   */
  export namespace test_menu_unified_view {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestMenuUnifiedViewData;
  }

  /**
   * @description Get restaurant settings with caching
   * @tags dbtn/module:restaurant_settings
   * @name get_restaurant_settings
   * @summary Get Restaurant Settings
   * @request GET:/routes/settings
   */
  export namespace get_restaurant_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRestaurantSettingsData;
  }

  /**
   * @description Save restaurant settings and invalidate cache
   * @tags dbtn/module:restaurant_settings
   * @name save_restaurant_settings
   * @summary Save Restaurant Settings
   * @request POST:/routes/settings
   */
  export namespace save_restaurant_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SaveSettingsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SaveRestaurantSettingsData;
  }

  /**
   * @description Get all available customizations for a specific menu item. This endpoint is designed for AI consumption during conversational ordering. It returns customizations from all linking methods: - Junction table (menu_item_customizations) - Global customizations (is_global = true) - Direct array links (item_ids field) Args: menu_item_id: UUID of the menu item Returns: ItemCustomizationsResponse with grouped customizations and formatted text Example Usage (by AI): When user says: "Add chicken tikka with extra hot" 1. AI searches menu for "chicken tikka" → gets menu_item_id 2. AI calls this endpoint: /ai-customizations/for-item/{menu_item_id} 3. AI validates "extra hot" is available 4. AI adds to cart with verified customization
   * @tags dbtn/module:ai_customizations
   * @name get_customizations_for_item
   * @summary Get Customizations For Item
   * @request GET:/routes/ai-customizations/for-item/{menu_item_id}
   */
  export namespace get_customizations_for_item {
    export type RequestParams = {
      /** Menu Item Id */
      menuItemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomizationsForItemData;
  }

  /**
   * @description Validate if a requested customization is available for a menu item. This helps AI avoid adding invalid customizations to orders. Args: request: Contains menu_item_id and requested_customization text Returns: Validation result with matched option or suggestion Example: Request: {"menu_item_id": "abc-123", "requested_customization": "no onions"} Response: {"is_valid": true, "matched_option": {"id": "...", "name": "No Onions", "price": 0.0}}
   * @tags dbtn/module:ai_customizations
   * @name validate_customization
   * @summary Validate Customization
   * @request POST:/routes/ai-customizations/validate
   */
  export namespace validate_customization {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidateCustomizationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateCustomizationData;
  }

  /**
   * @description Health check endpoint for AI customizations service.
   * @tags dbtn/module:ai_customizations
   * @name ai_customizations_health_check
   * @summary Ai Customizations Health Check
   * @request GET:/routes/ai-customizations/health
   */
  export namespace ai_customizations_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AiCustomizationsHealthCheckData;
  }

  /**
   * @description Create a new Gemini cache with the static BASE_SYSTEM_INSTRUCTION. This cache can be reused across all chat requests to reduce AI latency. The cache will expire after the specified TTL (default 24 hours). Returns the cache name to be used in subsequent chat requests.
   * @tags dbtn/module:gemini_cache_manager
   * @name create_base_cache
   * @summary Create Base Cache
   * @request POST:/routes/gemini-cache/create-base-cache
   */
  export namespace create_base_cache {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCacheRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateBaseCacheData;
  }

  /**
   * @description List all active Gemini caches with metadata. Useful for monitoring cache usage and expiration times.
   * @tags dbtn/module:gemini_cache_manager
   * @name list_caches
   * @summary List Caches
   * @request GET:/routes/gemini-cache/list-caches
   */
  export namespace list_caches {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListCachesData;
  }

  /**
   * @description Extend the expiration time of an existing cache. Useful for keeping active caches alive without recreating them.
   * @tags dbtn/module:gemini_cache_manager
   * @name extend_cache
   * @summary Extend Cache
   * @request POST:/routes/gemini-cache/extend-cache
   */
  export namespace extend_cache {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ExtendCacheRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ExtendCacheData;
  }

  /**
   * @description Delete a specific Gemini cache. Use this to clean up expired or unused caches.
   * @tags dbtn/module:gemini_cache_manager
   * @name delete_cache
   * @summary Delete Cache
   * @request DELETE:/routes/gemini-cache/delete-cache/{cache_name}
   */
  export namespace delete_cache {
    export type RequestParams = {
      /** Cache Name */
      cacheName: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteCacheData;
  }

  /**
   * @description Health check for cache manager
   * @tags dbtn/module:gemini_cache_manager
   * @name gemini_cache_health_check
   * @summary Gemini Cache Health Check
   * @request GET:/routes/gemini-cache/health
   */
  export namespace gemini_cache_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GeminiCacheHealthCheckData;
  }

  /**
   * @description Get orders placed by customers through the OnlineOrders page only. This endpoint exclusively returns orders with order_source: 'CUSTOMER_ONLINE_ORDER'
   * @tags dbtn/module:online_orders
   * @name get_online_orders
   * @summary Get Online Orders
   * @request GET:/routes/online-orders/orders
   */
  export namespace get_online_orders {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Page
       * Page number
       * @default 1
       */
      page?: number;
      /**
       * Page Size
       * Items per page
       * @default 20
       */
      page_size?: number;
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
      /** Status */
      status?: string | null;
      /** Search */
      search?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOnlineOrdersData;
  }

  /**
   * @description Create a new online order with Supabase storage. Now generates proper order numbers using unified sequence API. Includes retry logic to handle race conditions and transient failures.
   * @tags dbtn/module:online_orders
   * @name create_online_order
   * @summary Create Online Order
   * @request POST:/routes/online-orders/create
   */
  export namespace create_online_order {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateOnlineOrderRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateOnlineOrderData;
  }

  /**
   * @description Create a Stripe Payment Intent for online order checkout. Returns client_secret for frontend Stripe Elements.
   * @tags dbtn/module:stripe
   * @name create_payment_intent
   * @summary Create Payment Intent
   * @request POST:/routes/stripe/create-payment-intent
   */
  export namespace create_payment_intent {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreatePaymentIntentRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePaymentIntentData;
  }

  /**
   * @description Get Stripe publishable key for frontend initialization. This is safe to expose to the client.
   * @tags dbtn/module:stripe
   * @name get_stripe_publishable_key
   * @summary Get Stripe Publishable Key
   * @request GET:/routes/stripe/config
   */
  export namespace get_stripe_publishable_key {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStripePublishableKeyData;
  }

  /**
   * @description Handle Stripe webhook events. Verifies webhook signature and processes payment events.
   * @tags dbtn/module:stripe
   * @name stripe_webhook
   * @summary Stripe Webhook
   * @request POST:/routes/stripe/webhook
   */
  export namespace stripe_webhook {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = StripeWebhookData;
  }

  /**
   * @description Confirm payment status and update order. Called from frontend after Stripe confirms payment.
   * @tags dbtn/module:stripe
   * @name confirm_payment
   * @summary Confirm Payment
   * @request POST:/routes/stripe/confirm-payment
   */
  export namespace confirm_payment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ConfirmPaymentRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ConfirmPaymentData;
  }

  /**
   * @description Stream chat endpoint with model provider routing
   * @tags stream, dbtn/module:streaming_chat
   * @name stream_chat
   * @summary Stream Chat
   * @request POST:/routes/streaming-chat/chat
   */
  export namespace stream_chat {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = StreamChatData;
  }

  /**
   * @description Health check endpoint for streaming chat service
   * @tags dbtn/module:streaming_chat
   * @name check_streaming_health
   * @summary Check Streaming Health
   * @request GET:/routes/streaming-chat/streaming-health
   */
  export namespace check_streaming_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckStreamingHealthData;
  }

  /**
   * @description List available models
   * @tags dbtn/module:streaming_chat
   * @name list_available_models
   * @summary List Available Models
   * @request GET:/routes/streaming-chat/models
   */
  export namespace list_available_models {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListAvailableModelsData;
  }

  /**
   * @description Get AI-powered menu recommendations based on current cart contents. Features: - Analyzes cart items for complementary suggestions - Incorporates customer order history for personalization - 5-minute caching to reduce API costs - Fallback to empty list if Gemini fails Example: ```json { "cart_items": [ {"name": "Chicken Tikka Masala", "quantity": 1, "price": 9.95, "category": "Mains"} ], "customer_id": "user-123", "order_mode": "delivery", "limit": 3 } ```
   * @tags dbtn/module:ai_recommendations
   * @name get_cart_suggestions
   * @summary Get Cart Suggestions
   * @request POST:/routes/ai-recommendations/cart-suggestions
   */
  export namespace get_cart_suggestions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RecommendationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetCartSuggestionsData;
  }

  /**
   * @description Get cache statistics for monitoring
   * @tags dbtn/module:ai_recommendations
   * @name get_cache_stats
   * @summary Get Cache Stats
   * @request GET:/routes/ai-recommendations/cache-stats
   */
  export namespace get_cache_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCacheStatsData;
  }

  /**
   * @description Clear recommendation cache (for testing/debugging)
   * @tags dbtn/module:ai_recommendations
   * @name clear_cache
   * @summary Clear Cache
   * @request POST:/routes/ai-recommendations/clear-cache
   */
  export namespace clear_cache {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearCacheData;
  }

  /**
   * @description Health check endpoint
   * @tags dbtn/module:ai_recommendations
   * @name ai_recommendations_health
   * @summary Ai Recommendations Health
   * @request GET:/routes/ai-recommendations/health
   */
  export namespace ai_recommendations_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AiRecommendationsHealthData;
  }

  /**
   * @description Geocode a postcode or location name to get coordinates and other details
   * @tags dbtn/module:geocoding
   * @name geocode
   * @summary Geocode
   * @request POST:/routes/geocode
   */
  export namespace geocode {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GeocodingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GeocodeData;
  }

  /**
   * @description Generate Google Static Maps URL for mini map previews Returns a properly formatted Google Static Maps URL with: - Burgundy marker matching CustomerPortal theme - Dark theme styling for consistency - Optimized for address preview cards
   * @tags dbtn/module:google_static_maps
   * @name generate_static_map
   * @summary Generate Static Map
   * @request POST:/routes/generate-static-map
   */
  export namespace generate_static_map {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = StaticMapRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateStaticMapData;
  }

  /**
   * @description Get Google Maps configuration for static maps specifically Returns the API key validation for static maps generation
   * @tags dbtn/module:google_static_maps
   * @name get_static_maps_config
   * @summary Get Static Maps Config
   * @request GET:/routes/static-maps-config
   */
  export namespace get_static_maps_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStaticMapsConfigData;
  }

  /**
   * @description Validate if a postcode is within delivery zone and meets minimum order requirements
   * @tags dbtn/module:business_rules_validation
   * @name validate_delivery_postcode
   * @summary Validate Delivery Postcode
   * @request POST:/routes/validate-delivery-postcode
   */
  export namespace validate_delivery_postcode {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeliveryValidationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateDeliveryPostcodeData;
  }

  /**
   * @description Validate if restaurant is open for delivery/collection at specified time
   * @tags dbtn/module:business_rules_validation
   * @name validate_opening_hours
   * @summary Validate Opening Hours
   * @request POST:/routes/validate-opening-hours
   */
  export namespace validate_opening_hours {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OpeningHoursValidationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateOpeningHoursData;
  }

  /**
   * @description Get all current business rules for frontend use
   * @tags dbtn/module:business_rules_validation
   * @name get_current_business_rules
   * @summary Get Current Business Rules
   * @request GET:/routes/get-current-business-rules
   */
  export namespace get_current_business_rules {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentBusinessRulesData;
  }

  /**
   * @description Comprehensive order validation including all business rules
   * @tags dbtn/module:business_rules_validation
   * @name validate_order
   * @summary Validate Order
   * @request POST:/routes/validate-order
   */
  export namespace validate_order {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OrderValidationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateOrderData;
  }

  /**
   * @description Proxy Google Maps Static API images to avoid referrer restrictions. Fetches the map image from Google and serves it directly. Now uses GoogleMapsService library for centralized API management.
   * @tags dbtn/module:map_image_proxy
   * @name get_map_image_proxy
   * @summary Get Map Image Proxy
   * @request GET:/routes/map-image-proxy
   */
  export namespace get_map_image_proxy {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Latitude */
      latitude: number;
      /** Longitude */
      longitude: number;
      /**
       * Width
       * @default 120
       */
      width?: number;
      /**
       * Height
       * @default 80
       */
      height?: number;
      /**
       * Zoom
       * @default 15
       */
      zoom?: number;
      /**
       * Marker Color
       * @default "0x8B1538"
       */
      marker_color?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMapImageProxyData;
  }

  /**
   * @description Calculate delivery route with traffic consideration
   * @tags dbtn/module:delivery_calculator
   * @name calculate_delivery_route
   * @summary Calculate Delivery Route
   * @request POST:/routes/calculate
   */
  export namespace calculate_delivery_route {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeliveryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CalculateDeliveryRouteData;
  }

  /**
   * @description Calculate enhanced delivery route with traffic intelligence, weather, and location context
   * @tags dbtn/module:delivery_calculator
   * @name calculate_enhanced_delivery_route
   * @summary Calculate Enhanced Delivery Route
   * @request POST:/routes/calculate-enhanced
   */
  export namespace calculate_enhanced_delivery_route {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeliveryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CalculateEnhancedDeliveryRouteData;
  }

  /**
   * @description Get the Google Maps API key and restaurant location for frontend use
   * @tags dbtn/module:delivery_calculator
   * @name get_maps_config
   * @summary Get Maps Config
   * @request GET:/routes/maps-config
   */
  export namespace get_maps_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMapsConfigData;
  }

  /**
   * @description Run health checks for all services This endpoint always runs fresh checks (bypasses cache). Use /health/status for cached results. Returns: HealthCheckResponse with status of all services
   * @tags dbtn/module:health_monitoring
   * @name check_all_services
   * @summary Check All Services
   * @request POST:/routes/health/check-all
   */
  export namespace check_all_services {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckAllServicesData;
  }

  /**
   * @description Get current health status (cached, fast) Returns cached results if available and not expired. Falls back to fresh check if cache is empty or expired. Returns: HealthCheckResponse with cached or fresh health status
   * @tags dbtn/module:health_monitoring
   * @name get_health_status
   * @summary Get Health Status
   * @request GET:/routes/health/status
   */
  export namespace get_health_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHealthStatusData;
  }

  /**
   * @description Check health of a specific service Args: service: Service name (supabase, stripe, google_ai, google_maps) Returns: HealthStatusResponse for the requested service
   * @tags dbtn/module:health_monitoring
   * @name check_specific_service
   * @summary Check Specific Service
   * @request POST:/routes/health/check/{service}
   */
  export namespace check_specific_service {
    export type RequestParams = {
      /**
       * Service
       * Service to check
       */
      service: "supabase" | "stripe" | "google_ai" | "google_maps";
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckSpecificServiceData;
  }

  /**
   * @description Get recent health check history Note: Currently returns empty list. Future: Implement persistent logging to Supabase Args: limit: Maximum number of entries to return (default: 50) Returns: HealthHistoryResponse with recent health checks
   * @tags dbtn/module:health_monitoring
   * @name get_health_history
   * @summary Get Health History
   * @request GET:/routes/health/history
   */
  export namespace get_health_history {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHealthHistoryData;
  }

  /**
   * @description Clear the health check cache Forces next /health/status call to run fresh checks. Returns: Success message
   * @tags dbtn/module:health_monitoring
   * @name clear_health_cache
   * @summary Clear Health Cache
   * @request POST:/routes/health/clear-cache
   */
  export namespace clear_health_cache {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearHealthCacheData;
  }

  /**
   * @description 🧪 Test end-to-end customization flow. This test simulates what happens when Gemini adds items with customizations: Test Scenarios: 1. Item with free customizations (spice level) 2. Item with paid customizations (sauce) 3. Item with multiple customizations 4. Verify cart totals include customization prices 5. Verify customizations appear in cart response Args: request: Test configuration with session/user IDs Returns: Detailed test results with step-by-step validation
   * @tags dbtn/module:test_customizations
   * @name run_customization_test
   * @summary Run Customization Test
   * @request POST:/routes/run-customization-test
   */
  export namespace run_customization_test {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CustomizationTestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RunCustomizationTestData;
  }

  /**
   * @description Health check for customization test endpoint.
   * @tags dbtn/module:test_customizations
   * @name test_customizations_health_check
   * @summary Test Customizations Health Check
   * @request GET:/routes/test-customizations-health
   */
  export namespace test_customizations_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestCustomizationsHealthCheckData;
  }

  /**
   * @description Test endpoint to validate mode='ANY' with streaming. Query params: query: User message to test (default: "what main courses do you have?") mode: Function calling mode - 'ANY', 'AUTO', or 'NONE' (default: 'ANY') Returns: SSE stream with test results Test cases: 1. /test-mode-any?query=what starters do you have?&mode=ANY 2. /test-mode-any?query=what main courses do you have?&mode=ANY 3. /test-mode-any?query=what starters do you have?&mode=AUTO 4. /test-mode-any?query=what main courses do you have?&mode=AUTO Expected results: - mode='ANY': Should ALWAYS call function (100% rate) - mode='AUTO': May or may not call function (inconsistent)
   * @tags stream, dbtn/module:test_mode_any
   * @name test_mode_any
   * @summary Test Mode Any
   * @request GET:/routes/test-mode-any
   */
  export namespace test_mode_any {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Query
       * @default "what main courses do you have?"
       */
      query?: string;
      /**
       * Mode
       * @default "ANY"
       */
      mode?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestModeAnyData;
  }

  /**
   * @description Health check for test endpoint
   * @tags dbtn/module:test_mode_any
   * @name test_mode_any_health_check
   * @summary Test Mode Any Health Check
   * @request GET:/routes/test-mode-any-health
   */
  export namespace test_mode_any_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestModeAnyHealthCheckData;
  }

  /**
   * @description Multi-turn test: AI calls function → we execute → send result back → AI formats. This mimics production streaming behavior. CRITICAL TEST: Does mode='ANY' allow AI to format function results into text? Or does it force another function call (infinite loop)? Query params: query: User message mode: 'ANY', 'AUTO', or 'NONE' Expected with mode='ANY': Round 1: AI calls function ✅ Round 2: AI formats results into text ❓ (THIS IS THE KEY QUESTION)
   * @tags stream, dbtn/module:test_mode_any
   * @name test_mode_any_multiturn
   * @summary Test Mode Any Multiturn
   * @request GET:/routes/test-mode-any-multiturn
   */
  export namespace test_mode_any_multiturn {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Query
       * @default "what main courses do you have?"
       */
      query?: string;
      /**
       * Mode
       * @default "ANY"
       */
      mode?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestModeAnyMultiturnData;
  }

  /**
   * @description Test voice function executor with a single cart operation. Example: POST /test-voice-executor/test-execution { "session_id": "test_session_123", "user_id": null, "function_name": "search_and_add_to_cart", "args": {"search_query": "chicken tikka", "quantity": 2} }
   * @tags dbtn/module:test_voice_executor
   * @name test_voice_executor
   * @summary Test Voice Executor
   * @request POST:/routes/test-execution
   */
  export namespace test_voice_executor {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestVoiceExecutorData;
  }

  /**
   * @description Test all 6 cart operations in sequence to validate complete integration. Test Flow: 1. Clear cart (if requested) 2. Search and add item (using real menu item name) 3. Add direct item (using real menu_item_id) 4. Get cart 5. Update quantity 6. Remove item 7. Clear cart Returns detailed results for each operation.
   * @tags dbtn/module:test_voice_executor
   * @name test_all_cart_operations
   * @summary Test All Cart Operations
   * @request POST:/routes/test-all-operations
   */
  export namespace test_all_cart_operations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkTestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestAllCartOperationsData;
  }

  /**
   * @description Test ALL 12 voice functions to validate complete function parity. Categories tested: 1. Menu Functions (2) 2. Info Functions (2) 3. Order Functions (1) 4. Cart Functions (6) Returns detailed results for each function with pass/fail status.
   * @tags dbtn/module:test_voice_executor
   * @name test_all_voice_functions
   * @summary Test All Voice Functions
   * @request POST:/routes/test-all-functions
   */
  export namespace test_all_voice_functions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkTestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestAllVoiceFunctionsData;
  }

  /**
   * @description Get list of all supported voice cart functions.
   * @tags dbtn/module:test_voice_executor
   * @name list_supported_functions
   * @summary List Supported Functions
   * @request GET:/routes/supported-functions
   */
  export namespace list_supported_functions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListSupportedFunctionsData;
  }

  /**
   * @description Health check for voice executor test endpoint.
   * @tags dbtn/module:test_voice_executor
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/health
   */
  export namespace health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthCheckData;
  }

  /**
   * @description Initialize Google Live voice settings linked to primary agent. Generates default system prompt from unified_agent_config personality.
   * @tags dbtn/module:google_live_voice_config
   * @name initialize_google_live_voice_settings
   * @summary Initialize Google Live Voice Settings
   * @request POST:/routes/google-live-voice-config/initialize
   */
  export namespace initialize_google_live_voice_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeGoogleLiveVoiceSettingsData;
  }

  /**
   * @description Get current Google Live voice settings for the primary agent.
   * @tags dbtn/module:google_live_voice_config
   * @name get_google_live_voice_settings
   * @summary Get Google Live Voice Settings
   * @request GET:/routes/google-live-voice-config
   */
  export namespace get_google_live_voice_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGoogleLiveVoiceSettingsData;
  }

  /**
   * @description Update Google Live voice settings.
   * @tags dbtn/module:google_live_voice_config
   * @name update_google_live_voice_settings
   * @summary Update Google Live Voice Settings
   * @request PUT:/routes/google-live-voice-config
   */
  export namespace update_google_live_voice_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateGoogleLiveVoiceSettingsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateGoogleLiveVoiceSettingsData;
  }

  /**
   * @description Health check and current configuration status for Google Live voice.
   * @tags dbtn/module:google_live_voice_config
   * @name google_live_voice_status
   * @summary Google Live Voice Status
   * @request GET:/routes/google-live-voice-config/status
   */
  export namespace google_live_voice_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GoogleLiveVoiceStatusData;
  }

  /**
   * @description Initiate a test call using current Google Live settings. Returns call status and connection info.
   * @tags dbtn/module:google_live_voice_config
   * @name test_google_live_voice_call
   * @summary Test Google Live Voice Call
   * @request POST:/routes/google-live-voice-config/test-call
   */
  export namespace test_google_live_voice_call {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestGoogleLiveVoiceCallData;
  }

  /**
   * @description Mark current Google Live voice settings as published/live. Sets is_published=true and published_at=now(). This signals that these settings are the active production configuration.
   * @tags dbtn/module:google_live_voice_config
   * @name publish_voice_settings
   * @summary Publish Voice Settings
   * @request POST:/routes/google-live-voice-config/publish
   */
  export namespace publish_voice_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PublishVoiceSettingsData;
  }

  /**
   * @description Create a new chatbot prompt with GPT-5 and Google GenAI support. Admin/Manager access only.
   * @tags dbtn/module:chatbot_prompts
   * @name create_chatbot_prompt
   * @summary Create Chatbot Prompt
   * @request POST:/routes/chatbot-prompts/create
   */
  export namespace create_chatbot_prompt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatbotPromptCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateChatbotPromptData;
  }

  /**
   * @description List all chatbot prompts with optional filtering. Admin/Manager access for all prompts, public access for published prompts only.
   * @tags dbtn/module:chatbot_prompts
   * @name list_chatbot_prompts
   * @summary List Chatbot Prompts
   * @request GET:/routes/chatbot-prompts/list
   */
  export namespace list_chatbot_prompts {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Published Only
       * @default false
       */
      published_only?: boolean;
      /**
       * Active Only
       * @default false
       */
      active_only?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListChatbotPromptsData;
  }

  /**
   * @description Get the currently active chatbot prompt. Public access for chat runtime.
   * @tags dbtn/module:chatbot_prompts
   * @name get_active_prompt
   * @summary Get Active Prompt
   * @request GET:/routes/chatbot-prompts/active
   */
  export namespace get_active_prompt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActivePromptData;
  }

  /**
   * @description Get a specific chatbot prompt by ID. Admin/Manager access only.
   * @tags dbtn/module:chatbot_prompts
   * @name get_chatbot_prompt
   * @summary Get Chatbot Prompt
   * @request GET:/routes/chatbot-prompts/{prompt_id}
   */
  export namespace get_chatbot_prompt {
    export type RequestParams = {
      /** Prompt Id */
      promptId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetChatbotPromptData;
  }

  /**
   * @description Update a chatbot prompt. Admin/Manager access only.
   * @tags dbtn/module:chatbot_prompts
   * @name update_chatbot_prompt
   * @summary Update Chatbot Prompt
   * @request PUT:/routes/chatbot-prompts/update/{prompt_id}
   */
  export namespace update_chatbot_prompt {
    export type RequestParams = {
      /** Prompt Id */
      promptId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = ChatbotPromptUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateChatbotPromptData;
  }

  /**
   * @description Set a prompt as the active one. Only one prompt can be active at a time. Admin/Manager access only.
   * @tags dbtn/module:chatbot_prompts
   * @name set_active_prompt
   * @summary Set Active Prompt
   * @request POST:/routes/chatbot-prompts/set-active
   */
  export namespace set_active_prompt {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SetActivePromptRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetActivePromptData;
  }

  /**
   * @description Delete a chatbot prompt. Admin/Manager access only. Cannot delete active prompts.
   * @tags dbtn/module:chatbot_prompts
   * @name delete_chatbot_prompt
   * @summary Delete Chatbot Prompt
   * @request DELETE:/routes/chatbot-prompts/delete/{prompt_id}
   */
  export namespace delete_chatbot_prompt {
    export type RequestParams = {
      /** Prompt Id */
      promptId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteChatbotPromptData;
  }

  /**
   * @description Publish a prompt (make it available for selection as active). Admin/Manager access only.
   * @tags dbtn/module:chatbot_prompts
   * @name publish_prompt
   * @summary Publish Prompt
   * @request POST:/routes/chatbot-prompts/publish/{prompt_id}
   */
  export namespace publish_prompt {
    export type RequestParams = {
      /** Prompt Id */
      promptId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PublishPromptData;
  }

  /**
   * @description Unpublish a prompt (remove from active selection, deactivate if active). Admin/Manager access only.
   * @tags dbtn/module:chatbot_prompts
   * @name unpublish_prompt
   * @summary Unpublish Prompt
   * @request POST:/routes/chatbot-prompts/unpublish/{prompt_id}
   */
  export namespace unpublish_prompt {
    export type RequestParams = {
      /** Prompt Id */
      promptId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UnpublishPromptData;
  }

  /**
   * @description Get available model options for each provider.
   * @tags dbtn/module:chatbot_prompts
   * @name get_available_models
   * @summary Get Available Models
   * @request GET:/routes/chatbot-prompts/models/available
   */
  export namespace get_available_models {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAvailableModelsData;
  }

  /**
   * @description Health check for chatbot prompts API.
   * @tags dbtn/module:chatbot_prompts
   * @name chatbot_prompts_health
   * @summary Chatbot Prompts Health
   * @request GET:/routes/chatbot-prompts/health
   */
  export namespace chatbot_prompts_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ChatbotPromptsHealthData;
  }

  /**
   * @description Fetch menu data from Supabase and format it for Gemini system prompt. Returns concise menu context for voice ordering with full variant awareness.
   * @tags dbtn/module:gemini_voice_session
   * @name get_menu_context
   * @summary Get Menu Context
   * @request GET:/routes/gemini-voice/menu-context
   */
  export namespace get_menu_context {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMenuContextData;
  }

  /**
   * @description Search menu items by query or category. Used by Gemini voice agent to fetch menu data on-demand. This lazy-loading approach prevents context bloat and reduces latency.
   * @tags dbtn/module:gemini_voice_session
   * @name search_menu
   * @summary Search Menu
   * @request POST:/routes/gemini-voice/search-menu
   */
  export namespace search_menu {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SearchMenuRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SearchMenuData;
  }

  /**
   * @description Create ephemeral credentials for Gemini Live API. Returns short-lived JWT token (2-hour TTL) instead of permanent API key.
   * @tags dbtn/module:gemini_voice_session
   * @name create_gemini_voice_session
   * @summary Create Gemini Voice Session
   * @request POST:/routes/gemini-voice/create-session
   */
  export namespace create_gemini_voice_session {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VoiceSessionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateGeminiVoiceSessionData;
  }

  /**
   * @description Health check for voice session service
   * @tags dbtn/module:gemini_voice_session
   * @name voice_session_health
   * @summary Voice Session Health
   * @request GET:/routes/gemini-voice/health
   */
  export namespace voice_session_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VoiceSessionHealthData;
  }

  /**
   * @description Chat endpoint with true token-by-token streaming + automatic function calling
   * @tags stream, dbtn/module:structured_streaming
   * @name chat_stream
   * @summary Chat Stream
   * @request POST:/routes/structured-streaming/chat
   */
  export namespace chat_stream {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = StructuredStreamingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ChatStreamData;
  }

  /**
   * @description Health check for structured streaming
   * @tags dbtn/module:structured_streaming
   * @name check_structured_streaming_health
   * @summary Check Structured Streaming Health
   * @request GET:/routes/structured-streaming/health
   */
  export namespace check_structured_streaming_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckStructuredStreamingHealthData;
  }

  /**
   * @description Initialize AI voice settings table and default configuration
   * @tags dbtn/module:ai_voice_settings
   * @name initialize_ai_voice_settings
   * @summary Initialize Ai Voice Settings
   * @request POST:/routes/ai-voice-settings/initialize
   */
  export namespace initialize_ai_voice_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeAiVoiceSettingsData;
  }

  /**
   * @description Get current AI voice settings
   * @tags dbtn/module:ai_voice_settings
   * @name get_ai_voice_settings
   * @summary Get Ai Voice Settings
   * @request GET:/routes/ai-voice-settings
   */
  export namespace get_ai_voice_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAiVoiceSettingsData;
  }

  /**
   * @description Update AI voice settings
   * @tags dbtn/module:ai_voice_settings
   * @name update_ai_voice_settings
   * @summary Update Ai Voice Settings
   * @request PUT:/routes/ai-voice-settings
   */
  export namespace update_ai_voice_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AIVoiceSettingsUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateAiVoiceSettingsData;
  }

  /**
   * @description Get just the master toggle status for quick checks
   * @tags dbtn/module:ai_voice_settings
   * @name get_master_toggle
   * @summary Get Master Toggle
   * @request GET:/routes/ai-voice-settings/master-toggle
   */
  export namespace get_master_toggle {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMasterToggleData;
  }

  /**
   * @description Quick toggle for AI voice assistant (master switch)
   * @tags dbtn/module:ai_voice_settings
   * @name toggle_ai_voice_assistant
   * @summary Toggle Ai Voice Assistant
   * @request POST:/routes/ai-voice-settings/toggle
   */
  export namespace toggle_ai_voice_assistant {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Enabled */
      enabled: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ToggleAiVoiceAssistantData;
  }

  /**
   * @description Get live AI voice calls in progress (mock data for now)
   * @tags dbtn/module:ai_voice_settings
   * @name get_live_calls
   * @summary Get Live Calls
   * @request GET:/routes/ai-voice-settings/live-calls
   */
  export namespace get_live_calls {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLiveCallsData;
  }

  /**
   * @description Test connection to AI voice services
   * @tags dbtn/module:ai_voice_settings
   * @name test_ai_voice_connection
   * @summary Test Ai Voice Connection
   * @request POST:/routes/ai-voice-settings/test-connection
   */
  export namespace test_ai_voice_connection {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestAiVoiceConnectionData;
  }

  /**
   * @description Sync printer service workflow and installer files to cottage-pos-desktop repo. Pushes: - .github/workflows/publish-on-release.yml - installer/printer-service-setup.nsi - installer/README.md - printer-service/LICENSE.txt Returns: Dict with sync status and file URLs
   * @tags dbtn/module:update_pos_desktop
   * @name sync_printer_workflow_files
   * @summary Sync Printer Workflow Files
   * @request POST:/routes/sync-printer-workflow-files
   */
  export namespace sync_printer_workflow_files {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncPrinterWorkflowFilesData;
  }

  /**
   * @description Create a GitHub release for the printer service. This triggers the GitHub Actions workflow to build the installer. Args: request: Release version and notes Returns: Release info including URL
   * @tags dbtn/module:update_pos_desktop
   * @name create_printer_release
   * @summary Create Printer Release
   * @request POST:/routes/create-printer-release
   */
  export namespace create_printer_release {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PrinterReleaseRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePrinterReleaseData;
  }

  /**
   * @description Get the latest printer service release info. Returns: Latest release version, download URL, and metadata
   * @tags dbtn/module:update_pos_desktop
   * @name get_latest_printer_release
   * @summary Get Latest Printer Release
   * @request GET:/routes/latest-printer-release
   */
  export namespace get_latest_printer_release {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLatestPrinterReleaseData;
  }

  /**
   * @description Get the latest combined installer (POS Desktop + Printer Service) release info. Looks for releases containing the combined installer executable (CottageTandooriSetup*.exe). Returns: Dict with success status, version, download URLs, and metadata
   * @tags dbtn/module:update_pos_desktop
   * @name get_latest_combined_installer
   * @summary Get Latest Combined Installer
   * @request GET:/routes/get-latest-combined-installer
   */
  export namespace get_latest_combined_installer {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLatestCombinedInstallerData;
  }

  /**
   * @description Delete a printer service release by version tag. Useful for recreating releases cleanly. Args: version: Version tag (e.g., 'v1.0.0')
   * @tags dbtn/module:update_pos_desktop
   * @name delete_printer_release
   * @summary Delete Printer Release
   * @request DELETE:/routes/delete-printer-release
   */
  export namespace delete_printer_release {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Version */
      version: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeletePrinterReleaseData;
  }

  /**
   * @description Create GitHub release for POS Desktop (triggers build workflow)
   * @tags dbtn/module:update_pos_desktop
   * @name update_pos_desktop
   * @summary Update Pos Desktop
   * @request POST:/routes/update-pos-desktop
   */
  export namespace update_pos_desktop {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdatePOSDesktopRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdatePosDesktopData;
  }

  /**
   * @description Get current POS Desktop version information
   * @tags dbtn/module:update_pos_desktop
   * @name get_pos_desktop_version
   * @summary Get Pos Desktop Version
   * @request GET:/routes/pos-desktop-version
   */
  export namespace get_pos_desktop_version {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPosDesktopVersionData;
  }

  /**
   * @description Sync POS Desktop files from Databutton to GitHub and optionally create a release
   * @tags dbtn/module:update_pos_desktop
   * @name sync_pos_files
   * @summary Sync Pos Files
   * @request POST:/routes/sync-pos-files
   */
  export namespace sync_pos_files {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SyncPOSFilesRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SyncPosFilesData;
  }

  /**
   * @description Check which files exist before syncing
   * @tags dbtn/module:update_pos_desktop
   * @name preflight_check
   * @summary Preflight Check
   * @request GET:/routes/preflight-check
   */
  export namespace preflight_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PreflightCheckData;
  }

  /**
   * @description Sync Printer Helper Service files to GitHub using central library
   * @tags dbtn/module:update_pos_desktop
   * @name sync_printer_service
   * @summary Sync Printer Service
   * @request POST:/routes/sync-printer-service
   */
  export namespace sync_printer_service {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SyncPrinterServiceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SyncPrinterServiceData;
  }

  /**
   * @description Push all printer service files to cottage-pos-desktop GitHub repo
   * @tags dbtn/module:update_pos_desktop
   * @name push_printer_service_to_github_endpoint
   * @summary Push Printer Service To Github Endpoint
   * @request POST:/routes/push-printer-service-to-github
   */
  export namespace push_printer_service_to_github_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Commit Message
       * @default "feat: Merge printer service into main repo structure
       *
       * - Add printer-service/ directory with all code
       * - Include NSSM configuration and installer scripts
       * - Add GitHub workflow for automated builds
       * - Prepare for unified installer build (MYA-1301)"
       */
      commit_message?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PushPrinterServiceToGithubEndpointData;
  }

  /**
   * @description Sync electron-builder configuration files to cottage-pos-desktop repository. Pushes: - package.json (with electron-builder config) - build/installer.nsh (NSSM service installation script) - .github/workflows/build-pos-installer.yml (GitHub Actions workflow) This replaces the custom NSIS installer approach with native electron-builder. Returns: Sync status with GitHub URLs
   * @tags dbtn/module:update_pos_desktop
   * @name sync_electron_builder_config
   * @summary Sync Electron Builder Config
   * @request POST:/routes/sync-electron-builder-config
   */
  export namespace sync_electron_builder_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncElectronBuilderConfigData;
  }

  /**
   * @description Analyze POSDesktop.tsx to find all import dependencies and compare against current file_mapping to identify unmapped files. Returns: Analysis report with mapped and unmapped files
   * @tags dbtn/module:update_pos_desktop
   * @name analyze_pos_dependencies
   * @summary Analyze Pos Dependencies
   * @request POST:/routes/analyze-pos-dependencies
   */
  export namespace analyze_pos_dependencies {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzePosDependenciesData;
  }

  /**
   * @description Update the file_mapping dictionary with new files. Args: request: List of files to add with their databutton and github paths Returns: Success status and updated mapping count
   * @tags dbtn/module:update_pos_desktop
   * @name update_file_mapping
   * @summary Update File Mapping
   * @request POST:/routes/update-file-mapping
   */
  export namespace update_file_mapping {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateFileMappingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateFileMappingData;
  }
}
