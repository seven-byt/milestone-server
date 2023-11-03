export type PollState = {
  id: number;
  enabled: boolean;
  completed: boolean;
  results: boolean;
  options: {
    id: number;
    text: string;
    votes: number;
  }[];
};
