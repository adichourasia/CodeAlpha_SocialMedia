import bcrypt from 'bcryptjs';
import { all, get, initDb, run } from '../db.js';

const DEMO_USERS = [
  { username: 'aditya_demo', email: 'aditya.demo@example.com', displayName: 'Aditya Demo' },
  { username: 'maya_demo', email: 'maya.demo@example.com', displayName: 'Maya Demo' },
  { username: 'ryan_demo', email: 'ryan.demo@example.com', displayName: 'Ryan Demo' },
  { username: 'sofia_demo', email: 'sofia.demo@example.com', displayName: 'Sofia Demo' },
  { username: 'leo_demo', email: 'leo.demo@example.com', displayName: 'Leo Demo' },
];

const DEMO_PASSWORD = 'demo1234';

const DEMO_POST_IMAGES = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
];

const DEMO_AVATAR_IMAGES = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
];

const stableRandom = (seed) => {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  return value - Math.floor(value);
};

const timestampFromSeed = (seed, minDaysAgo, maxDaysAgo) => {
  const dayRange = Math.max(1, maxDaysAgo - minDaysAgo);
  const daysAgo = minDaysAgo + stableRandom(seed) * dayRange;
  const minuteOffset = Math.floor(stableRandom(seed + 17) * 1440);
  const millisAgo = Math.floor((daysAgo * 24 * 60 + minuteOffset) * 60 * 1000);
  return new Date(Date.now() - millisAgo).toISOString();
};

const imageFromSeed = (seed) => {
  return DEMO_POST_IMAGES[Math.floor(stableRandom(seed) * DEMO_POST_IMAGES.length)];
};

const avatarFromSeed = (seed) => DEMO_AVATAR_IMAGES[Math.floor(stableRandom(seed) * DEMO_AVATAR_IMAGES.length)];

