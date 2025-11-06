// Arrange Order Types
export type ContentType = 'QUYEN' | 'VONHAC';
export type ItemType = 'ATHLETE' | 'TEAM';
export type FormType = 'Song luyện' | 'Đơn Luyện' | 'Đồng Đội' | 'Đa Luyện';

export interface ArrangeItem {
  id: string;
  type: ItemType;
  name: string;
  gender: 'male' | 'female' | 'mixed';
  studentCode: string;
  formType?: FormType; // Only for QUYEN
  contentId: string;
  orderIndex?: number;
  sectionId?: string;
  members?: ArrangeItemMember[];
}

export interface ArrangeItemMember {
  id: string;
  name: string;
  gender: 'male' | 'female';
  studentCode: string;
  formType?: FormType;
  contentId?: string;
}

export interface ArrangeSection {
  contentId: string;
  contentName: string;
  items: ArrangeItem[];
}

export interface ArrangeOrderData {
  contentType: ContentType;
  competitionName: string;
  sections: ArrangeSection[];
  pool: ArrangeItem[];
}

export interface ContentItem {
  id: string;
  name: string;
}

// Request DTOs
export interface SaveArrangeOrderRequest {
  competitionId: string;
  contentType: ContentType;
  sections: SectionDto[];
}

export interface SectionDto {
  contentId: string;
  items: ItemDto[];
}

export interface ItemDto {
  id: string;
  type: ItemType;
  orderIndex: number;
}

export interface RandomizeArrangeOrderRequest {
  competitionId: string;
  contentType: ContentType;
  randomize?: boolean;
  gender?: string;
  formType?: string;
}

