import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, Database, FileJson, PhoneCall, Cpu } from 'lucide-react';

export function MenuCorpusDocumentation() {
  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Menu Corpus for AI Voice Agent</AlertTitle>
        <AlertDescription>
          The menu corpus is the knowledge base that powers the Ultravox AI voice agent's understanding of your menu items.
          This documentation explains how the data pipeline works and how to troubleshoot common issues.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database Schema</TabsTrigger>
          <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <PhoneCall className="mr-2 h-5 w-5 text-indigo-400" />
                Menu Corpus Pipeline Overview
              </h3>
              <p className="text-gray-300 mb-4">
                The menu corpus is a structured representation of your restaurant's menu that the AI voice agent uses to answer customer questions and take orders over the phone.
              </p>
              
              <div className="bg-gray-800 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-2">Data Flow</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Menu items are stored in the <Badge variant="outline">menu_items</Badge> and <Badge variant="outline">categories</Badge> tables in Supabase</li>
                  <li>When a customer calls, the API extracts menu data from the database using SQL</li>
                  <li>The extracted data is formatted into a standardized menu corpus format</li>
                  <li>The menu corpus is provided to the Ultravox AI voice agent to power conversations</li>
                </ol>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-md">
                <h4 className="font-medium mb-2">Required Data Fields</h4>
                <p className="text-gray-300 mb-2">For the menu corpus to work properly, your menu items need these fields:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li><Badge variant="outline">name</Badge> - Name of the menu item</li>
                  <li><Badge variant="outline">menu_item_description</Badge> or <Badge variant="outline">description</Badge> - Description of the item</li>
                  <li><Badge variant="outline">price_takeaway</Badge>, <Badge variant="outline">price_delivery</Badge>, <Badge variant="outline">price_dine_in</Badge> - Different pricing options</li>
                  <li><Badge variant="outline">protein_type</Badge> - Type of protein (chicken, lamb, vegetarian, etc.)</li>
                  <li><Badge variant="outline">dietary_tags</Badge> - Array of dietary information (vegetarian, vegan, etc.)</li>
                  <li><Badge variant="outline">allergens</Badge> - Array of allergens (nuts, dairy, gluten, etc.)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Database className="mr-2 h-5 w-5 text-indigo-400" />
                Database Schema
              </h3>
              
              <div className="bg-gray-800 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-2">Menu Items Table</h4>
                <p className="text-gray-300 mb-2">The <Badge variant="outline">menu_items</Badge> table stores all menu items and their attributes:</p>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto mb-2">
                  {`CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  menu_item_description TEXT,
  category_id UUID REFERENCES categories(id),
  price_takeaway DECIMAL(10,2),
  price_delivery DECIMAL(10,2),
  price_dine_in DECIMAL(10,2),
  protein_type TEXT,
  dietary_tags TEXT[],
  allergens TEXT[],
  variants JSONB,
  customizations JSONB,
  available_for_voice_ordering BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                </pre>
                <p className="text-sm text-gray-400">Note: The AI voice agent will only use items where <Badge variant="outline">active = true</Badge>, <Badge variant="outline">status = 'published'</Badge>, and <Badge variant="outline">available_for_voice_ordering = true</Badge></p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-md">
                <h4 className="font-medium mb-2">Categories Table</h4>
                <p className="text-gray-300 mb-2">The <Badge variant="outline">categories</Badge> table organizes menu items into groups:</p>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto mb-2">
                  {`CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER,
  parent_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="extraction" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <FileJson className="mr-2 h-5 w-5 text-indigo-400" />
                Data Extraction Process
              </h3>
              
              <div className="bg-gray-800 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-2">SQL Query for Menu Extraction</h4>
                <p className="text-gray-300 mb-2">The API uses this SQL query to extract menu data:</p>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                  {`SELECT 
  mi.id, 
  mi.name, 
  mi.menu_item_description, 
  c.name as category_name,
  mi.price_takeaway, 
  mi.price_delivery, 
  mi.price_dine_in,
  mi.protein_type, 
  mi.dietary_tags, 
  mi.allergens,
  mi.variants, 
  mi.customizations
FROM 
  menu_items mi
LEFT JOIN 
  categories c ON mi.category_id = c.id
WHERE 
  mi.active = true AND mi.status = 'published' AND mi.available_for_voice_ordering = true
ORDER BY 
  c.name, mi.name;`}
                </pre>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-md">
                <h4 className="font-medium mb-2">Menu Corpus Format</h4>
                <p className="text-gray-300 mb-2">The extracted data is transformed into this format:</p>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                  {`[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Chicken Tikka Masala",
    "description": "Tender chicken in a rich, creamy tomato sauce",
    "category": "Main Courses",
    "prices": {
      "takeaway": 10.99,
      "delivery": 12.99,
      "dine_in": 14.99
    },
    "protein": "chicken",
    "dietary": ["gluten-free"],
    "allergens": ["dairy"],
    "variants": {
      "spice_levels": ["mild", "medium", "hot"]
    },
    "customizations": {
      "add_ons": [
        {"name": "Extra Naan", "price": 2.50}
      ]
    }
  }
]`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="troubleshooting" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Cpu className="mr-2 h-5 w-5 text-indigo-400" />
                Troubleshooting Guide
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-md">
                  <h4 className="font-medium mb-2">SQL Function Issues</h4>
                  <p className="text-gray-300 mb-2">If the SQL function isn't working:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Check if the <Badge variant="outline">execute_sql</Badge> function exists in Supabase</li>
                    <li>Verify the SQL function has the correct parameter (<Badge variant="outline">sql_query</Badge>)</li>
                    <li>Make sure the function has proper permissions (<Badge variant="outline">SECURITY DEFINER</Badge>)</li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Missing Tables</h4>
                  <p className="text-gray-300 mb-2">If menu tables don't exist:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Use the "SQL Diagnostics" tab to check table status</li>
                    <li>Run the table creation queries to create missing tables</li>
                    <li>Verify proper foreign key relationships between tables</li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Empty Menu Data</h4>
                  <p className="text-gray-300 mb-2">If no menu data is being returned:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Check if menu items exist in the database</li>
                    <li>Verify items have <Badge variant="outline">active = true</Badge> and <Badge variant="outline">status = 'published'</Badge></li>
                    <li>Use the "Sample Data" tab to populate test data</li>
                    <li>Ensure all required price fields are populated</li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Mock Data Fallback</h4>
                  <p className="text-gray-300 mb-2">If the system is using mock data instead of real data:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Run the comprehensive test to identify exactly where the pipeline is failing</li>
                    <li>Check SQL error messages for clues about query failures</li>
                    <li>Verify the data extraction endpoints are properly handling errors</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
