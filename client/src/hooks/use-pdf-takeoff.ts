import { useState, useCallback, useEffect } from 'react';

export interface Measurement {
  id: string;
  type: 'area' | 'length';
  points: { x: number; y: number }[];
  value: number;
  unit: 'm2' | 'm' | 'mm' | 'ft2' | 'ft';
  label: string;
  elementType: 'floor' | 'wall' | 'ceiling' | 'opening' | 'structural' | 'other';
  pageNumber: number;
  color?: string;
  createdAt: string;
}

export interface PDFTakeoff {
  id: number;
  projectId: number;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  pageCount: number;
  scaleRatio: number | null;
  scaleCalibration: {
    pixelDistance: number;
    realDistance: number;
    unit: 'm' | 'mm' | 'ft';
  } | null;
  measurements: Measurement[];
  pages: {
    pageNumber: number;
    imageUrl: string;
    width: number;
    height: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface UsePDFTakeoffReturn {
  takeoffs: PDFTakeoff[];
  currentTakeoff: PDFTakeoff | null;
  isLoading: boolean;
  error: string | null;
  fetchTakeoffs: (projectId: number) => Promise<void>;
  fetchTakeoff: (id: number) => Promise<void>;
  createTakeoff: (projectId: number, file: File) => Promise<PDFTakeoff | null>;
  updateMeasurements: (id: number, measurements: Measurement[], scaleCalibration?: any) => Promise<void>;
  deleteTakeoff: (id: number) => Promise<void>;
  clearError: () => void;
}

export function usePDFTakeoff(): UsePDFTakeoffReturn {
  const [takeoffs, setTakeoffs] = useState<PDFTakeoff[]>([]);
  const [currentTakeoff, setCurrentTakeoff] = useState<PDFTakeoff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchTakeoffs = useCallback(async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/pdf-takeoffs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF takeoffs');
      }
      
      const data = await response.json();
      setTakeoffs(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTakeoff = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pdf-takeoff/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF takeoff');
      }
      
      const data = await response.json();
      setCurrentTakeoff(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTakeoff = useCallback(async (projectId: number, file: File): Promise<PDFTakeoff | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('projectId', projectId.toString());
      
      const response = await fetch('/api/pdf-takeoff/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload PDF');
      }
      
      const data = await response.json();
      
      if (data.success && data.takeoff) {
        // Fetch full takeoff data with pages
        await fetchTakeoff(parseInt(data.takeoff.id));
        
        // Refresh the list
        await fetchTakeoffs(projectId);
        
        return currentTakeoff;
      }
      
      return null;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentTakeoff, fetchTakeoff, fetchTakeoffs]);

  const updateMeasurements = useCallback(async (
    id: number,
    measurements: Measurement[],
    scaleCalibration?: any
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pdf-takeoff/${id}/measurements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ measurements, scaleCalibration }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update measurements');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentTakeoff(data.takeoff);
        
        // Update in the list as well
        setTakeoffs(prev => 
          prev.map(t => t.id === id ? data.takeoff : t)
        );
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTakeoff = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/pdf-takeoff/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete PDF takeoff');
      }
      
      setTakeoffs(prev => prev.filter(t => t.id !== id));
      
      if (currentTakeoff?.id === id) {
        setCurrentTakeoff(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentTakeoff]);

  return {
    takeoffs,
    currentTakeoff,
    isLoading,
    error,
    fetchTakeoffs,
    fetchTakeoff,
    createTakeoff,
    updateMeasurements,
    deleteTakeoff,
    clearError,
  };
}
