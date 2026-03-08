/**
 * Shared types for Browse page and API.
 */

export interface BrowseMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
}

export interface BrowseEarning {
  symbol: string;
  name: string;
  date: string;
  when: "bmo" | "amc";
}

export interface BrowseIpo {
  name: string;
  symbol: string;
  date: string;
  exchange: string;
}

export interface BrowseData {
  upcomingEarnings: BrowseEarning[];
  upcomingIpos: BrowseIpo[];
  topGainers: BrowseMover[];
  topLosers: BrowseMover[];
}
