import { useState, useCallback } from 'react';
import { DataMapCanvas } from '@/components/datamap/DataMapCanvas';
import { MapBreadcrumb, type BreadcrumbItem } from '@/components/datamap/MapBreadcrumb';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DataMapNodeType } from '@/db/db';

const LEVEL_ORDER: DataMapNodeType[] = ['organization', 'department', 'process', 'data_item'];

export default function DataMapping() {
  // Navigation stack: [{id, label, level}]
  const [path, setPath] = useState<BreadcrumbItem[]>([
    { id: null, label: 'Organizations', level: 'organization' },
  ]);

  const currentLevel = path[path.length - 1];
  const parentId = currentLevel.id;

  const handleDrillDown = useCallback((nodeId: string, nodeLabel: string) => {
    const currentIdx = LEVEL_ORDER.indexOf(currentLevel.level);
    if (currentIdx >= LEVEL_ORDER.length - 1) return; // data_item has no children
    const nextLevel = LEVEL_ORDER[currentIdx + 1];
    setPath(prev => [...prev, { id: nodeId, label: nodeLabel, level: nextLevel }]);
  }, [currentLevel.level]);

  const handleNavigate = useCallback((index: number) => {
    setPath(prev => prev.slice(0, index + 1));
  }, []);

  const handleBack = useCallback(() => {
    if (path.length > 1) {
      setPath(prev => prev.slice(0, -1));
    }
  }, [path.length]);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]" data-full-width>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-background shrink-0">
        {path.length > 1 && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <MapBreadcrumb path={path} onNavigate={handleNavigate} />
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <DataMapCanvas
          key={`${currentLevel.level}-${parentId}`}
          level={currentLevel.level}
          parentId={parentId}
          onDrillDown={handleDrillDown}
        />
      </div>
    </div>
  );
}
