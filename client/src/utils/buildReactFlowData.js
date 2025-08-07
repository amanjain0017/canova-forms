import dagre from "dagre";

const nodeWidth = 180;
const nodeHeight = 80;

export function buildReactFlowData(form) {
  const nodes = [];
  const edges = [];

  // Handle case where form is null or undefined
  if (!form || !form.pages) {
    return { nodes, edges };
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB" }); // Top-to-bottom layout
  g.setDefaultEdgeLabel(() => ({}));

  // First, collect all valid page IDs
  const validPageIds = new Set();
  form.pages.forEach((page) => {
    if (page && page.id) {
      validPageIds.add(page.id);
    }
  });

  // Helper function to validate if an ID exists and is not undefined/null
  const isValidPageId = (id) => {
    return (
      id &&
      id !== undefined &&
      id !== null &&
      id !== "undefined" &&
      validPageIds.has(id)
    );
  };

  form.pages.forEach((page) => {
    // Skip pages without valid IDs
    if (!page || !page.id || page.id === undefined || page.id === null) {
      console.warn("Skipping page with invalid ID:", page);
      return;
    }

    // Determine the best label for the page
    // Priority: name > title > id
    const pageLabel = page.name || page.title || page.id || "Unnamed Page";

    g.setNode(page.id, {
      label: pageLabel,
      width: nodeWidth,
      height: nodeHeight,
    });

    nodes.push({
      id: page.id,
      type: "default",
      data: {
        label: pageLabel,
        // You can add more data here if needed for custom node rendering
        originalPage: page,
      },
      position: { x: 0, y: 0 },
      // Add some styling to make nodes more visually appealing
      style: {
        background: "#ffffff",
        border: "2px solid #1e40af",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#1e40af",
        padding: "10px",
        textAlign: "center",
        width: nodeWidth,
        height: nodeHeight,
      },
    });

    const cond = page.conditionalLogic;

    // Add conditional logic edges - only if target pages exist
    if (cond?.truePageId && isValidPageId(cond.truePageId)) {
      g.setEdge(page.id, cond.truePageId);
      edges.push({
        id: `${page.id}-true->${cond.truePageId}`,
        source: page.id,
        target: cond.truePageId,
        label: "True",
        animated: true,
        style: { stroke: "#22c55e", strokeWidth: 2 },
        labelStyle: { fill: "#22c55e", fontWeight: "bold" },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.8 },
      });
    }

    if (cond?.falsePageId && isValidPageId(cond.falsePageId)) {
      g.setEdge(page.id, cond.falsePageId);
      edges.push({
        id: `${page.id}-false->${cond.falsePageId}`,
        source: page.id,
        target: cond.falsePageId,
        label: "False",
        animated: true,
        style: { stroke: "#ef4444", strokeWidth: 2 },
        labelStyle: { fill: "#ef4444", fontWeight: "bold" },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.8 },
      });
    }

    // Add normal next page edges
    if (page.nextPageId && Array.isArray(page.nextPageId)) {
      page.nextPageId.forEach((nextId) => {
        // Only add edge if target exists and it's not already covered by conditional logic
        if (
          isValidPageId(nextId) &&
          nextId !== cond?.truePageId &&
          nextId !== cond?.falsePageId
        ) {
          g.setEdge(page.id, nextId);
          edges.push({
            id: `${page.id}->${nextId}`,
            source: page.id,
            target: nextId,
            style: { stroke: "#6b7280", strokeWidth: 2 },
            animated: false,
          });
        }
      });
    } else if (page.nextPageId && typeof page.nextPageId === "string") {
      // Handle case where nextPageId is a single string instead of array
      if (
        isValidPageId(page.nextPageId) &&
        page.nextPageId !== cond?.truePageId &&
        page.nextPageId !== cond?.falsePageId
      ) {
        g.setEdge(page.id, page.nextPageId);
        edges.push({
          id: `${page.id}->${page.nextPageId}`,
          source: page.id,
          target: page.nextPageId,
          style: { stroke: "#6b7280", strokeWidth: 2 },
          animated: false,
        });
      }
    }
  });

  // Apply dagre layout
  dagre.layout(g);

  // Update node positions based on layout
  nodes.forEach((node) => {
    const layout = g.node(node.id);
    if (layout) {
      node.position = {
        x: layout.x - nodeWidth / 2,
        y: layout.y - nodeHeight / 2,
      };
    }
  });

  return { nodes, edges };
}
