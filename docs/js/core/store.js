import { loadState, saveState } from '../utils/storage.js';
import { createId } from '../utils/id.js';

const defaultState = {
  profile: {
    name: 'you',
    bio: 'A small local profile to collect your memories.',
    avatarData: '',
  },
  posts: [],
  issues: [],
  followingAuthors: [],
};

function normalizePost(post) {
  return {
    id: post.id,
    authorName: post.authorName || 'you',
    authorIcon: post.authorIcon || (post.authorName || 'U').trim().slice(0, 1).toUpperCase(),
    authorAvatarData: post.authorAvatarData || '',
    caption: post.caption || '',
    imageData: post.imageData || '',
    fixedTags: Array.isArray(post.fixedTags) ? post.fixedTags : [],
    freeTags: Array.isArray(post.freeTags) ? post.freeTags : [],
    likes: Number(post.likes || 0),
    saves: Number(post.saves || 0),
    comments: Array.isArray(post.comments) ? post.comments : [],
    impressions: Number(post.impressions || 0),
    liked: Boolean(post.liked),
    saved: Boolean(post.saved),
    createdAt: post.createdAt || new Date().toISOString(),
    updatedAt: post.updatedAt || null,
    composeData: post.composeData || null,
  };
}

function normalizeState(saved) {
  if (!saved) return structuredClone(defaultState);
  return {
    profile: {
      name: saved.profile?.name || defaultState.profile.name,
      bio: saved.profile?.bio || defaultState.profile.bio,
      avatarData: saved.profile?.avatarData || '',
    },
    posts: Array.isArray(saved.posts) ? saved.posts.map(normalizePost) : [],
    issues: Array.isArray(saved.issues) ? saved.issues : [],
    followingAuthors: Array.isArray(saved.followingAuthors) ? saved.followingAuthors : [],
  };
}

let state = normalizeState(loadState());

export function getState() {
  return state;
}

function commit(nextState) {
  state = nextState;
  saveState(state);
}

export function addPost(post) {
  const next = structuredClone(state);
  next.posts.unshift({
    id: createId('post'),
    authorName: post.authorName,
    authorIcon: (post.authorName || 'U').trim().slice(0, 1).toUpperCase(),
    authorAvatarData: state.profile.avatarData || '',
    caption: post.caption || '',
    imageData: post.imageData,
    fixedTags: post.fixedTags || [],
    freeTags: post.freeTags || [],
    likes: 0,
    saves: 0,
    comments: [],
    impressions: 0,
    liked: false,
    saved: false,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    composeData: post.composeData || null,
  });
  commit(next);
}

export function updatePost(postId, updates) {
  const next = structuredClone(state);
  const post = next.posts.find((item) => item.id === postId);
  if (!post) return;

  post.caption = updates.caption ?? post.caption;
  post.imageData = updates.imageData ?? post.imageData;
  post.fixedTags = Array.isArray(updates.fixedTags) ? updates.fixedTags : post.fixedTags;
  post.freeTags = Array.isArray(updates.freeTags) ? updates.freeTags : post.freeTags;
  post.composeData = updates.composeData ?? post.composeData;
  post.updatedAt = new Date().toISOString();
  commit(next);
}

export function deletePost(postId) {
  const next = structuredClone(state);
  const exists = next.posts.some((item) => item.id === postId);
  if (!exists) return;

  next.posts = next.posts.filter((item) => item.id !== postId);
  next.issues = next.issues
    .map((issue) => ({
      ...issue,
      postIds: (issue.postIds || []).filter((id) => id !== postId),
    }))
    .filter((issue) => issue.postIds.length);

  commit(next);
}

export function toggleLike(postId) {
  const next = structuredClone(state);
  const post = next.posts.find((item) => item.id === postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  commit(next);
}

export function toggleSave(postId) {
  const next = structuredClone(state);
  const post = next.posts.find((item) => item.id === postId);
  if (!post) return;
  post.saved = !post.saved;
  post.saves += post.saved ? 1 : -1;
  commit(next);
}

export function addComment(postId, text) {
  const next = structuredClone(state);
  const post = next.posts.find((item) => item.id === postId);
  if (!post || !text.trim()) return;
  post.comments.unshift({
    id: createId('comment'),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  });
  commit(next);
}

export function addImpression(postId) {
  const next = structuredClone(state);
  const post = next.posts.find((item) => item.id === postId);
  if (!post) return;
  post.impressions += 1;
  commit(next);
}

export function updateProfile(profile) {
  const next = structuredClone(state);
  const previousName = next.profile.name;
  const nextAvatar = profile.avatarData || '';
  next.profile.name = profile.name;
  next.profile.bio = profile.bio;
  next.profile.avatarData = nextAvatar;
  next.posts = next.posts.map((post) => (
    post.authorName === previousName
      ? {
        ...post,
        authorName: profile.name,
        authorIcon: (profile.name || 'U').trim().slice(0, 1).toUpperCase(),
        authorAvatarData: nextAvatar,
      }
      : post
  ));
  next.followingAuthors = next.followingAuthors.map((name) => (
    name === previousName ? profile.name : name
  ));
  commit(next);
}

export function toggleFollow(authorName) {
  const next = structuredClone(state);
  const exists = next.followingAuthors.includes(authorName);
  next.followingAuthors = exists
    ? next.followingAuthors.filter((name) => name !== authorName)
    : [...next.followingAuthors, authorName];
  commit(next);
}

export function saveIssue(issue) {
  const next = structuredClone(state);
  next.issues.unshift({
    id: createId('issue'),
    title: issue.title,
    subtitle: issue.subtitle,
    tone: issue.tone,
    postIds: issue.postIds,
    createdAt: new Date().toISOString(),
  });
  commit(next);
}
