// Services
export { searchMaterial, batchSearch } from './services/searcher';
export type { MaterialMatch, MaterialItem, SearchQuery } from './services/searcher';
export { groupMaterials } from './services/grouper';
export type { MaterialGroup, GroupingOptions } from './services/grouper';
export { createAIGenerationPlan } from './services/ai-materials';
export type { AIGenerationPlan, BatchGenerationPlan } from './services/ai-materials';

// Pipeline
export { MaterialMatchingPipeline } from './pipeline-controller';
export type { MaterialMatchingResult } from './pipeline-controller';
