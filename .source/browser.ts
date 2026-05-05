// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"api-reference.mdx": () => import("../content/docs/api-reference.mdx?collection=docs"), "architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"), "deployment.mdx": () => import("../content/docs/deployment.mdx?collection=docs"), "full-documentation.mdx": () => import("../content/docs/full-documentation.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "overview.mdx": () => import("../content/docs/overview.mdx?collection=docs"), }),
};
export default browserCollections;