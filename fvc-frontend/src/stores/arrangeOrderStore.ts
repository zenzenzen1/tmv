import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import arrangeOrderService from '../services/arrangeOrderService';
import { globalErrorHandler } from '../utils/errorHandler';
import type {
  ArrangeOrderData,
  ArrangeSection,
  ArrangeItem,
  ContentItem,
  ContentType,
} from '../types/arrange';

interface ArrangeOrderState {
  competitionId: string | null;
  contentType: ContentType;
  sections: Record<string, ArrangeSection>; // keyed by contentId
  pool: ArrangeItem[];
  contentItems: ContentItem[];
  loading: boolean;
  error: string | null;
}

interface ArrangeOrderActions {
  // Load data
  loadArrangeOrder: (competitionId: string, contentType: ContentType) => Promise<void>;
  loadContentItems: (competitionId: string, contentType: ContentType) => Promise<void>;
  
  // Randomization
  randomize: (randomize?: boolean, filters?: { gender?: string; formType?: string }) => Promise<void>;
  
  // Item manipulation
  addToSection: (sectionId: string, item: ArrangeItem) => void;
  removeFromSection: (sectionId: string, itemId: string) => void;
  moveItemInSection: (sectionId: string, itemId: string, delta: number) => void;
  moveBackToPool: (sectionId: string, itemId: string) => void;
  
  // Section operations
  shuffleSection: (sectionId: string) => void;
  seedSection: (sectionId: string) => void;
  resetAll: () => void;
  
  // Persistence
  saveOrder: () => Promise<void>;
  exportJSON: () => void;
  
  // State management
  setContentType: (type: ContentType) => void;
  setCompetitionId: (id: string | null) => void;
  reset: () => void;
}

type ArrangeOrderStore = ArrangeOrderState & ArrangeOrderActions;

const initialState: ArrangeOrderState = {
  competitionId: null,
  contentType: 'QUYEN',
  sections: {},
  pool: [],
  contentItems: [],
  loading: false,
  error: null,
};

