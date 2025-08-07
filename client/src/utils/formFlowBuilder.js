export function buildFormFlow(form) {
  const pagesById = {};
  const claimed = new Set(); // Pages that already have a parent
  const visited = new Set(); // Pages we've processed

  // Step 1: Initialize pages and index by ID
  form.pages.forEach((page) => {
    pagesById[page.id] = page;
    // Reset flow arrays
    page.nextPageId = [];
    page.prevPageId = [];
  });

  // Step 2: Process conditional logic first (higher priority)
  const processConditionalLogic = (pageId, depth = 0) => {
    // Prevent infinite recursion
    if (depth > form.pages.length || visited.has(pageId)) {
      return;
    }

    visited.add(pageId);
    const page = pagesById[pageId];
    if (!page || !page.conditionalLogic) return;

    const { truePageId, falsePageId } = page.conditionalLogic;

    // Handle TRUE path
    if (truePageId && pagesById[truePageId]) {
      if (!claimed.has(truePageId)) {
        // This page is available, claim it
        page.nextPageId.push(truePageId);
        pagesById[truePageId].prevPageId.push(pageId);
        claimed.add(truePageId);

        // Recursively process this page
        processConditionalLogic(truePageId, depth + 1);
      }
      // If already claimed, we simply don't connect to it
    }

    // Handle FALSE path
    if (falsePageId && pagesById[falsePageId]) {
      if (!claimed.has(falsePageId)) {
        // This page is available, claim it
        page.nextPageId.push(falsePageId);
        pagesById[falsePageId].prevPageId.push(pageId);
        claimed.add(falsePageId);

        // Recursively process this page
        processConditionalLogic(falsePageId, depth + 1);
      }
      // If already claimed, we simply don't connect to it
    }
  };

  // Step 3: Start processing from the first page
  if (form.pages.length > 0) {
    const firstPageId = form.pages[0].id;
    claimed.add(firstPageId); // First page is claimed by default
    processConditionalLogic(firstPageId);
  }

  // Step 4: Handle linear flow for remaining unclaimed pages
  // Go through pages in order and try to connect unclaimed ones
  for (let i = 0; i < form.pages.length - 1; i++) {
    const currentPage = form.pages[i];

    // Only process pages that don't have conditional logic or
    // have conditional logic but still have room for more connections
    const hasConditionalNext =
      currentPage.conditionalLogic &&
      (currentPage.conditionalLogic.truePageId ||
        currentPage.conditionalLogic.falsePageId);

    // If page has no next connections, try to connect it to the next unclaimed page
    if (currentPage.nextPageId.length === 0) {
      // Find the next unclaimed page
      for (let j = i + 1; j < form.pages.length; j++) {
        const candidatePage = form.pages[j];
        if (!claimed.has(candidatePage.id)) {
          // Connect current page to this candidate
          currentPage.nextPageId.push(candidatePage.id);
          candidatePage.prevPageId.push(currentPage.id);
          claimed.add(candidatePage.id);
          break; // Only connect to the first available page
        }
      }
    }
  }

  // Step 5: Clean up and ensure uniqueness
  form.pages.forEach((page) => {
    page.nextPageId = [...new Set(page.nextPageId)];
    page.prevPageId = [...new Set(page.prevPageId)];
  });

  // Step 6: Log orphaned pages for debugging
  const orphanedPages = form.pages.filter(
    (page) => !claimed.has(page.id) && page.id !== form.pages[0]?.id
  );

  if (orphanedPages.length > 0) {
    console.warn(
      "Orphaned pages (unreachable in flow):",
      orphanedPages.map((p) => ({ id: p.id, name: p.name }))
    );
  }

  // Step 7: Log flow summary for debugging
  console.log(
    "Flow summary:",
    form.pages.map((page) => ({
      id: page.id,
      name: page.name,
      nextPages: page.nextPageId,
      hasConditional: !!page.conditionalLogic,
      isEndPoint: page.nextPageId.length === 0,
    }))
  );

  return form;
}
