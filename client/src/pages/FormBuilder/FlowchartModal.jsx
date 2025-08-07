import { useMemo, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import "./FlowchartModal.css";
import PublishModal from "../../components/Modals/PublishModal/PublishModal";

import { buildReactFlowData } from "../../utils/buildReactFlowData";

const FlowchartModal = ({ form, isOpen, onClose, onBackToEdit, onPublish }) => {
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Create a more detailed dependency for useMemo to ensure it updates when form changes
  const formKey = useMemo(() => {
    if (!form) return "no-form";
    // Create a key that includes essential form data that would affect the flow
    return JSON.stringify({
      pages:
        form.pages?.map((page) => ({
          id: page.id,
          title: page.title,
          name: page.name, // Include name field
          conditionalLogic: page.conditionalLogic,
          nextPageId: page.nextPageId,
        })) || [],
    });
  }, [form]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildReactFlowData(form),
    [formKey] // Use the detailed key instead of just [form]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when form changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildReactFlowData(form);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [formKey, setNodes, setEdges]);

  // Handle opening the publish modal
  const handleNextClick = () => {
    setShowPublishModal(true);
  };

  // Handle closing the publish modal
  const handleClosePublishModal = () => {
    setShowPublishModal(false);
  };

  // Handle the actual publish action
  const handlePublishAction = (publishData) => {
    if (onPublish) {
      onPublish(publishData);
    }

    setShowPublishModal(false);
    onClose(); // Close the flowchart modal as well
  };

  // If the modal is not open, return null to not render anything
  if (!isOpen) return null;

  return (
    <>
      <div className="flowchart-modal-overlay">
        <div className="flowchart-modal-content">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-right"
          >
            <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
            <Controls position="bottom-left" />
            {/* Panel for the title */}
            <Panel position="top-right" className="flowchart-title-panel">
              <h3 className="text-lg font-bold text-gray-800">
                {form?.title || form?.name || "Form Flow"}
              </h3>
            </Panel>
            {/* Close button at top right */}
          </ReactFlow>

          {/* Footer for action buttons */}
          <div className="flowchart-footer-buttons">
            <button onClick={onBackToEdit} className="next-button">
              Back to Edit
            </button>
            <button onClick={handleNextClick} className="next-button">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && form && (
        <PublishModal
          isOpen={showPublishModal}
          onClose={handleClosePublishModal}
          itemToPublish={form}
          onPublish={handlePublishAction}
        />
      )}
    </>
  );
};

export default FlowchartModal;
