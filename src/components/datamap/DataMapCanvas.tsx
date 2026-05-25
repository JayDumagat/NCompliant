import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DataMapNode, type DataMapNodeType, type DataMapEdge as DataMapEdgeType } from '@/db/db';
import { OrgNode } from './OrgNode';
import { DeptNode } from './DeptNode';
import { ProcessNode } from './ProcessNode';
import { DataItemNode } from './DataItemNode';
import { DataFlowEdge } from './DataFlowEdge';
import { NodeDialog } from './NodeDialog';
import { EdgeDialog } from './EdgeDialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Maximize } from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  organization: OrgNode,
  department: DeptNode,
  process: ProcessNode,
  data_item: DataItemNode,
};

const edgeTypes: EdgeTypes = {
  dataflow: DataFlowEdge,
};

const CHILD_TYPE: Record<DataMapNodeType, DataMapNodeType | null> = {
  organization: 'department',
  department: 'process',
  process: 'data_item',
  data_item: null,
};

interface DataMapCanvasProps {
  level: DataMapNodeType;
  parentId: string | null;
  onDrillDown: (nodeId: string, nodeLabel: string) => void;
}

export function DataMapCanvas({ level, parentId, onDrillDown }: DataMapCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Dialogs
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<DataMapNode | null>(null);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [editingEdge, setEditingEdge] = useState<DataMapEdgeType | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  // Query data from Dexie
  const dbNodes = useLiveQuery(
    () => db.dataMapNodes.where('type').equals(level).filter(n => n.parentId === parentId).toArray(),
    [level, parentId]
  );

  const dbEdges = useLiveQuery(
    () => db.dataMapEdges.where('level').equals(level).filter(e => e.parentId === parentId).toArray(),
    [level, parentId]
  );

  // Child counts for drill-down indicator
  const childType = CHILD_TYPE[level];
  const allChildren = useLiveQuery(
    () => childType ? db.dataMapNodes.where('type').equals(childType).toArray() : Promise.resolve([] as DataMapNode[]),
    [childType]
  );

  const childCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (allChildren ?? []).forEach(c => {
      if (c.parentId) counts[c.parentId] = (counts[c.parentId] || 0) + 1;
    });
    return counts;
  }, [allChildren]);

  // Sync Dexie → React Flow nodes
  useEffect(() => {
    if (!dbNodes) return;
    const flowNodes: Node[] = dbNodes.map(n => ({
      id: n.id,
      type: n.type,
      position: { x: n.positionX, y: n.positionY },
      data: {
        label: n.label,
        description: n.description,
        color: n.color,
        icon: n.icon,
        metadata: n.metadata,
        childCount: childCounts[n.id] || 0,
      },
    }));
    setNodes(flowNodes);
  }, [dbNodes, childCounts, setNodes]);

  // Sync Dexie → React Flow edges
  useEffect(() => {
    if (!dbEdges) return;
    const flowEdges: Edge[] = dbEdges.map(e => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: 'dataflow',
      animated: e.animated,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      data: { label: e.label, dataTypes: e.dataTypes, animated: e.animated },
    }));
    setEdges(flowEdges);
  }, [dbEdges, setEdges]);

  // Persist node position on drag end
  const onNodeDragStop = useCallback(async (_: unknown, node: Node) => {
    await db.dataMapNodes.update(node.id, {
      positionX: node.position.x,
      positionY: node.position.y,
      updatedAt: Date.now(),
    });
  }, []);

  // Handle new connection → open edge dialog
  const onConnect = useCallback((conn: Connection) => {
    setPendingConnection(conn);
    setEditingEdge(null);
    setEdgeDialogOpen(true);
  }, []);

  // Save new edge
  const handleSaveEdge = useCallback(async (data: { label: string; dataTypes: string[]; animated: boolean }) => {
    if (pendingConnection) {
      const newEdge: DataMapEdgeType = {
        id: `dm-edge-${Date.now()}`,
        workspaceId: 'ws-default',
        sourceNodeId: pendingConnection.source!,
        targetNodeId: pendingConnection.target!,
        label: data.label,
        dataTypes: data.dataTypes,
        animated: data.animated,
        level,
        parentId,
        createdAt: Date.now(),
      };
      await db.dataMapEdges.add(newEdge);
      // Also add to local state for immediate update
      setEdges(eds => addEdge({
        ...pendingConnection,
        id: newEdge.id,
        type: 'dataflow',
        animated: data.animated,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: { label: data.label, dataTypes: data.dataTypes, animated: data.animated },
      }, eds) as Edge[]);
      toast.success('Connection created');
    } else if (editingEdge) {
      await db.dataMapEdges.update(editingEdge.id, { label: data.label, dataTypes: data.dataTypes, animated: data.animated });
      toast.success('Connection updated');
    }
    setPendingConnection(null);
    setEditingEdge(null);
    setEdgeDialogOpen(false);
  }, [pendingConnection, editingEdge, level, parentId, setEdges]);

  // Double click → drill down
  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    if (CHILD_TYPE[level]) {
      onDrillDown(node.id, node.data.label as string);
    }
  }, [level, onDrillDown]);

  // Edge double click → edit
  const onEdgeDoubleClick = useCallback((_: unknown, edge: Edge) => {
    const dbEdge = dbEdges?.find(e => e.id === edge.id);
    if (dbEdge) {
      setEditingEdge(dbEdge);
      setPendingConnection(null);
      setEdgeDialogOpen(true);
    }
  }, [dbEdges]);

  // Track selection
  const onSelectionChange = useCallback(({ nodes: sn, edges: se }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeIds(sn.map(n => n.id));
    setSelectedEdgeIds(se.map(e => e.id));
  }, []);

  // Add node
  const handleAddNode = useCallback(() => {
    setEditingNode(null);
    setNodeDialogOpen(true);
  }, []);

  // Save node (create or update)
  const handleSaveNode = useCallback(async (data: { label: string; description: string; color: string; metadata: Record<string, unknown> }) => {
    if (editingNode) {
      await db.dataMapNodes.update(editingNode.id, { ...data, updatedAt: Date.now() });
      toast.success('Node updated');
    } else {
      // Place new node at a reasonable position
      const existingPositions = nodes.map(n => n.position);
      const maxX = existingPositions.length > 0 ? Math.max(...existingPositions.map(p => p.x)) : 0;
      const newNode: DataMapNode = {
        id: `dm-${level.slice(0, 4)}-${Date.now()}`,
        workspaceId: 'ws-default',
        type: level,
        parentId,
        label: data.label,
        description: data.description,
        positionX: maxX + 280,
        positionY: 150 + Math.random() * 100,
        color: data.color,
        icon: level === 'organization' ? 'Building2' : level === 'department' ? 'Users' : level === 'process' ? 'Cpu' : 'FileText',
        metadata: data.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.dataMapNodes.add(newNode);
      toast.success('Node added');
    }
    setEditingNode(null);
    setNodeDialogOpen(false);
  }, [editingNode, level, parentId, nodes]);

  // Delete selected
  const handleDeleteSelected = useCallback(async () => {
    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

    // Cascade delete children of selected nodes
    for (const nodeId of selectedNodeIds) {
      const descendants = await getDescendants(nodeId);
      for (const descId of descendants) {
        await db.dataMapEdges.where('sourceNodeId').equals(descId).delete();
        await db.dataMapEdges.where('targetNodeId').equals(descId).delete();
        await db.dataMapNodes.delete(descId);
      }
      // Delete edges connected to this node
      await db.dataMapEdges.where('sourceNodeId').equals(nodeId).delete();
      await db.dataMapEdges.where('targetNodeId').equals(nodeId).delete();
      await db.dataMapNodes.delete(nodeId);
    }

    for (const edgeId of selectedEdgeIds) {
      await db.dataMapEdges.delete(edgeId);
    }

    const total = selectedNodeIds.length + selectedEdgeIds.length;
    toast.success(`Deleted ${total} item${total > 1 ? 's' : ''}`);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, [selectedNodeIds, selectedEdgeIds]);

  // Context menu on node (right-click → edit)
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const dbNode = dbNodes?.find(n => n.id === node.id);
    if (dbNode) {
      setEditingNode(dbNode);
      setNodeDialogOpen(true);
    }
  }, [dbNodes]);

  const hasSelection = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0;

  const levelLabels: Record<DataMapNodeType, string> = {
    organization: 'Organization',
    department: 'Department',
    process: 'Process',
    data_item: 'Data Item',
  };

  return (
    <div className="relative h-full w-full">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <Button size="sm" className="gap-1.5 h-8 text-xs shadow-md" onClick={handleAddNode}>
          <Plus className="h-3.5 w-3.5" />
          Add {levelLabels[level]}
        </Button>
        {hasSelection && (
          <Button size="sm" variant="destructive" className="gap-1.5 h-8 text-xs shadow-md" onClick={handleDeleteSelected}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete ({selectedNodeIds.length + selectedEdgeIds.length})
          </Button>
        )}
      </div>

      {/* Hint */}
      {CHILD_TYPE[level] && (
        <div className="absolute top-3 right-14 z-10">
          <div className="rounded-md bg-card/90 backdrop-blur-sm border px-2.5 py-1.5 shadow-sm">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Maximize className="h-3 w-3" />
              Double-click to drill down · Right-click to edit
            </p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'dataflow', markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 } }}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        className="datamap-canvas"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} className="!shadow-md !border !rounded-lg" />
        <MiniMap
          pannable
          zoomable
          className="!shadow-md !border !rounded-lg"
          maskColor="var(--muted)"
          nodeColor={(node) => (node.data?.color as string) || '#6b7280'}
        />
      </ReactFlow>

      {/* Dialogs */}
      <NodeDialog
        open={nodeDialogOpen}
        onOpenChange={setNodeDialogOpen}
        nodeType={level}
        initialData={editingNode ? { label: editingNode.label, description: editingNode.description, color: editingNode.color, metadata: editingNode.metadata } : undefined}
        onSave={handleSaveNode}
      />
      <EdgeDialog
        open={edgeDialogOpen}
        onOpenChange={v => { setEdgeDialogOpen(v); if (!v) { setPendingConnection(null); setEditingEdge(null); } }}
        initialData={editingEdge ? { label: editingEdge.label, dataTypes: editingEdge.dataTypes, animated: editingEdge.animated } : undefined}
        onSave={handleSaveEdge}
      />
    </div>
  );
}

/** Recursively collect all descendant node IDs */
async function getDescendants(nodeId: string): Promise<string[]> {
  const children = await db.dataMapNodes.where('parentId').equals(nodeId).toArray();
  const ids: string[] = [];
  for (const child of children) {
    ids.push(child.id);
    const grandchildren = await getDescendants(child.id);
    ids.push(...grandchildren);
  }
  return ids;
}
