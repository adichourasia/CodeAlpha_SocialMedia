import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { all, get, initDb, run } from './db.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'chatgram-dev-secret';

app.use(cors());
app.use(express.json());

const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

const mapUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  displayName: user.display_name,
  bio: user.bio,
  avatarUrl: user.avatar_url,
  createdAt: user.created_at,
});

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Missing auth token' });
      return;
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT * FROM users WHERE id = ?', [payload.userId]);
    if (!user) {
      res.status(401).json({ message: 'Invalid token user' });
      return;
    }

    req.user = mapUser(user);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      next();
      return;
    }

    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await get('SELECT * FROM users WHERE id = ?', [payload.userId]);
    if (user) {
      req.user = mapUser(user);
    }
    next();
  } catch {
    next();
  }
};

const postSelect = `
  SELECT
    p.id,
    p.content,
    p.image_url,
    p.created_at,
    u.id AS author_id,
    u.username AS author_username,
    u.display_name AS author_display_name,
    u.avatar_url AS author_avatar_url,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
    CASE
      WHEN ? IS NULL THEN 0
      ELSE EXISTS(SELECT 1 FROM likes lx WHERE lx.post_id = p.id AND lx.user_id = ?)
    END AS liked_by_me
  FROM posts p
  JOIN users u ON p.author_id = u.id
`;

const mapPost = (row) => ({
  id: row.id,
  content: row.content,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  likeCount: Number(row.like_count),
  commentCount: Number(row.comment_count),
  likedByMe: Boolean(row.liked_by_me),
  author: {
    id: row.author_id,
    username: row.author_username,
    displayName: row.author_display_name,
    avatarUrl: row.author_avatar_url,
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password || !displayName) {
      res.status(400).json({ message: 'username, email, password, and displayName are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      res.status(409).json({ message: 'Username or email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ec4899&color=fff`;

    const created = await run(
      'INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, displayName, avatarUrl]
    );

    const user = await get('SELECT * FROM users WHERE id = ?', [created.lastID]);
    const token = signToken(user.id);

    res.status(201).json({ token, user: mapUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) {
      res.status(400).json({ message: 'username or email and password are required' });
      return;
    }

    const user = await get(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username ?? '', email ?? '']
    );

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (typeof user.password_hash !== 'string' || user.password_hash.length === 0) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password_hash);
    } catch {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken(user.id);
    res.json({ token, user: mapUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', details: error.message });
  }
});

app.get('/api/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

app.patch('/api/profiles/me', auth, async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;
    const current = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    const updatedDisplayName = displayName ?? current.display_name;
    const updatedBio = bio ?? current.bio;
    const updatedAvatar = avatarUrl ?? current.avatar_url;

    await run(
      'UPDATE users SET display_name = ?, bio = ?, avatar_url = ? WHERE id = ?',
      [updatedDisplayName, updatedBio, updatedAvatar, req.user.id]
    );

    const updated = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: mapUser(updated) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', details: error.message });
  }
});

app.get('/api/profiles/:username', optionalAuth, async (req, res) => {
  try {
    const profile = await get('SELECT * FROM users WHERE username = ?', [req.params.username]);
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    const [postCount, followerCount, followingCount] = await Promise.all([
      get('SELECT COUNT(*) AS count FROM posts WHERE author_id = ?', [profile.id]),
      get('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?', [profile.id]),
      get('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?', [profile.id]),
    ]);

    let isFollowing = false;
    if (req.user) {
      const follow = await get(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, profile.id]
      );
      isFollowing = Boolean(follow);
    }

    res.json({
      user: mapUser(profile),
      stats: {
        postCount: Number(postCount.count),
        followerCount: Number(followerCount.count),
        followingCount: Number(followingCount.count),
      },
      isFollowing,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load profile', details: error.message });
  }
});

app.post('/api/profiles/:username/follow', auth, async (req, res) => {
  try {
    const target = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!target) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (target.id === req.user.id) {
      res.status(400).json({ message: 'You cannot follow yourself' });
      return;
    }

    const exists = await get(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, target.id]
    );

    let following;
    if (exists) {
      await run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, target.id]);
      following = false;
    } else {
      await run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, target.id]);
      following = true;
    }

    res.json({ following });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update follow state', details: error.message });
  }
});

app.get('/api/profiles/:username/followers', optionalAuth, async (req, res) => {
  try {
    const target = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!target) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const rows = await all(
      `
      SELECT u.*
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      `,
      [target.id]
    );

    res.json({ users: rows.map(mapUser) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load followers', details: error.message });
  }
});

app.get('/api/profiles/:username/following', optionalAuth, async (req, res) => {
  try {
    const target = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!target) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const rows = await all(
      `
      SELECT u.*
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      `,
      [target.id]
    );

    res.json({ users: rows.map(mapUser) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load following', details: error.message });
  }
});

app.post('/api/posts', auth, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Post content is required' });
      return;
    }

    const normalizedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';

    const created = await run(
      'INSERT INTO posts (author_id, content, image_url) VALUES (?, ?, ?)',
      [req.user.id, content.trim(), normalizedImageUrl]
    );

    const row = await get(
      `${postSelect} WHERE p.id = ?`,
      [req.user.id, req.user.id, created.lastID]
    );

    res.status(201).json({ post: mapPost(row) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', details: error.message });
  }
});

app.get('/api/posts/:postId', optionalAuth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const row = await get(
      `${postSelect} WHERE p.id = ?`,
      [req.user?.id ?? null, req.user?.id ?? null, postId]
    );

    if (!row) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    res.json({ post: mapPost(row) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load post', details: error.message });
  }
});

app.get('/api/posts', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const rows = await all(
      `${postSelect}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user?.id ?? null, req.user?.id ?? null, limit, offset]
    );

    res.json({ posts: rows.map(mapPost), limit, offset, hasMore: rows.length === limit });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load posts', details: error.message });
  }
});

