import { apiClient } from 'app';

export const setupExecuteSqlFunction = async () => {
  try {
    console.log('Setting up execute_sql RPC function...');
    const response = await apiClient.setup_execute_sql_function_consolidated();
    const result = await response.json();
    
    console.log('Setup result:', result);
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
    console.log('Testing database connection...');
    const response = await apiClient.check_database_connection();
    const result = await response.json();
    
    console.log('Connection test result:', result);
    return result;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return {
      success: false,
      message: `Error: ${error}`
    };
  }
};
