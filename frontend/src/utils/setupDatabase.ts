import brain from "brain";

export const setupExecuteSqlFunction = async () => {
  try {
    const response = await (brain as any).setup_execute_sql_function_consolidated();
    const result = await response.json();
    
    return {
      success: result.success,
      message: result.message,
      details: result.details
    };
  } catch (error) {
    console.error('Error setting up execute_sql function:', error);
    return {
      success: false,
      message: `Error: ${error}`,
      details: null
    };
  }
};

export const testDatabaseConnection = async () => {
  try {
    const response = await (brain as any).check_database_connection();
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return {
      success: false,
      message: `Error: ${error}`
    };
  }
};