export const useArrangeOrderStore = create<ArrangeOrderStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadArrangeOrder: async (competitionId: string, contentType: ContentType) => {
        try {
          set({ loading: true, error: null });
          const data = await arrangeOrderService.getArrangeOrder(competitionId, contentType);
          
          // Convert sections array to Record
          const sectionsMap: Record<string, ArrangeSection> = {};
          data.sections.forEach((section) => {
            sectionsMap[section.contentId] = section;
          });
          
          set({
            competitionId,
            contentType,
            sections: sectionsMap,
            pool: data.pool,
            loading: false,
          });
        } catch (error) {
          const { message } = globalErrorHandler(error);
          set({ error: message, loading: false });
        }
      },

      loadContentItems: async (competitionId: string, contentType: ContentType) => {
        try {
          set({ loading: true, error: null });
          const items = await arrangeOrderService.getContentItems(competitionId, contentType);
          set({ contentItems: items, loading: false });
        } catch (error) {
          const { message } = globalErrorHandler(error);
          set({ error: message, loading: false });
        }
      },

      randomize: async (randomize = true, filters = {}) => {
        const { competitionId, contentType } = get();
        if (!competitionId) return;

        try {
          set({ loading: true, error: null });
          const data = await arrangeOrderService.randomizeArrangeOrder(competitionId, {
            competitionId,
            contentType,
            randomize,
            ...filters,
          });
          
          const sectionsMap: Record<string, ArrangeSection> = {};
          data.sections.forEach((section) => {
            sectionsMap[section.contentId] = section;
          });
          
          set({
            sections: sectionsMap,
            pool: data.pool,
            loading: false,
          });
        } catch (error) {
          const { message } = globalErrorHandler(error);
          set({ error: message, loading: false });
        }
      },

      addToSection: (sectionId: string, item: ArrangeItem) => {
        const { sections, pool } = get();
        
        // Check if already in section
        if (sections[sectionId]?.items.some((i) => i.id === item.id)) {
          return;
        }
        
        // Remove from pool
        const newPool = pool.filter((i) => i.id !== item.id);
        
        // Add to section
        const section = sections[sectionId];
        if (section) {
          const newItems = [...section.items, { ...item, sectionId, orderIndex: section.items.length + 1 }];
          set({
            sections: { ...sections, [sectionId]: { ...section, items: newItems } },
            pool: newPool,
          });
        }
      },

      removeFromSection: (sectionId: string, itemId: string) => {
        const { sections, pool } = get();
        const section = sections[sectionId];
        if (!section) return;
        
        const item = section.items.find((i) => i.id === itemId);
        if (!item) return;
        
        // Remove from section
        const newItems = section.items
          .filter((i) => i.id !== itemId)
          .map((i, idx) => ({ ...i, orderIndex: idx + 1 }));
        
        // Add back to pool
        const { sectionId: _, orderIndex: __, ...itemWithoutSection } = item;
        const newPool = [...pool, itemWithoutSection];
        
        set({
          sections: { ...sections, [sectionId]: { ...section, items: newItems } },
          pool: newPool,
        });
      },

      moveItemInSection: (sectionId: string, itemId: string, delta: number) => {
        const { sections } = get();
        const section = sections[sectionId];
        if (!section) return;
        
        const items = [...section.items];
        const index = items.findIndex((i) => i.id === itemId);
        if (index < 0) return;
        
        const newIndex = index + delta;
        if (newIndex < 0 || newIndex >= items.length) return;
        
        // Swap
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        
        // Update orderIndex
        items.forEach((item, idx) => {
          item.orderIndex = idx + 1;
        });
        
        set({
          sections: { ...sections, [sectionId]: { ...section, items } },
        });
      },

      moveBackToPool: (sectionId: string, itemId: string) => {
        get().removeFromSection(sectionId, itemId);
      },

      shuffleSection: (sectionId: string) => {
        const { sections } = get();
        const section = sections[sectionId];
        if (!section) return;
        
        const items = [...section.items];
        // Fisher-Yates shuffle
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }
        
        // Update orderIndex
        items.forEach((item, idx) => {
          item.orderIndex = idx + 1;
        });
        
        set({
          sections: { ...sections, [sectionId]: { ...section, items } },
        });
      },

      seedSection: (sectionId: string) => {
        const { sections } = get();
        const section = sections[sectionId];
        if (!section) return;
        
        const items = [...section.items].sort((a, b) => a.name.localeCompare(b.name));
        
        // Update orderIndex
        items.forEach((item, idx) => {
          item.orderIndex = idx + 1;
        });
        
        set({
          sections: { ...sections, [sectionId]: { ...section, items } },
        });
      },

      resetAll: () => {
        const { sections, pool } = get();
        
        // Move all items back to pool
        let newPool = [...pool];
        Object.values(sections).forEach((section) => {
          section.items.forEach((item) => {
            const { sectionId: _, orderIndex: __, ...itemWithoutSection } = item;
            newPool.push(itemWithoutSection);
          });
        });
        
        // Clear all sections
        const emptySections: Record<string, ArrangeSection> = {};
        Object.keys(sections).forEach((contentId) => {
          emptySections[contentId] = { ...sections[contentId], items: [] };
        });
        
        set({
          sections: emptySections,
          pool: newPool,
        });
      },

      saveOrder: async () => {
        const { competitionId, contentType, sections } = get();
        if (!competitionId) return;

        try {
          set({ loading: true, error: null });
          
          const sectionsArray = Object.values(sections).map((section) => ({
            contentId: section.contentId,
            items: section.items.map((item) => ({
              id: item.id,
              type: item.type,
              orderIndex: item.orderIndex!,
            })),
          }));
          
          await arrangeOrderService.saveArrangeOrder(competitionId, {
            competitionId,
            contentType,
            sections: sectionsArray,
          });
          
          set({ loading: false });
        } catch (error) {
          const { message } = globalErrorHandler(error);
          set({ error: message, loading: false });
        }
      },

      exportJSON: () => {
        const { contentType, sections } = get();
        const data = {
          contentType,
          sections: Object.values(sections),
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-${contentType.toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      setContentType: (type: ContentType) => {
        set({ contentType: type, sections: {}, pool: [] });
      },

      setCompetitionId: (id: string | null) => {
        set({ competitionId: id });
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'arrange-order-store' }
  )
);

