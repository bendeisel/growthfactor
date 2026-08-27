// Adult classes, as a subscribe feed. See src/lib/ics.js.
import { buildIcs } from '../lib/ics.js';
import { feeds } from '../data/schedule.js';

export function GET() {
  return buildIcs({ audience: 'adult', name: feeds.adult.name });
}
