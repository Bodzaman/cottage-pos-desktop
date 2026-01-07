import React from "react";
import CategoryManagement from "./CategoryManagement";

interface CategoriesTabProps {
  onMenuChange: () => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ onMenuChange }) => {
  return (
    <CategoryManagement
      onMenuChange={onMenuChange}
      className=""
    />
  );
};

export default CategoriesTab;
