import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ChevronRight, DollarSign, Package } from "lucide-react";
import { debounce } from "lodash";

interface Element {
  id: number;
  code: string;
  category: string;
  subcategory: string;
  name: string;
  description: string | null;
  unit: string;
}

interface ElementRate {
  elementId: number;
  low: number;
  median: number;
  high: number;
  confidence: "high" | "medium" | "low";
  regionalFactor: number;
}

interface ElementSelectorProps {
  onSelect: (element: Element, rate: ElementRate | null) => void;
  region?: string;
  buildingType?: string;
  quality?: string;
  placeholder?: string;
  className?: string;
}

export function ElementSelector({
  onSelect,
  region = "Sydney",
  buildingType = "residential_detached",
  quality = "standard",
  placeholder = "Search elements by name, code, or description...",
  className = "",
}: ElementSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setIsOpen(query.length >= 2);
      setSelectedIndex(0);
    }, 150),
    []
  );

  // Fetch search results
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["/api/elements", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await apiRequest("GET", `/api/elements?search=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Fetch preview rates for top results
  const { data: ratePreviews = {} } = useQuery({
    queryKey: ["/api/costs/estimate-bulk", searchResults.slice(0, 5).map((e: Element) => e.id)],
    queryFn: async () => {
      const items = searchResults.slice(0, 5).map((el: Element) => ({
        elementId: el.id,
        quantity: 1,
      }));
      
      if (items.length === 0) return {};
      
      const res = await apiRequest("POST", "/api/costs/estimate-bulk", {
        items,
        region,
        buildingType,
        quality,
      });
      
      const data = await res.json();
      const rateMap: Record<number, ElementRate> = {};
      
      for (const item of data.items) {
        if (!item.error) {
          rateMap[item.elementId] = {
            elementId: item.elementId,
            low: item.low,
            median: item.median,
            high: item.high,
            confidence: item.confidence,
            regionalFactor: item.regionalFactor || 1,
          };
        }
      }
      
      return rateMap;
    },
    enabled: searchResults.length > 0 && isOpen,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (element: Element) => {
    const rate = ratePreviews[element.id] || null;
    onSelect(element, rate);
    setSearchQuery("");
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-green-100 text-green-800 text-xs">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Med</Badge>;
      case "low":
        return <Badge className="bg-amber-100 text-amber-800 text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  // Close on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  // Add/remove click outside listener
  const handleFocus = () => {
    if (inputRef.current?.value && inputRef.current.value.length >= 2) {
      setIsOpen(true);
    }
    document.addEventListener("mousedown", handleClickOutside);
  };

  const handleBlur = () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          onChange={(e) => debouncedSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-4"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {searchResults.map((element: Element, index: number) => {
                const rate = ratePreviews[element.id];
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={element.id}
                    onClick={() => handleSelect(element)}
                    className={`w-full text-left p-3 border-b last:border-b-0 transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {element.code} - {element.name}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {element.unit}
                          </Badge>
                        </div>
                        
                        {element.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {element.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {element.category}
                          </Badge>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{element.subcategory}</span>
                        </div>
                      </div>

                      <div className="ml-4 text-right shrink-0">
                        {rate ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="w-3 h-3 text-green-600" />
                              <span className="font-semibold text-green-600">
                                {rate.median.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-gray-500">{element.unit}</span>
                              {getConfidenceBadge(rate.confidence)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            No rate
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {searchResults.length >= 20 && (
              <div className="p-2 text-center text-xs text-gray-500 border-t">
                Showing top 20 results. Refine your search for more.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isOpen && searchQuery.length >= 2 && searchResults.length === 0 && !isLoading && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-4 text-center text-gray-500">
            No elements found matching "{searchQuery}"
          </CardContent>
        </Card>
      )}
    </div>
  );
}
