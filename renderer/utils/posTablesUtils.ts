import { API_URL } from '../utils/environment';

// Programmatic migration function that can be called without UI
export const migrateTablesNow = async () => {
  try {
    const response = await fetch(`${API_URL}/routes/pos-tables/migrate-tables-now`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error("Migration failed:", data.message, data.details);
      return {
        success: false,
        message: data.message || "Migration failed",
        details: data.details
      };
    }
    
    console.log("Migration completed successfully");
    return {
      success: true,
      message: "Migration completed successfully",
      details: data.details
    };
  } catch (error) {
    console.error("Error during migration:", error);
    return {
      success: false,
      message: error.message || "Unknown error during migration"
    };
  }
};
