export type WSO2Product = 'APIM' | 'MI' | 'IS' | 'UNKNOWN';

export interface ProductVersion {
  product: WSO2Product;
  version: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  selectedProduct: WSO2Product;
  selectedVersion: string;
  isLoading: boolean;
}
