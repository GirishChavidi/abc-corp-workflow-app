import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// ─── Start Node ─────────────────────────────────────────────────────────────
export const StartNode = memo(({ data, selected }) => (
  <div className={`workflow-node node-start ${selected ? 'ring-2 ring-green-400' : ''}`}>
    <Handle type="source" position={Position.Bottom} className="!bg-green-600" />
    <div className="flex items-center gap-2 justify-center">
      <span>▶</span>
      <span>{data.label || 'Start'}</span>
    </div>
  </div>
));

// ─── End Node ───────────────────────────────────────────────────────────────
export const EndNode = memo(({ data, selected }) => (
  <div className={`workflow-node node-end ${selected ? 'ring-2 ring-pink-400' : ''}`}>
    <Handle type="target" position={Position.Top} className="!bg-pink-600" />
    <div className="flex items-center gap-2 justify-center">
      <span>⏹</span>
      <span>{data.label || 'End'}</span>
    </div>
  </div>
));

// ─── Decision Node (Diamond shape via CSS) ──────────────────────────────────
export const DecisionNode = memo(({ data, selected }) => (
  <div className={`workflow-node node-decision ${selected ? 'ring-2 ring-yellow-400' : ''}`} style={{ clipPath: 'none', background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', minWidth: 180 }}>
    <Handle type="target" position={Position.Top} className="!bg-yellow-600" />
    <Handle type="source" position={Position.Bottom} className="!bg-yellow-600" id="default" />
    <Handle type="source" position={Position.Right} className="!bg-yellow-600" id="yes" />
    <Handle type="source" position={Position.Left} className="!bg-yellow-600" id="no" />
    <div className="text-center">
      <div className="text-xs text-yellow-700 font-bold mb-1">◆ DECISION</div>
      <div className="font-semibold text-sm">{data.label || 'Decision'}</div>
      {data.options && (
        <div className="text-xs text-yellow-600 mt-1 flex gap-1 justify-center flex-wrap">
          {data.options.map((o, i) => (
            <span key={i} className="bg-yellow-200 px-1.5 py-0.5 rounded">{o}</span>
          ))}
        </div>
      )}
    </div>
  </div>
));

// ─── Process Node ───────────────────────────────────────────────────────────
export const ProcessNode = memo(({ data, selected }) => (
  <div className={`workflow-node node-process ${selected ? 'ring-2 ring-blue-400' : ''}`}>
    <Handle type="target" position={Position.Top} className="!bg-blue-600" />
    <Handle type="source" position={Position.Bottom} className="!bg-blue-600" />
    <div className="flex items-center gap-2 justify-center">
      <span>⚙️</span>
      <span>{data.label || 'Process'}</span>
    </div>
  </div>
));

// ─── Training Node ──────────────────────────────────────────────────────────
export const TrainingNode = memo(({ data, selected }) => (
  <div className={`workflow-node node-training ${selected ? 'ring-2 ring-indigo-400' : ''}`} style={{ minWidth: 200 }}>
    <Handle type="target" position={Position.Top} className="!bg-indigo-600" />
    <Handle type="source" position={Position.Bottom} className="!bg-indigo-600" />
    <div>
      <div className="text-xs text-indigo-500 font-bold mb-1">📚 TRAINING</div>
      <div className="font-semibold text-sm">{data.label || 'Select Trainings'}</div>
      {data.trainings && data.trainings.length > 0 && (
        <div className="mt-2 text-xs space-y-1">
          {data.trainings.map((t, i) => (
            <div key={i} className="bg-indigo-100 px-2 py-1 rounded text-indigo-700 capitalize">
              {t.replace('_', ' ')}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
));

// ─── Payment Node ───────────────────────────────────────────────────────────
export const PaymentNode = memo(({ data, selected }) => (
  <div className={`workflow-node node-payment ${selected ? 'ring-2 ring-yellow-400' : ''}`} style={{ minWidth: 200 }}>
    <Handle type="target" position={Position.Top} className="!bg-yellow-600" />
    <Handle type="source" position={Position.Bottom} className="!bg-yellow-600" />
    <div>
      <div className="text-xs text-yellow-700 font-bold mb-1">💰 PAYMENT</div>
      <div className="font-semibold text-sm">{data.label || 'Payment Assignment'}</div>
      {data.payments && Object.keys(data.payments).length > 0 && (
        <div className="mt-2 text-xs space-y-1">
          {Object.entries(data.payments).map(([training, payer], i) => (
            <div key={i} className="bg-yellow-100 px-2 py-1 rounded text-yellow-800 capitalize">
              {training.replace('_', ' ')}: <b>{payer.replace('_', ' ')}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
));

// ─── Vendor Node ────────────────────────────────────────────────────────────
export const VendorNode = memo(({ data, selected }) => (
  <div className={`workflow-node node-vendor ${selected ? 'ring-2 ring-purple-400' : ''}`} style={{ minWidth: 200 }}>
    <Handle type="target" position={Position.Top} className="!bg-purple-600" />
    <Handle type="source" position={Position.Bottom} className="!bg-purple-600" />
    <div>
      <div className="text-xs text-purple-500 font-bold mb-1">🏪 VENDOR</div>
      <div className="font-semibold text-sm">{data.label || 'Assign Vendors'}</div>
      {data.vendors && Object.keys(data.vendors).length > 0 && (
        <div className="mt-2 text-xs space-y-1">
          {Object.entries(data.vendors).map(([training, vendor], i) => (
            <div key={i} className="bg-purple-100 px-2 py-1 rounded text-purple-700 capitalize">
              {training.replace('_', ' ')}: <b>{vendor}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
));

// Export node types map for React Flow
export const nodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  decisionNode: DecisionNode,
  processNode: ProcessNode,
  trainingNode: TrainingNode,
  paymentNode: PaymentNode,
  vendorNode: VendorNode,
};
