"use client";

import { useState } from "react";
import { Schema, SchemaNode, NodeType, TestResultConfig, CardLink } from "@/types/schema";
import { Sidebar } from "@/components/schema-builder/Sidebar";
import { Header } from "@/components/schema-builder/Header";
import { Canvas } from "@/components/schema-builder/Canvas";
import { Palette } from "@/components/schema-builder/Palette";
import { JsonModal } from "@/components/schema-builder/JsonModal";

export default function SchemaBuilderPage() {
  const [schema, setSchema] = useState<Schema>({
    name: "New Schema",
    nodes: [],
    links: [],
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const handleNodeAdd = (nodeType: NodeType) => {
    let nodeData: Record<string, unknown> = {};

    if (nodeType.id === "phosphate-result") {
      nodeData = {
        testName: "Test P4",
        timestamp: "1h ago",
        analyteLabel: "Phosphate",
        status: "Elevated",
        statusIcon: "/Icons/exclamationmark.triangle 1.svg",
        trendImage: "/Icons/Phosphate_map.svg",
        value: 36.7,
        unit: "PPM",
        progress: 0.92,
        accentColor: "#3C7DE5",
      };
    }

    const newNode: SchemaNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType.id,
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      label: nodeType.label,
      analyteType: nodeType.analyteType,
      data: nodeData,
    };

    setSchema((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  const handleNodeMove = (id: string, x: number, y: number) => {
    setSchema((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === id ? { ...node, x, y } : node
      ),
    }));
  };

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(id);
  };

  const handleConfigChange = (nodeId: string, config: TestResultConfig) => {
    setSchema((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === nodeId ? { ...node, testConfig: config } : node
      ),
    }));
  };

  const handleLinkCreate = (sourceId: string, targetId: string, linkDotPos: { x: number; y: number }) => {
    // Check if link already exists
    const existingLink = schema.links?.find(
      (link) =>
        (link.sourceNodeId === sourceId && link.targetNodeId === targetId) ||
        (link.sourceNodeId === targetId && link.targetNodeId === sourceId)
    );
    if (existingLink) return;

    // Check unit compatibility
    const sourceNode = schema.nodes.find((n) => n.id === sourceId);
    const targetNode = schema.nodes.find((n) => n.id === targetId);
    
    if (sourceNode?.analyteType && targetNode?.analyteType) {
      const sourceUnit = (sourceNode.data as { unit?: string })?.unit;
      const targetUnit = (targetNode.data as { unit?: string })?.unit;
      
      if (sourceUnit && targetUnit && sourceUnit !== targetUnit) {
        // Show toast - we'll implement this later
        console.warn("These cards use different units and can't be linked yet.");
        return;
      }
    }

    const newLink: CardLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      linkDotPosition: linkDotPos,
    };

    setSchema((prev) => ({
      ...prev,
      links: [...(prev.links || []), newLink],
    }));
  };

  const handleLinkRemove = (linkId: string) => {
    setSchema((prev) => ({
      ...prev,
      links: (prev.links || []).filter((link) => link.id !== linkId),
    }));
  };

  const handleLinkUpdate = (linkId: string, updates: Partial<CardLink>) => {
    setSchema((prev) => ({
      ...prev,
      links: (prev.links || []).map((link) =>
        link.id === linkId ? { ...link, ...updates } : link
      ),
    }));
  };

  const handleApplyChanges = () => {
    setIsJsonModalOpen(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      <Header schemaName={schema.name} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentView="action-space" />
        <div className="flex-1 flex overflow-hidden">
          <Canvas
            nodes={schema.nodes}
            links={schema.links || []}
            onNodeMove={handleNodeMove}
            onNodeClick={handleNodeClick}
            onConfigChange={handleConfigChange}
            onLinkCreate={handleLinkCreate}
            onLinkRemove={handleLinkRemove}
            onLinkUpdate={handleLinkUpdate}
            selectedNodeId={selectedNodeId}
          />
          <Palette onNodeAdd={handleNodeAdd} />
        </div>
      </div>
      <JsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        schema={schema}
      />
    </div>
  );
}

