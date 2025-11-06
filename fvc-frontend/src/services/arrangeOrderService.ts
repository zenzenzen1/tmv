import apiService from './api';
import type {
  ArrangeOrderData,
  ContentItem,
  SaveArrangeOrderRequest,
  RandomizeArrangeOrderRequest,
  ContentType,
} from '../types/arrange';

const arrangeOrderService = {
  getArrangeOrder: async (
    competitionId: string,
    contentType: ContentType
  ): Promise<ArrangeOrderData> => {
    const response = await apiService.get<ArrangeOrderData>(
      `/competitions/${competitionId}/arrange-order`,
      { contentType }
    );
    return response.data;
  },

  saveArrangeOrder: async (
    competitionId: string,
    request: SaveArrangeOrderRequest
  ): Promise<void> => {
    await apiService.post(
      `/competitions/${competitionId}/arrange-order`,
      request
    );
  },

  randomizeArrangeOrder: async (
    competitionId: string,
    request: RandomizeArrangeOrderRequest
  ): Promise<ArrangeOrderData> => {
    const response = await apiService.post<ArrangeOrderData>(
      `/competitions/${competitionId}/arrange-order/randomize`,
      request
    );
    // POST returns T directly, but check if it's wrapped
    return (response as any).data || response;
  },

  getContentItems: async (
    competitionId: string,
    contentType: ContentType
  ): Promise<ContentItem[]> => {
    const response = await apiService.get<ContentItem[]>(
      `/competitions/${competitionId}/arrange-order/content-items`,
      { contentType }
    );
    return response.data;
  },
};

export default arrangeOrderService;