app.get('/api/profiles/:username/posts', optionalAuth, async (req, res) => {
  try {
    const author = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!author) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const rows = await all(
      `${postSelect}
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user?.id ?? null, req.user?.id ?? null, author.id, limit, offset]
    );

    res.json({ posts: rows.map(mapPost), limit, offset, hasMore: rows.length === limit });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load user posts', details: error.message });
  }
});

app.delete('/api/posts/:postId', auth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const post = await get('SELECT id, author_id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (post.author_id !== req.user.id) {
      res.status(403).json({ message: 'You can only delete your own posts' });
      return;
    }

    await run('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post', details: error.message });
  }
});

app.delete('/api/posts/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const commentId = Number(req.params.commentId);
    const comment = await get('SELECT id, author_id FROM comments WHERE id = ? AND post_id = ?', [commentId, postId]);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (comment.author_id !== req.user.id) {
      res.status(403).json({ message: 'You can only delete your own comments' });
      return;
    }

    await run('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', details: error.message });
  }
});

app.post('/api/posts/:postId/like', auth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const post = await get('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const exists = await get('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);

    let liked;
    if (exists) {
      await run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);
      liked = false;
    } else {
      await run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, postId]);
      liked = true;
    }

    const count = await get('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [postId]);
    res.json({ liked, likeCount: Number(count.count) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle like', details: error.message });
  }
});

app.post('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Comment content is required' });
      return;
    }

    const post = await get('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const created = await run(
      'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content.trim()]
    );

    const comment = await get(
      `
      SELECT c.id, c.content, c.created_at, u.id AS author_id, u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
      `,
      [created.lastID]
    );

    res.status(201).json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          id: comment.author_id,
          username: comment.username,
          displayName: comment.display_name,
          avatarUrl: comment.avatar_url,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create comment', details: error.message });
  }
});

app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const rows = await all(
      `
      SELECT c.id, c.content, c.created_at, u.id AS author_id, u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      `,
      [postId]
    );

    res.json({
      comments: rows.map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        author: {
          id: row.author_id,
          username: row.username,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
        },
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load comments', details: error.message });
  }
});

// Search users by username or display name (case-insensitive, partial match)
app.get('/api/users', async (req, res) => {
  try {
    const search = req.query.search?.toString().trim();
    if (!search) {
      res.status(400).json({ message: 'Missing search query' });
      return;
    }
    const users = await all(
      `SELECT * FROM users WHERE username LIKE ? OR display_name LIKE ? ORDER BY username LIMIT 20`,
      [`%${search}%`, `%${search}%`]
    );
    res.json({ users: users.map(mapUser) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search users', details: error.message });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ChatGram API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
