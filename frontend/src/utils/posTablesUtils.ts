import brain from 'brain';

// Programmatic migration function that can be called without UI
export const migrateTablesNow = async () => {
  try {
    const response = await (brain as any).migrate_tables_now({});
    const data = await response.json();

    if (!data.success) {
      console.error("Migration failed:", data.message, data.details);
      return {
        success: false,
        message: data.message || "Migration failed",
        details: data.details
      };
    }

    return {
      success: true,
      message: "Migration completed successfully",
      details: data.details
    };
  } catch (error) {
    console.error("Error during migration:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during migration"
    };
  }
};
