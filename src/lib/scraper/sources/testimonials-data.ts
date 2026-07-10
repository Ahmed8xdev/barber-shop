export interface Testimonial {
  text: string;
  author: string;
  subreddit: string;
  score: number;
}

export const STATIC_TESTIMONIALS: Testimonial[] = [
  { text: "Finally found a barber who understands curly hair. The precision cut transformed my look completely. Best $45 I've ever spent on grooming.", author: "CurlyFury", subreddit: "curlyhair", score: 342 },
  { text: "First time getting a fade and I'm blown away. The blend is seamless and the line work is razor sharp. My new go-to spot.", author: "FreshFade22", subreddit: "barber", score: 287 },
  { text: "Been growing my hair out for 6 months and was nervous about a big cut. The stylist listened to exactly what I wanted and delivered perfection.", author: "LongHairGuy", subreddit: "malehairadvice", score: 256 },
  { text: "Best beard trim of my life. They use hot towel, straight razor, and the attention to detail is insane. Feels like a whole new face.", author: "BeardKing", subreddit: "barber", score: 231 },
  { text: "My daughter recommended this place for my first proper haircut in years. The pompadour they gave me makes me look 10 years younger.", author: "DadStyle2026", subreddit: "malehairadvice", score: 198 },
  { text: "The scalp massage alone is worth the price. Add in the precision scissor work and you've got a barber that actually cares about their craft.", author: "RelaxedClient", subreddit: "Hair", score: 176 },
  { text: "Moved to a new city and was terrified of finding a new barber. Checked Reddit recs and found gold. Two months in, still perfect cuts every time.", author: "NewInTown", subreddit: "malehairadvice", score: 165 },
  { text: "Asked for a textured crop with a mid fade. Showed them one photo and they nailed it without asking a single question. Artistry at its finest.", author: "StyleSeeker", subreddit: "barber", score: 154 },
  { text: "Tried the keratin treatment and my frizzy hair has never looked better. Three weeks in and still silky smooth. Game changer.", author: "SmoothOperator", subreddit: "Hair", score: 143 },
  { text: "Went from shoulder-length to a modern undercut. The transformation video got 50K views on TikTok. Best decision I made this year.", author: "ViralCut", subreddit: "malehairadvice", score: 132 },
  { text: "Afraid of barbers after a tragic buzz cut incident in 2024. This place restored my faith. Consulted first, explained everything, and delivered a masterpiece.", author: "TraumaRecovery", subreddit: "barber", score: 121 },
  { text: "Premium pricing but you get what you pay for. Hot towel, straight razor neck shave, product consultation, and a cut that lasts 3 weeks looking fresh.", author: "ValueBuyer", subreddit: "malehairadvice", score: 115 },
];
