import apiClient from './client';

export type EnquiryType = 'general' | 'product' | 'order' | 'return' | 'custom_quote';
export type EnquiryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface EnquiryReply {
  _id:       string;
  message:   string;
  author:    string;
  authorRole:'customer' | 'vendor' | 'admin';
  createdAt: string;
}

export interface Enquiry {
  _id:        string;
  ticketId:   string;
  user:       { _id: string; name: string; email: string } | string;
  vendor?:    string;
  product?:   { _id: string; name: string } | string;
  type:       EnquiryType;
  subject:    string;
  message:    string;
  status:     EnquiryStatus;
  priority:   'low' | 'medium' | 'high' | 'urgent';
  replies:    EnquiryReply[];
  quoteItems?:{ description: string; quantity: number; unitPrice: number }[];
  quoteTotal?:number;
  createdAt:  string;
  updatedAt:  string;
}

const enquiryApi = {
  // Vendor: enquiries addressed to their store
  myEnquiries: (params?: { page?: number; limit?: number; status?: EnquiryStatus; type?: EnquiryType }) =>
    apiClient.get<{ data: Enquiry[]; pagination: unknown }>('/enquiries/vendor/mine', { params }),

  // Admin: all enquiries
  allEnquiries: (params?: Record<string, unknown>) =>
    apiClient.get<{ data: Enquiry[]; pagination: unknown }>('/enquiries', { params }),

  getById: (id: string) =>
    apiClient.get<{ data: Enquiry }>(`/enquiries/${id}`),

  // Reply to an enquiry
  reply: (id: string, message: string) =>
    apiClient.post<{ data: Enquiry }>(`/enquiries/${id}/reply`, { message }),

  // Update status
  updateStatus: (id: string, status: EnquiryStatus) =>
    apiClient.patch<{ data: Enquiry }>(`/enquiries/${id}/status`, { status }),

  // Submit a custom quote
  submitQuote: (id: string, quoteItems: Enquiry['quoteItems'], note?: string) =>
    apiClient.post<{ data: Enquiry }>(`/enquiries/${id}/quote`, { quoteItems, note }),
};

export default enquiryApi;
