import React from 'react';

const nodeTemplates = [
  { type: 'startNode', label: '▶ Start', color: 'border-green-400 text-green-700' },
  { type: 'endNode', label: '⏹ End', color: 'border-pink-400 text-pink-700' },
  { type: 'decisionNode', label: '◆ Decision', color: 'border-yellow-400 text-yellow-700' },
  { type: 'processNode', label: '⚙️ Process', color: 'border-blue-400 text-blue-700' },
  { type: 'trainingNode', label: '📚 Training', color: 'border-indigo-400 text-indigo-700' },
  { type: 'paymentNode', label: '💰 Payment', color: 'border-yellow-400 text-yellow-700' },
  { type: 'vendorNode', label: '🏪 Vendor', color: 'border-purple-400 text-purple-700' },
];

export default function NodePalette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-56">
      <h3 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">
        Drag & Drop Nodes
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Drag nodes onto the canvas to build your workflow
      </p>
      <div className="space-y-2">
        {nodeTemplates.map((node) => (
          <div
            key={node.type}
            className={`dnd-node border-2 ${node.color} cursor-grab active:cursor-grabbing`}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
          >
            {node.label}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-bold text-xs text-gray-500 uppercase mb-2">Quick Tips</h4>
        <ul className="text-xs text-gray-400 space-y-1.5">
          <li>• Drag nodes from here to canvas</li>
          <li>• Connect nodes by dragging handles</li>
          <li>• Click a node to edit its properties</li>
          <li>• Use Delete key to remove selected</li>
          <li>• Scroll to zoom, drag to pan</li>
        </ul>
      </div>
    </div>
  );
}
