import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // The landing page must always start at the hero on a fresh visit.
    // Section anchors still use the browser's native hash navigation.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
