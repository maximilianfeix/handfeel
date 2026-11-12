import { Contact, Conversation } from './types';

export const contacts: Contact[] = [
  { id: 'maya', name: 'Maya Chen', initials: 'MC', color: 'sand', online: true, photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces', about: 'Collecting little moments ☀️' },
  { id: 'leo', name: 'Leo Martinez', initials: 'LM', color: 'sky', online: true, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces', about: 'Probably out for a run.' },
  { id: 'weekend', name: 'The weekend club', initials: 'WC', color: 'moss', online: false, about: 'Good people, better plans.' },
  { id: 'ava', name: 'Ava Thompson', initials: 'AT', color: 'rose', online: false, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces', about: 'Making things, taking breaks.' },
  { id: 'oliver', name: 'Oliver James', initials: 'OJ', color: 'sage', online: true, photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces', about: 'One coffee at a time.' },
  { id: 'studio', name: 'Studio friends', initials: 'sf', color: 'lilac', online: false, about: 'A place for our next big idea.' },
  { id: 'nina', name: 'Nina Park', initials: 'NP', color: 'wheat', online: false, photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&crop=faces', about: 'See you on the sunny side.' },
  { id: 'ethan', name: 'Ethan Williams', initials: 'EW', color: 'mist', online: false, photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop&crop=faces', about: 'Always up for an adventure.' },
  { id: 'sofia', name: 'Sofia Rossi', initials: 'SR', color: 'peach', online: true, photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=160&h=160&fit=crop&crop=faces', about: 'A little art in the everyday.' },
];

export const initialConversations: Conversation[] = [
  { id: 'maya', contactId: 'maya', unread: 2, pinned: true, time: '2m', messages: [
    { id: 'm1', text: 'Hey! How’s your morning going? ☀️', mine: false, time: '10:24' },
    { id: 'm2', text: 'Slow start, good coffee. Can’t complain ☕', mine: true, time: '10:25' },
    { id: 'm3', text: 'That sounds like the right kind of morning.', mine: false, time: '10:25' },
    { id: 'm4', text: 'I found that little café I was telling you about! We should go this weekend.', mine: false, time: '10:26' },
    { id: 'm5', text: 'Sunday coffee? I’m so in.', mine: true, time: '10:28' },
    { id: 'm6', text: 'Sunday at 10? The light in there is unreal 🌿', mine: false, time: '10:30' },
    { id: 'm7', text: 'Sunday, 10:00 AM', mine: false, time: '10:30', kind: 'place' },
  ] },
  { id: 'leo', contactId: 'leo', unread: 1, pinned: true, time: '12m', messages: [
    { id: 'l1', text: 'Made it home? That was such a good evening.', mine: true, time: '09:52' },
    { id: 'l2', text: 'Just sent you the playlist 🎧', mine: false, time: '10:20' },
  ] },
  { id: 'weekend', contactId: 'weekend', group: true, members: 6, unread: 4, time: '28m', messages: [
    { id: 'w1', text: 'Maya: Who’s up for a little escape this Saturday?', mine: false, time: '09:48' },
    { id: 'w2', text: 'Count me in! Somewhere with a view?', mine: true, time: '09:50' },
    { id: 'w3', text: 'Leo: Okay, who’s bringing snacks? 🍿', mine: false, time: '10:04' },
  ] },
  { id: 'ava', contactId: 'ava', unread: 0, time: '1h', messages: [
    { id: 'a1', text: 'The photos from yesterday are so lovely!', mine: false, time: '09:10' },
    { id: 'a2', text: 'You have such a good eye ✨', mine: true, time: '09:12' },
  ] },
  { id: 'oliver', contactId: 'oliver', unread: 0, time: '2h', messages: [
    { id: 'o1', text: 'Thanks for the recommendation. New favorite spot.', mine: false, time: '08:20' },
    { id: 'o2', text: 'Glad you liked it! See you soon 🙌', mine: true, time: '08:22' },
  ] },
  { id: 'studio', contactId: 'studio', group: true, members: 4, unread: 0, time: '3h', messages: [
    { id: 's1', text: 'Nina: The new moodboard is looking so good.', mine: false, time: '07:30' },
  ] },
  { id: 'nina', contactId: 'nina', unread: 0, time: 'Yesterday', messages: [
    { id: 'n1', text: 'Let’s do it again soon 🤍', mine: false, time: '18:42' },
  ] },
  { id: 'ethan', contactId: 'ethan', unread: 0, time: 'Yesterday', messages: [
    { id: 'e1', text: 'That trail looks amazing. Adding it to the list!', mine: false, time: '16:15' },
  ] },
];