const seedDemo = async () => {
  await initDb();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of DEMO_USERS) {
    await run(
      `
      INSERT OR IGNORE INTO users (username, email, password_hash, display_name, bio, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        user.username,
        user.email,
        passwordHash,
        user.displayName,
        'Demo profile for testing feed and interactions.',
        avatarFromSeed(user.username.length),
      ],
    );
  }

  const users = await all('SELECT id, username, display_name FROM users ORDER BY id');
  const demoUsernames = new Set(DEMO_USERS.map((user) => user.username));
  const demoUsers = users.filter((user) => demoUsernames.has(user.username));
  const demoUserIds = new Set(demoUsers.map((user) => user.id));

  let insertedPosts = 0;
  let insertedComments = 0;
  let insertedLikes = 0;
  let insertedFollows = 0;

  for (const user of users) {
    const existingCountRow = await get('SELECT COUNT(*) AS count FROM posts WHERE author_id = ?', [user.id]);
    const existingCount = Number(existingCountRow?.count ?? 0);

    if (existingCount > 0) {
      continue;
    }

    await run('INSERT INTO posts (author_id, content, image_url, created_at) VALUES (?, ?, ?, ?)', [
      user.id,
      `Hello from ${user.display_name}! This is my first demo post.`,
      imageFromSeed(user.id * 10 + 1),
      timestampFromSeed(user.id * 10 + 1, 4, 14),
    ]);

    await run('INSERT INTO posts (author_id, content, image_url, created_at) VALUES (?, ?, ?, ?)', [
      user.id,
      `Second demo update by ${user.username}. Testing timeline and profile pages.`,
      imageFromSeed(user.id * 10 + 2),
      timestampFromSeed(user.id * 10 + 2, 1, 9),
    ]);

    insertedPosts += 2;
  }

  const posts = await all('SELECT id, author_id, content FROM posts ORDER BY id');

  for (const post of posts) {
    if (!demoUserIds.has(post.author_id)) {
      continue;
    }

    const nonAuthors = users.filter((user) => user.id !== post.author_id);
    const commenters = nonAuthors.slice(0, 2);

    for (const commenter of commenters) {
      if (!demoUserIds.has(commenter.id)) {
        continue;
      }

      const existingComment = await get(
        'SELECT id FROM comments WHERE post_id = ? AND author_id = ? LIMIT 1',
        [post.id, commenter.id],
      );

      if (!existingComment) {
        await run('INSERT INTO comments (post_id, author_id, content, created_at) VALUES (?, ?, ?, ?)', [
          post.id,
          commenter.id,
          `Nice post @${users.find((u) => u.id === post.author_id)?.username || 'friend'}!`,
          timestampFromSeed(post.id * 100 + commenter.id, 0, 6),
        ]);
        insertedComments += 1;
      }
    }

    const likers = nonAuthors.slice(0, 3);
    for (const liker of likers) {
      const existingLike = await get('SELECT 1 AS ok FROM likes WHERE user_id = ? AND post_id = ? LIMIT 1', [
        liker.id,
        post.id,
      ]);
      if (!existingLike) {
        await run('INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)', [
          liker.id,
          post.id,
          timestampFromSeed(post.id * 1000 + liker.id, 0, 6),
        ]);
        insertedLikes += 1;
      }
    }
  }

  for (const follower of users) {
    for (const following of users) {
      if (follower.id === following.id) {
        continue;
      }

      if (follower.id < following.id) {
        if (!demoUserIds.has(follower.id) || !demoUserIds.has(following.id)) {
          continue;
        }

        const existingFollow = await get(
          'SELECT 1 AS ok FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
          [follower.id, following.id],
        );

        if (!existingFollow) {
          await run('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)', [
            follower.id,
            following.id,
            timestampFromSeed(follower.id * 100 + following.id, 8, 28),
          ]);
          insertedFollows += 1;
        }
      }
    }
  }

  for (const user of demoUsers) {
    await run('UPDATE users SET created_at = ?, avatar_url = ? WHERE id = ?', [
      timestampFromSeed(user.id, 45, 90),
      avatarFromSeed(user.id * 11),
      user.id,
    ]);
  }

  const demoPosts = await all('SELECT id, author_id FROM posts WHERE author_id IN (SELECT id FROM users WHERE username LIKE ?)', [
    '%_demo',
  ]);

  for (const post of demoPosts) {
    await run('UPDATE posts SET created_at = ? WHERE id = ?', [
      timestampFromSeed(post.id * 5 + post.author_id, 1, 20),
      post.id,
    ]);
    await run('UPDATE posts SET image_url = ? WHERE id = ?', [imageFromSeed(post.id * 7 + post.author_id), post.id]);
  }

  const demoComments = await all(
    `
    SELECT c.id, c.post_id
    FROM comments c
    JOIN posts p ON p.id = c.post_id
    JOIN users u ON u.id = p.author_id
    WHERE u.username LIKE ?
    ORDER BY c.id
    `,
    ['%_demo'],
  );

  for (const comment of demoComments) {
    await run(
      'UPDATE comments SET created_at = datetime((SELECT created_at FROM posts WHERE id = ?), ? || " minutes") WHERE id = ?',
      [comment.post_id, Math.floor(stableRandom(comment.id) * 720) + 10, comment.id],
    );
  }

  const demoLikes = await all(
    `
    SELECT l.user_id, l.post_id
    FROM likes l
    JOIN posts p ON p.id = l.post_id
    JOIN users u ON u.id = p.author_id
    WHERE u.username LIKE ?
    ORDER BY l.post_id, l.user_id
    `,
    ['%_demo'],
  );

  for (const like of demoLikes) {
    await run(
      'UPDATE likes SET created_at = datetime((SELECT created_at FROM posts WHERE id = ?), ? || " minutes") WHERE user_id = ? AND post_id = ?',
      [
        like.post_id,
        Math.floor(stableRandom(like.post_id * 1000 + like.user_id) * 180) + 1,
        like.user_id,
        like.post_id,
      ],
    );
  }

  const demoFollows = await all(
    `
    SELECT f.follower_id, f.following_id
    FROM follows f
    JOIN users uf ON uf.id = f.follower_id
    JOIN users ut ON ut.id = f.following_id
    WHERE uf.username LIKE ? AND ut.username LIKE ?
    ORDER BY f.follower_id, f.following_id
    `,
    ['%_demo', '%_demo'],
  );

  for (const follow of demoFollows) {
    await run('UPDATE follows SET created_at = ? WHERE follower_id = ? AND following_id = ?', [
      timestampFromSeed(follow.follower_id * 100 + follow.following_id, 10, 35),
      follow.follower_id,
      follow.following_id,
    ]);
  }

  const counts = await all(`
    SELECT 'users' AS table_name, COUNT(*) AS count FROM users
    UNION ALL
    SELECT 'posts', COUNT(*) FROM posts
    UNION ALL
    SELECT 'comments', COUNT(*) FROM comments
    UNION ALL
    SELECT 'likes', COUNT(*) FROM likes
    UNION ALL
    SELECT 'follows', COUNT(*) FROM follows
  `);

  console.log('Seed complete.');
  console.table(counts);
  console.log('New posts inserted:', insertedPosts);
  console.log('New comments inserted:', insertedComments);
  console.log('New likes inserted:', insertedLikes);
  console.log('New follows inserted:', insertedFollows);
  console.log('Demo password for created demo users:', DEMO_PASSWORD);
};

seedDemo().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
