import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from '../components/workflow/WorkflowNodes';
import NodePalette from '../components/workflow/NodePalette';
import NodeEditor from '../components/workflow/NodeEditor';
import { projectsAPI, vendorsAPI, workflowsAPI } from '../api';
import useStore from '../store';

let nodeIdCounter = 0;
const getNextId = () => `node_${Date.now()}_${nodeIdCounter++}`;

const defaultEdgeOptions = {
  animated: true,
  style: { strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed },
};

export default function WorkflowBuilder() {
  const { id } = useParams();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [project, setProject] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  const showNotification = useStore((s) => s.showNotification);
  const isManager = useStore((s) => s.user?.role === 'account_manager');

  // Load project and vendors
  useEffect(() => {
    Promise.all([projectsAPI.get(id), vendorsAPI.list(), workflowsAPI.list()])
      .then(([p, v, t]) => {
        setProject(p);
        setVendors(v);
        setTemplates(t);
        // Load existing workflow
        if (p.workflow_data?.nodes?.length) {
          setNodes(p.workflow_data.nodes);
          setEdges(p.workflow_data.edges || []);
        } else {
          // Default starter nodes
          setNodes([
            { id: 'start', type: 'startNode', position: { x: 300, y: 50 }, data: { label: 'Project Start' } },
            { id: 'end', type: 'endNode', position: { x: 300, y: 600 }, data: { label: 'Hire' } },
          ]);
        }
      })
      .catch(() => showNotification('Failed to load project', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  // ─── React Flow callbacks ─────────────────────────────────────────────────
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions, id: `e_${Date.now()}` }, eds)),
    []
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ─── Drag and Drop from palette ──────────────────────────────────────────
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const labelMap = {
        startNode: 'Start',
        endNode: 'End',
        decisionNode: 'Decision',
        processNode: 'Process Step',
        trainingNode: 'Training',
        paymentNode: 'Payment',
        vendorNode: 'Vendor Assignment',
      };

      const newNode = {
        id: getNextId(),
        type,
        position,
        data: {
          label: labelMap[type] || 'New Node',
          ...(type === 'decisionNode' ? { options: ['Yes', 'No'] } : {}),
          ...(type === 'trainingNode' ? { trainings: [] } : {}),
          ...(type === 'paymentNode' ? { payments: {} } : {}),
          ...(type === 'vendorNode' ? { vendors: {} } : {}),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance]
  );

  // ─── Delete selected node ────────────────────────────────────────────────
  const onKeyDown = useCallback(
    (event) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
      }
    },
    [selectedNode]
  );

  // ─── Update node data from editor ────────────────────────────────────────
  const handleNodeUpdate = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...newData } } : n))
    );
  }, []);

  // ─── Save workflow ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const workflow_data = { nodes, edges };
      await projectsAPI.saveWorkflow(id, workflow_data);
      showNotification('Workflow saved successfully');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Load template ───────────────────────────────────────────────────────
  const handleLoadTemplate = (template) => {
    if (template.workflow_data?.nodes) {
      setNodes(template.workflow_data.nodes);
      setEdges(template.workflow_data.edges || []);
      showNotification(`Loaded template: ${template.name}`);
    }
    setShowTemplates(false);
  };

  // ─── Save as template ────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      await workflowsAPI.create({
        name: templateName,
        description: templateDesc,
        workflow_data: { nodes, edges },
      });
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateDesc('');
      showNotification('Template saved');
      // Refresh templates
      workflowsAPI.list().then(setTemplates);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // ─── Auto-generate workflow ───────────────────────────────────────────────
  const handleAutoGenerate = () => {
    const isOnsite = project?.type === 'on-site';
    const generatedNodes = [
      { id: 'start', type: 'startNode', position: { x: 300, y: 0 }, data: { label: 'Project Start' } },
      { id: 'type-check', type: 'decisionNode', position: { x: 300, y: 120 }, data: { label: `Project Type: ${project?.type || '?'}`, field: 'project_type', options: ['on-site', 'off-site'] } },
      { id: 'training-check', type: 'decisionNode', position: { x: 300, y: 260 }, data: { label: 'Training Required?', field: 'training_required', options: ['Yes', 'No'] } },
      { id: 'training-select', type: 'trainingNode', position: { x: 120, y: 400 }, data: { label: 'Select Trainings', trainings: isOnsite ? ['computer_skills', 'business_skills'] : [] } },
      { id: 'payment', type: 'paymentNode', position: { x: 120, y: 540 }, data: { label: 'Assign Payment', payments: {} } },
      { id: 'vendor-assign', type: 'vendorNode', position: { x: 120, y: 680 }, data: { label: 'Assign Vendors', vendors: {} } },
      { id: 'cert-check', type: 'decisionNode', position: { x: 120, y: 820 }, data: { label: 'Certification Required?', field: 'certification', options: ['Yes', 'No'] } },
      { id: 'interview', type: 'processNode', position: { x: 300, y: 960 }, data: { label: 'Client Interviews' } },
      { id: 'shortlist', type: 'processNode', position: { x: 300, y: 1080 }, data: { label: 'Shortlist Candidates' } },
      { id: 'offer', type: 'processNode', position: { x: 300, y: 1200 }, data: { label: 'Issue Offer Letters' } },
      { id: 'hire', type: 'endNode', position: { x: 300, y: 1320 }, data: { label: 'Hire Candidates' } },
    ];

    const generatedEdges = [
      { id: 'e1', source: 'start', target: 'type-check', ...defaultEdgeOptions },
      { id: 'e2', source: 'type-check', target: 'training-check', ...defaultEdgeOptions },
      { id: 'e3', source: 'training-check', target: 'training-select', ...defaultEdgeOptions, label: 'Yes' },
      { id: 'e4', source: 'training-check', target: 'interview', ...defaultEdgeOptions, label: 'No' },
      { id: 'e5', source: 'training-select', target: 'payment', ...defaultEdgeOptions },
      { id: 'e6', source: 'payment', target: 'vendor-assign', ...defaultEdgeOptions },
      { id: 'e7', source: 'vendor-assign', target: 'cert-check', ...defaultEdgeOptions },
      { id: 'e8', source: 'cert-check', target: 'interview', ...defaultEdgeOptions },
      { id: 'e9', source: 'interview', target: 'shortlist', ...defaultEdgeOptions },
      { id: 'e10', source: 'shortlist', target: 'offer', ...defaultEdgeOptions },
      { id: 'e11', source: 'offer', target: 'hire', ...defaultEdgeOptions },
    ];

    setNodes(generatedNodes);
    setEdges(generatedEdges);
    showNotification('Workflow auto-generated based on project type');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]" onKeyDown={onKeyDown} tabIndex={0}>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${id}`} className="text-gray-500 hover:text-gray-700">
            ← Back to Project
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-800">
            Workflow Builder: {project?.name}
          </h1>
          <span className={`badge ${project?.type === 'on-site' ? 'badge-training' : 'badge-active'}`}>
            {project?.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAutoGenerate} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">
            ⚡ Auto-Generate
          </button>
          <button onClick={() => setShowTemplates(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">
            📋 Templates
          </button>
          {isManager && (
            <button onClick={() => setShowSaveTemplate(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">
              💾 Save as Template
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save Workflow'}
          </button>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="flex gap-4 h-full">
        {/* Left: Node Palette */}
        <NodePalette />

        {/* Center: React Flow Canvas */}
        <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background variant="dots" gap={16} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              style={{ height: 120, width: 180 }}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>

        {/* Right: Node Editor */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
            vendors={vendors}
          />
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Workflow Templates</h2>
              <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            {templates.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No templates saved yet.</p>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors" onClick={() => handleLoadTemplate(t)}>
                    <h3 className="font-bold text-gray-800">{t.name}</h3>
                    {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {t.workflow_data?.nodes?.length || 0} nodes · Created by {t.creator_name || 'Unknown'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Save as Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Standard On-site Flow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Describe this template..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowSaveTemplate(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button onClick={handleSaveTemplate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save Template</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
