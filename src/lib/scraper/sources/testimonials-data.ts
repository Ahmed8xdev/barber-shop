/** Third-party public community discussions, never verified customer reviews. */
export interface Testimonial {
  text: string;
  author: string;
  subreddit: string;
  score: number;
  /** Direct link to the original community post for attribution. */
  url?: string;
}
