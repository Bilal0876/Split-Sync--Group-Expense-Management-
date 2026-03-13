import api from './api';

export interface UserInfo {
  userId: string;
  username: string;
}

export interface SettlementRecommendation {
  from: UserInfo;
  to: UserInfo;
  amount: number;
}

export interface Settlement {
  id: string;
  group_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  settled_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface BalancesResponse {
  transactions: SettlementRecommendation[];
  settlements: Settlement[];
}

/** Fetch current balances/recommendations for a group */
export const getBalances = async (groupId: string): Promise<BalancesResponse> => {
  const response = await api.get<BalancesResponse>(`/settlements/${groupId}/balances`);
  return response.data;
};

/** Record a new settlement payment */
export const recordSettlement = async (data: {
  groupId: string;
  senderId: string;
  receiverId: string;
  amount: number;
}): Promise<{ message: string; settlement: Settlement }> => {
  const response = await api.post<{ message: string; settlement: Settlement }>(
    `/settlements/${data.groupId}/record`, 
    {
      senderId: data.senderId,
      receiverId: data.receiverId,
      amount: data.amount
    }
  );
  return response.data;
};

/** Fetch settlement history for a group (Note: this is included in getBalances, but keeping for direct access if needed) */
export const getSettlementHistory = async (groupId: string): Promise<Settlement[]> => {
  const response = await api.get<BalancesResponse>(`/settlements/${groupId}/balances`);
  return response.data.settlements;
};
