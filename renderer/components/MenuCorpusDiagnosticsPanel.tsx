import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Database, Server, RefreshCw } from "lucide-react";
import { apiClient } from 'app';
import { Skeleton } from "@/components/ui/skeleton";

interface DiagnosticResult {
  success: boolean;
  message: string;
  [key: string]: any;
}

export function MenuCorpusDiagnosticsPanel() {
  const [sqlTestResult, setSqlTestResult] = useState<DiagnosticResult | null>(null);
  const [sampleDataResult, setSampleDataResult] = useState<DiagnosticResult | null>(null);
  const [comprehensiveTestResult, setComprehensiveTestResult] = useState<DiagnosticResult | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runSqlTest = async () => {
    setLoading(true);
    setActiveTest("sql");
    setSqlTestResult(null);
    try {
      const response = await apiClient.test_sql_direct_helper();
      const data = await response.json();
      setSqlTestResult(data);
    } catch (error) {
      setSqlTestResult({
        success: false,
        message: `Error running SQL test: ${error}`
      });
    } finally {
      setLoading(false);
    }
  };

  const populateSampleData = async () => {
    setLoading(true);
    setActiveTest("sample");
    setSampleDataResult(null);
    try {
      const response = await apiClient.populate_sample_menu_data_v2_helper();
      const data = await response.json();
      setSampleDataResult(data);
    } catch (error) {
      setSampleDataResult({
        success: false,
        message: `Error populating sample data: ${error}`
      });
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveTest = async () => {
    setLoading(true);
    setActiveTest("comprehensive");
    setComprehensiveTestResult(null);
    try {
      const response = await apiClient.run_comprehensive_test_helper();
      const data = await response.json();
      setComprehensiveTestResult(data);
    } catch (error) {
      setComprehensiveTestResult({
        success: false,
        message: `Error running comprehensive test: ${error}`
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (success: boolean | undefined, text?: string) => {
    if (success === undefined) return null;
    return success ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        {text || "Success"}
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        {text || "Failed"}
      </Badge>
    );
  };

  const renderDetailItem = (label: string, value: any, isSuccess?: boolean) => {
    return (
      <div className="flex items-start justify-between py-1">
        <span className="text-sm font-medium text-muted-foreground">{label}:</span>
        <span className="text-sm font-mono ml-2">
          {isSuccess !== undefined ? renderStatusBadge(isSuccess, String(value)) : value}
        </span>
      </div>
    );
  };

  const renderSqlTestResults = () => {
    if (!sqlTestResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">SQL Connectivity Test Results</h3>
          {renderStatusBadge(sqlTestResult.success)}
        </div>

        <Alert variant={sqlTestResult.success ? "default" : "destructive"}>
          <Database className="h-4 w-4" />
          <AlertTitle>Database Connectivity</AlertTitle>
          <AlertDescription>{sqlTestResult.message}</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Test Details</h4>
          <div className="bg-muted p-3 rounded-md">
            {renderDetailItem("Connection Method", sqlTestResult.connection_method || "N/A")}
            {renderDetailItem("Query Tested", sqlTestResult.test_query || "N/A")}
            {renderDetailItem("SQL Function Working", sqlTestResult.sql_function_working ? "Yes" : "No", sqlTestResult.sql_function_working)}
            {sqlTestResult.error && renderDetailItem("Error", sqlTestResult.error)}
          </div>

          {sqlTestResult.test_result && (
            <div>
              <h4 className="text-sm font-semibold mt-4">Query Result</h4>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(sqlTestResult.test_result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSampleDataResults = () => {
    if (!sampleDataResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Sample Data Population Results</h3>
          {renderStatusBadge(sampleDataResult.success)}
        </div>

        <Alert variant={sampleDataResult.success ? "default" : "destructive"}>
          <Database className="h-4 w-4" />
          <AlertTitle>Data Population</AlertTitle>
          <AlertDescription>{sampleDataResult.message}</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Population Details</h4>
          <div className="bg-muted p-3 rounded-md">
            {renderDetailItem("Categories Created", sampleDataResult.categories_created || 0)}
            {renderDetailItem("Menu Items Created", sampleDataResult.menu_items_created || 0)}
            {renderDetailItem("Variants Created", sampleDataResult.variants_created || 0)}
            {sampleDataResult.error && renderDetailItem("Error", sampleDataResult.error)}
          </div>

          {sampleDataResult.sample_items && sampleDataResult.sample_items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mt-4">Sample Items</h4>
              <div className="bg-muted p-3 rounded-md overflow-x-auto">
                <pre className="text-xs">{JSON.stringify(sampleDataResult.sample_items, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderComprehensiveTestResults = () => {
    if (!comprehensiveTestResult) return null;

    const steps = comprehensiveTestResult.steps || [];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Comprehensive Test Results</h3>
          {renderStatusBadge(comprehensiveTestResult.success)}
        </div>

        <Alert variant={comprehensiveTestResult.success ? "default" : "destructive"}>
          <Server className="h-4 w-4" />
          <AlertTitle>Pipeline Status</AlertTitle>
          <AlertDescription>{comprehensiveTestResult.message}</AlertDescription>
        </Alert>

        <div className="space-y-4">
          {steps.map((step: any, index: number) => (
            <div key={index} className="border rounded-md overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted">
                <div className="flex items-center gap-2">
                  {step.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold">{step.name}</span>
                </div>
                {renderStatusBadge(step.success)}
              </div>
              <div className="p-3">
                <p className="text-sm text-muted-foreground">{step.message}</p>
                
                {step.details && (
                  <div className="mt-2">
                    <Separator className="my-2" />
                    <div className="space-y-1">
                      {Object.entries(step.details).map(([key, value]: [string, any]) => {
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="mt-2">
                              <h5 className="text-xs font-semibold uppercase text-muted-foreground">{key}</h5>
                              <pre className="bg-muted/50 p-2 rounded text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            </div>
                          );
                        }
                        
                        return renderDetailItem(key, value);
                      })}
                    </div>
                  </div>
                )}
                
                {step.error && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="font-mono text-xs">{step.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ))}
        </div>

        {comprehensiveTestResult.sample_menu_item && (
          <div>
            <h4 className="text-sm font-semibold mt-4">Sample Menu Item</h4>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
              {JSON.stringify(comprehensiveTestResult.sample_menu_item, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderLoading = () => {
    if (!loading) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        
        <Skeleton className="h-20 w-full" />
        
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu Corpus SQL Diagnostics</h2>
          <p className="text-muted-foreground">Test and diagnose SQL connectivity and menu data extraction</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runSqlTest} 
            disabled={loading}
            variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Test SQL Function
          </Button>
          <Button 
            onClick={populateSampleData} 
            disabled={loading}
            variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Populate Sample Data
          </Button>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={loading}
            variant="default">
            <Server className="mr-2 h-4 w-4" />
            Run Comprehensive Test
          </Button>
        </div>

        <Tabs defaultValue="sql" value={activeTest || "sql"}>
          <TabsList className="mb-4">
            <TabsTrigger value="sql" onClick={() => setActiveTest("sql")}>
              SQL Test
            </TabsTrigger>
            <TabsTrigger value="sample" onClick={() => setActiveTest("sample")}>
              Sample Data
            </TabsTrigger>
            <TabsTrigger value="comprehensive" onClick={() => setActiveTest("comprehensive")}>
              Comprehensive Test
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sql" className="space-y-4">
            {loading && activeTest === "sql" ? renderLoading() : renderSqlTestResults()}
            {!loading && !sqlTestResult && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Run SQL test to see results</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sample" className="space-y-4">
            {loading && activeTest === "sample" ? renderLoading() : renderSampleDataResults()}
            {!loading && !sampleDataResult && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Populate sample data to see results</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="comprehensive" className="space-y-4">
            {loading && activeTest === "comprehensive" ? renderLoading() : renderComprehensiveTestResults()}
            {!loading && !comprehensiveTestResult && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Run comprehensive test to see results</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
