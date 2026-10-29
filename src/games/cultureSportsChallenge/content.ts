import type { CultureCategory, Difficulty } from '../../types/content';
import { definePrepared } from '../prepared';

export const CULTURE_POINTS = { Easy: 1, Medium: 2, Hard: 3 } as const;

type Row = {
  c: CultureCategory;
  k?: 'question' | 'task';
  p: string;
  a: string;
  h?: string;
  d: Difficulty;
  t?: string;
};

const rows: Row[] = [
  // Sports
  { c: 'Sports', p: 'How many players does each team have on the pitch in an 11-a-side football match?', a: '11', h: 'It is in the name of the format.', d: 'Easy' },
  { c: 'Sports', p: 'How many points is a basketball shot from behind the arc worth?', a: '3', d: 'Easy' },
  { c: 'Sports', p: 'How many rings are on the Olympic flag?', a: '5', h: 'One for each group of continents.', d: 'Easy' },
  { c: 'Sports', p: 'Which sport uses a shuttlecock?', a: 'Badminton', d: 'Easy' },
  { c: 'Sports', p: 'In tennis, what word is used for a score of zero?', a: 'Love', h: 'It is also a feeling.', d: 'Medium' },
  { c: 'Sports', p: 'How many players are on court for one volleyball team?', a: '6', d: 'Medium' },
  { c: 'Sports', p: 'Which country hosted the 2022 FIFA World Cup?', a: 'Qatar', h: 'It is a neighbour of the UAE.', d: 'Easy' },
  { c: 'Sports', p: 'How many balls are bowled in one over in cricket?', a: '6', d: 'Medium' },
  { c: 'Sports', p: 'What is the name of the Formula 1 circuit on Yas Island in Abu Dhabi?', a: 'Yas Marina Circuit', h: 'It is named after the island and its harbour.', d: 'Medium' },
  { c: 'Sports', p: 'How many minutes long is a normal football match, not counting added time?', a: '90', d: 'Easy' },
  { c: 'Sports', p: 'What colour card does a referee show to send a player off?', a: 'Red', d: 'Easy' },
  { c: 'Sports', p: 'What do you call it when one player scores three goals in a single match?', a: 'A hat-trick', d: 'Medium' },
  { c: 'Sports', p: 'Which swimming stroke is done lying on your back?', a: 'Backstroke', d: 'Easy' },
  { c: 'Sports', p: 'How many holes are played in a standard round of golf?', a: '18', h: 'Double nine.', d: 'Hard' },
  { c: 'Sports', p: 'In table tennis, how many points do you usually need to win a game?', a: '11', d: 'Hard' },
  { c: 'Sports', p: 'Roughly how many kilometres long is a marathon?', a: 'About 42 km (42.195 km)', h: 'It is between 40 and 45.', d: 'Hard' },
  { c: 'Sports', p: 'In which sport would you perform a slam dunk?', a: 'Basketball', d: 'Easy' },
  { c: 'Sports', p: 'Which martial art, very popular in UAE schools, focuses on grappling and holds on the mat?', a: 'Jiu-jitsu', h: 'It is often linked with Brazil and Japan.', d: 'Medium' },
  // UAE Culture
  { c: 'UAE Culture', p: 'What is the capital city of the UAE?', a: 'Abu Dhabi', d: 'Easy' },
  { c: 'UAE Culture', p: 'In which year was the UAE founded?', a: '1971', h: 'It was in the early 1970s.', d: 'Medium' },
  { c: 'UAE Culture', p: 'Name the four colours of the UAE flag.', a: 'Red, green, white and black', d: 'Easy' },
  { c: 'UAE Culture', p: 'What is the national bird of the UAE?', a: 'The falcon', d: 'Easy' },
  { c: 'UAE Culture', p: 'What is the name of the UAE\'s currency?', a: 'The dirham', d: 'Easy' },
  { c: 'UAE Culture', p: 'Which building in Dubai is the tallest in the world?', a: 'Burj Khalifa', d: 'Easy' },
  { c: 'UAE Culture', p: 'Which emirate is the largest by area?', a: 'Abu Dhabi', d: 'Medium' },
  { c: 'UAE Culture', p: 'What was the name of the UAE spacecraft that reached Mars orbit in 2021?', a: 'Hope (the Hope Probe)', h: 'Its name means something you wish for.', d: 'Medium' },
  { c: 'UAE Culture', p: 'Who is known as the Founding Father of the UAE?', a: 'Sheikh Zayed bin Sultan Al Nahyan', d: 'Medium' },
  { c: 'UAE Culture', p: 'Which emirate is known for many museums and was named the Cultural Capital of the Arab World in 1998?', a: 'Sharjah', d: 'Hard' },
  { c: 'UAE Culture', p: 'Which emirate lies entirely on the Gulf of Oman coast?', a: 'Fujairah', h: 'It is on the east coast.', d: 'Hard' },
  { c: 'UAE Culture', p: 'Which famous white mosque in Abu Dhabi welcomes visitors from around the world?', a: 'Sheikh Zayed Grand Mosque', d: 'Easy' },
  { c: 'UAE Culture', p: 'What is Arabic coffee called in Emirati Arabic?', a: 'Gahwa', h: 'It starts with "G".', d: 'Medium' },
  { c: 'UAE Culture', p: 'What is a "souk"?', a: 'A traditional market', d: 'Easy' },
  { c: 'UAE Culture', p: 'Which museum on Saadiyat Island shares its name with a famous museum in Paris?', a: 'Louvre Abu Dhabi', d: 'Medium' },
  { c: 'UAE Culture', p: 'Who was the first Emirati astronaut to go to the International Space Station, in 2019?', a: 'Hazza Al Mansouri', d: 'Hard' },
  { c: 'UAE Culture', p: 'Which mountain in Ras Al Khaimah is home to a record-breaking zipline?', a: 'Jebel Jais', d: 'Hard' },
  { c: 'UAE Culture', p: 'On which date is UAE National Day celebrated?', a: '2 December', d: 'Easy' },
  { c: 'UAE Culture', p: 'Which Dubai building, shaped like a silver ring covered in Arabic calligraphy, is a museum?', a: 'Museum of the Future', d: 'Medium' },
  { c: 'UAE Culture', p: 'What is the traditional wooden boat of the Gulf called?', a: 'A dhow', d: 'Easy' },
  { c: 'UAE Culture', p: 'What is the name of the huge sand desert that stretches across the south of the UAE?', a: 'The Empty Quarter (Rub\' al Khali)', h: 'Its name describes a quarter with nothing in it.', d: 'Hard' },
  // General knowledge
  { c: 'General Knowledge', p: 'How many days are there in a leap year?', a: '366', d: 'Easy' },
  { c: 'General Knowledge', p: 'Which planet is known as the Red Planet?', a: 'Mars', d: 'Easy' },
  { c: 'General Knowledge', p: 'What is the largest ocean on Earth?', a: 'The Pacific Ocean', d: 'Medium' },
  { c: 'General Knowledge', p: 'How many continents are there?', a: '7', d: 'Easy' },
  { c: 'General Knowledge', p: 'Which gas do plants take in from the air to make food?', a: 'Carbon dioxide', d: 'Medium' },
  { c: 'General Knowledge', p: 'What is the fastest land animal?', a: 'The cheetah', d: 'Easy' },
  { c: 'General Knowledge', p: 'How many sides does a hexagon have?', a: '6', d: 'Easy' },
  { c: 'General Knowledge', p: 'What is the largest hot desert in the world?', a: 'The Sahara', d: 'Medium' },
  { c: 'General Knowledge', p: 'What do bees make from flower nectar?', a: 'Honey', d: 'Easy' },
  { c: 'General Knowledge', p: 'What is frozen water called?', a: 'Ice', d: 'Easy' },
  { c: 'General Knowledge', p: 'How many hours are there in two days?', a: '48', d: 'Medium' },
  { c: 'General Knowledge', p: 'Which is the closest star to Earth?', a: 'The Sun', h: 'You see it every day.', d: 'Hard' },
  { c: 'General Knowledge', p: 'What is 12 multiplied by 12?', a: '144', d: 'Medium' },
  // Teamwork tasks
  { c: 'Teamwork', k: 'task', p: 'Together, name all seven emirates.', a: 'Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah', d: 'Hard', t: 'Seven Emirates' },
  { c: 'Teamwork', k: 'task', p: 'Name five sports that use a ball.', a: 'Any five, e.g. football, basketball, tennis, cricket, volleyball', d: 'Easy', t: 'Five Ball Sports' },
  { c: 'Teamwork', k: 'task', p: 'Name four things you might find in a traditional majlis.', a: 'E.g. cushions, carpets, a dallah, coffee cups, an incense burner', d: 'Medium', t: 'Inside the Majlis' },
  { c: 'Teamwork', k: 'task', p: 'Name five animals that live in the UAE desert.', a: 'E.g. camel, Arabian oryx, gazelle, desert fox, falcon, spiny-tailed lizard, scorpion', d: 'Medium', t: 'Desert Animals' },
  { c: 'Teamwork', k: 'task', p: 'Count from 1 to 10 taking turns, one number each, without anyone speaking at the same time.', a: 'Completed cleanly in order with no overlaps', d: 'Easy', t: 'Counting Relay' },
  { c: 'Teamwork', k: 'task', p: 'Name three Olympic sports that happen in water.', a: 'E.g. swimming, diving, water polo, artistic swimming, rowing', d: 'Medium', t: 'Water Sports' },
  { c: 'Teamwork', k: 'task', p: 'Name four foods or drinks often shared at an Emirati family gathering.', a: 'E.g. dates, gahwa, machboos, luqaimat, harees', d: 'Medium', t: 'Family Feast' },
  // Creative tasks
  { c: 'Creative', k: 'task', p: 'Give ten seconds of exciting sports commentary for a last-minute winning goal.', a: 'Energetic, clear commentary with a goal moment', d: 'Easy', t: 'Commentator Moment' },
  { c: 'Creative', k: 'task', p: 'Invent a name and a mascot for a brand-new UAE football team.', a: 'A team name plus a mascot idea', d: 'Easy', t: 'New Team Mascot' },
  { c: 'Creative', k: 'task', p: 'Describe the desert at sunrise using three different senses.', a: 'Three senses used, e.g. sight, sound and touch', d: 'Medium', t: 'Desert Senses' },
  { c: 'Creative', k: 'task', p: 'Make up a two-line rhyme to welcome a guest to your home.', a: 'Two lines that rhyme and sound welcoming', d: 'Medium', t: 'Welcome Rhyme' },
  { c: 'Creative', k: 'task', p: 'Strike three different sports poses, one after another, and say the sport for each.', a: 'Three clear poses with correct sport names', d: 'Easy', t: 'Pose Parade' },
  { c: 'Creative', k: 'task', p: 'Invent a new family game that uses only a ball and a scarf. Explain it in one sentence.', a: 'A clear one-sentence game idea', d: 'Hard', t: 'Invent a Game' },
  { c: 'Creative', k: 'task', p: 'Describe a falcon to someone who has never seen one, without saying "bird".', a: 'A clear description without the word "bird"', d: 'Hard', t: 'Describe the Falcon' },
];

export const cultureChallenges = definePrepared(
  'cultureSportsChallenge',
  'cs',
  CULTURE_POINTS,
  rows.map((row) => ({
    title: row.t ?? row.c,
    category: row.c,
    kind: row.k ?? 'question',
    prompt: row.p,
    answer: row.a,
    hint: row.h,
    difficulty: row.d,
  })),
);
