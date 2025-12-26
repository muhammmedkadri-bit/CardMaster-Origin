import { CreditCard, Transaction } from '../types';
// Fix: Removed the import of 'CATEGORIES' from '../constants' as it is not exported there and not used in this file.

/**
 * Mock API service to simulate bank integration.
 * In a real application, this would call actual banking APIs (e.g., Plaid, Salt Edge).
 */

export const apiService = {
  /**
   * Simulates fetching updated balances from the bank.
   * Returns current balances to maintain UI consistency without random fluctuations.
   */
  fetchLatestBalances: async (cards: CreditCard[]): Promise<Record<string, number>> => {
    // Simulate network delay for a realistic feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const balanceUpdates: Record<string, number> = {};
    cards.forEach(card => {
      // Return the existing balance instead of creating random changes
      balanceUpdates[card.id] = card.balance;
    });
    
    return balanceUpdates;
  },

  /**
   * Simulates fetching new transactions since last sync.
   * Now returns an empty array to prevent unwanted "ghost" transactions.
   */
  fetchNewTransactions: async (cards: CreditCard[]): Promise<Transaction[]> => {
    if (cards.length === 0) return [];
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Returns empty array so no unexpected spendings appear in history
    return [];
  }
};