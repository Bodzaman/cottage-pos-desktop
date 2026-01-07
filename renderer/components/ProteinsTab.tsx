import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2
} from "lucide-react";

import { apiClient } from "app";
import ProteinForm from "./ProteinForm";

// Types
interface ProteinType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProteinsTabProps {
  proteins: ProteinType[];
  onRefreshProteins: () => void;
}

const ProteinsTab: React.FC<ProteinsTabProps> = ({
  proteins,
  onRefreshProteins
}) => {
  // Local state for this tab
  const [proteinSearchQuery, setProteinSearchQuery] = useState('');
  const [isCreateProteinDialogOpen, setIsCreateProteinDialogOpen] = useState(false);
  const [isEditProteinDialogOpen, setIsEditProteinDialogOpen] = useState(false);
  const [editingProtein, setEditingProtein] = useState<ProteinType | null>(null);

  // Filter proteins based on search
  const filteredProteins = proteins.filter(protein => 
    proteinSearchQuery === '' || 
    protein.name.toLowerCase().includes(proteinSearchQuery.toLowerCase()) ||
    protein.description?.toLowerCase().includes(proteinSearchQuery.toLowerCase())
  );

  const handleCreateProtein = async (proteinData: any) => {
    try {
      const response = await apiClient.create_protein_type2(proteinData); // Use menu_protein_types API
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`Protein '${result.protein_type.name}' created successfully`);
          await onRefreshProteins();
          setIsCreateProteinDialogOpen(false);
        } else {
          toast.error(result.message || 'Failed to create protein');
        }
      } else {
        toast.error('Failed to create protein');
      }
    } catch (error) {
      console.error('Error creating protein:', error);
      toast.error('Error creating protein');
    }
  };

  const handleUpdateProtein = async (proteinId: string, updatedData: Partial<ProteinType>) => {
    try {
      const response = await apiClient.update_protein_type2({ proteinId }, updatedData); // Use correct API and parameter name
      if (response.ok) {
        // Handle 204 No Content response (successful update with no body)
        if (response.status === 204) {
          toast.success('Protein updated successfully');
          await onRefreshProteins();
          setIsEditProteinDialogOpen(false); // Close the dialog
        } else {
          // Handle responses with body
          const result = await response.json();
          if (result.success) {
            toast.success('Protein updated successfully');
            await onRefreshProteins();
            setIsEditProteinDialogOpen(false); // Close the dialog
          } else {
            toast.error(result.message || 'Failed to update protein');
          }
        }
      } else {
        toast.error('Failed to update protein');
      }
    } catch (error) {
      console.error('Error updating protein:', error);
      toast.error('Error updating protein');
    }
  };

  const handleDeleteProtein = async (proteinId: string, proteinName: string) => {
    if (!confirm(`Are you sure you want to delete '${proteinName}'? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiClient.delete_protein_type2({ proteinId }); // Use correct API and parameter name
      if (response.ok) {
        // Handle 204 No Content response (successful deletion with no body)
        if (response.status === 204) {
          toast.success(`Protein '${proteinName}' deleted successfully`);
          await onRefreshProteins();
        } else {
          // Handle responses with body
          const result = await response.json();
          if (result.success) {
            toast.success(`Protein '${proteinName}' deleted successfully`);
            await onRefreshProteins();
          } else {
            toast.error(result.message || 'Failed to delete protein');
          }
        }
      } else {
        toast.error('Failed to delete protein');
      }
    } catch (error) {
      console.error('Error deleting protein:', error);
      toast.error('Error deleting protein');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Protein Management</h2>
        <Button 
          onClick={() => setIsCreateProteinDialogOpen(true)}
          className="bg-[#7C5DFA] hover:bg-[#6B4DEA] text-white border border-[#7C5DFA]/30 hover:border-[#7C5DFA]/50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Protein
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search proteins..."
            value={proteinSearchQuery}
            onChange={(e) => setProteinSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] text-white"
          />
        </div>
      </div>

      {/* Protein List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProteins.map((protein) => (
          <Card key={protein.id} className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.4)] transition-colors">
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="font-medium text-white text-lg">{protein.name}</h3>
                {protein.description && (
                  <p className="text-gray-400 text-sm mt-1">{protein.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProtein(protein);
                    setIsEditProteinDialogOpen(true);
                  }}
                  className="flex-1 border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)]"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProtein(protein.id, protein.name)}
                  className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProteins.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No proteins found. Create your first protein type to get started.</p>
        </div>
      )}

      {/* Create Protein Dialog */}
      <Dialog open={isCreateProteinDialogOpen} onOpenChange={setIsCreateProteinDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Protein Type</DialogTitle>
            <DialogDescription>
              Create a new protein type for your menu items.
            </DialogDescription>
          </DialogHeader>
          <ProteinForm onSave={handleCreateProtein} onCancel={() => setIsCreateProteinDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Protein Dialog */}
      <Dialog open={isEditProteinDialogOpen} onOpenChange={setIsEditProteinDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Protein Type</DialogTitle>
            <DialogDescription>
              Modify the protein type details.
            </DialogDescription>
          </DialogHeader>
          {editingProtein && (
            <ProteinForm 
              protein={editingProtein} 
              onSave={(data) => handleUpdateProtein(editingProtein.id, data)} 
              onCancel={() => {
                setIsEditProteinDialogOpen(false);
                setEditingProtein(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProteinsTab;
