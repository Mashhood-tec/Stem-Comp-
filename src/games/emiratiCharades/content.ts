import type { Difficulty } from '../../types/content';
import { definePrepared } from '../prepared';

export const CHARADES_POINTS = { Easy: 1, Medium: 2, Hard: 3 } as const;

type Row = [prompt: string, category: string, actingTip: string, difficulty: Difficulty];

const rows: Row[] = [
  ['Pouring Arabic coffee', 'Heritage & Traditions', 'Hold an imaginary dallah high and pour carefully into a tiny cup.', 'Easy'],
  ['Falcon landing on a glove', 'Heritage & Traditions', 'Raise one arm, then flap your other hand down onto it like wings.', 'Medium'],
  ['Riding a camel', 'Heritage & Traditions', 'Sway slowly up and down as if sitting high on a hump.', 'Easy'],
  ['Pearl diving', 'Heritage & Traditions', 'Hold your nose, dive down and open an imaginary oyster shell.', 'Medium'],
  ['Rowing a dhow', 'Heritage & Traditions', 'Pull heavy oars together with an imaginary crew.', 'Medium'],
  ['Weaving a palm basket', 'Heritage & Traditions', 'Braid long imaginary strips over and under each other.', 'Hard'],
  ['Henna on your hands', 'Heritage & Traditions', 'Draw tiny careful patterns on your palm, then blow to dry them.', 'Medium'],
  ['Burning incense to welcome guests', 'Heritage & Traditions', 'Waft the smoke towards yourself and offer it to a guest.', 'Hard'],
  ['Sandboarding down a dune', 'UAE Themes', 'Balance sideways on a board and surf down a big slope.', 'Easy'],
  ['Watching National Day fireworks', 'UAE Themes', 'Point up, follow a rocket with your eyes and cheer as it bursts.', 'Easy'],
  ['Waving the UAE flag', 'UAE Themes', 'Wave proudly with both hands, then stand tall and smile.', 'Easy'],
  ['Bargaining at the souk', 'UAE Themes', 'Point at an item, shake your head at the price, then shake hands.', 'Medium'],
  ['Riding the metro', 'UAE Themes', 'Hold a rail overhead and sway as the train speeds up and stops.', 'Easy'],
  ['Zipline over the mountains', 'UAE Themes', 'Hold a bar above your head and zoom forward with a big face.', 'Medium'],
  ['Snorkelling with turtles', 'UAE Themes', 'Put on a mask, breathe through a tube and point at a slow swimmer.', 'Hard'],
  ['Planting a ghaf tree', 'UAE Themes', 'Dig a hole, place a seedling gently and water it.', 'Hard'],
  ['Scoring a penalty', 'Sports Moves', 'Place the ball, step back, run up and shoot. Celebrate!', 'Easy'],
  ['Goalkeeper diving save', 'Sports Moves', 'Crouch, watch the ball and dive sideways with arms stretched.', 'Easy'],
  ['Bowling in cricket', 'Sports Moves', 'Run up and swing a straight arm over your shoulder.', 'Medium'],
  ['Basketball slam dunk', 'Sports Moves', 'Dribble, jump high and push the ball down into a hoop.', 'Easy'],
  ['Serving in padel', 'Sports Moves', 'Bounce the ball and hit it underarm with a short racket.', 'Hard'],
  ['Horse riding', 'Sports Moves', 'Hold the reins and bounce gently as you trot.', 'Easy'],
  ['Jiu-jitsu bow and handshake', 'Sports Moves', 'Bow respectfully, then offer a firm, friendly handshake.', 'Hard'],
  ['Finishing a marathon', 'Sports Moves', 'Run tiredly, then raise your arms as you break the tape.', 'Medium'],
  ['Swimming backstroke', 'Sports Moves', 'Lie back and swing your arms over your head one at a time.', 'Medium'],
  ['Cycling up a mountain', 'Sports Moves', 'Pedal hard, lean forward and wipe your forehead.', 'Medium'],
  ['Taking a family selfie', 'Family Activities', 'Hold out a phone, squeeze everyone in and say "cheese".', 'Easy'],
  ['Baking a cake together', 'Family Activities', 'Mix, pour, open the oven and blow on hot fingers.', 'Easy'],
  ['Picnic in the park', 'Family Activities', 'Shake out a blanket, unpack food and swat a fly.', 'Medium'],
  ['Reading a bedtime story', 'Family Activities', 'Open a book, read with expression and yawn sleepily.', 'Easy'],
  ['Building a sandcastle', 'Family Activities', 'Fill a bucket, flip it over and decorate with shells.', 'Easy'],
  ['Flying a kite at the beach', 'Family Activities', 'Run backwards, look up and pull the string.', 'Medium'],
  ['Playing hide and seek', 'Family Activities', 'Cover your eyes, count, then tiptoe around searching.', 'Easy'],
  ['Visiting grandparents', 'Family Activities', 'Knock, hug warmly and sit down to listen to a story.', 'Medium'],
  ['Brushing your teeth', 'Everyday Life', 'Squeeze toothpaste, brush up and down, then rinse.', 'Easy'],
  ['Washing the car', 'Everyday Life', 'Scrub in circles with a sponge, then spray with a hose.', 'Easy'],
  ['Grocery shopping', 'Everyday Life', 'Push a trolley, pick fruit and check the list.', 'Medium'],
  ['Waiting for a lift', 'Everyday Life', 'Press a button, look up at the numbers and tap your foot.', 'Hard'],
  ['Watering plants', 'Everyday Life', 'Carry a heavy watering can and tilt it gently.', 'Easy'],
  ['Packing a suitcase', 'Everyday Life', 'Fold clothes, squeeze them in and sit on the lid to close it.', 'Medium'],
  ['Making a video call', 'Everyday Life', 'Hold up a phone, wave at the screen and say hello silently.', 'Medium'],
  ['Ice skating', 'Sports Moves', 'Glide with wobbly legs, arms out for balance.', 'Medium'],
];

export const charadePrompts = definePrepared(
  'emiratiCharades',
  'ch',
  CHARADES_POINTS,
  rows.map(([prompt, category, actingTip, difficulty]) => ({ title: prompt, prompt, category, actingTip, difficulty })),
);
