import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MATERIALS, type MaterialType } from "@shared/schema";

interface MaterialSelectorProps {
  selectedMaterial: MaterialType;
  onMaterialSelect: (material: MaterialType) => void;
}

export function MaterialSelector({ selectedMaterial, onMaterialSelect }: MaterialSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Floor Materials
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-3">
          {Object.entries(MATERIALS).map(([key, material]) => (
            <Button
              key={key}
              variant={selectedMaterial === key ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 ${
                selectedMaterial === key 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onMaterialSelect(key as MaterialType)}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: material.color }}
                />
                <div className="text-left">
                  <p className="font-medium">{material.name}</p>
                  <p className="text-sm opacity-75">
                    {key === 'timber' && 'Hardwood flooring'}
                    {key === 'carpet' && 'Quality carpet'}
                    {key === 'tiles' && 'Ceramic tiles'}
                    {key === 'laminate' && 'Laminate flooring'}
                    {key === 'vinyl' && 'Vinyl planks'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold">
                ${material.cost}/m²
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
