import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TemplateVariablesDialogProps {
  variables?: Record<string, any[]>;
}

const TemplateVariablesDialog = ({ variables = {} }: TemplateVariablesDialogProps) => {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold">Template Variables Reference</h3>
      <p className="text-sm text-muted-foreground">
        Use these variables in your template header, body, and footer to include dynamic data.
        Variables are enclosed in double curly braces like <code className="bg-muted p-1 rounded">{'{{variable.name}}'}</code>.
      </p>
      
      {/* Basic variable documentation */}
      <div className="p-4 border rounded-md bg-muted/30 space-y-3">
        <h4 className="text-sm font-semibold">Available Variables</h4>
        <div className="text-sm text-muted-foreground">
          <p>Template variables allow you to insert dynamic content into your templates:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Business:</strong> Restaurant name, address, contact details</li>
            <li><strong>Order:</strong> Order number, total, items, payment method</li>
            <li><strong>Customer:</strong> Name, contact details, delivery address</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemplateVariablesDialog;
