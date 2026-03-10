import api from './api';

export interface UserInfo {
  userId: number;
  username: string;
}

export interface SettlementRecommendation {
  from: UserInfo;
  to: UserInfo;
  amount: number;
}

export interface Settlement {
  id: number;
  group_id: number;
  sender_id: number;
  receiver_id: number;
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
export const getBalances = async (groupId: number): Promise<BalancesResponse> => {
  const response = await api.get<BalancesResponse>(`/settlements/${groupId}/balances`);
  return response.data;
};

/** Record a new settlement payment */
export const recordSettlement = async (data: {
  groupId: number;
  senderId: number;
  receiverId: number;
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
export const getSettlementHistory = async (groupId: number): Promise<Settlement[]> => {
  const response = await api.get<BalancesResponse>(`/settlements/${groupId}/balances`);
  return response.data.settlements;
};
