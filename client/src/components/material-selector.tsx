import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Leaf } from "lucide-react";
import { MATERIALS, type MaterialType } from "@shared/schema";

interface MaterialSelectorProps {
  selectedMaterial: MaterialType;
  onMaterialSelect: (material: MaterialType) => void;
}

export function MaterialSelector({ selectedMaterial, onMaterialSelect }: MaterialSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const allMaterials = useMemo(() => {
    return Object.entries(MATERIALS).map(([key, material]) => ({
      key: key as MaterialType,
      ...material,
      category: getCategory(key),
    }));
  }, []);

  const filteredMaterials = useMemo(() => {
    let filtered = allMaterials.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          material.key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || material.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort materials
    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "cost") return a.cost - b.cost;
      if (sortBy === "eco" && "ecoRating" in a && "ecoRating" in b) {
        return (b.ecoRating || 0) - (a.ecoRating || 0);
      }
      return 0;
    });

    return filtered;
  }, [allMaterials, searchTerm, filterCategory, sortBy]);

  function getCategory(key: string): string {
    if (key.includes("structural") || key.includes("concrete") || key.includes("steel") || key.includes("timber_")) return "structural";
    if (key.includes("wall") || key.includes("cladding") || key.includes("brick") || key.includes("render")) return "walls";
    if (key.includes("roof") || key.includes("membrane") || key.includes("tiles") && !key.includes("floor")) return "roofing";
    if (key.includes("insulation")) return "insulation";
    if (key.includes("window") || key.includes("door")) return "openings";
    if (key.includes("floor") || key.includes("carpet") || key.includes("vinyl") || key.includes("laminate")) return "flooring";
    if (key.includes("paint") || key.includes("plaster")) return "finishes";
    if (key.includes("hvac") || key.includes("heating") || key.includes("ventilation")) return "mechanical";
    if (key.includes("electrical") || key.includes("lighting") || key.includes("power")) return "electrical";
    if (key.includes("plumbing") || key.includes("toilet") || key.includes("basin") || key.includes("shower")) return "plumbing";
    return "other";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Materials Database ({filteredMaterials.length} items)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="walls">Walls</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="flooring">Flooring</SelectItem>
                <SelectItem value="insulation">Insulation</SelectItem>
                <SelectItem value="openings">Windows & Doors</SelectItem>
                <SelectItem value="finishes">Finishes</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="eco">Eco Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMaterials.map((material) => (
            <Button
              key={material.key}
              variant={selectedMaterial === material.key ? "default" : "outline"}
              className={`w-full justify-between h-auto p-3 ${
                selectedMaterial === material.key 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onMaterialSelect(material.key)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div 
                  className="w-4 h-4 rounded-sm border border-gray-300"
                  style={{ backgroundColor: material.color }}
                />
                <div className="text-left flex-1">
                  <p className="font-medium">{material.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {"source" in material && (
                      <Badge variant="secondary" className="text-xs">
                        {material.source}
                      </Badge>
                    )}
                    {"ecoRating" in material && (
                      <div className="flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">{material.ecoRating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold">
                  ${material.cost}
                </span>
                <span className="text-xs text-gray-500 block">
                  {"unit" in material ? `/${material.unit}` : "/m²"}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
